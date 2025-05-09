// Importação da biblioteca Supabase
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = "https://ryttlyigvimycygnzfju.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA";
const supabase = createClient(supabaseUrl, supabaseKey);

// Usuários padrão do sistema para teste
const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123'
  }
];

/**
 * API de diagnóstico para o sistema de login
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

  // Coletar informações de diagnóstico
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      env: process.env.NODE_ENV || 'development',
      platform: process.platform,
      vercel: process.env.VERCEL || false
    },
    supabase: {
      url: supabaseUrl,
      keyLength: supabaseKey.length,
      keySample: `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 10)}`
    },
    database: {
      status: 'pending',
      users: {
        status: 'pending',
        count: 0,
        sample: null,
        error: null
      },
      defaultUserLogin: {
        status: 'pending',
        result: null
      }
    }
  };

  try {
    // Verificar conexão com o Supabase
    const { data: healthData, error: healthError } = await supabase.from('users').select('count').limit(1);
    
    if (healthError) {
      diagnosticInfo.database.status = 'error';
      diagnosticInfo.database.error = healthError.message;
    } else {
      diagnosticInfo.database.status = 'connected';
      
      // Verificar tabela de usuários
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, name, accessLevel')
          .limit(5);
        
        if (usersError) {
          diagnosticInfo.database.users.status = 'error';
          diagnosticInfo.database.users.error = usersError.message;
        } else {
          diagnosticInfo.database.users.status = 'available';
          diagnosticInfo.database.users.count = users?.length || 0;
          diagnosticInfo.database.users.sample = users?.map(u => ({ 
            id: u.id, 
            username: u.username, 
            accessLevel: u.accessLevel 
          })) || [];
        }
      } catch (usersError) {
        diagnosticInfo.database.users.status = 'error';
        diagnosticInfo.database.users.error = usersError.message;
      }
      
      // Testar login com usuário padrão
      try {
        const testUser = DEFAULT_USERS[0];
        const { data: user, error: loginError } = await supabase
          .from('users')
          .select('*')
          .eq('username', testUser.username)
          .single();
        
        if (loginError) {
          diagnosticInfo.database.defaultUserLogin.status = 'error';
          diagnosticInfo.database.defaultUserLogin.result = loginError.message;
        } else if (!user) {
          diagnosticInfo.database.defaultUserLogin.status = 'missing';
          diagnosticInfo.database.defaultUserLogin.result = 'Usuário padrão não encontrado';
        } else if (user.password !== testUser.password) {
          diagnosticInfo.database.defaultUserLogin.status = 'wrongpass';
          diagnosticInfo.database.defaultUserLogin.result = 'Senha diferente da esperada';
        } else {
          diagnosticInfo.database.defaultUserLogin.status = 'success';
          diagnosticInfo.database.defaultUserLogin.result = 'Usuário padrão encontrado com credenciais corretas';
        }
      } catch (loginError) {
        diagnosticInfo.database.defaultUserLogin.status = 'error';
        diagnosticInfo.database.defaultUserLogin.result = loginError.message;
      }
    }
  } catch (error) {
    diagnosticInfo.database.status = 'error';
    diagnosticInfo.database.error = error.message;
  }

  return res.status(200).json(diagnosticInfo);
} 