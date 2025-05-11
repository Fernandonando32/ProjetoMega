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
            // Usar o gerenciador Supabase com suporte offline
            if (window.supabaseManager) {
                return await window.supabaseManager.getData(
                    'users', 
                    '*', 
                    opts.useCache
                );
            }
            
            // Fallback para o método tradicional
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .order(opts.orderBy, { ascending: opts.ascending });
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            this._notifyError('Erro ao buscar usuários', error);
            return [];
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
            // Usar o gerenciador Supabase com suporte offline
            if (window.supabaseManager) {
                const users = await window.supabaseManager.getData(
                    'users', 
                    `id,full_name,username,email,role,permissions,operacao,is_active,last_login,created_at,updated_at`, 
                    useCache
                );
                
                return users.find(user => user.id == userId) || null;
            }
            
            // Fallback para o método tradicional
            const { data, error } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error) {
                if (error.code === 'PGRST116') {
                    // Não encontrado
                    return null;
                }
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error(`Erro ao buscar usuário ID ${userId}:`, error);
            this._notifyError(`Erro ao buscar usuário ID ${userId}`, error);
            return null;
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
            // Se Auth está disponível, usar o método de criação de usuário do Auth
            if (window.Auth && window.Auth.createUser) {
                const result = await window.Auth.createUser(userData);
                return result;
            }
            
            // Caso contrário, preparar dados para inserção direta
            // Mapear campos para a estrutura correta da tabela users
            const userToCreate = {
                username: userData.username,
                email: userData.email,
                full_name: userData.name,
                role: userData.accessLevel,
                permissions: userData.permissions || [],
                operacao: userData.operacao || '',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Usar o gerenciador Supabase com suporte offline
            if (window.supabaseManager) {
                const result = await window.supabaseManager.insertData('users', userToCreate);
                
                return { 
                    success: true, 
                    user: result,
                    message: 'Usuário criado com sucesso' 
                };
            }
            
            // Fallback para o método tradicional
            const { data, error } = await window.supabaseClient
                .from('users')
                .insert([userToCreate])
                .select();
                
            if (error) throw error;
            
            return { 
                success: true, 
                user: data[0],
                message: 'Usuário criado com sucesso' 
            };
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            this._notifyError('Erro ao criar usuário', error);
            
            return { 
                success: false, 
                message: `Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`,
                error 
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
            
            // Se Auth está disponível, usar o método de atualização de usuário do Auth
            if (window.Auth && window.Auth.updateUser) {
                return await window.Auth.updateUser(userId, userData);
            }
            
            // Preparar dados para atualização com os nomes de campos corretos
            const userToUpdate = {
                username: userData.username,
                email: userData.email,
                full_name: userData.name,
                role: userData.accessLevel,
                permissions: userData.permissions || [],
                operacao: userData.operacao,
                updated_at: new Date().toISOString()
            };
            
            // Remover campos vazios ou undefined
            Object.keys(userToUpdate).forEach(key => {
                if (userToUpdate[key] === undefined || userToUpdate[key] === '') {
                    delete userToUpdate[key];
                }
            });
            
            // Usar o gerenciador Supabase com suporte offline
            if (window.supabaseManager) {
                const result = await window.supabaseManager.updateData('users', userId, userToUpdate);
                
                return { 
                    success: true, 
                    user: result,
                    message: 'Usuário atualizado com sucesso' 
                };
            }
            
            // Fallback para o método tradicional
            const { data, error } = await window.supabaseClient
                .from('users')
                .update(userToUpdate)
                .eq('id', userId)
                .select();
                
            if (error) throw error;
            
            return { 
                success: true, 
                user: data[0],
                message: 'Usuário atualizado com sucesso' 
            };
        } catch (error) {
            console.error(`Erro ao atualizar usuário ID ${userId}:`, error);
            this._notifyError(`Erro ao atualizar usuário ID ${userId}`, error);
            
            return { 
                success: false, 
                message: `Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`,
                error 
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
            // Verificar se usuário existe
            const existingUser = await this.getUserById(userId, false);
            if (!existingUser) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Usar o gerenciador Supabase com suporte offline
            if (window.supabaseManager) {
                await window.supabaseManager.deleteData('users', userId);
                
                return { 
                    success: true,
                    message: 'Usuário excluído com sucesso' 
                };
            }
            
            // Fallback para o método tradicional
            const { error } = await window.supabaseClient
                .from('users')
                .delete()
                .eq('id', userId);
                
            if (error) throw error;
            
            return { 
                success: true,
                message: 'Usuário excluído com sucesso' 
            };
        } catch (error) {
            console.error(`Erro ao excluir usuário ID ${userId}:`, error);
            this._notifyError(`Erro ao excluir usuário ID ${userId}`, error);
            
            return { 
                success: false, 
                message: `Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`,
                error 
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
    }
};

// Expor API globalmente
window.UserAPI = UserAPI; 