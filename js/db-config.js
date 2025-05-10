// Supabase configuration
const SUPABASE_URL = 'https://ryttlyigvimycygnzfju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA';

// Use a instância global do cliente se já existir, ou defina a configuração para uso posterior
if (!window.supabaseClient) {
    // Atualizar a configuração global do Supabase
    if (window.SUPABASE_CONFIG) {
        window.SUPABASE_CONFIG.url = SUPABASE_URL;
        window.SUPABASE_CONFIG.anonKey = SUPABASE_KEY;
    }
    
    // Criar a instância se ainda não existir
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Use a instância global do cliente
const supabase = window.supabaseClient;

// Database operations for user management
const UserDB = {
    // Get all users
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    // Create new user
    async createUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // Update user
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
            console.error('Error updating user:', error);
            throw error;
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Get user by ID
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
            console.error('Error fetching user:', error);
            throw error;
        }
    }
};

// Export the database operations
window.UserDB = UserDB; 