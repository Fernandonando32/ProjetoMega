/**
 * Módulo de autenticação para o frontend
 */

// Constantes para permissões
export const PERMISSIONS = {
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

// URL da API de login
const API_URL = '/api';

/**
 * Faz login no sistema
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<boolean>} - True se o login foi bem-sucedido
 */
export async function login(username, password) {
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
}

/**
 * Verifica se o usuário está autenticado
 * @returns {Promise<boolean>} - True se o usuário estiver autenticado
 */
export async function isAuthenticated() {
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
}

/**
 * Faz logout do sistema
 * @returns {Promise<boolean>} - True se o logout foi bem-sucedido
 */
export async function logout() {
    try {
        console.log('Fazendo logout');
        // Limpa dados do usuário do sessionStorage
        sessionStorage.removeItem('currentUser');
        
        // Notifica o servidor (opcional, dependendo da implementação)
        const response = await fetch(`${API_URL}?action=logout`, {
            method: 'POST',
        });

        return response.ok;
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        return false;
    }
}

/**
 * Obtém o usuário atual
 * @returns {Object|null} - Objeto com dados do usuário ou null se não estiver autenticado
 */
export function getCurrentUser() {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Verifica se o usuário tem uma permissão específica
 * @param {Object} user - Objeto do usuário
 * @param {string} permission - Permissão a verificar
 * @returns {boolean} - True se o usuário tiver a permissão
 */
export function hasPermission(user, permission) {
    if (!user || !user.accessLevel) return false;
    
    // Verifica se o usuário tem permissões personalizadas
    if (user.customPermissions && user.permissions) {
        return user.permissions.includes(permission);
    }
    
    // Obter permissões do nível de acesso
    const accessLevels = {
        ADMIN: [
            // Todas as permissões
            ...Object.values(PERMISSIONS)
        ],
        TECH_MANAGER: [
            // Permissões relacionadas a técnicos e agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.EDIT_TECHNICIAN,
            PERMISSIONS.DELETE_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            PERMISSIONS.VIEW_MAINTENANCE
        ],
        MAINTENANCE_MANAGER: [
            // Permissões relacionadas a manutenção
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_BY_OPERATION,
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE,
            PERMISSIONS.EDIT_MAINTENANCE,
            PERMISSIONS.DELETE_MAINTENANCE
        ],
        USER: [
            // Permissões básicas
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE
        ],
        VIEWER: [
            // Permissões de visualização apenas
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    };
    
    return accessLevels[user.accessLevel]?.includes(permission) || false;
} 