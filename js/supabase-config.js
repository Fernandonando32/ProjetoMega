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
    }
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
    }

    // Inicializar o cliente Supabase
    async initialize() {
        try {
            // Não criamos um novo cliente, apenas testamos a conexão
            await this.testConnection();
            this.connected = true;
            console.log('Conexão com Supabase estabelecida com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
            return false;
        }
    }

    // Testar conexão com o servidor
    async testConnection() {
        try {
            const { data, error } = await this.client.from('users').select('count').limit(1);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
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

    // Obter dados com cache
    async getData(table, query, useCache = true) {
        const cacheKey = `${table}-${JSON.stringify(query)}`;

        if (useCache && SUPABASE_CONFIG.cache.enabled) {
            const cachedData = this.cache.get(cacheKey);
            if (cachedData && Date.now() - cachedData.timestamp < SUPABASE_CONFIG.cache.ttl) {
                return cachedData.data;
            }
        }

        try {
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
            throw error;
        }
    }

    // Inserir dados
    async insertData(table, data) {
        try {
            const { data: result, error } = await this.client.from(table).insert(data);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao inserir dados na tabela ${table}:`, error);
            throw error;
        }
    }

    // Atualizar dados
    async updateData(table, id, data) {
        try {
            const { data: result, error } = await this.client.from(table).update(data).eq('id', id);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar dados na tabela ${table}:`, error);
            throw error;
        }
    }

    // Excluir dados
    async deleteData(table, id) {
        try {
            const { data: result, error } = await this.client.from(table).delete().eq('id', id);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error(`Erro ao excluir dados da tabela ${table}:`, error);
            throw error;
        }
    }

    // Limpar cache
    clearCache() {
        this.cache.clear();
    }
}

// Verificar se já existe uma instância do gerenciador
if (!window.supabaseManager) {
    // Exportar instância única do gerenciador
    window.supabaseManager = new SupabaseManager();
    
    // Inicializar automaticamente
    window.supabaseManager.initialize().catch(console.error);
} 