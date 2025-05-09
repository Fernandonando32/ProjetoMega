-- Esquema para o Supabase

-- Tabela de usuários
CREATE TABLE users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Em produção, deve ser um hash
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    access_level VARCHAR(50) NOT NULL,
    operacao VARCHAR(50),
    custom_permissions BOOLEAN DEFAULT FALSE,
    permissions TEXT[], -- Array de permissões
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp automaticamente
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)

-- Habilitar RLS na tabela de usuários
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para administradores (acesso total)
CREATE POLICY admin_users_policy ON users
    USING (auth.uid() IN (
        SELECT auth.uid() 
        FROM users 
        WHERE access_level = 'ADMIN' OR 
              (custom_permissions = TRUE AND 'manage_users' = ANY(permissions))
    ));

-- Política para usuários autenticados (visualização)
CREATE POLICY users_view_policy ON users
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Índices
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_access_level ON users(access_level);

-- Inserir usuários padrão
INSERT INTO users (username, password, name, email, access_level) VALUES
('admin', 'admin123', 'Administrador', 'admin@example.com', 'ADMIN'),
('tecnico', 'tech123', 'Gestor de Técnicos', 'tecnico@example.com', 'TECH_MANAGER'),
('manutencao', 'maint123', 'Gestor de Manutenção', 'manutencao@example.com', 'MAINTENANCE_MANAGER'),
('usuario', 'user123', 'Usuário Padrão', 'user@example.com', 'USER'),
('visualizador', 'view123', 'Visualizador', 'viewer@example.com', 'VIEWER'); 