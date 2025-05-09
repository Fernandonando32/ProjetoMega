// Importação da biblioteca Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = "https://ryttlyigvimycygnzfju.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA";
const supabase = createClient(supabaseUrl, supabaseKey);

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
      
      // Buscar o usuário pelo nome de usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !user) {
        console.log('Usuário não encontrado ou erro:', userError);
        return res.status(401).json({
          error: "Credenciais inválidas"
        });
      }
      
      // Verificar a senha (em produção, deve usar bcrypt ou similar)
      if (user.password !== password) {
        console.log('Senha incorreta');
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
      error: "Erro interno do servidor"
    });
  }
} 