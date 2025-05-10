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
            // Verificar credenciais no Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username,
                password: password
            });

            if (error) throw error;

            // Obter dados do usuário
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError) throw userError;

            // Armazenar dados do usuário
            const user = {
                id: userData.id,
                name: userData.full_name,
                username: userData.username,
                email: userData.email,
                accessLevel: userData.role,
                permissions: userData.permissions || [],
                operacao: userData.operacao
            };

            // Salvar no localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', data.session.access_token);

            return { success: true, user };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: error.message };
        }
    }

    static async logout() {
        try {
            await supabase.auth.signOut();
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
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(user => ({
                id: user.id,
                name: user.full_name,
                username: user.username,
                email: user.email,
                accessLevel: user.role,
                permissions: user.permissions || [],
                operacao: user.operacao,
                is_active: user.is_active
            }));
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    }

    static async createUser(userData) {
        try {
            // Criar usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password
            });

            if (authError) throw authError;

            // Criar registro na tabela users
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    username: userData.username,
                    email: userData.email,
                    full_name: userData.name,
                    role: userData.accessLevel,
                    permissions: userData.permissions || [],
                    operacao: userData.operacao,
                    is_active: true
                }])
                .select();

            if (error) throw error;

            return { success: true, user: data[0] };
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async updateUser(userId, userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    full_name: userData.name,
                    username: userData.username,
                    email: userData.email,
                    role: userData.accessLevel,
                    permissions: userData.permissions || [],
                    operacao: userData.operacao
                })
                .eq('id', userId)
                .select();

            if (error) throw error;

            // Se houver nova senha, atualizar no Supabase Auth
            if (userData.password) {
                const { error: authError } = await supabase.auth.admin.updateUserById(
                    userId,
                    { password: userData.password }
                );
                if (authError) throw authError;
            }

            return { success: true, user: data[0] };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async deleteUser(userId) {
        try {
            // Deletar usuário do Supabase Auth
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            if (authError) throw authError;

            // Deletar registro da tabela users
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            return { success: false, message: error.message };
        }
    }

    static async checkLocalUsersCount() {
        try {
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            return {
                hasLocalUsers: localUsers.length > 0,
                count: localUsers.length,
                usernames: localUsers.map(u => u.username)
            };
        } catch (error) {
            console.error('Erro ao verificar usuários locais:', error);
            return { hasLocalUsers: false, count: 0, usernames: [] };
        }
    }

    static async syncLocalUsers() {
        try {
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const results = [];

            for (const localUser of localUsers) {
                try {
                    const result = await this.createUser(localUser);
                    results.push({
                        username: localUser.username,
                        success: result.success,
                        serverId: result.user?.id,
                        error: result.message
                    });
                } catch (error) {
                    results.push({
                        username: localUser.username,
                        success: false,
                        error: error.message
                    });
                }
            }

            // Limpar usuários locais após sincronização
            localStorage.removeItem('localUsers');

            return {
                success: results.some(r => r.success),
                message: `Sincronização concluída: ${results.filter(r => r.success).length} de ${results.length} usuários sincronizados`,
                details: results
            };
        } catch (error) {
            console.error('Erro na sincronização:', error);
            return { success: false, message: error.message };
        }
    }

    static async runDatabaseDiagnostic() {
        try {
            // Verificar conexão com o servidor
            const serverReachable = await this.checkServerConnection();
            
            // Verificar conexão com o banco
            const databaseConnected = await this.checkDatabaseConnection();
            
            // Verificar existência das tabelas
            const tablesExist = await this.checkTablesExist();
            
            // Verificar permissões
            const permissionsOk = await this.checkPermissions();
            
            // Verificar capacidade de criar usuário
            const canCreateUser = await this.testCreateUser();
            
            // Verificar ambiente
            const environment = {
                isOnline: navigator.onLine,
                localStorage: this.testLocalStorage()
            };

            return {
                serverReachable,
                databaseConnected,
                tablesExist,
                permissionsOk,
                canCreateUser,
                environment,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro no diagnóstico:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Métodos auxiliares de diagnóstico
    static async checkServerConnection() {
        try {
            const response = await fetch(supabase.supabaseUrl);
            return response.ok;
        } catch {
            return false;
        }
    }

    static async checkDatabaseConnection() {
        try {
            const { data, error } = await supabase.from('users').select('count').limit(1);
            return !error;
        } catch {
            return false;
        }
    }

    static async checkTablesExist() {
        try {
            const { data, error } = await supabase.from('users').select('id').limit(1);
            return !error;
        } catch {
            return false;
        }
    }

    static async checkPermissions() {
        try {
            const { data, error } = await supabase.from('users').select('id').limit(1);
            return !error;
        } catch {
            return false;
        }
    }

    static async testCreateUser() {
        try {
            const testUser = {
                username: 'test_user_' + Date.now(),
                email: `test_${Date.now()}@test.com`,
                password: 'Test123!',
                name: 'Test User',
                accessLevel: 'VIEWER'
            };

            const result = await this.createUser(testUser);
            if (result.success) {
                await this.deleteUser(result.user.id);
            }
            return result.success;
        } catch {
            return false;
        }
    }

    static testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return { working: true };
        } catch (error) {
            return { working: false, error: error.message };
        }
    }
}

// Exportar para uso global
window.Auth = Auth;
window.PERMISSIONS = PERMISSIONS;
window.ACCESS_LEVELS = ACCESS_LEVELS; 