// Define permissões padrão para o sistema
(function() {
    // Esperar até que o DOM esteja carregado
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Configurando permissões do sistema...');
        
        // Verificar se Auth já existe
        if (!window.Auth) {
            console.warn('Auth não disponível ao configurar permissões');
            return;
        }

        // Definir as permissões se elas não existirem
        if (!window.Auth.PERMISSIONS) {
            window.Auth.PERMISSIONS = {
                MANAGE_USERS: 'manage_users',
                VIEW_TECHNICIANS: 'view_technicians',
                ADD_TECHNICIAN: 'add_technician',
                EDIT_TECHNICIAN: 'edit_technician',
                DELETE_TECHNICIAN: 'delete_technician',
                VIEW_STATISTICS: 'view_statistics',
                VIEW_MAP: 'view_map',
                VIEW_BY_OPERATION: 'view_by_operation',
                VIEW_TASKS: 'view_tasks',
                CREATE_TASKS: 'create_tasks',
                EDIT_TASKS: 'edit_tasks',
                DELETE_TASKS: 'delete_tasks',
                COMPLETE_TASKS: 'complete_tasks',
                VIEW_COMPLETED: 'view_completed',
                VIEW_MAINTENANCE: 'view_maintenance',
                ADD_MAINTENANCE: 'add_maintenance',
                EDIT_MAINTENANCE: 'edit_maintenance',
                DELETE_MAINTENANCE: 'delete_maintenance'
            };
            console.log('Permissões definidas com sucesso');
        }
        
        // Definir níveis de acesso se não existirem
        if (!window.Auth.ACCESS_LEVELS) {
            window.Auth.ACCESS_LEVELS = {
                ADMIN: {
                    name: 'Administrador',
                    permissions: ['manage_users', 'view_technicians', 'add_technician', 'edit_technician', 
                                 'delete_technician', 'view_statistics', 'view_map', 'view_by_operation']
                },
                TECH_MANAGER: {
                    name: 'Gestor de Técnicos',
                    permissions: ['view_technicians', 'add_technician', 'edit_technician', 'view_statistics']
                },
                MAINTENANCE_MANAGER: {
                    name: 'Gestor de Manutenção',
                    permissions: ['view_technicians', 'view_maintenance', 'add_maintenance', 'edit_maintenance']
                },
                USER: {
                    name: 'Usuário Padrão',
                    permissions: ['view_technicians']
                },
                VIEWER: {
                    name: 'Visualizador',
                    permissions: ['view_technicians']
                }
            };
            console.log('Níveis de acesso definidos com sucesso');
        }
    });
})(); 