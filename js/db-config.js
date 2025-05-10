// Configuração do Supabase
const SUPABASE_URL = 'https://ryttlyigvimycygnzfju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5MjQ5NzAsImV4cCI6MjA1NTUwMDk3MH0.0YHhXwXwXwXwXwXwXwXwXwXwXwXwXwXwXwXwXwXw';

// Inicializar o cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Objeto para gerenciar operações com usuários
const UserDB = {
    // Obter todos os usuários
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            throw error;
        }
    },

    // Criar novo usuário
    async createUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw error;
        }
    },

    // Atualizar usuário existente
    async updateUser(userId, userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', userId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    },

    // Excluir usuário
    async deleteUser(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            throw error;
        }
    },

    // Obter usuário por ID
    async getUserById(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            throw error;
        }
    }
};

// Exportar para uso global
window.UserDB = UserDB; 