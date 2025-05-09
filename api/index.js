// Importação da biblioteca Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = "https://ryttlyigvimycygnzfju.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA";
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Verifica se os usuários padrão existem e os cria se necessário
async function initializeUsers() {
  try {
    console.log('Verificando usuários existentes...');
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Erro ao verificar usuários:', error);
      return;
    }
    
    // Se não há usuários, inicializar com os padrões
    const count = existingUsers?.[0]?.count || 0;
    console.log(`Encontrados ${count} usuários no banco de dados.`);
    
    if (count === 0) {
      console.log('Inicializando usuários padrão...');
      
      // Inserir usuários padrão
      const { error: insertError } = await supabase
        .from('users')
        .insert(DEFAULT_USERS);
      
      if (insertError) {
        console.error('Erro ao inserir usuários padrão:', insertError);
      } else {
        console.log('Usuários padrão criados com sucesso!');
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar usuários:', error);
  }
}

/**
 * Manipulador de requisição para a API principal da Vercel
 */
export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Inicializa usuários na primeira execução
  await initializeUsers();

  console.log('API recebeu requisição:', {
    method: req.method,
    query: req.query,
    body: typeof req.body === 'object' ? 'Objeto JSON' : typeof req.body,
    path: req.url
  });

  try {
    // Verificar se é uma requisição POST para login
    if (req.method === 'POST' && !req.query.action) {
      // Extrair credenciais da requisição
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: "Nome de usuário e senha são obrigatórios"
        });
      }
      
      console.log(`Tentando login com usuário: ${username}`);
      
      // Verificar se estamos usando usuários padrão para testes
      const defaultUser = DEFAULT_USERS.find(u => u.username === username && u.password === password);
      if (defaultUser) {
        // Login com usuário padrão (para testes)
        const { password: _, ...userWithoutPassword } = defaultUser;
        console.log('Login bem-sucedido com usuário padrão:', username);
        
        return res.status(200).json({
          user: userWithoutPassword,
          message: "Login bem-sucedido"
        });
      }
      
      // Buscar o usuário pelo nome de usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError) {
        console.log('Erro ao buscar usuário:', userError);
        console.log('Tentando login direto com usuários padrão...');
        
        // Tentar usuário padrão em caso de erro na tabela
        const defaultUser = DEFAULT_USERS.find(u => u.username === username && u.password === password);
        if (defaultUser) {
          const { password: _, ...userWithoutPassword } = defaultUser;
          console.log('Login bem-sucedido com usuário padrão (fallback):', username);
          
          return res.status(200).json({
            user: userWithoutPassword,
            message: "Login bem-sucedido"
          });
        }
        
        return res.status(401).json({
          error: "Credenciais inválidas ou banco de dados inacessível"
        });
      }
      
      if (!user) {
        console.log('Usuário não encontrado:', username);
        return res.status(401).json({
          error: "Credenciais inválidas"
        });
      }
      
      // Verificar a senha (em produção, deve usar bcrypt ou similar)
      if (user.password !== password) {
        console.log('Senha incorreta para usuário:', username);
        return res.status(401).json({
          error: "Credenciais inválidas" 
        });
      }
      
      // Remover senha dos dados a serem enviados
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('Login bem-sucedido para:', username);
      
      // Retornar dados do usuário
      return res.status(200).json({
        user: userWithoutPassword,
        message: "Login bem-sucedido"
      });
    } 
    // Verificar autenticação
    else if (req.method === 'GET' && req.query.action === 'check') {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return res.status(401).json({
          authenticated: false,
          error: "Não autenticado"
        });
      }
      
      // Obter dados atualizados do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError) {
        return res.status(500).json({
          authenticated: false,
          error: "Erro ao obter dados do usuário"
        });
      }
      
      // Remover senha dos dados a serem enviados
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        authenticated: true,
        user: userWithoutPassword
      });
    } 
    // Logout
    else if (req.method === 'POST' && req.query.action === 'logout') {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return res.status(500).json({
          error: "Erro ao fazer logout"
        });
      }
      
      return res.status(200).json({
        message: "Logout bem-sucedido"
      });
    }
    // Verifica o status da tabela de usuários 
    else if (req.method === 'GET' && req.query.action === 'check-users') {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id,username,name,accessLevel')
          .limit(10);
        
        if (error) {
          return res.status(500).json({
            status: 'error',
            message: 'Erro ao verificar tabela de usuários',
            error: error.message
          });
        }
        
        return res.status(200).json({
          status: 'success',
          users: data || [],
          count: data?.length || 0,
          defaultUsersAvailable: DEFAULT_USERS.length
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: 'Erro ao acessar o banco de dados',
          error: error.message
        });
      }
    }
    // Método não permitido
    else {
      console.log('Requisição não reconhecida');
      return res.status(405).json({ 
        error: 'Método não permitido',
        method: req.method,
        path: req.url,
        query: req.query
      });
    }
  } catch (error) {
    console.error('Erro na execução da API:', error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message
    });
  }
} 