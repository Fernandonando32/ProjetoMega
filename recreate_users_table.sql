-- Primeiro, remover a tabela existente e suas dependências
DROP TABLE IF EXISTS users CASCADE;

-- Criar a tabela users com a estrutura correta
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    accessLevel VARCHAR(20) NOT NULL DEFAULT 'USER',
    operacao VARCHAR(50),
    customPermissions JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o timestamp
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuários padrão
INSERT INTO users (username, password, name, email, accessLevel) VALUES
    ('admin', 'admin123', 'Administrador', 'admin@example.com', 'ADMIN'),
    ('tecnico', 'tech123', 'Gestor de Técnicos', 'tecnico@example.com', 'TECH_MANAGER'),
    ('manutencao', 'maint123', 'Gestor de Manutenção', 'manutencao@example.com', 'MAINTENANCE_MANAGER'),
    ('usuario', 'user123', 'Usuário Padrão', 'user@example.com', 'USER'),
    ('visualizador', 'view123', 'Visualizador', 'viewer@example.com', 'VIEWER');

-- Criar políticas de segurança (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Usuários podem ler seus próprios dados"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Política para permitir que administradores leiam todos os dados
CREATE POLICY "Administradores podem ler todos os dados"
    ON users FOR SELECT
    USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Política para permitir que administradores atualizem todos os dados
CREATE POLICY "Administradores podem atualizar todos os dados"
    ON users FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Política para permitir que administradores insiram novos usuários
CREATE POLICY "Administradores podem inserir novos usuários"
    ON users FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

-- Política para permitir que administradores excluam usuários
CREATE POLICY "Administradores podem excluir usuários"
    ON users FOR DELETE
    USING (auth.jwt() ->> 'role' = 'ADMIN'); 