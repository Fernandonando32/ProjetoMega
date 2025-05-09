// Importação da biblioteca Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import SUPABASE_CONFIG from '../config.js';

// Configuração do cliente Supabase
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseKey = SUPABASE_CONFIG.key;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * API de autenticação para o Sistema de Gestão FTTH
 */
export default {
    /**
     * Verifica as credenciais de login e autentica o usuário
     * @param {Request} req - O objeto de requisição
     * @param {Response} res - O objeto de resposta
     * @returns {Promise<Object>} Resposta com status e dados do usuário (se autenticado)
     */
    async authenticate(req, res) {
        try {
            // Extrair credenciais da requisição
            const { username, password } = req.body;
            
            if (!username || !password) {
                return {
                    status: 400,
                    error: "Nome de usuário e senha são obrigatórios"
                };
            }
            
            // Buscar o usuário pelo nome de usuário
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            
            if (userError || !user) {
                return {
                    status: 401,
                    error: "Credenciais inválidas"
                };
            }
            
            // Verificar a senha (em produção, deve usar bcrypt ou similar)
            if (user.password !== password) {
                return {
                    status: 401,
                    error: "Credenciais inválidas"
                };
            }
            
            // Remover senha dos dados a serem enviados
            const { password: _, ...userWithoutPassword } = user;
            
            // Gerar token de sessão com Supabase (opcional)
            // const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
            //     email: user.email,
            //     password: password
            // });
            
            // if (sessionError) {
            //     console.error('Erro ao criar sessão:', sessionError);
            //     return {
            //         status: 500,
            //         error: "Erro ao criar sessão"
            //     };
            // }
            
            // Retornar dados do usuário e informações de sessão
            return {
                status: 200,
                data: {
                    user: userWithoutPassword,
                    message: "Login bem-sucedido"
                }
            };
        } catch (error) {
            console.error('Erro no processo de autenticação:', error);
            return {
                status: 500,
                error: "Erro interno do servidor"
            };
        }
    },
    
    /**
     * Verifica se o usuário atual está autenticado
     * @returns {Promise<Object>} Status da autenticação
     */
    async checkAuth() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                return {
                    status: 401,
                    authenticated: false,
                    error: "Não autenticado"
                };
            }
            
            // Obter dados atualizados do usuário
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (userError) {
                return {
                    status: 500,
                    authenticated: false,
                    error: "Erro ao obter dados do usuário"
                };
            }
            
            // Remover senha dos dados a serem enviados
            const { password: _, ...userWithoutPassword } = user;
            
            return {
                status: 200,
                authenticated: true,
                data: {
                    user: userWithoutPassword
                }
            };
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return {
                status: 500,
                authenticated: false,
                error: "Erro interno do servidor"
            };
        }
    },
    
    /**
     * Encerra a sessão do usuário atual
     * @returns {Promise<Object>} Status do logout
     */
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                return {
                    status: 500,
                    error: "Erro ao fazer logout"
                };
            }
            
            return {
                status: 200,
                message: "Logout bem-sucedido"
            };
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            return {
                status: 500,
                error: "Erro interno do servidor"
            };
        }
    },
    
    /**
     * Verifica se o usuário tem a permissão especificada
     * @param {Object} user - Objeto do usuário
     * @param {string} permission - Permissão a ser verificada
     * @returns {boolean} Verdadeiro se o usuário possui a permissão
     */
    hasPermission(user, permission) {
        if (!user || !user.accessLevel) return false;
        
        // Verificar se o usuário tem permissões personalizadas
        if (user.customPermissions && user.permissions) {
            return user.permissions.includes(permission);
        }
        
        // Caso contrário, busque as permissões associadas ao nível de acesso
        const { data: accessLevel, error } = supabase
            .from('access_levels')
            .select('permissions')
            .eq('name', user.accessLevel)
            .single();
        
        if (error || !accessLevel) return false;
        
        return accessLevel.permissions.includes(permission);
    }
}; 