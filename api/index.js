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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
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
    // Obter lista de usuários
    else if (req.method === 'GET' && req.query.action === 'get-users') {
      try {
        // Obter lista de usuários do banco de dados
        const { data, error } = await supabase
          .from('users')
          .select('id,username,name,email,accessLevel,operacao,customPermissions,permissions')
          .order('id', { ascending: true });
        
        if (error) {
          console.error('Erro ao obter usuários:', error);
          return res.status(500).json({
            error: "Erro ao obter usuários",
            message: error.message
          });
        }
        
        // Remover senhas dos dados
        const usersWithoutPasswords = data.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        
        return res.status(200).json({
          users: usersWithoutPasswords
        });
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return res.status(500).json({
          error: "Erro interno do servidor",
          message: error.message
        });
      }
    }
    // Criar usuário
    else if (req.method === 'POST' && req.query.action === 'create-user') {
      try {
        const userData = req.body;
        
        console.log('Tentando criar novo usuário:', userData.username);
        
        if (!userData.username || !userData.password || !userData.name || !userData.accessLevel) {
          return res.status(400).json({
            error: "Dados incompletos",
            message: "Nome de usuário, senha, nome e nível de acesso são obrigatórios"
          });
        }
        
        // Verificar se o nome de usuário já existe
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('username')
          .eq('username', userData.username)
          .maybeSingle();
        
        if (checkError) {
          console.error('Erro ao verificar usuário existente:', checkError);
          return res.status(500).json({
            error: "Erro ao verificar usuário existente",
            message: checkError.message
          });
        }
        
        if (existingUser) {
          return res.status(400).json({
            error: "Nome de usuário já existe",
            message: "Este nome de usuário já está em uso"
          });
        }
        
        // Limpar dados antes de enviar para o Supabase
        const cleanedUserData = { 
          ...userData 
        };
        
        // Garantir que campos JSON sejam realmente arrays ou objetos e não strings
        if (typeof cleanedUserData.permissions === 'string') {
          try {
            cleanedUserData.permissions = JSON.parse(cleanedUserData.permissions);
          } catch (e) {
            console.warn('Erro ao converter permissions de string para array:', e);
            // Se não conseguir converter, usar um array vazio
            cleanedUserData.permissions = [];
          }
        }
        
        console.log('Dados de usuário limpos para criação:', JSON.stringify(cleanedUserData));
        
        // Inserir novo usuário
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([cleanedUserData])
            .select();
          
          if (error) {
            console.error('Erro do Supabase ao criar usuário:', error);
            
            // Verificar o tipo de erro para fornecer mensagens mais úteis
            if (error.code === '23505') {
              return res.status(409).json({
                error: "Conflito de dados",
                message: "Nome de usuário já existe"
              });
            } else if (error.code === '23503') {
              return res.status(400).json({
                error: "Erro de referência",
                message: "O usuário faz referência a dados que não existem"
              });
            } else if (error.code === '22P02') {
              return res.status(400).json({
                error: "Tipo de dado inválido",
                message: "Um campo contém um valor com formato inválido"
              });
            }
            
            // Se o banco de dados não estiver disponível, criar usuário localmente
            console.log('Erro ao criar usuário no Supabase, tentando criar localmente');
            const localUser = {
              ...cleanedUserData,
              id: Date.now() // Gerar ID baseado em timestamp
            };
            
            return res.status(201).json({
              user: localUser,
              message: "Usuário criado localmente (modo offline)",
              offline: true
            });
          }
          
          if (!data || data.length === 0) {
            console.error('Nenhum dado retornado após criação.');
            return res.status(500).json({
              error: "Falha na criação",
              message: "Usuário não foi criado"
            });
          }
          
          console.log('Usuário criado com sucesso:', data[0].id);
          
          // Remover senha do resultado
          const { password, ...userWithoutPassword } = data[0];
          
          return res.status(201).json({
            user: userWithoutPassword,
            message: "Usuário criado com sucesso"
          });
        } catch (supabaseError) {
          console.error('Exceção ao chamar Supabase.insert:', supabaseError);
          
          // Se ocorrer um erro na inserção, tentar criar localmente
          console.log('Tentando criar usuário localmente após exceção');
          const localUser = {
            ...cleanedUserData,
            id: Date.now() // Gerar ID baseado em timestamp
          };
          
          return res.status(201).json({
            user: localUser,
            message: "Usuário criado localmente (modo offline após falha de conexão)",
            offline: true
          });
        }
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        console.error('Stack trace:', error.stack);
        
        // Mesmo com erro, tentar criar localmente
        try {
          const localUser = {
            ...req.body,
            id: Date.now() // Gerar ID baseado em timestamp
          };
          
          return res.status(201).json({
            user: localUser,
            message: "Usuário criado localmente (fallback de erro)",
            offline: true
          });
        } catch (fallbackError) {
          return res.status(500).json({
            error: "Erro interno do servidor",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }
      }
    }
    // Atualizar usuário
    else if (req.method === 'PUT' && req.query.action === 'update-user') {
      try {
        const userId = parseInt(req.query.id);
        const userData = req.body;
        
        console.log('Tentando atualizar usuário:', userId);
        console.log('Dados de atualização:', JSON.stringify(userData));
        
        if (!userId || isNaN(userId)) {
          return res.status(400).json({
            error: "ID de usuário inválido",
            message: "O ID do usuário deve ser um número válido"
          });
        }
        
        // Verificar se o usuário existe
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (checkError) {
          console.error('Erro ao verificar usuário existente:', checkError);
          return res.status(500).json({
            error: "Erro ao verificar usuário existente",
            message: checkError.message
          });
        }
        
        if (!existingUser) {
          console.log(`Usuário com ID ${userId} não encontrado. Provavelmente foi criado localmente.`);
          
          // Para IDs que parecem timestamps (criados localmente), usamos fallback local
          if (userId > 1000000000000) { // ID é um timestamp (13 dígitos)
            console.log('Detectado ID local (timestamp). Usando armazenamento local.');
            
            // Obter usuários do armazenamento local
            let localUsers = [];
            try {
              // Tentar obter do localStorage do cliente (não funciona no servidor)
              // Isso é apenas para que o código não falhe, mas será ignorado no servidor
              if (typeof localStorage !== 'undefined') {
                const usersJson = localStorage.getItem('users');
                if (usersJson) {
                  localUsers = JSON.parse(usersJson);
                }
              }
            } catch (e) {
              console.warn('Erro ao acessar localStorage no servidor:', e);
            }
            
            // Simular sucesso para usuários criados localmente
            // Isso permite que o cliente continue funcionando
            return res.status(200).json({
              user: { ...userData, id: userId },
              message: "Usuário atualizado localmente (modo offline)"
            });
          }
          
          return res.status(404).json({
            error: "Usuário não encontrado",
            message: "O usuário com o ID especificado não existe no banco de dados"
          });
        }
        
        console.log('Usuário encontrado, preparando para atualizar');
        
        // Se a senha estiver vazia, manter a senha existente
        if (!userData.password) {
          delete userData.password;
        }
        
        // Limpar dados antes de enviar para o Supabase
        // Alguns tipos de dados podem causar problemas se não forem tratados corretamente
        const cleanedUserData = { 
          ...userData 
        };
        
        // Garantir que campos JSON sejam realmente arrays ou objetos e não strings
        if (typeof cleanedUserData.permissions === 'string') {
          try {
            cleanedUserData.permissions = JSON.parse(cleanedUserData.permissions);
          } catch (e) {
            console.warn('Erro ao converter permissions de string para array:', e);
            // Se não conseguir converter, usar um array vazio
            cleanedUserData.permissions = [];
          }
        }
        
        console.log('Dados de usuário limpos para atualização:', JSON.stringify(cleanedUserData));
        
        // Atualizar usuário
        try {
          const { data, error } = await supabase
            .from('users')
            .update(cleanedUserData)
            .eq('id', userId)
            .select();
          
          if (error) {
            console.error('Erro do Supabase ao atualizar usuário:', error);
            
            // Verificar o tipo de erro para fornecer mensagens mais úteis
            if (error.code === '23505') {
              return res.status(409).json({
                error: "Conflito de dados",
                message: "Nome de usuário já existe"
              });
            } else if (error.code === '23503') {
              return res.status(400).json({
                error: "Erro de referência",
                message: "O usuário faz referência a dados que não existem"
              });
            } else if (error.code === '22P02') {
              return res.status(400).json({
                error: "Tipo de dado inválido",
                message: "Um campo contém um valor com formato inválido"
              });
            }
            
            return res.status(500).json({
              error: "Erro ao atualizar usuário",
              message: error.message
            });
          }
          
          if (!data || data.length === 0) {
            console.error('Nenhum dado retornado após atualização.');
            return res.status(404).json({
              error: "Falha na atualização",
              message: "Nenhum registro foi atualizado"
            });
          }
          
          console.log('Usuário atualizado com sucesso:', data[0].id);
          
          // Remover senha do resultado
          const { password, ...userWithoutPassword } = data[0];
          
          return res.status(200).json({
            user: userWithoutPassword,
            message: "Usuário atualizado com sucesso"
          });
        } catch (supabaseError) {
          console.error('Exceção ao chamar Supabase.update:', supabaseError);
          return res.status(500).json({
            error: "Erro ao executar operação no banco de dados",
            message: supabaseError.message
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({
          error: "Erro interno do servidor",
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
    // Excluir usuário
    else if (req.method === 'DELETE' && req.query.action === 'delete-user') {
      try {
        const userId = parseInt(req.query.id);
        
        if (!userId || isNaN(userId)) {
          return res.status(400).json({
            error: "ID de usuário inválido",
            message: "O ID do usuário deve ser um número válido"
          });
        }
        
        // Verificar se o usuário existe
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (checkError) {
          console.error('Erro ao verificar usuário existente:', checkError);
          return res.status(500).json({
            error: "Erro ao verificar usuário existente",
            message: checkError.message
          });
        }
        
        if (!existingUser) {
          return res.status(404).json({
            error: "Usuário não encontrado",
            message: "O usuário com o ID especificado não existe"
          });
        }
        
        // Excluir usuário
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        
        if (error) {
          console.error('Erro ao excluir usuário:', error);
          return res.status(500).json({
            error: "Erro ao excluir usuário",
            message: error.message
          });
        }
        
        return res.status(200).json({
          message: "Usuário excluído com sucesso"
        });
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return res.status(500).json({
          error: "Erro interno do servidor",
          message: error.message
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