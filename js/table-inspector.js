/**
 * Inspetor de Tabelas - Ferramenta temporária para diagnóstico
 * Este arquivo ajuda a identificar problemas com a estrutura das tabelas no Supabase
 */

const TableInspector = {
    /**
     * Inicializa o inspetor
     */
    init() {
        console.log('Inicializando inspetor de tabelas...');
        this.attachToWindow();
        return this;
    },

    /**
     * Anexa o inspetor ao objeto window para acesso global
     */
    attachToWindow() {
        window.TableInspector = this;
        console.log('Inspetor de tabelas disponível globalmente como window.TableInspector');
    },

    /**
     * Inspeciona a estrutura da tabela users
     */
    async inspectUsersTable() {
        try {
            console.log('Inspecionando tabela users...');
            
            // Verificar se o cliente Supabase está disponível
            if (!window.supabaseClient) {
                return {
                    success: false,
                    message: 'Cliente Supabase não disponível'
                };
            }
            
            // Tentar obter a definição da tabela usando RPC (se disponível)
            try {
                const { data: tableInfo, error: tableError } = await window.supabaseClient.rpc('get_table_definition', {
                    table_name: 'users'
                });
                
                if (!tableError && tableInfo) {
                    console.log('Definição da tabela obtida via RPC:', tableInfo);
                    return {
                        success: true,
                        method: 'rpc',
                        tableInfo
                    };
                }
            } catch (rpcError) {
                console.log('RPC não disponível:', rpcError.message);
            }
            
            // Método alternativo: tentar inferir a estrutura a partir de uma consulta
            const { data: sampleData, error: sampleError } = await window.supabaseClient
                .from('users')
                .select('*')
                .limit(1);
                
            if (sampleError) {
                return {
                    success: false,
                    message: `Erro ao consultar tabela users: ${sampleError.message}`,
                    error: sampleError
                };
            }
            
            if (!sampleData || sampleData.length === 0) {
                // Tentar apenas obter os nomes das colunas
                const { data: columnsData, error: columnsError } = await window.supabaseClient
                    .from('users')
                    .select()
                    .limit(0);
                    
                if (columnsError) {
                    return {
                        success: false,
                        message: `Erro ao obter colunas da tabela users: ${columnsError.message}`,
                        error: columnsError
                    };
                }
                
                return {
                    success: true,
                    method: 'columns_only',
                    columns: Object.keys(columnsData[0] || {})
                };
            }
            
            // Analisar a estrutura da tabela a partir dos dados de amostra
            const sampleRecord = sampleData[0];
            const inferredStructure = {};
            
            Object.keys(sampleRecord).forEach(key => {
                const value = sampleRecord[key];
                inferredStructure[key] = {
                    type: typeof value,
                    isArray: Array.isArray(value),
                    isNull: value === null,
                    example: value
                };
            });
            
            return {
                success: true,
                method: 'inferred',
                structure: inferredStructure,
                sampleRecord
            };
        } catch (error) {
            console.error('Erro ao inspecionar tabela users:', error);
            return {
                success: false,
                message: `Erro ao inspecionar tabela: ${error.message}`,
                error
            };
        }
    },
    
    /**
     * Testa a criação de um usuário com diferentes formatos
     */
    async testUserCreation() {
        const testResults = [];
        
        // Dados de teste
        const timestamp = Date.now();
        const testUser = {
            username: `test_user_${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'Test123!',
            full_name: 'Test User',
            name: 'Test User',
            role: 'VIEWER',
            accessLevel: 'VIEWER',
            permissions: [],
            operacao: 'BJ Fibra',
            is_active: true
        };
        
        console.log('Testando criação de usuário com diferentes formatos...');
        
        // Teste 1: Usando Auth.createUser
        try {
            console.log('Teste 1: Usando Auth.createUser...');
            if (window.Auth && window.Auth.createUser) {
                const result = await window.Auth.createUser({
                    username: testUser.username + '_1',
                    email: `test${timestamp}_1@example.com`,
                    password: testUser.password,
                    name: testUser.name,
                    accessLevel: testUser.accessLevel,
                    permissions: testUser.permissions,
                    operacao: testUser.operacao
                });
                
                testResults.push({
                    method: 'Auth.createUser',
                    success: result.success,
                    message: result.message || 'Sucesso',
                    data: result.success ? result.user : null
                });
            } else {
                testResults.push({
                    method: 'Auth.createUser',
                    success: false,
                    message: 'Método não disponível'
                });
            }
        } catch (error) {
            testResults.push({
                method: 'Auth.createUser',
                success: false,
                message: error.message,
                error
            });
        }
        
        // Teste 2: Usando UserAPI.createUser
        try {
            console.log('Teste 2: Usando UserAPI.createUser...');
            if (window.UserAPI && window.UserAPI.createUser) {
                const result = await window.UserAPI.createUser({
                    username: testUser.username + '_2',
                    email: `test${timestamp}_2@example.com`,
                    password: testUser.password,
                    name: testUser.full_name,
                    accessLevel: testUser.role,
                    permissions: testUser.permissions,
                    operacao: testUser.operacao
                });
                
                testResults.push({
                    method: 'UserAPI.createUser',
                    success: result.success,
                    message: result.message || 'Sucesso',
                    data: result.success ? result.user : null
                });
            } else {
                testResults.push({
                    method: 'UserAPI.createUser',
                    success: false,
                    message: 'Método não disponível'
                });
            }
        } catch (error) {
            testResults.push({
                method: 'UserAPI.createUser',
                success: false,
                message: error.message,
                error
            });
        }
        
        // Teste 3: Usando supabaseManager
        try {
            console.log('Teste 3: Usando supabaseManager...');
            if (window.supabaseManager && window.Auth) {
                // Primeiro criar o usuário na autenticação
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email: `test${timestamp}_3@example.com`,
                    password: testUser.password
                });
                
                if (authError) throw authError;
                
                // Depois criar o registro na tabela users
                const userData = {
                    id: authData.user.id,
                    username: testUser.username + '_3',
                    email: authData.user.email,
                    full_name: testUser.name,
                    role: testUser.accessLevel,
                    permissions: testUser.permissions,
                    operacao: testUser.operacao,
                    is_active: true
                };
                
                const result = await window.supabaseManager.insertData('users', userData);
                
                testResults.push({
                    method: 'supabaseManager.insertData',
                    success: !!result,
                    message: result ? 'Sucesso' : 'Falha',
                    data: result
                });
            } else {
                testResults.push({
                    method: 'supabaseManager.insertData',
                    success: false,
                    message: 'Método não disponível'
                });
            }
        } catch (error) {
            testResults.push({
                method: 'supabaseManager.insertData',
                success: false,
                message: error.message,
                error
            });
        }
        
        return {
            timestamp: new Date().toISOString(),
            results: testResults
        };
    },
    
    /**
     * Exibe um relatório na interface do usuário
     */
    async displayReport(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Elemento com ID ${containerId} não encontrado`);
            return;
        }
        
        container.innerHTML = '<h3>Analisando tabela users...</h3>';
        
        try {
            // Executar inspeção
            const tableInfo = await this.inspectUsersTable();
            const testResults = await this.testUserCreation();
            
            // Criar HTML do relatório
            let html = '<div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">';
            html += '<h3>Relatório de Inspeção da Tabela Users</h3>';
            
            // Informações da tabela
            html += '<div style="margin-bottom: 20px;">';
            html += '<h4>Estrutura da Tabela</h4>';
            
            if (tableInfo.success) {
                if (tableInfo.method === 'rpc') {
                    html += `<pre>${JSON.stringify(tableInfo.tableInfo, null, 2)}</pre>`;
                } else if (tableInfo.method === 'columns_only') {
                    html += '<p>Colunas encontradas:</p>';
                    html += `<pre>${JSON.stringify(tableInfo.columns, null, 2)}</pre>`;
                } else {
                    html += '<p>Estrutura inferida:</p>';
                    html += `<pre>${JSON.stringify(tableInfo.structure, null, 2)}</pre>`;
                    html += '<p>Exemplo de registro:</p>';
                    html += `<pre>${JSON.stringify(tableInfo.sampleRecord, null, 2)}</pre>`;
                }
            } else {
                html += `<p style="color: #c00;">Erro: ${tableInfo.message}</p>`;
            }
            html += '</div>';
            
            // Resultados dos testes
            html += '<div>';
            html += '<h4>Testes de Criação de Usuário</h4>';
            
            testResults.results.forEach((result, index) => {
                const bgColor = result.success ? '#d4edda' : '#f8d7da';
                const textColor = result.success ? '#155724' : '#721c24';
                
                html += `<div style="background: ${bgColor}; color: ${textColor}; padding: 10px; margin-bottom: 10px; border-radius: 3px;">`;
                html += `<strong>Teste ${index + 1}: ${result.method}</strong><br>`;
                html += `Status: ${result.success ? 'Sucesso' : 'Falha'}<br>`;
                html += `Mensagem: ${result.message}<br>`;
                
                if (result.data) {
                    html += `<details>
                        <summary>Dados</summary>
                        <pre>${JSON.stringify(result.data, null, 2)}</pre>
                    </details>`;
                }
                
                if (result.error) {
                    html += `<details>
                        <summary>Detalhes do Erro</summary>
                        <pre>${JSON.stringify(result.error, null, 2)}</pre>
                    </details>`;
                }
                
                html += '</div>';
            });
            html += '</div>';
            
            // Recomendações
            html += '<div style="margin-top: 20px;">';
            html += '<h4>Recomendações</h4>';
            
            // Analisar os resultados para gerar recomendações
            const successfulMethods = testResults.results.filter(r => r.success).map(r => r.method);
            const failedMethods = testResults.results.filter(r => !r.success).map(r => r.method);
            
            if (successfulMethods.length > 0) {
                html += `<p>Métodos bem-sucedidos: <strong>${successfulMethods.join(', ')}</strong></p>`;
                html += '<p>Recomendação: Use um desses métodos para criar usuários.</p>';
            }
            
            if (failedMethods.length > 0) {
                html += `<p>Métodos com falha: <strong>${failedMethods.join(', ')}</strong></p>`;
                
                // Verificar padrões comuns de erro
                const errorMessages = testResults.results
                    .filter(r => !r.success && r.message)
                    .map(r => r.message);
                
                if (errorMessages.some(msg => msg.includes('duplicate'))) {
                    html += '<p>Detectado erro de chave duplicada. Verifique se os nomes de usuário ou e-mails já existem.</p>';
                }
                
                if (errorMessages.some(msg => msg.includes('column') && msg.includes('exist'))) {
                    html += '<p>Detectado erro de coluna inexistente. Verifique se os nomes dos campos correspondem à estrutura da tabela.</p>';
                }
                
                if (errorMessages.some(msg => msg.includes('permission'))) {
                    html += '<p>Detectado erro de permissão. Verifique se as políticas de segurança do Supabase permitem a operação.</p>';
                }
            }
            
            html += '</div>';
            
            // Fechar div principal
            html += '</div>';
            
            // Atualizar o container
            container.innerHTML = html;
        } catch (error) {
            container.innerHTML = `<div style="color: #c00;">Erro ao gerar relatório: ${error.message}</div>`;
        }
    }
};

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => TableInspector.init()); 