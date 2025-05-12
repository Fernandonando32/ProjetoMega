/**
 * Script de teste para verificar a criação de usuários
 * Este arquivo é temporário para diagnóstico
 */

// Função para testar a criação de usuário
async function testUserCreation() {
    console.log('Iniciando teste de criação de usuário...');
    
    // Gerar dados de teste com timestamp único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const testUser = {
        username: `test_user_${timestamp}`,
        email: `test${randomString}@exemplo.com`,
        password: 'Test123!',
        name: 'Test User',
        full_name: 'Test User',
        accessLevel: 'VIEWER',
        role: 'VIEWER',
        permissions: [],
        operacao: 'BJ Fibra',
        is_active: true
    };
    
    console.log('Dados de teste:', testUser);
    
    // Teste 1: Usando Auth.createUser
    try {
        console.log('\nTeste 1: Usando Auth.createUser...');
        if (window.Auth && window.Auth.createUser) {
            const result = await window.Auth.createUser({
                username: testUser.username + '_1',
                email: `teste_1_${randomString}@exemplo.com`,
                password: testUser.password,
                name: testUser.name,
                accessLevel: testUser.accessLevel,
                permissions: testUser.permissions,
                operacao: testUser.operacao
            });
            
            console.log('Resultado Auth.createUser:', result);
        } else {
            console.log('Auth.createUser não disponível');
        }
    } catch (error) {
        console.error('Erro em Auth.createUser:', error);
    }
    
    // Teste 2: Usando UserAPI.createUser
    try {
        console.log('\nTeste 2: Usando UserAPI.createUser...');
        if (window.UserAPI && window.UserAPI.createUser) {
            const result = await window.UserAPI.createUser({
                username: testUser.username + '_2',
                email: `teste_2_${randomString}@exemplo.com`,
                password: testUser.password,
                name: testUser.name,
                accessLevel: testUser.accessLevel,
                permissions: testUser.permissions,
                operacao: testUser.operacao
            });
            
            console.log('Resultado UserAPI.createUser:', result);
        } else {
            console.log('UserAPI.createUser não disponível');
        }
    } catch (error) {
        console.error('Erro em UserAPI.createUser:', error);
    }
    
    console.log('\nTestes concluídos!');
}

// Executar teste quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, aguardando 2 segundos para iniciar os testes...');
    
    // Adicionar botão de teste à página
    const testButton = document.createElement('button');
    testButton.textContent = 'Executar Teste de Criação de Usuário';
    testButton.style.padding = '10px';
    testButton.style.margin = '20px';
    testButton.style.backgroundColor = '#007bff';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', () => {
        testUserCreation().catch(console.error);
    });
    
    // Adicionar à página
    document.body.appendChild(testButton);
    
    // Adicionar área para resultados
    const resultArea = document.createElement('pre');
    resultArea.id = 'test-results';
    resultArea.style.margin = '20px';
    resultArea.style.padding = '15px';
    resultArea.style.backgroundColor = '#f5f5f5';
    resultArea.style.border = '1px solid #ddd';
    resultArea.style.borderRadius = '5px';
    resultArea.style.maxHeight = '400px';
    resultArea.style.overflow = 'auto';
    
    document.body.appendChild(resultArea);
    
    // Interceptar console.log para exibir na página
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = function() {
        originalConsoleLog.apply(console, arguments);
        const args = Array.from(arguments).map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        });
        
        const resultArea = document.getElementById('test-results');
        if (resultArea) {
            resultArea.textContent += args.join(' ') + '\n';
        }
    };
    
    console.error = function() {
        originalConsoleError.apply(console, arguments);
        const args = Array.from(arguments).map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        });
        
        const resultArea = document.getElementById('test-results');
        if (resultArea) {
            resultArea.textContent += '❌ ERRO: ' + args.join(' ') + '\n';
        }
    };
}); 