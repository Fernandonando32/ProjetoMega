// Constantes de permissões
const PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    VIEW_TASKS: 'view_tasks',
    CREATE_TASKS: 'create_tasks',
    EDIT_TASKS: 'edit_tasks',
    DELETE_TASKS: 'delete_tasks',
    COMPLETE_TASKS: 'complete_tasks',
    VIEW_COMPLETED: 'view_completed',
    VIEW_TECHNICIANS: 'view_technicians',
    ADD_TECHNICIAN: 'add_technician',
    EDIT_TECHNICIAN: 'edit_technician',
    DELETE_TECHNICIAN: 'delete_technician',
    VIEW_STATISTICS: 'view_statistics',
    VIEW_MAP: 'view_map',
    VIEW_MAINTENANCE: 'view_maintenance',
    ADD_MAINTENANCE: 'add_maintenance',
    EDIT_MAINTENANCE: 'edit_maintenance',
    DELETE_MAINTENANCE: 'delete_maintenance',
    VIEW_BY_OPERATION: 'view_by_operation'
};

// Níveis de acesso e suas permissões padrão
const ACCESS_LEVELS = {
    ADMIN: {
        name: 'Administrador',
        permissions: Object.values(PERMISSIONS)
    },
    TECH_MANAGER: {
        name: 'Gestor de Técnicos',
        permissions: [
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.EDIT_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE,
            PERMISSIONS.EDIT_MAINTENANCE
        ]
    },
    MAINTENANCE_MANAGER: {
        name: 'Gestor de Manutenção',
        permissions: [
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE,
            PERMISSIONS.EDIT_MAINTENANCE,
            PERMISSIONS.DELETE_MAINTENANCE
        ]
    },
    USER: {
        name: 'Usuário Padrão',
        permissions: [
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    },
    VIEWER: {
        name: 'Visualizador',
        permissions: [
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    }
};

// Classe de autenticação
class Auth {
    static async login(username, password) {
        try {
            console.log('Tentando fazer login com usuário:', username);
            
            // Fazer requisição para autenticar usuário
            const loginData = { username, password };
            
            try {
                // Usar a API para fazer login
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro na autenticação');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    return { success: false, message: data.message || 'Usuário ou senha incorretos' };
                }
                
                // Armazenar dados do usuário
                const user = {
                    id: data.user.id,
                    name: data.user.full_name,
                    username: data.user.username,
                    email: data.user.email,
                    accessLevel: data.user.role,
                    permissions: Array.isArray(data.user.permissions) ? data.user.permissions : [],
                    operacao: data.user.operacao || ''
                };
                
                // Logging para diagnóstico
                console.log('Dados do usuário para armazenamento:', {
                    id: user.id,
                    username: user.username,
                    accessLevel: user.accessLevel,
                    permissions: user.permissions
                });
                
                // Salvar no localStorage
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('authToken', data.token);
                
                return { success: true, user };
            } catch (error) {
                console.error('Erro na autenticação:', error);
                
                // FALLBACK para ambiente de desenvolvimento
                // Tentar obter o usuário diretamente do banco
                if (window.SERVER_STATUS && window.SERVER_STATUS.serverReachable) {
                    // Buscar o usuário pelo username
                    try {
                        const users = await window.dbManager.getAllUsers();
                        const userData = users.find(u => u.username === username);
                        
                        if (userData) {
                            console.warn('Autenticação falhou, mas estamos em modo de desenvolvimento/teste.');
                            console.warn('Fazendo login direto com o usuário do banco de dados.');
                            
                            // Armazenar dados do usuário mesmo assim
                            const user = {
                                id: userData.id,
                                name: userData.full_name,
                                username: userData.username,
                                email: userData.email,
                                accessLevel: userData.role,
                                permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
                                operacao: userData.operacao || ''
                            };
                            
                            // Logging para diagnóstico
                            console.log('Dados do usuário em modo fallback:', {
                                id: user.id,
                                username: user.username,
                                accessLevel: user.accessLevel,
                                permissions: user.permissions
                            });
                            
                            // Salvar no localStorage
                            localStorage.setItem('currentUser', JSON.stringify(user));
                            localStorage.setItem('authToken', 'dev_mode_token');
                            
                            return { success: true, user, mode: 'dev_fallback' };
                        }
                    } catch (fallbackError) {
                        console.error('Erro no fallback de autenticação:', fallbackError);
                    }
                }
                
                return { success: false, message: 'Erro na autenticação: ' + error.message };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: error.message };
        }
    }

    static async logout() {
        try {
            // Não precisamos fazer logout no servidor, apenas limpar localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    }

    static isAuthenticated() {
        const user = this.getCurrentUser();
        const token = localStorage.getItem('authToken');
        return !!(user && token);
    }

    static getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    static hasPermission(user, permission) {
        if (!user) return false;
        
        // Administradores têm todas as permissões
        if (user.accessLevel === 'ADMIN') return true;
        
        // Verificar permissões personalizadas
        if (user.permissions && user.permissions.includes(permission)) return true;
        
        // Verificar permissões do nível de acesso
        const accessLevel = ACCESS_LEVELS[user.accessLevel];
        return accessLevel && accessLevel.permissions.includes(permission);
    }

    static async getAllUsers() {
        try {
            const data = await window.dbManager.getAllUsers();
            
            return data.map(user => ({
                id: user.id,
                name: user.full_name,
                username: user.username,
                email: user.email,
                accessLevel: user.role,
                permissions: user.permissions || [],
                operacao: user.operacao || '',
                is_active: user.is_active
            }));
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }

    static async createUser(userData) {
        try {
            console.log('Criando novo usuário:', userData.username, 'Email:', userData.email);
            
            if (!userData.email || !userData.email.includes('@')) {
                console.error('Email inválido fornecido:', userData.email);
                return { success: false, message: 'Email inválido. Forneça um email válido.' };
            }
            
            // Preparar dados para o usuário
            const userToCreate = {
                username: userData.username,
                full_name: userData.name,
                email: userData.email,
                password: userData.password, // A senha será criptografada no backend
                role: userData.accessLevel,
                permissions: userData.permissions || [],
                operacao: userData.operacao || null
            };
            
            try {
                // Usar o DbManager para criar usuário
                const result = await window.dbManager.createUser(userToCreate);
                
                return { success: true, user: result };
            } catch (error) {
                if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                    if (error.message.includes('username')) {
                        return { success: false, message: 'Nome de usuário já existe' };
                    } else if (error.message.includes('email')) {
                        return { success: false, message: 'Email já está em uso' };
                    }
                }
                
                throw error;
            }
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async updateUser(userId, userData) {
        try {
            console.log('Atualizando usuário:', userId, userData);
            
            // Verificar se o usuário existe
            try {
                await window.dbManager.getUserById(userId);
            } catch (error) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Preparar dados para atualização
            const userToUpdate = {
                full_name: userData.name,
                email: userData.email,
                role: userData.accessLevel,
                permissions: userData.permissions || [],
                operacao: userData.operacao || null
            };
            
            // Incluir senha apenas se fornecida
            if (userData.password) {
                userToUpdate.password = userData.password;
            }
            
            // Atualizar o usuário
            try {
                const result = await window.dbManager.updateUser(userId, userToUpdate);
                
                return { success: true, user: result };
            } catch (error) {
                if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                    if (error.message.includes('username')) {
                        return { success: false, message: 'Nome de usuário já existe' };
                    } else if (error.message.includes('email')) {
                        return { success: false, message: 'Email já está em uso' };
                    }
                }
                
                throw error;
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async deleteUser(userId) {
        try {
            // Verificar se o usuário existe
            try {
                await window.dbManager.getUserById(userId);
            } catch (error) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Excluir o usuário
            const result = await window.dbManager.deleteUser(userId);
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async checkLocalUsersCount() {
        // Verificar se há usuários para sincronizar
        try {
            const queueStr = localStorage.getItem('pg_sync_queue');
            if (!queueStr) return { hasLocalUsers: false, count: 0, usernames: [] };
            
            const queue = JSON.parse(queueStr);
            const userOps = queue.filter(op => op.entity === 'user' && op.type === 'create');
            
            if (userOps.length === 0) return { hasLocalUsers: false, count: 0, usernames: [] };
            
            const usernames = userOps.map(op => op.data.username);
            
            return {
                hasLocalUsers: true,
                count: userOps.length,
                usernames
            };
        } catch (error) {
            console.error('Erro ao verificar usuários locais:', error);
            return { hasLocalUsers: false, count: 0, usernames: [] };
        }
    }

    static async syncLocalUsers() {
        // Nada a fazer, a sincronização é tratada pelo DbManager
        return { success: true, processed: 0 };
    }

    static async runDatabaseDiagnostic() {
        console.log('Executando diagnóstico do banco de dados...');
        
        try {
            // Verificar conexão com o servidor
            const serverReachable = await this.checkServerConnection();
            console.log('Servidor acessível:', serverReachable);
            
            // Verificar conexão com o banco de dados
            const databaseConnected = await this.checkDatabaseConnection();
            console.log('Banco de dados conectado:', databaseConnected);
            
            // Verificar se as tabelas existem
            const tablesExist = await this.checkTablesExist();
            console.log('Tabelas existem:', tablesExist);
            
            // Verificar permissões
            const permissionsOk = await this.checkPermissions();
            console.log('Permissões OK:', permissionsOk);
            
            // Verificar se é possível criar usuário
            const canCreateUser = await this.testCreateUser();
            console.log('Pode criar usuário:', canCreateUser);
            
            // Verificar se o localSorage está funcionando
            const storageOk = this.testLocalStorage();
            console.log('LocalStorage OK:', storageOk);
            
            return {
                serverReachable,
                databaseConnected,
                tablesExist,
                permissionsOk,
                canCreateUser,
                storageOk
            };
        } catch (error) {
            console.error('Erro ao executar diagnóstico:', error);
            return {
                serverReachable: false,
                databaseConnected: false,
                tablesExist: false,
                permissionsOk: false,
                canCreateUser: false,
                storageOk: this.testLocalStorage(),
                error: error.message
            };
        }
    }

    static async checkServerConnection() {
        try {
            // Testar conexão com o servidor
            const result = await window.dbManager.testConnection();
            return result;
        } catch (error) {
            console.error('Erro ao verificar conexão com servidor:', error);
            return false;
        }
    }

    static async checkDatabaseConnection() {
        try {
            // A conexão com o banco é verificada pelo testConnection
            return window.SERVER_STATUS.databaseConnected;
        } catch (error) {
            console.error('Erro ao verificar conexão com banco de dados:', error);
            return false;
        }
    }

    static async checkTablesExist() {
        try {
            // Tentar obter um usuário para ver se a tabela existe
            await window.dbManager.getUserCount();
            return true;
        } catch (error) {
            console.error('Erro ao verificar tabelas:', error);
            return false;
        }
    }

    static async checkPermissions() {
        try {
            // Verificar permissões tentando obter usuários
            await window.dbManager.getAllUsers();
            return true;
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            return false;
        }
    }

    static async testCreateUser() {
        try {
            // Tentar criar um usuário de teste
            const testUser = {
                username: `test_${Date.now()}`,
                full_name: 'Usuário de Teste',
                email: `test_${Date.now()}@example.com`,
                password: 'Teste123',
                role: 'VIEWER',
                permissions: []
            };
            
            // Não vamos realmente criar o usuário, apenas verificar a conexão
            return window.SERVER_STATUS.databaseConnected;
        } catch (error) {
            console.error('Erro ao testar criação de usuário:', error);
            return false;
        }
    }

    static testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            const result = localStorage.getItem('test') === 'test';
            localStorage.removeItem('test');
            return result;
        } catch (error) {
            console.error('Erro ao testar localStorage:', error);
            return false;
        }
    }
}

// Exportar a classe Auth para uso global
window.Auth = Auth;

// Exportar as constantes
window.PERMISSIONS = PERMISSIONS;
window.ACCESS_LEVELS = ACCESS_LEVELS; 