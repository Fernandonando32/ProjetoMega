/**
 * Módulo de autenticação para o frontend
 * Versão modificada para funcionar sem ES6 modules
 */

// Usar objeto global em vez de exports
window.Auth = {};

// Constantes para permissões
Auth.PERMISSIONS = {
    // Permissões da Agenda
    VIEW_TASKS: 'view_tasks',
    CREATE_TASKS: 'create_tasks',
    EDIT_TASKS: 'edit_tasks',
    DELETE_TASKS: 'delete_tasks',
    COMPLETE_TASKS: 'complete_tasks',
    VIEW_COMPLETED: 'view_completed',
    
    // Permissões de Acompanhamento de Técnicos e Veículos
    VIEW_TECHNICIANS: 'view_technicians',
    ADD_TECHNICIAN: 'add_technician',
    EDIT_TECHNICIAN: 'edit_technician',
    DELETE_TECHNICIAN: 'delete_technician',
    VIEW_STATISTICS: 'view_statistics',
    VIEW_MAP: 'view_map',
    VIEW_BY_OPERATION: 'view_by_operation',
    
    // Permissões de Manutenção de Veículos
    VIEW_MAINTENANCE: 'view_maintenance',
    ADD_MAINTENANCE: 'add_maintenance',
    EDIT_MAINTENANCE: 'edit_maintenance',
    DELETE_MAINTENANCE: 'delete_maintenance',
    
    // Permissões de administração
    MANAGE_USERS: 'manage_users'
};

// Definição dos níveis de acesso
Auth.ACCESS_LEVELS = {
    ADMIN: {
        name: 'Administrador',
        permissions: Object.values(Auth.PERMISSIONS)
    },
    TECH_MANAGER: {
        name: 'Gestor de Técnicos',
        permissions: [
            Auth.PERMISSIONS.VIEW_TASKS,
            Auth.PERMISSIONS.CREATE_TASKS,
            Auth.PERMISSIONS.EDIT_TASKS,
            Auth.PERMISSIONS.COMPLETE_TASKS,
            Auth.PERMISSIONS.VIEW_COMPLETED,
            Auth.PERMISSIONS.VIEW_TECHNICIANS,
            Auth.PERMISSIONS.ADD_TECHNICIAN,
            Auth.PERMISSIONS.EDIT_TECHNICIAN,
            Auth.PERMISSIONS.DELETE_TECHNICIAN,
            Auth.PERMISSIONS.VIEW_STATISTICS,
            Auth.PERMISSIONS.VIEW_MAP,
            Auth.PERMISSIONS.VIEW_BY_OPERATION,
            Auth.PERMISSIONS.VIEW_MAINTENANCE
        ]
    },
    MAINTENANCE_MANAGER: {
        name: 'Gestor de Manutenção',
        permissions: [
            Auth.PERMISSIONS.VIEW_TASKS,
            Auth.PERMISSIONS.CREATE_TASKS,
            Auth.PERMISSIONS.EDIT_TASKS,
            Auth.PERMISSIONS.COMPLETE_TASKS,
            Auth.PERMISSIONS.VIEW_COMPLETED,
            Auth.PERMISSIONS.VIEW_TECHNICIANS,
            Auth.PERMISSIONS.VIEW_STATISTICS,
            Auth.PERMISSIONS.VIEW_BY_OPERATION,
            Auth.PERMISSIONS.VIEW_MAINTENANCE,
            Auth.PERMISSIONS.ADD_MAINTENANCE,
            Auth.PERMISSIONS.EDIT_MAINTENANCE,
            Auth.PERMISSIONS.DELETE_MAINTENANCE
        ]
    },
    USER: {
        name: 'Usuário Padrão',
        permissions: [
            Auth.PERMISSIONS.VIEW_TASKS,
            Auth.PERMISSIONS.CREATE_TASKS,
            Auth.PERMISSIONS.EDIT_TASKS,
            Auth.PERMISSIONS.COMPLETE_TASKS,
            Auth.PERMISSIONS.VIEW_COMPLETED,
            Auth.PERMISSIONS.VIEW_TECHNICIANS,
            Auth.PERMISSIONS.ADD_TECHNICIAN,
            Auth.PERMISSIONS.VIEW_STATISTICS,
            Auth.PERMISSIONS.VIEW_MAP,
            Auth.PERMISSIONS.VIEW_BY_OPERATION,
            Auth.PERMISSIONS.VIEW_MAINTENANCE,
            Auth.PERMISSIONS.ADD_MAINTENANCE
        ]
    },
    VIEWER: {
        name: 'Visualizador',
        permissions: [
            Auth.PERMISSIONS.VIEW_TASKS,
            Auth.PERMISSIONS.VIEW_COMPLETED,
            Auth.PERMISSIONS.VIEW_TECHNICIANS,
            Auth.PERMISSIONS.VIEW_STATISTICS,
            Auth.PERMISSIONS.VIEW_MAINTENANCE
        ]
    }
};

// URL da API de login
const API_URL = '/api';

/**
 * Faz login no sistema
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<boolean>} - True se o login foi bem-sucedido
 */
