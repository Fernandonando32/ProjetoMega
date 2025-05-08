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

// Usuários padrão do sistema
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
function isAuthenticated() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user !== null;
}

// Função para fazer login
function login(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Remover a senha antes de armazenar
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
    }
    return false;
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('currentUser');
}

// Função para obter o usuário atual
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Função para inicializar os usuários no localStorage
function initializeUsers() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
    }
}

// Função para criar um novo usuário
function createUser(userData) {
    const users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
    
    // Verificar se o nome de usuário já existe
    if (users.some(user => user.username === userData.username)) {
        return { success: false, message: 'Nome de usuário já existe' };
    }
    
    // Gerar ID único
    const newId = Math.max(...users.map(user => user.id), 0) + 1;
    
    // Criar o novo usuário
    const newUser = {
        id: newId,
        ...userData
    };
    
    // Adicionar à lista
    users.push(newUser);
    
    // Salvar no localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    return { success: true, user: newUser };
}

// Função para atualizar um usuário existente
function updateUser(userId, userData) {
    const users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
    
    // Verificar se o usuário existe
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'Usuário não encontrado' };
    }
    
    // Verificar se o nome de usuário já existe (exceto para o usuário atual)
    if (userData.username && users.some(user => user.username === userData.username && user.id !== userId)) {
        return { success: false, message: 'Nome de usuário já existe' };
    }
    
    // Atualizar o usuário
    users[userIndex] = { ...users[userIndex], ...userData };
    
    // Salvar no localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Se o usuário atual for atualizado, também atualizar no localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.id === userId) {
        // Não incluir a senha no usuário atual
        const { password, ...userWithoutPassword } = users[userIndex];
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    }
    
    return { success: true, user: users[userIndex] };
}

// Função para excluir um usuário
function deleteUser(userId) {
    try {
        // Converter para número se for uma string
        userId = Number(userId);
        
        // Obter usuários
        let users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
        
        // Encontrar o índice do usuário
        const userIndex = users.findIndex(user => user.id === userId);
        
        // Se não encontrou o usuário
        if (userIndex === -1) {
            return { success: false, message: 'Usuário não encontrado' };
        }
        
        // Verificar se é o último administrador
        const isAdmin = users[userIndex].accessLevel === 'ADMIN' || 
                    (users[userIndex].customPermissions && 
                     users[userIndex].permissions && 
                     users[userIndex].permissions.includes(PERMISSIONS.MANAGE_USERS));
     
        if (isAdmin) {
            const otherAdmins = users.filter(user => 
                (user.id !== userId) && 
                (user.accessLevel === 'ADMIN' || 
                (user.customPermissions && 
                 user.permissions && 
                 user.permissions.includes(PERMISSIONS.MANAGE_USERS)))
            );
            
            if (otherAdmins.length === 0) {
                return { success: false, message: 'Não é possível excluir o último administrador do sistema' };
            }
        }
        
        // Remover o usuário
        users.splice(userIndex, 1);
        
        // Salvar no localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para atualizar a senha de um usuário
function updateUserPassword(userId, newPassword) {
    try {
        // Converter para número se for uma string
        userId = Number(userId);
        
        // Obter usuários
        let users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
        
        // Encontrar o índice do usuário
        const userIndex = users.findIndex(user => user.id === userId);
        
        // Se não encontrou o usuário
        if (userIndex === -1) {
            return { success: false, message: 'Usuário não encontrado' };
        }
        
        // Atualizar a senha
        users[userIndex].password = newPassword;
        
        // Salvar no localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        return { success: true };
    }
    catch (error) {
        console.error('Erro ao atualizar senha do usuário:', error);
        return { success: false, message: error.message };
    }
}

// Função para obter todos os usuários
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
}

// Função para obter um usuário pelo ID
function getUserById(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || DEFAULT_USERS;
    return users.find(user => user.id === userId) || null;
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