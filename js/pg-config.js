// Configuração do PostgreSQL
const PG_CONFIG = {
    host: '187.62.153.52',
    port: 6432,
    database: 'acompanhamento_ftth',
    user: 'ftth',
    password: 'ftth@123.',
    ssl: false // Desabilitar SSL para conexão direta, ajuste conforme necessário
};

// Definir o status do servidor
window.SERVER_STATUS = {
    serverReachable: true,
    databaseConnected: true,
    tablesExist: true,
    permissionsOk: true,
    canCreateUser: true,
    isOnline: true
};

// Classe para gerenciar as operações de banco de dados
class DbManager {
    constructor() {
        this.config = PG_CONFIG;
        this.connected = false;
        this.cache = new Map();
        this.offlineQueue = [];
        this.loadOfflineQueue();
    }

    // Carregar a fila offline do localStorage
    loadOfflineQueue() {
        try {
            const savedQueue = localStorage.getItem('pg_sync_queue');
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
            localStorage.setItem('pg_sync_queue', JSON.stringify(this.offlineQueue));
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

    // Método para fazer requisição à API REST que comunica com o PostgreSQL
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `http://localhost:3000/api/${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            // Verificar se a resposta é bem-sucedida
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            
            // Verificar se é um erro de rede (servidor inacessível)
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                window.SERVER_STATUS.serverReachable = false;
                window.SERVER_STATUS.databaseConnected = false;
            }
            
            throw error;
        }
    }

    // Métodos específicos para operações CRUD
    
    // Obter todos os usuários
    async getAllUsers() {
        try {
            const data = await this.makeRequest('users');
            return data;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            
            // Se o servidor estiver inacessível, tentar usar dados em cache
            if (!window.SERVER_STATUS.serverReachable) {
                const cachedUsers = localStorage.getItem('cached_users');
                if (cachedUsers) {
                    return JSON.parse(cachedUsers);
                }
            }
            
            throw error;
        }
    }

    // Criar um novo usuário
    async createUser(userData) {
        try {
            const result = await this.makeRequest('users', 'POST', userData);
            return result;
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            
            // Se o servidor estiver inacessível, adicionar à fila offline
            if (!window.SERVER_STATUS.serverReachable) {
                const tempUser = {
                    ...userData,
                    id: `temp_${Date.now()}`,
                    _is_temp: true
                };
                
                this.addToOfflineQueue({
                    type: 'create',
                    entity: 'user',
                    data: tempUser
                });
                
                return tempUser;
            }
            
            throw error;
        }
    }

    // Atualizar um usuário existente
    async updateUser(userId, userData) {
        try {
            const result = await this.makeRequest(`users/${userId}`, 'PUT', userData);
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar usuário ${userId}:`, error);
            
            // Se o servidor estiver inacessível, adicionar à fila offline
            if (!window.SERVER_STATUS.serverReachable) {
                this.addToOfflineQueue({
                    type: 'update',
                    entity: 'user',
                    id: userId,
                    data: userData
                });
                
                // Retornar dados combinados para uso offline
                return { ...userData, id: userId, _is_updated_offline: true };
            }
            
            throw error;
        }
    }

    // Excluir um usuário
    async deleteUser(userId) {
        try {
            const result = await this.makeRequest(`users/${userId}`, 'DELETE');
            return result;
        } catch (error) {
            console.error(`Erro ao excluir usuário ${userId}:`, error);
            
            // Se o servidor estiver inacessível, adicionar à fila offline
            if (!window.SERVER_STATUS.serverReachable) {
                this.addToOfflineQueue({
                    type: 'delete',
                    entity: 'user',
                    id: userId
                });
                
                return { success: true, _is_deleted_offline: true };
            }
            
            throw error;
        }
    }

    // Obter usuário por ID
    async getUserById(userId) {
        try {
            const result = await this.makeRequest(`users/${userId}`);
            return result;
        } catch (error) {
            console.error(`Erro ao buscar usuário ${userId}:`, error);
            throw error;
        }
    }

    // Verificar a conexão com o servidor
    async testConnection() {
        try {
            await this.makeRequest('health');
            window.SERVER_STATUS.serverReachable = true;
            window.SERVER_STATUS.databaseConnected = true;
            return true;
        } catch (error) {
            console.error('Erro ao testar conexão:', error);
            window.SERVER_STATUS.serverReachable = false;
            window.SERVER_STATUS.databaseConnected = false;
            return false;
        }
    }

    // Obter a contagem de usuários
    async getUserCount() {
        try {
            const result = await this.makeRequest('users/count');
            return result.count;
        } catch (error) {
            console.error('Erro ao obter contagem de usuários:', error);
            return 0;
        }
    }

    // Métodos adicionais para outras operações CRUD
    
    // Operações de tarefas (agenda)
    async getAllTasks() {
        try {
            const data = await this.makeRequest('tasks');
            return data;
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            throw error;
        }
    }
    
    async createTask(taskData) {
        try {
            const result = await this.makeRequest('tasks', 'POST', taskData);
            return result;
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            throw error;
        }
    }
    
    async updateTask(taskId, taskData) {
        try {
            const result = await this.makeRequest(`tasks/${taskId}`, 'PUT', taskData);
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar tarefa ${taskId}:`, error);
            throw error;
        }
    }
    
    async deleteTask(taskId) {
        try {
            const result = await this.makeRequest(`tasks/${taskId}`, 'DELETE');
            return result;
        } catch (error) {
            console.error(`Erro ao excluir tarefa ${taskId}:`, error);
            throw error;
        }
    }
    
    // Operações de técnicos
    async getAllTechnicians() {
        try {
            const data = await this.makeRequest('technicians');
            return data;
        } catch (error) {
            console.error('Erro ao buscar técnicos:', error);
            throw error;
        }
    }
    
    // Operações de manutenção
    async getAllMaintenance() {
        try {
            const data = await this.makeRequest('maintenance');
            return data;
        } catch (error) {
            console.error('Erro ao buscar registros de manutenção:', error);
            throw error;
        }
    }
}

// Criar uma instância global do gerenciador de banco de dados
window.dbManager = new DbManager();

// Exportar o gerenciador de banco de dados
window.DbManager = DbManager;

// Exportar as operações de banco de dados para usuários (compatibilidade com código existente)
window.UserDB = {
    // Get all users
    async getAllUsers() {
        try {
            const data = await window.dbManager.getAllUsers();
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Create new user
    async createUser(userData) {
        try {
            const data = await window.dbManager.createUser(userData);
            return data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Update user
    async updateUser(userId, userData) {
        try {
            const data = await window.dbManager.updateUser(userId, userData);
            return data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            const result = await window.dbManager.deleteUser(userId);
            return result.success;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Get user by ID
    async getUserById(userId) {
        try {
            const data = await window.dbManager.getUserById(userId);
            return data;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }
}; 