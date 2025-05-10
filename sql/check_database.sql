-- Verificar se a tabela users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Criar tabela users se não existir
        CREATE TABLE public.users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL,
            permissions JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Criar índices
        CREATE INDEX idx_users_username ON public.users(username);
        CREATE INDEX idx_users_email ON public.users(email);

        -- Criar função para atualizar updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Criar trigger para atualizar updated_at
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar se o usuário admin existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM public.users WHERE username = 'admin') THEN
        -- Inserir usuário admin se não existir
        INSERT INTO public.users (
            username,
            email,
            password_hash,
            full_name,
            role,
            permissions,
            is_active
        ) VALUES (
            'admin',
            'admin@sistema.com',
            crypt('admin123', gen_salt('bf')),
            'Administrador do Sistema',
            'ADMIN',
            '["manage_users", "view_tasks", "create_tasks", "edit_tasks", "delete_tasks", "complete_tasks", "view_completed", "view_technicians", "add_technician", "edit_technician", "delete_technician", "view_statistics", "view_map", "view_by_operation", "view_maintenance", "add_maintenance", "edit_maintenance", "delete_maintenance"]'::jsonb,
            true
        );
    END IF;
END $$;

-- Verificar e corrigir políticas de segurança
DO $$
BEGIN
    -- Habilitar RLS (Row Level Security)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Criar política para permitir acesso total aos administradores
    DROP POLICY IF EXISTS admin_access ON public.users;
    CREATE POLICY admin_access ON public.users
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.username = current_user
                AND u.role = 'ADMIN'
            )
        );

    -- Criar política para permitir que usuários vejam seus próprios dados
    DROP POLICY IF EXISTS user_own_data ON public.users;
    CREATE POLICY user_own_data ON public.users
        FOR SELECT
        TO authenticated
        USING (
            username = current_user
        );
END $$; 