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

// Definição dos níveis de acesso
export const ACCESS_LEVELS = {
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
            PERMISSIONS.DELETE_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    },
    MAINTENANCE_MANAGER: {
        name: 'Gestor de Manutenção',
        permissions: [
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
        ]
    },
    USER: {
        name: 'Usuário Padrão',
        permissions: [
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
        ]
    },
    VIEWER: {
        name: 'Visualizador',
        permissions: [
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAINTENANCE
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

/**
 * Obtém a lista de todos os usuários
 * @returns {Promise<Array>} - Lista de usuários
 */
export async function getAllUsers() {
    try {
        console.log('Buscando lista de usuários');
        
        // Obter usuários do armazenamento local primeiro
        let localUsers = [];
        try {
            const usersInLocalStorage = localStorage.getItem('users');
            if (usersInLocalStorage) {
                localUsers = JSON.parse(usersInLocalStorage);
                console.log(`Encontrados ${localUsers.length} usuários no armazenamento local`);
            }
        } catch (localError) {
            console.warn('Erro ao acessar localStorage:', localError);
        }
        
        // Tentar obter usuários do servidor
        try {
            console.log(`Fazendo requisição para ${API_URL}?action=get-users`);
            const response = await fetch(`${API_URL}?action=get-users`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Erro ao processar resposta JSON:', jsonError);
                console.log('Resposta bruta:', await response.text());
                return mergeDatabaseAndLocalUsers([], localUsers);
            }
            
            // Mesmo em caso de erro (500), o servidor pode retornar usuários padrão
            if (data && data.users) {
                console.log(`Recebidos ${data.users.length} usuários do servidor`);
                
                if (data.fromDefault) {
                    console.log('Usando usuários padrão fornecidos pelo servidor');
                }
                
                // Se houver mensagem de erro, exibir
                if (!response.ok) {
                    console.warn(`API retornou erro ${response.status}, mas forneceu usuários de fallback`);
                    if (data.error) console.error('Mensagem de erro:', data.error);
                }
                
                // Mesclar usuários do servidor com usuários locais
                return mergeDatabaseAndLocalUsers(data.users, localUsers);
            }
            
            // Se não tiver usuários e não for OK, usar apenas local
            if (!response.ok) {
                console.warn(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
                return mergeDatabaseAndLocalUsers([], localUsers);
            }
            
            console.error('Resposta inesperada do servidor sem usuários:', data);
            return mergeDatabaseAndLocalUsers([], localUsers);
        } catch (serverError) {
            console.warn('Erro de comunicação com o servidor:', serverError);
            return mergeDatabaseAndLocalUsers([], localUsers);
        }
    } catch (error) {
        console.error('Erro ao obter lista de usuários:', error);
        
        // Em caso de erro, tentar retornar os usuários locais como fallback
        try {
            const usersInLocalStorage = localStorage.getItem('users');
            return usersInLocalStorage ? JSON.parse(usersInLocalStorage) : [];
        } catch (fallbackError) {
            console.error('Erro no fallback de localStorage:', fallbackError);
            return [];
        }
    }
}

/**
 * Mescla usuários do banco de dados e do armazenamento local
 * @param {Array} dbUsers - Usuários do banco de dados
 * @param {Array} localUsers - Usuários do armazenamento local
 * @returns {Array} - Lista de usuários mesclada
 */
function mergeDatabaseAndLocalUsers(dbUsers, localUsers) {
    // Se não houver usuários locais, retornar apenas os do banco
    if (!localUsers || localUsers.length === 0) {
        return dbUsers;
    }
    
    // Se não houver usuários do banco, retornar apenas os locais
    if (!dbUsers || dbUsers.length === 0) {
        return localUsers;
    }
    
    // Criar um mapa de usuários do banco para rápido acesso
    const dbUserMap = new Map();
    dbUsers.forEach(user => {
        dbUserMap.set(user.id, user);
    });
    
    // Adicionar usuários locais que não existem no banco
    // São os usuários com IDs baseados em timestamp (13+ dígitos)
    const localOnlyUsers = localUsers.filter(user => {
        // Se o ID for um timestamp (13+ dígitos)
        return !dbUserMap.has(user.id) && String(user.id).length >= 13;
    });
    
    console.log(`Mesclando ${dbUsers.length} usuários do servidor com ${localOnlyUsers.length} usuários locais`);
    
    // Combinar usuários do banco com usuários locais
    const combinedUsers = [...dbUsers, ...localOnlyUsers];
    
    // Atualizar o armazenamento local com a lista mesclada
    try {
        localStorage.setItem('users', JSON.stringify(combinedUsers));
    } catch (e) {
        console.warn('Erro ao atualizar localStorage com usuários mesclados:', e);
    }
    
    return combinedUsers;
}

/**
 * Cria um novo usuário
 * @param {Object} userData - Dados do usuário a ser criado
 * @returns {Promise<Object>} - Objeto com resultado da operação
 */
export async function createUser(userData) {
    try {
        console.log('Criando novo usuário:', userData.username);
        
        // Se não conseguir se comunicar com o servidor, usar armazenamento local
        try {
            const response = await fetch(`${API_URL}?action=create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('Usuário criado com sucesso');
                
                // Se o usuário foi criado no modo offline, adicionar ao armazenamento local
                if (data.offline) {
                    console.log('Usuário criado em modo offline, salvando localmente');
                    const existingUsers = localStorage.getItem('users');
                    const users = existingUsers ? JSON.parse(existingUsers) : [];
                    users.push(data.user);
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                return { success: true, user: data.user, offline: data.offline };
            } else {
                console.error('Erro ao criar usuário:', data.error);
                throw new Error(data.message || data.error || 'Erro ao criar usuário');
            }
        } catch (serverError) {
            console.warn('Erro de comunicação com o servidor:', serverError);
            console.log('Usando armazenamento local para criar usuário');
            
            // Verificar se o nome de usuário já existe
            const existingUsers = await getAllUsers();
            if (existingUsers.some(user => user.username === userData.username)) {
                return { success: false, message: 'Nome de usuário já existe' };
            }
            
            // Criar novo usuário localmente
            const newUser = {
                ...userData,
                id: Date.now() // Gerar ID único baseado no timestamp
            };
            
            // Adicionar à lista de usuários local
            const updatedUsers = [...existingUsers, newUser];
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            return { success: true, user: newUser, offline: true };
        }
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return { success: false, message: error.message || 'Erro ao criar usuário' };
    }
}

/**
 * Atualiza um usuário existente
 * @param {number} userId - ID do usuário a ser atualizado
 * @param {Object} userData - Novos dados do usuário
 * @returns {Promise<Object>} - Objeto com resultado da operação
 */
export async function updateUser(userId, userData) {
    try {
        console.log('Atualizando usuário:', userId);
        
        // Se não conseguir se comunicar com o servidor, usar armazenamento local
        try {
            const response = await fetch(`${API_URL}?action=update-user&id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                console.error('Resposta não-OK do servidor:', response.status, response.statusText);
                
                // Se for um erro 404 (usuário não encontrado), provavelmente é um usuário local
                if (response.status === 404) {
                    console.log('Usuário não encontrado no servidor, tentando atualizar localmente');
                    return updateLocalUser(userId, userData);
                }
            }

            const data = await response.json();
            
            if (response.ok) {
                console.log('Usuário atualizado com sucesso');
                
                // Verificar se o usuário foi atualizado em modo offline
                if (data.offline) {
                    console.log('Usuário atualizado em modo offline, atualizando armazenamento local');
                    return updateLocalUser(userId, userData);
                }
                
                return { success: true, user: data.user };
            } else {
                console.error('Erro ao atualizar usuário:', data.error);
                
                // Tentar como fallback atualizar localmente
                if (data.error === "Usuário não encontrado" || data.message?.includes("não existe")) {
                    console.log('Tentando atualizar usuário localmente após erro de "não encontrado"');
                    return updateLocalUser(userId, userData);
                }
                
                throw new Error(data.message || data.error || 'Erro ao atualizar usuário');
            }
        } catch (serverError) {
            console.warn('Erro de comunicação com o servidor:', serverError);
            console.log('Usando armazenamento local para atualizar usuário');
            
            return updateLocalUser(userId, userData);
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { success: false, message: error.message || 'Erro ao atualizar usuário' };
    }
}

/**
 * Função auxiliar para atualizar um usuário no armazenamento local
 * @param {number} userId - ID do usuário a ser atualizado
 * @param {Object} userData - Novos dados do usuário
 * @returns {Promise<Object>} - Objeto com resultado da operação
 */
async function updateLocalUser(userId, userData) {
    try {
        // Obter lista atual de usuários
        let existingUsers = [];
        const usersInLocalStorage = localStorage.getItem('users');
        if (usersInLocalStorage) {
            existingUsers = JSON.parse(usersInLocalStorage);
        }
        
        // Verificar se o usuário existe
        const userIndex = existingUsers.findIndex(user => user.id == userId);
        
        if (userIndex === -1) {
            console.log(`Usuário ${userId} não encontrado no armazenamento local. Criando novo.`);
            // Alternativa: criar um novo usuário
            const newUser = {
                ...userData,
                id: userId
            };
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            
            // Se o usuário atual foi atualizado, atualizar na sessão
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id == userId) {
                const { password, ...userWithoutPassword } = newUser;
                sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            }
            
            return { success: true, user: newUser, offline: true };
        }
        
        // Verificar se o nome de usuário já existe (exceto para o próprio usuário)
        if (existingUsers.some(user => user.username === userData.username && user.id != userId)) {
            return { success: false, message: 'Nome de usuário já existe' };
        }
        
        // Atualizar usuário
        const updatedUser = {
            ...existingUsers[userIndex],
            ...userData,
            id: userId // Manter o ID original
        };
        
        existingUsers[userIndex] = updatedUser;
        
        // Salvar no armazenamento local
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Se o usuário atual foi atualizado, atualizar na sessão
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id == userId) {
            const { password, ...userWithoutPassword } = updatedUser;
            sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        }
        
        return { success: true, user: updatedUser, offline: true };
    } catch (error) {
        console.error('Erro ao atualizar usuário localmente:', error);
        return { success: false, message: 'Erro ao atualizar usuário localmente: ' + error.message };
    }
}

/**
 * Exclui um usuário
 * @param {number} userId - ID do usuário a ser excluído
 * @returns {Promise<Object>} - Objeto com resultado da operação
 */
export async function deleteUser(userId) {
    try {
        console.log('Excluindo usuário:', userId);
        
        // Se não conseguir se comunicar com o servidor, usar armazenamento local
        try {
            const response = await fetch(`${API_URL}?action=delete-user&id=${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('Usuário excluído com sucesso');
                return { success: true };
            } else {
                console.error('Erro ao excluir usuário:', data.error);
                throw new Error(data.error);
            }
        } catch (serverError) {
            console.warn('Erro de comunicação com o servidor:', serverError);
            console.log('Usando armazenamento local para excluir usuário');
            
            // Obter lista atual de usuários
            let existingUsers = await getAllUsers();
            
            // Verificar se o usuário existe
            const userIndex = existingUsers.findIndex(user => user.id === userId);
            if (userIndex === -1) {
                return { success: false, message: 'Usuário não encontrado' };
            }
            
            // Remover usuário da lista
            existingUsers.splice(userIndex, 1);
            
            // Salvar no armazenamento local
            localStorage.setItem('users', JSON.stringify(existingUsers));
            
            return { success: true };
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return { success: false, message: error.message || 'Erro ao excluir usuário' };
    }
}

/**
 * Realiza diagnóstico da conexão com o banco de dados
 * @returns {Promise<Object>} - Resultados do diagnóstico
 */
export async function diagnoseConnection() {
    try {
        console.log('Iniciando diagnóstico de conexão...');
        
        // Tentar diagnóstico com o servidor
        try {
            const response = await fetch(`${API_URL}?action=diagnose-db`, {
                method: 'GET',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            // Se não conseguir se comunicar com o servidor
            if (!response.ok) {
                console.warn(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
                return {
                    success: false,
                    serverConnection: false,
                    error: `Erro HTTP ${response.status}: ${response.statusText}`
                };
            }
            
            const data = await response.json();
            console.log('Resultados do diagnóstico:', data);
            
            return {
                success: true,
                ...data.diagnostic,
                timestamp: new Date().toISOString()
            };
        } catch (serverError) {
            console.warn('Erro de comunicação com o servidor:', serverError);
            return {
                success: false,
                serverConnection: false,
                error: serverError.message,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        console.error('Erro ao realizar diagnóstico:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Realiza diagnóstico do estado atual da autenticação
 * @returns {Object} - Informações sobre o estado de autenticação
 */
export function getDiagnosticInfo() {
    try {
        // Verificar dados no sessionStorage
        const sessionData = {};
        try {
            const currentUser = sessionStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                sessionData.user = {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    accessLevel: user.accessLevel
                };
                sessionData.hasSession = true;
            } else {
                sessionData.hasSession = false;
            }
        } catch (e) {
            sessionData.sessionError = e.message;
        }
        
        // Verificar dados no localStorage
        const storageData = {};
        try {
            const usersInLocalStorage = localStorage.getItem('users');
            if (usersInLocalStorage) {
                const users = JSON.parse(usersInLocalStorage);
                storageData.userCount = users.length;
                storageData.hasLocalUsers = users.length > 0;
                
                // Lista apenas os nomes e IDs dos usuários para segurança
                storageData.localUsers = users.map(user => ({
                    id: user.id,
                    username: user.username,
                    accessLevel: user.accessLevel
                }));
            } else {
                storageData.hasLocalUsers = false;
                storageData.userCount = 0;
            }
        } catch (e) {
            storageData.storageError = e.message;
        }
        
        return {
            success: true,
            apiUrl: API_URL,
            session: sessionData,
            localStorage: storageData,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
} 