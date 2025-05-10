// Configuração do Supabase
const SUPABASE_CONFIG = {
    // URL do seu projeto Supabase
    url: 'https://ryttlyigvimycygnzfju.supabase.co',
    // Chave anônima do seu projeto
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA',
    // Configurações de reconexão
    reconnect: {
        maxAttempts: 5,
        delay: 2000, // 2 segundos
        backoff: 1.5
    },
    // Configurações de cache
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000 // 5 minutos
    },
    // Modo offline
    offline: {
        enabled: true,
        syncQueue: 'supabase_sync_queue'
    }
};

// Definir o status do servidor
window.SERVER_STATUS = {
    serverReachable: false,
    databaseConnected: true,
    tablesExist: true,
    permissionsOk: true,
    canCreateUser: false,
    isOnline: true
};

// Verificar se já existe uma instância do cliente Supabase
if (!window.supabaseClient) {
    // Criar apenas uma instância do cliente para toda a aplicação
    window.supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('Cliente Supabase inicializado globalmente');
}

// Classe para gerenciar a conexão com o Supabase
class SupabaseManager {
    constructor() {
        // Usar a instância global em vez de criar uma nova
        this.client = window.supabaseClient;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.cache = new Map();
        this.offlineQueue = [];
        this.loadOfflineQueue();
    }

    // Carregar a fila offline do localStorage
    loadOfflineQueue() {
        try {
            const savedQueue = localStorage.getItem(SUPABASE_CONFIG.offline.syncQueue);
            if (savedQueue) {
                this.offlineQueue = JSON.parse(savedQueue);
                console.log(`Carregada fila offline com ${this.offlineQueue.length} operações pendentes`);
            }
        } catch (error) {
            console.error('Erro ao carregar fila offline:', error);
            this.offlineQueue = [];
        }
    }

