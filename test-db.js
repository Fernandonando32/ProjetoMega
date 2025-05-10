// Script para testar a verificação e criação da tabela de usuários
const API_URL = 'https://projeto-mega.vercel.app/api';

async function checkTableStructure() {
  try {
    console.log('Verificando estrutura da tabela users...');
    const response = await fetch(`${API_URL}?action=check-users-table`);
    const data = await response.json();
    console.log('Estrutura da tabela:', data);
    return data;
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    return null;
  }
}

async function listUsers() {
  try {
    console.log('Listando usuários existentes...');
    const response = await fetch(`${API_URL}?action=get-users`);
    const data = await response.json();
    console.log('Usuários encontrados:', data);
    return data;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return null;
  }
}

async function runDiagnostic() {
  try {
    console.log('Executando diagnóstico do banco de dados...');
    const response = await fetch(`${API_URL}?action=diagnose-db`);
    const data = await response.json();
    console.log('Resultado do diagnóstico:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
    return null;
  }
}

async function createUsersTable() {
  try {
    console.log('Tentando criar a tabela de usuários...');
    const response = await fetch(`${API_URL}?action=create-users-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Resposta:', data);
    return data;
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return null;
  }
}

async function initializeUsers() {
  try {
    console.log('Tentando inicializar usuários padrão...');
    const response = await fetch(`${API_URL}?action=initialize-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Resposta:', data);
    return data;
  } catch (error) {
    console.error('Erro ao inicializar usuários:', error);
    return null;
  }
}

async function recreateUsersTable() {
  try {
    console.log('Tentando recriar a tabela de usuários...');
    const response = await fetch(`${API_URL}?action=recreate-users-table`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('Resposta:', data);
    return data;
  } catch (error) {
    console.error('Erro ao recriar tabela:', error);
    return null;
  }
}

// Função principal para testar
async function testDatabase() {
  console.log('=== Iniciando verificação do banco de dados ===\n');
  
  // Primeiro executa o diagnóstico
  const diagnostic = await runDiagnostic();
  
  if (!diagnostic) {
    console.error('Não foi possível executar o diagnóstico');
    return;
  }
  
  console.log('\n=== Resultado do diagnóstico ===');
  console.log(`Conexão com o banco: ${diagnostic.databaseConnected ? 'OK' : 'FALHA'}`);
  console.log(`Tabelas existem: ${diagnostic.tablesExist ? 'SIM' : 'NÃO'}`);
  console.log(`Pode criar usuários: ${diagnostic.canCreateUser ? 'SIM' : 'NÃO'}`);
  
  if (!diagnostic.databaseConnected) {
    console.error('\nERRO: Não foi possível conectar ao banco de dados');
    console.log('Verifique se:');
    console.log('1. As credenciais do Supabase estão corretas');
    console.log('2. O banco de dados está online');
    console.log('3. As políticas de segurança permitem acesso');
    return;
  }

  // Recriar a tabela de usuários
  console.log('\n=== Recriando tabela de usuários ===');
  const recreated = await recreateUsersTable();
  
  if (!recreated || !recreated.success) {
    console.error('ERRO: Não foi possível recriar a tabela de usuários');
    return;
  }
  
  console.log('Tabela de usuários recriada com sucesso!');
  
  // Verifica a estrutura da tabela
  console.log('\n=== Verificando estrutura da tabela users ===');
  const tableStructure = await checkTableStructure();
  
  if (!tableStructure) {
    console.error('Não foi possível verificar a estrutura da tabela');
    return;
  }
  
  if (tableStructure.exists) {
    console.log('Tabela users existe!');
    console.log('Campos encontrados:', tableStructure.fields || []);
  } else {
    console.error('ERRO: Tabela users não existe no banco de dados');
    return;
  }
  
  // Lista os usuários existentes
  console.log('\n=== Listando usuários existentes ===');
  const users = await listUsers();
  
  if (!users) {
    console.error('Não foi possível listar os usuários');
    return;
  }
  
  if (users.users && users.users.length > 0) {
    console.log(`Encontrados ${users.users.length} usuários:`);
    users.users.forEach(user => {
      console.log(`- ${user.username} (${user.accessLevel})`);
    });
  } else {
    console.log('Nenhum usuário encontrado na tabela');
  }
  
  // Executa diagnóstico final
  console.log('\n=== Executando diagnóstico final ===');
  const finalDiagnostic = await runDiagnostic();
  
  if (finalDiagnostic) {
    console.log('\n=== Resultado do diagnóstico final ===');
    console.log(`Conexão com o banco: ${finalDiagnostic.databaseConnected ? 'OK' : 'FALHA'}`);
    console.log(`Tabelas existem: ${finalDiagnostic.tablesExist ? 'SIM' : 'NÃO'}`);
    console.log(`Pode criar usuários: ${finalDiagnostic.canCreateUser ? 'SIM' : 'NÃO'}`);
  }
}

// Executar o teste
testDatabase(); 