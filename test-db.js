// Script para testar a verificação e criação da tabela de usuários
const API_URL = 'https://projeto-mega.vercel.app/api';

async function checkUsersTable() {
  try {
    console.log('Verificando se a tabela de usuários existe...');
    const response = await fetch(`${API_URL}?action=check-users-table`);
    const data = await response.json();
    console.log('Resposta:', data);
    return data;
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
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

// Função principal para testar
async function testDatabase() {
  // Primeiro verifica se a tabela existe
  const checkResult = await checkUsersTable();
  
  if (!checkResult || !checkResult.exists) {
    console.log('Tabela não existe, tentando criar...');
    await createUsersTable();
  } else {
    console.log('Tabela já existe!');
  }
}

// Executar o teste
testDatabase(); 