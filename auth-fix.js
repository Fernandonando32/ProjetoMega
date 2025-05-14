// Arquivo auth-fix.js
// Este script verifica se o objeto Auth existe e implementa as funções necessárias
// Deve ser incluído ANTES do auth.js na página

console.log('Inicializando verificações e correções do objeto Auth...');

// Esperar até que o documento seja carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado. Verificando e corrigindo o objeto Auth...');
    
    // Garantir que o objeto window.Auth existe
    if (!window.Auth) {
        console.log('Objeto Auth não encontrado. Criando um objeto Auth básico...');
        window.Auth = {};
    }

    // Implementar a função isAuthenticated se não existir
    if (!window.Auth.isAuthenticated) {
        console.log('Configurando função de autenticação...');
        window.Auth.isAuthenticated = function() {
            try {
                const userStr = localStorage.getItem('currentUser');
                const token = localStorage.getItem('authToken');
                return userStr !== null && token !== null;
            } catch (e) {
                console.error('Erro ao verificar autenticação:', e);
                return false;
            }
        };
    }

    // Implementar a função getCurrentUser se não existir
    if (!window.Auth.getCurrentUser) {
        console.log('Configurando função para obter usuário atual...');
        window.Auth.getCurrentUser = function() {
            try {
                const userStr = localStorage.getItem('currentUser');
                return userStr ? JSON.parse(userStr) : null;
            } catch (e) {
                console.error('Erro ao obter usuário atual:', e);
                return null;
            }
        };
    }

    // Implementar a função hasPermission se não existir
    if (!window.Auth.hasPermission) {
        console.log('Configurando verificação de permissões...');
        window.Auth.hasPermission = function(user, permission) {
            if (!user) return false;
            if (user.accessLevel === 'ADMIN') return true;
            return user.permissions && Array.isArray(user.permissions) && user.permissions.includes(permission);
        };
    }

    // Definir PERMISSIONS se não existir
    if (!window.Auth.PERMISSIONS) {
        console.log('Configurando permissões padrão do sistema...');
        window.Auth.PERMISSIONS = {
            VIEW_BY_OPERATION: 'view_by_operation',
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
            DELETE_MAINTENANCE: 'delete_maintenance'
        };
    }

    // Definir ACCESS_LEVELS se não existir
    if (!window.Auth.ACCESS_LEVELS) {
        console.log('Configurando níveis de acesso do sistema...');
        window.Auth.ACCESS_LEVELS = {
            ADMIN: {
                name: 'Administrador'
            },
            TECH_MANAGER: {
                name: 'Gestor de Técnicos'
            },
            MAINTENANCE_MANAGER: {
                name: 'Gestor de Manutenção'
            },
            USER: {
                name: 'Usuário Padrão'
            },
            VIEWER: {
                name: 'Visualizador'
            }
        };
    }

    // Implementar função logout se necessário
    if (!window.Auth.logout) {
        console.log('Configurando função de logout...');
        window.Auth.logout = function() {
            try {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
            } catch (e) {
                console.error('Erro ao fazer logout:', e);
            }
        };
    }

    // Definir configurações padrão se não existirem
    if (!window.CONFIGS_FTTH) {
        console.log('Definindo configurações padrão do sistema FTTH...');
        window.CONFIGS_FTTH = {
            CARREGAR_DO_BANCO_AO_INICIAR: true,
            SALVAR_APENAS_LOCAL: false,
            ORIGENS_PERMITIDAS: ['manual', 'user_action', 'import_csv', 'csv_import'],
            DEBUG: true
        };
    }

    // Garantir que existe uma função para inicializar um usuário mínimo caso não exista
    if (!window.Auth.initDefaultUser) {
        console.log('Configurando função de inicialização de usuário padrão...');
        window.Auth.initDefaultUser = function() {
            if (!window.Auth.isAuthenticated()) {
                console.log('Usuário não autenticado. Criando usuário padrão temporário...');
                const tempUser = {
                    id: 'temp_user_' + Date.now(),
                    name: 'Usuário Temporário',
                    username: 'temp',
                    email: 'temp@system.com',
                    accessLevel: 'ADMIN',
                    permissions: Object.values(window.Auth.PERMISSIONS),
                    operacao: ''
                };
                
                // Salvar no localStorage
                localStorage.setItem('currentUser', JSON.stringify(tempUser));
                localStorage.setItem('authToken', 'temp_token');
                
                console.log('Usuário temporário criado para permitir o funcionamento básico');
            }
        };
    }

    console.log('Verificação e correção do objeto Auth concluídas.');
});

