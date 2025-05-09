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

-- Tabela de registros (técnicos e veículos)
CREATE TABLE registros (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cidade VARCHAR(100) NOT NULL,
    tecnico VARCHAR(100) NOT NULL,
    auxiliar VARCHAR(100),
    placa VARCHAR(20),
    modelo VARCHAR(100),
    operacao VARCHAR(50) NOT NULL,
    equipes VARCHAR(100),
    km_atual VARCHAR(20),
    ultima_troca_oleo VARCHAR(20),
    renavam VARCHAR(20),
    latitude VARCHAR(20),
    longitude VARCHAR(20),
    observacoes TEXT,
    data_inicio_contrato DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Tabela de manutenções
CREATE TABLE manutencoes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    registro_id BIGINT REFERENCES registros(id) ON DELETE CASCADE,
    tipo_manutencao VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    km_atual VARCHAR(20),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id)
);

-- Tabela de importações CSV
CREATE TABLE importacoes_csv (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome_arquivo VARCHAR(255) NOT NULL,
    registros_importados INTEGER NOT NULL,
    registros_duplicados INTEGER NOT NULL,
    registros_com_problema INTEGER NOT NULL,
    linhas_ignoradas INTEGER NOT NULL,
    arquivo_original TEXT, -- Conteúdo do arquivo CSV
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id)
);

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar o timestamp automaticamente
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_updated_at
BEFORE UPDATE ON registros
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manutencoes_updated_at
BEFORE UPDATE ON manutencoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacoes_csv ENABLE ROW LEVEL SECURITY;

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

-- Políticas para registros
CREATE POLICY registros_admin_policy ON registros
    USING (auth.uid() IN (
        SELECT auth.uid() 
        FROM users 
        WHERE access_level = 'ADMIN' OR 
              (custom_permissions = TRUE AND 'manage_technician' = ANY(permissions))
    ));

CREATE POLICY registros_operacao_policy ON registros
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth.uid()
            FROM users
            WHERE operacao IS NULL OR operacao = registros.operacao
        )
    );

-- Índices
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_access_level ON users(access_level);
CREATE INDEX idx_registros_operacao ON registros(operacao);
CREATE INDEX idx_registros_cidade ON registros(cidade);
CREATE INDEX idx_registros_tecnico ON registros(tecnico);
CREATE INDEX idx_manutencoes_registro_id ON manutencoes(registro_id);

-- Inserir usuários padrão
INSERT INTO users (username, password, name, email, access_level) VALUES
('admin', 'admin123', 'Administrador', 'admin@example.com', 'ADMIN'),
('tecnico', 'tech123', 'Gestor de Técnicos', 'tecnico@example.com', 'TECH_MANAGER'),
('manutencao', 'maint123', 'Gestor de Manutenção', 'manutencao@example.com', 'MAINTENANCE_MANAGER'),
('usuario', 'user123', 'Usuário Padrão', 'user@example.com', 'USER'),
('visualizador', 'view123', 'Visualizador', 'viewer@example.com', 'VIEWER'); 