Auth.login = async function(username, password) {
    try {
        console.log('Tentando login para usuário:', username);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Login bem-sucedido');
            // Armazenar dados do usuário na sessão
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            return true;
        } else {
            console.error('Erro no login:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return false;
    }
};

/**
 * Verifica se o usuário está autenticado
 * @returns {Promise<boolean>} - True se o usuário estiver autenticado
 */
Auth.isAuthenticated = async function() {
    try {
        // Primeiro, verifica se há dados no sessionStorage
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            console.log('Usuário já autenticado via sessionStorage');
            return true;
        }
        
        console.log('Verificando autenticação com o servidor');
        // Se não houver, verifica com o servidor
        const response = await fetch(`${API_URL}?action=check`, {
            method: 'GET',
        });

        const data = await response.json();
        
        if (response.ok && data.authenticated) {
            console.log('Usuário autenticado via servidor');
            // Atualiza os dados do usuário na sessão
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            return true;
        } else {
            console.log('Usuário não autenticado');
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
    }
};

/**
 * Faz logout do sistema
 * @returns {Promise<boolean>} - True se o logout foi bem-sucedido
 */
Auth.logout = async function() {
    try {
        console.log('Fazendo logout');
        // Limpa dados do usuário do sessionStorage
        sessionStorage.removeItem('currentUser');
        
        // Notifica o servidor (opcional, dependendo da implementação)
        try {
            const response = await fetch(`${API_URL}?action=logout`, {
                method: 'POST',
            });
            
            console.log('Resposta do servidor para logout:', response.ok ? 'sucesso' : 'falha');
        } catch (serverError) {
            console.warn('Erro ao notificar servidor sobre logout:', serverError);
            // Continua com o processo de logout mesmo com erro no servidor
        }
        
        // Redirecionar para a página de login
        window.location.href = 'login.html';
        return true;
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Ainda tenta redirecionar em caso de erro
        window.location.href = 'login.html';
        return false;
    }
};

/**
 * Obtém o usuário atual
 * @returns {Object|null} - Objeto com dados do usuário ou null se não estiver autenticado
 */
Auth.getCurrentUser = function() {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};

/**
 * Verifica se o usuário tem uma permissão específica
 * @param {Object} user - Objeto do usuário
 * @param {string} permission - Permissão a verificar
 * @returns {boolean} - True se o usuário tiver a permissão
 */
Auth.hasPermission = function(user, permission) {
    if (!user || !user.accessLevel) return false;
    
    // Verifica se o usuário tem permissões personalizadas
    if (user.customPermissions && user.permissions) {
        return user.permissions.includes(permission);
    }
    
    // Obter permissões do nível de acesso
    const accessLevel = Auth.ACCESS_LEVELS[user.accessLevel];
    if (!accessLevel) return false;
    
    return accessLevel.permissions.includes(permission);
};

// Adicionando outras funções necessárias
Auth.getAllUsers = async function() {
    // Implementação básica
    return [];
};

Auth.createUser = async function(userData) {
    // Implementação básica
    return {};
};

Auth.updateUser = async function(userId, userData) {
    // Implementação básica
    return {};
};

Auth.deleteUser = async function(userId) {
    // Implementação básica
    return true;
};

/**
 * Verifica se há usuários locais para sincronizar
 * @returns {Promise<Object>} - Objeto com informações sobre usuários locais
 */
Auth.checkLocalUsersCount = async function() {
    try {
        // Verificar se há usuários no localStorage
        const localUsers = localStorage.getItem('localUsers');
        if (!localUsers) {
            return {
                hasLocalUsers: false,
                count: 0,
                usernames: []
            };
        }

        const users = JSON.parse(localUsers);
        return {
            hasLocalUsers: users.length > 0,
            count: users.length,
            usernames: users.map(user => user.username)
        };
    } catch (error) {
        console.error('Erro ao verificar usuários locais:', error);
        return {
            hasLocalUsers: false,
            count: 0,
            usernames: []
        };
    }
};

/**
 * Sincroniza usuários locais com o servidor
 * @returns {Promise<Object>} - Resultado da sincronização
 */
Auth.syncLocalUsers = async function() {
    try {
        // Obter usuários locais
        const localUsers = localStorage.getItem('localUsers');
        if (!localUsers) {
            return {
                success: true,
                message: 'Não há usuários locais para sincronizar'
            };
        }

        const users = JSON.parse(localUsers);
        const results = {
            success: true,
            message: 'Sincronização concluída',
            details: []
        };

        // Tentar sincronizar cada usuário
        for (const user of users) {
            try {
                const response = await fetch(`${API_URL}?action=create-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user)
                });

                const data = await response.json();
                
                results.details.push({
                    username: user.username,
                    success: response.ok,
                    serverId: data.userId,
                    error: data.error
                });
            } catch (error) {
                results.details.push({
                    username: user.username,
                    success: false,
                    error: error.message
                });
            }
        }

        // Se todos os usuários foram sincronizados com sucesso, limpar o localStorage
        if (results.details.every(detail => detail.success)) {
            localStorage.removeItem('localUsers');
            results.message = 'Todos os usuários foram sincronizados com sucesso';
        } else {
            results.message = 'Alguns usuários não puderam ser sincronizados';
        }

        return results;
    } catch (error) {
        console.error('Erro ao sincronizar usuários:', error);
        return {
            success: false,
            message: 'Erro ao sincronizar usuários: ' + error.message
        };
    }
};

console.log('Auth module loaded successfully (non-module version)'); 