    // Salvar a fila offline no localStorage
    saveOfflineQueue() {
        try {
            localStorage.setItem(SUPABASE_CONFIG.offline.syncQueue, JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('Erro ao salvar fila offline:', error);
        }
    }

    // Adicionar operação à fila offline
    addToOfflineQueue(operation) {
        this.offlineQueue.push({
            ...operation,
            timestamp: Date.now()
        });
        this.saveOfflineQueue();
        console.log(`Operação adicionada à fila offline. Total: ${this.offlineQueue.length}`);
    }

    // Inicializar o cliente Supabase
    async initialize() {
        try {
            // Inicializar o cache explicitamente
            this.initializeCache();
            
            // Não criamos um novo cliente, apenas testamos a conexão
            await this.testConnection();
            this.connected = true;
            console.log('Conexão com Supabase estabelecida com sucesso');
            
            // Verificar operações pendentes
            if (this.offlineQueue.length > 0 && window.SERVER_STATUS.serverReachable) {
                console.log(`Detectadas ${this.offlineQueue.length} operações pendentes. Tentando sincronizar...`);
                setTimeout(() => this.processPendingOperations(), 3000);
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
            // Se o servidor não estiver acessível, ativar modo offline
            if (!window.SERVER_STATUS.serverReachable) {
                console.warn('Servidor não acessível, ativando modo offline');
                // Tenta executar operações offline quando estiver online novamente
                window.addEventListener('online', () => this.processPendingOperations());
            }
            return false;
        }
    }

    // Inicializar o cache de forma explícita
    initializeCache() {
        if (!this.cache || !(this.cache instanceof Map)) {
            console.log('Inicializando sistema de cache...');
            this.cache = new Map();
            
            // Pré-carregar alguns dados essenciais se o servidor estiver acessível
            if (window.SERVER_STATUS.serverReachable) {
                // Carregar dados de usuários em segundo plano
                setTimeout(async () => {
                    try {
                        const users = await this.client.from('users').select('*');
                        if (users.data) {
                            this.cache.set('users-*', {
                                data: users.data,
                                timestamp: Date.now()
                            });
                            console.log('Cache pré-carregado com dados de usuários');
                        }
                    } catch (error) {
                        console.warn('Não foi possível pré-carregar o cache:', error);
                    }
                }, 100);
            }
        }
    }

    // Verificar o status do cache
    isCacheWorking() {
        return this.cache instanceof Map;
    }

    // Testar conexão com o servidor
    async testConnection() {
        try {
            const { data, error } = await this.client.from('users').select('count').limit(1);
            if (error) throw error;
            // Atualizar status do servidor
            window.SERVER_STATUS.serverReachable = true;
            return true;
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            // Status do servidor já está definido como inacessível
            return false;
        }
    }

    // Tentar reconectar automaticamente
    async reconnect() {
        if (this.reconnectAttempts >= SUPABASE_CONFIG.reconnect.maxAttempts) {
            console.error('Número máximo de tentativas de reconexão atingido');
            return false;
        }

        this.reconnectAttempts++;
        const delay = SUPABASE_CONFIG.reconnect.delay * Math.pow(SUPABASE_CONFIG.reconnect.backoff, this.reconnectAttempts - 1);

        console.log(`Tentativa de reconexão ${this.reconnectAttempts} em ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.initialize();
    }

    // Obter dados com cache e suporte offline
    async getData(table, query, useCache = true) {
        const cacheKey = `${table}-${JSON.stringify(query)}`;

        if (useCache && SUPABASE_CONFIG.cache.enabled) {
            const cachedData = this.cache.get(cacheKey);
            if (cachedData && Date.now() - cachedData.timestamp < SUPABASE_CONFIG.cache.ttl) {
                return cachedData.data;
            }
        }

        try {
            // Verificar se o servidor está acessível
            if (!window.SERVER_STATUS.serverReachable) {
                console.warn(`Servidor não acessível, usando dados em cache para ${table}`);
                // Retornar dados do cache mesmo que expirados
                const cachedData = this.cache.get(cacheKey);
                if (cachedData) {
                    return cachedData.data;
                }
                // Se não houver cache, retornar array vazio
                return [];
            }

            const { data, error } = await this.client.from(table).select(query);
            if (error) throw error;

            if (useCache && SUPABASE_CONFIG.cache.enabled) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error(`Erro ao obter dados da tabela ${table}:`, error);
            // Em caso de erro, tentar usar o cache
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                console.warn(`Usando dados em cache para ${table} devido a erro`);
                return cachedData.data;
            }
            throw error;
        }
    }

    // Inserir dados com suporte offline
    async insertData(table, data) {
        try {
            // Verificar se o servidor está acessível
            if (!window.SERVER_STATUS.serverReachable) {
                console.warn(`Servidor não acessível, adicionando operação de inserção em ${table} à fila offline`);
                // Gerar ID temporário para uso offline
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const tempData = { ...data, id: tempId, _is_temp: true };
                
                // Adicionar à fila offline
                this.addToOfflineQueue({
                    type: 'insert',
                    table,
                    data: tempData
                });
                
                return tempData;
            }

            const { data: result, error } = await this.client.from(table).insert(data);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao inserir dados na tabela ${table}:`, error);
            
            // Se ocorrer erro, tente adicionar à fila offline
            if (SUPABASE_CONFIG.offline.enabled) {
                console.warn(`Adicionando operação de inserção em ${table} à fila offline devido a erro`);
                const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                const tempData = { ...data, id: tempId, _is_temp: true };
                
                this.addToOfflineQueue({
                    type: 'insert',
                    table,
                    data: tempData
                });
                
                return tempData;
            }
            
            throw error;
        }
    }

    // Atualizar dados com suporte offline
    async updateData(table, id, data) {
        try {
            // Verificar se o servidor está acessível
            if (!window.SERVER_STATUS.serverReachable) {
                console.warn(`Servidor não acessível, adicionando operação de atualização em ${table} à fila offline`);
                
                // Adicionar à fila offline
                this.addToOfflineQueue({
                    type: 'update',
                    table,
                    id,
                    data
                });
                
                // Retornar dados atualizados para uso local
                return { ...data, id };
            }

            const { data: result, error } = await this.client.from(table).update(data).eq('id', id);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar dados na tabela ${table}:`, error);
            
            // Se ocorrer erro, tente adicionar à fila offline
            if (SUPABASE_CONFIG.offline.enabled) {
                console.warn(`Adicionando operação de atualização em ${table} à fila offline devido a erro`);
                
                this.addToOfflineQueue({
                    type: 'update',
                    table,
                    id,
                    data
                });
                
                // Retornar dados atualizados para uso local
                return { ...data, id };
            }
            
            throw error;
        }
    }

    // Excluir dados com suporte offline
    async deleteData(table, id) {
        try {
            // Verificar se o servidor está acessível
            if (!window.SERVER_STATUS.serverReachable) {
                console.warn(`Servidor não acessível, adicionando operação de exclusão em ${table} à fila offline`);
                
                // Adicionar à fila offline
                this.addToOfflineQueue({
                    type: 'delete',
                    table,
                    id
                });
                
                return true;
            }

            const { data: result, error } = await this.client.from(table).delete().eq('id', id);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao excluir dados da tabela ${table}:`, error);
            
            // Se ocorrer erro, tente adicionar à fila offline
            if (SUPABASE_CONFIG.offline.enabled) {
                console.warn(`Adicionando operação de exclusão em ${table} à fila offline devido a erro`);
                
                this.addToOfflineQueue({
                    type: 'delete',
                    table,
                    id
                });
                
                return true;
            }
            
            throw error;
        }
    }

