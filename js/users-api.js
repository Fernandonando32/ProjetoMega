/**
 * API de Usuários - Interface para comunicação com o banco de dados
 * Fornece métodos para operações CRUD de usuários
 */

const UserAPI = {
    /**
     * Busca todos os usuários do banco de dados
     * @param {Object} options - Opções para a busca
     * @param {boolean} options.useCache - Se deve usar o cache (padrão: true)
     * @param {string} options.orderBy - Campo para ordenação (padrão: created_at)
     * @param {boolean} options.ascending - Ordem ascendente (padrão: false)
     * @returns {Promise<Array>} Lista de usuários
     */
    async getAllUsers(options = {}) {
        const defaultOptions = {
            useCache: true,
            orderBy: 'created_at',
            ascending: false
        };
        
        const opts = { ...defaultOptions, ...options };
        
        try {
            const users = await window.dbManager.getAllUsers();
            return users;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    },
    
    /**
     * Busca um usuário pelo ID
     * @param {number|string} userId - ID do usuário
     * @param {boolean} useCache - Se deve usar o cache
     * @returns {Promise<Object|null>} Dados do usuário ou null se não encontrado
     */
    async getUserById(userId, useCache = true) {
        if (!userId) {
            console.error('ID de usuário não fornecido');
            return null;
        }
        
        try {
            const user = await window.dbManager.getUserById(userId);
            return user;
        } catch (error) {
            console.error(`Erro ao buscar usuário ${userId}:`, error);
            throw error;
        }
    },
    
    /**
     * Busca um usuário pelo nome de usuário
     * @param {string} username - Nome de usuário
     * @returns {Promise<Object|null>} Dados do usuário ou null se não encontrado
     */
    async getUserByUsername(username) {
        if (!username) {
            console.error('Nome de usuário não fornecido');
            return null;
        }
        
        try {
            // Buscar todos os usuários (provavelmente do cache) e filtrar
            const users = await this.getAllUsers({ useCache: true });
            return users.find(user => user.username === username) || null;
        } catch (error) {
            console.error(`Erro ao buscar usuário "${username}":`, error);
            this._notifyError(`Erro ao buscar usuário "${username}"`, error);
            return null;
        }
    },
    
    /**
     * Cria um novo usuário
     * @param {Object} userData - Dados do usuário a ser criado
     * @returns {Promise<Object>} Resultado da operação
     */
    async createUser(userData) {
        if (!userData) {
            return { success: false, message: 'Dados do usuário não fornecidos' };
        }
        
        // Validar dados obrigatórios
        const requiredFields = ['name', 'username', 'accessLevel'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            return { 
                success: false, 
                message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
            };
        }
        
        // Verificar se nome de usuário já existe
        const existingUser = await this.getUserByUsername(userData.username);
        if (existingUser) {
            return { success: false, message: 'Nome de usuário já existe' };
        }
        
        try {
            // Preparar os dados do usuário
            const userToCreate = {
                username: userData.username,
                full_name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.accessLevel,
                permissions: userData.customPermissions ? userData.permissions : undefined,
                operacao: userData.operacao || null
            };

            // Criar o usuário
            const result = await window.dbManager.createUser(userToCreate);
            
            return { 
                success: true, 
                user: result
            };
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            
            // Tratar erros específicos
            if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                if (error.message.includes('username')) {
                    return { success: false, message: 'Nome de usuário já existe' };
                } else if (error.message.includes('email')) {
                    return { success: false, message: 'Email já está em uso' };
                }
            }
            
            return { 
                success: false, 
                message: error.message
            };
        }
    },
    
    /**
     * Atualiza um usuário existente
     * @param {number|string} userId - ID do usuário a ser atualizado
     * @param {Object} userData - Novos dados do usuário
     * @returns {Promise<Object>} Resultado da operação
     */
    async updateUser(userId, userData) {
        if (!userId) {
            return { success: false, message: 'ID de usuário não fornecido' };
        }
        
        if (!userData) {
            return { success: false, message: 'Dados para atualização não fornecidos' };
        }
        
        try {
            // Verificar se usuário existe
            const existingUser = await this.getUserById(userId, false);
            if (!existingUser) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Verificar se está tentando alterar nome de usuário para um que já existe
            if (userData.username && userData.username !== existingUser.username) {
                const userWithSameUsername = await this.getUserByUsername(userData.username);
                if (userWithSameUsername && userWithSameUsername.id !== userId) {
                    return { success: false, message: 'Nome de usuário já está em uso' };
                }
            }
            
            // Preparar os dados do usuário
            const userToUpdate = {
                full_name: userData.name,
                email: userData.email,
                role: userData.accessLevel,
                permissions: userData.customPermissions ? userData.permissions : undefined,
                operacao: userData.operacao || null
            };

            // Incluir senha apenas se fornecida
            if (userData.password) {
                userToUpdate.password = userData.password;
            }

            // Atualizar o usuário
            const result = await window.dbManager.updateUser(userId, userToUpdate);
            
            return { 
                success: true, 
                user: result
            };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            
            // Tratar erros específicos
            if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                if (error.message.includes('username')) {
                    return { success: false, message: 'Nome de usuário já existe' };
                } else if (error.message.includes('email')) {
                    return { success: false, message: 'Email já está em uso' };
                }
            }
            
            return { 
                success: false, 
                message: error.message
            };
        }
    },
    
    /**
     * Exclui um usuário
     * @param {number|string} userId - ID do usuário a ser excluído
     * @returns {Promise<Object>} Resultado da operação
     */
    async deleteUser(userId) {
        if (!userId) {
            return { success: false, message: 'ID de usuário não fornecido' };
        }
        
        // Não permitir excluir o próprio usuário
        const currentUser = window.Auth?.getCurrentUser();
        if (currentUser && currentUser.id == userId) {
            return { success: false, message: 'Não é possível excluir seu próprio usuário' };
        }
        
        try {
            const result = await window.dbManager.deleteUser(userId);
            
            return { 
                success: true
            };
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            return { 
                success: false, 
                message: error.message
            };
        }
    },
    
    /**
     * Altera a senha de um usuário
     * @param {number|string} userId - ID do usuário
     * @param {string} newPassword - Nova senha
     * @returns {Promise<Object>} Resultado da operação
     */
    async changePassword(userId, newPassword) {
        if (!userId) {
            return { success: false, message: 'ID de usuário não fornecido' };
        }
        
        if (!newPassword) {
            return { success: false, message: 'Nova senha não fornecida' };
        }
        
        try {
            // Verificar se usuário existe
            const existingUser = await this.getUserById(userId, false);
            if (!existingUser) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Atualizar usuário com a nova senha
            return await this.updateUser(userId, { password: newPassword });
        } catch (error) {
            console.error(`Erro ao alterar senha do usuário ID ${userId}:`, error);
            this._notifyError(`Erro ao alterar senha do usuário ID ${userId}`, error);
            
            return { 
                success: false, 
                message: `Erro ao alterar senha: ${error.message || 'Erro desconhecido'}`,
                error 
            };
        }
    },
    
    /**
     * Verifica a situação da fila offline
     * @returns {Object} Informações sobre a fila offline
     */
    getOfflineQueueStatus() {
        if (!window.supabaseManager?.offlineQueue) {
            return {
                enabled: false,
                available: false,
                count: 0
            };
        }
        
        return {
            enabled: true,
            available: true,
            count: window.supabaseManager.offlineQueue.length,
            operations: window.supabaseManager.offlineQueue.map(op => ({
                type: op.type,
                table: op.table,
                timestamp: new Date(op.timestamp).toISOString()
            }))
        };
    },
    
    /**
     * Força a tentativa de sincronização da fila offline
     * @returns {Promise<Object>} Resultado da operação
     */
    async syncOfflineQueue() {
        if (!window.supabaseManager?.processPendingOperations) {
            return {
                success: false,
                message: 'Funcionalidade de sincronização não disponível'
            };
        }
        
        try {
            const queueBefore = this.getOfflineQueueStatus();
            
            await window.supabaseManager.processPendingOperations();
            
            const queueAfter = this.getOfflineQueueStatus();
            
            return {
                success: true,
                message: 'Sincronização concluída',
                operationsProcessed: queueBefore.count - queueAfter.count,
                operationsRemaining: queueAfter.count
            };
        } catch (error) {
            console.error('Erro ao sincronizar fila offline:', error);
            this._notifyError('Erro ao sincronizar dados', error);
            
            return { 
                success: false, 
                message: `Erro ao sincronizar: ${error.message || 'Erro desconhecido'}`,
                error 
            };
        }
    },
    
    /**
     * Método interno para notificar erros importantes
     * @private
     */
    _notifyError(message, error) {
        // Se existir um sistema de notificação, usar
        if (window.NotificationSystem) {
            window.NotificationSystem.showError(message, error);
            return;
        }
        
        // Registrar eventos no console
        if (error && error.message) {
            console.error(`${message}: ${error.message}`, error);
        } else {
            console.error(message);
        }
    },

    async checkUsername(username) {
        try {
            const users = await this.getAllUsers();
            return users.some(user => user.username === username);
        } catch (error) {
            console.error('Erro ao verificar nome de usuário:', error);
            return false;
        }
    },

    async checkEmail(email) {
        try {
            const users = await this.getAllUsers();
            return users.some(user => user.email === email);
        } catch (error) {
            console.error('Erro ao verificar email:', error);
            return false;
        }
    }
};

// Expor API globalmente
window.UserAPI = UserAPI; 