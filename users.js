// Importação da biblioteca Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import SUPABASE_CONFIG from './config.js';

// Configuração do cliente Supabase
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseKey = SUPABASE_CONFIG.key;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definição das permissões
const PERMISSIONS = {
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
const ACCESS_LEVELS = {
    ADMIN: {
        name: 'Administrador',
        permissions: [
            // Agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.DELETE_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            
            // Acompanhamento de Técnicos
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.EDIT_TECHNICIAN,
            PERMISSIONS.DELETE_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            
            // Manutenção de Veículos
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE,
            PERMISSIONS.EDIT_MAINTENANCE,
            PERMISSIONS.DELETE_MAINTENANCE,
            
            // Administração
            PERMISSIONS.MANAGE_USERS
        ]
    },
    TECH_MANAGER: {
        name: 'Gestor de Técnicos',
        permissions: [
            // Agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            
            // Acompanhamento de Técnicos (acesso completo)
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.EDIT_TECHNICIAN,
            PERMISSIONS.DELETE_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            
            // Visualização de manutenção
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    },
    MAINTENANCE_MANAGER: {
        name: 'Gestor de Manutenção',
        permissions: [
            // Agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            
            // Acompanhamento de Técnicos (visualização)
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_BY_OPERATION,
            
            // Manutenção de Veículos (acesso completo)
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE,
            PERMISSIONS.EDIT_MAINTENANCE,
            PERMISSIONS.DELETE_MAINTENANCE
        ]
    },
    USER: {
        name: 'Usuário Padrão',
        permissions: [
            // Agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_TASKS,
            PERMISSIONS.COMPLETE_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            
            // Acompanhamento de Técnicos (básico)
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.ADD_TECHNICIAN,
            PERMISSIONS.VIEW_STATISTICS,
            PERMISSIONS.VIEW_MAP,
            PERMISSIONS.VIEW_BY_OPERATION,
            
            // Manutenção (básico)
            PERMISSIONS.VIEW_MAINTENANCE,
            PERMISSIONS.ADD_MAINTENANCE
        ]
    },
    VIEWER: {
        name: 'Visualizador',
        permissions: [
            // Agenda
            PERMISSIONS.VIEW_TASKS,
            PERMISSIONS.VIEW_COMPLETED,
            
            // Acompanhamento de Técnicos
            PERMISSIONS.VIEW_TECHNICIANS,
            PERMISSIONS.VIEW_STATISTICS,
            
            // Manutenção
            PERMISSIONS.VIEW_MAINTENANCE
        ]
    }
};

// Usuários padrão do sistema (serão usados apenas para inicialização do banco)
const DEFAULT_USERS = [
    {
        id: 1,
        username: 'admin',
        password: 'admin123', // Em produção, isso deve ser um hash
        name: 'Administrador',
        accessLevel: 'ADMIN',
        email: 'admin@example.com'
    },
    {
        id: 2,
        username: 'tecnico',
        password: 'tech123',
        name: 'Gestor de Técnicos',
        accessLevel: 'TECH_MANAGER',
        email: 'tecnico@example.com'
    },
    {
        id: 3,
        username: 'manutencao',
        password: 'maint123',
        name: 'Gestor de Manutenção',
        accessLevel: 'MAINTENANCE_MANAGER',
        email: 'manutencao@example.com'
    },
    {
        id: 4,
        username: 'usuario',
        password: 'user123',
        name: 'Usuário Padrão',
        accessLevel: 'USER',
        email: 'user@example.com'
    },
    {
        id: 5,
        username: 'visualizador',
        password: 'view123',
        name: 'Visualizador',
        accessLevel: 'VIEWER',
        email: 'viewer@example.com'
    }
];

// Função para verificar permissões
function hasPermission(user, permission) {
    if (!user || !user.accessLevel) return false;
    
    // Verificar se o usuário tem permissões personalizadas
    if (user.customPermissions && user.permissions) {
        return user.permissions.includes(permission);
    }
    
    // Caso contrário, use o nível de acesso padrão
    return ACCESS_LEVELS[user.accessLevel].permissions.includes(permission);
}

// Função para verificar se o usuário está autenticado
async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
}

// Função para fazer login
async function login(username, password) {
    try {
        // Primeiro, buscar o usuário pelo nome de usuário
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (userError || !users) {
            console.error('Erro ao buscar usuário:', userError);
            return false;
        }
        
        // Verificar a senha (em produção, deve usar bcrypt ou similar)
        if (users.password === password) {
            // Autenticar com Supabase Auth (opcional, se estiver usando)
            // const { data, error } = await supabase.auth.signInWithPassword({
            //     email: users.email,
            //     password: password
            // });
            
            // if (error) {
            //     console.error('Erro de autenticação:', error);
            //     return false;
            // }
            
            // Remover a senha antes de armazenar
            const { password: _, ...userWithoutPassword } = users;
            sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro no login:', error);
        return false;
    }
}

// Função para fazer logout
async function logout() {
    // Limpar a sessão do navegador
    sessionStorage.removeItem('currentUser');
    
    // Fazer logout no Supabase Auth (se estiver usando)
    // await supabase.auth.signOut();
}

// Função para obter o usuário atual
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser'));
}

// Função para inicializar os usuários no banco de dados
async function initializeUsers() {
    try {
        // Verificar se já existem usuários no banco
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        
        if (checkError) {
            console.error('Erro ao verificar usuários existentes:', checkError);
            return;
        }
        
        // Se não houver usuários, adicionar os padrões
        if (!existingUsers || existingUsers.length === 0) {
            const { error: insertError } = await supabase
                .from('users')
                .insert(DEFAULT_USERS);
            
            if (insertError) {
                console.error('Erro ao inserir usuários padrão:', insertError);
            } else {
                console.log('Usuários padrão inicializados com sucesso');
            }
        }
    } catch (error) {
        console.error('Erro ao inicializar usuários:', error);
    }
}

// Função para criar um novo usuário
async function createUser(userData) {
    try {
        // Verificar se o nome de usuário já existe
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', userData.username)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Erro ao verificar usuário existente:', checkError);
            return { success: false, message: 'Erro ao verificar usuário existente' };
        }
        
        if (existingUser) {
            return { success: false, message: 'Nome de usuário já existe' };
        }
        
        // Inserir o novo usuário
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (insertError) {
            console.error('Erro ao criar usuário:', insertError);
            return { success: false, message: insertError.message };
        }
        
        return { success: true, user: newUser };
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para atualizar um usuário existente
async function updateUser(userId, userData) {
    try {
        // Verificar se o nome de usuário já existe (exceto para o usuário atual)
        if (userData.username) {
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('username', userData.username)
                .neq('id', userId)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Erro ao verificar usuário existente:', checkError);
                return { success: false, message: 'Erro ao verificar usuário existente' };
            }
            
            if (existingUser) {
                return { success: false, message: 'Nome de usuário já existe' };
            }
        }
        
        // Atualizar o usuário
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('id', userId)
            .select()
            .single();
        
        if (updateError) {
            console.error('Erro ao atualizar usuário:', updateError);
            return { success: false, message: updateError.message };
        }
        
        // Se o usuário atual for atualizado, também atualizar na sessão
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser && currentUser.id === userId) {
            // Não incluir a senha no usuário atual
            const { password, ...userWithoutPassword } = updatedUser;
            sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        }
        
        return { success: true, user: updatedUser };
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para excluir um usuário
async function deleteUser(userId) {
    try {
        // Converter para número se for uma string
        userId = Number(userId);
        
        // Verificar se é o último administrador
        const { data: adminUsers, error: checkError } = await supabase
            .from('users')
            .select('id, accessLevel, customPermissions, permissions')
            .or(`accessLevel.eq.ADMIN,and(customPermissions.eq.true,permissions.cs.{"${PERMISSIONS.MANAGE_USERS}"})`)
            .neq('id', userId);
        
        if (checkError) {
            console.error('Erro ao verificar administradores:', checkError);
            return { success: false, message: 'Erro ao verificar administradores' };
        }
        
        // Verificar se o usuário a ser excluído é um administrador
        const { data: userToDelete, error: userError } = await supabase
            .from('users')
            .select('accessLevel, customPermissions, permissions')
            .eq('id', userId)
            .single();
        
        if (userError) {
            console.error('Erro ao buscar usuário:', userError);
            return { success: false, message: 'Usuário não encontrado' };
        }
        
        const isAdmin = userToDelete.accessLevel === 'ADMIN' || 
                    (userToDelete.customPermissions && 
                     userToDelete.permissions && 
                     userToDelete.permissions.includes(PERMISSIONS.MANAGE_USERS));
        
        if (isAdmin && (!adminUsers || adminUsers.length === 0)) {
            return { success: false, message: 'Não é possível excluir o último administrador do sistema' };
        }
        
        // Excluir o usuário
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (deleteError) {
            console.error('Erro ao excluir usuário:', deleteError);
            return { success: false, message: deleteError.message };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para atualizar a senha de um usuário
async function updateUserPassword(userId, newPassword) {
    try {
        // Converter para número se for uma string
        userId = Number(userId);
        
        // Atualizar a senha
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: newPassword })
            .eq('id', userId);
        
        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            return { success: false, message: updateError.message };
        }
        
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar senha do usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para obter todos os usuários
async function getAllUsers() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) {
            console.error('Erro ao buscar usuários:', error);
            return [];
        }
        
        return users;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

// Função para obter um usuário pelo ID
async function getUserById(userId) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Erro ao buscar usuário:', error);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
}

// Exportar as funções e constantes
window.Auth = {
    PERMISSIONS,
    ACCESS_LEVELS,
    DEFAULT_USERS,
    hasPermission,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
    initializeUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    getAllUsers,
    getUserById
}; 