    // Processar operações pendentes quando o servidor estiver disponível
    async processPendingOperations() {
        if (!window.SERVER_STATUS.serverReachable || this.offlineQueue.length === 0) {
            return;
        }

        console.log(`Processando ${this.offlineQueue.length} operações pendentes`);
        
        // Copiar a fila para processar
        const operationsToProcess = [...this.offlineQueue];
        this.offlineQueue = [];
        this.saveOfflineQueue();
        
        // Processar cada operação
        for (const operation of operationsToProcess) {
            try {
                switch (operation.type) {
                    case 'insert':
                        // Remover propriedades temporárias
                        const insertData = { ...operation.data };
                        if (insertData._is_temp) {
                            delete insertData._is_temp;
                            delete insertData.id; // Deixar o banco gerar um ID real
                        }
                        await this.client.from(operation.table).insert(insertData);
                        break;
                        
                    case 'update':
                        await this.client.from(operation.table).update(operation.data).eq('id', operation.id);
                        break;
                        
                    case 'delete':
                        await this.client.from(operation.table).delete().eq('id', operation.id);
                        break;
                }
                
                console.log(`Operação ${operation.type} em ${operation.table} processada com sucesso`);
            } catch (error) {
                console.error(`Erro ao processar operação ${operation.type} em ${operation.table}:`, error);
                // Adicionar de volta à fila
                this.offlineQueue.push(operation);
            }
        }
        
        // Salvar a fila atualizada
        this.saveOfflineQueue();
        
        // Limpar o cache para recarregar dados
        this.clearCache();
    }

    // Limpar cache
    clearCache() {
        this.cache.clear();
        console.log('Cache limpo');
    }

    // Obter status do sistema
    getSystemStatus() {
        return {
            ...window.SERVER_STATUS,
            offlineQueueSize: this.offlineQueue.length,
            cacheSize: this.cache.size,
            reconnectAttempts: this.reconnectAttempts,
            timestamp: new Date().toISOString()
        };
    }
}

// Verificar se já existe uma instância do gerenciador
if (!window.supabaseManager) {
    // Exportar instância única do gerenciador
    window.supabaseManager = new SupabaseManager();
    
    // Inicializar automaticamente
    window.supabaseManager.initialize().catch(console.error);
} 