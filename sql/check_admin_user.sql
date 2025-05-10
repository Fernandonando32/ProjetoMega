-- Verificar e corrigir usuário admin
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Verificar se o usuário existe na tabela auth.users
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@sistema.com';
    
    IF admin_id IS NULL THEN
        -- Criar usuário no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@sistema.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Administrador"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_id;
    END IF;

    -- Verificar se o usuário existe na tabela public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_id) THEN
        -- Criar usuário na tabela public.users
        INSERT INTO public.users (
            id,
            username,
            email,
            password_hash,
            full_name,
            role,
            permissions,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            'admin',
            'admin@sistema.com',
            crypt('admin123', gen_salt('bf')),
            'Administrador do Sistema',
            'ADMIN',
            '["manage_users", "view_tasks", "create_tasks", "edit_tasks", "delete_tasks", "complete_tasks", "view_completed", "view_technicians", "add_technician", "edit_technician", "delete_technician", "view_statistics", "view_map", "view_maintenance", "add_maintenance", "edit_maintenance", "delete_maintenance", "view_by_operation"]'::jsonb,
            true,
            now(),
            now()
        );
    END IF;

    -- Atualizar a senha do usuário no auth.users
    UPDATE auth.users 
    SET encrypted_password = crypt('admin123', gen_salt('bf'))
    WHERE id = admin_id;
END $$; 