// Garantir que as funções de banco de dados essenciais existam
// Implementar carregarDoBanco se não existir
if (!window.carregarDoBanco) {
    console.log('Configurando função para carregar dados do banco...');
    window.carregarDoBanco = async function() {
        try {
            console.log('Tentando carregar dados do banco de dados...');
            
            // Determinar a URL base da API
            const baseUrl = window.getBaseApiUrl ? window.getBaseApiUrl() : 'http://localhost:3000';
            
            // Fazer a requisição à API
            const response = await fetch(`${baseUrl}/api?action=carregar-ftth-registros`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.registros)) {
                console.log(`Carregados ${result.registros.length} registros do banco de dados.`);
                
                // Filtrar registros para excluir qualquer um que contenha "Guadalupe"
                const registrosFiltrados = result.registros.filter(registro => {
                    // Verificar se algum campo contém a palavra "Guadalupe"
                    const temGuadalupe = Object.values(registro).some(valor => 
                        typeof valor === 'string' && valor.includes('Guadalupe')
                    );
                    return !temGuadalupe;
                });
                
                if (registrosFiltrados.length < result.registros.length) {
                    console.log(`Filtrados ${result.registros.length - registrosFiltrados.length} registros contendo "Guadalupe".`);
                }
                
                return { 
                    success: true, 
                    registros: registrosFiltrados,
                    message: `${registrosFiltrados.length} registros carregados com sucesso`
                };
            } else {
                console.log('Erro ao carregar registros do banco:', result.message || 'Erro desconhecido');
                return { 
                    success: false, 
                    registros: [],
                    message: result.message || 'Erro ao carregar registros do banco'
                };
            }
        } catch (error) {
            console.error('Erro ao carregar dados do banco:', error);
            return { 
                success: false, 
                registros: [],
                error: error.message || 'Erro desconhecido ao carregar dados'
            };
        }
    };
}

// Implementar salvarNoBanco se não existir
if (!window.salvarNoBanco) {
    console.log('Configurando função para salvar dados no banco...');
    window.salvarNoBanco = async function(registros, origem = 'manual') {
        try {
            console.log(`Tentando salvar ${registros.length} registros no banco de dados (origem: ${origem})...`);
            
            // Filtrar registros para excluir qualquer um que contenha "Guadalupe"
            const registrosFiltrados = registros.filter(registro => {
                // Verificar se algum campo contém a palavra "Guadalupe"
                const temGuadalupe = Object.values(registro).some(valor => 
                    typeof valor === 'string' && valor.includes('Guadalupe')
                );
                return !temGuadalupe;
            });
            
            if (registrosFiltrados.length < registros.length) {
                console.log(`Filtrados ${registros.length - registrosFiltrados.length} registros contendo "Guadalupe".`);
            }
            
            // Determinar a URL base da API
            const baseUrl = window.getBaseApiUrl ? window.getBaseApiUrl() : 'http://localhost:3000';
            
            // Preparar dados para enviar
            const data = {
                registros: registrosFiltrados,
                tipo: origem,
                usuario: window.Auth ? window.Auth.getCurrentUser()?.id : null
            };
            
            // Fazer a requisição à API
            const response = await fetch(`${baseUrl}/api?action=salvar-ftth-registros`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Registros salvos com sucesso no banco:', result.message || 'Operação bem-sucedida');
                return { 
                    success: true, 
                    message: result.message || 'Registros salvos com sucesso'
                };
            } else {
                console.log('Erro ao salvar registros no banco:', result.message || 'Erro desconhecido');
                return { 
                    success: false, 
                    error: result.message || 'Erro ao salvar registros'
                };
            }
        } catch (error) {
            console.error('Erro ao salvar dados no banco:', error);
            return { 
                success: false, 
                error: error.message || 'Erro desconhecido ao salvar dados'
            };
        }
    };
} 