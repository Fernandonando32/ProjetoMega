-- Remover usuário admin existente se houver
DO $$
BEGIN
    -- Remover da tabela public.users primeiro
    DELETE FROM public.users WHERE username = 'admin' OR email = 'admin@sistema.com';
    
    -- Remover da tabela auth.users
    DELETE FROM auth.users WHERE email = 'admin@sistema.com';
END $$;

-- Criar novo usuário admin
DO $$
DECLARE
    admin_id UUID;
BEGIN
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
END $$; 