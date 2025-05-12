-- Criar extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    operacao VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para a tabela de usuários
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Criar função para atualizar campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar automaticamente o campo updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para tarefas (Agenda)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    priority VARCHAR(20) DEFAULT 'normal',
    technician_id UUID,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    operacao VARCHAR(50),
    color VARCHAR(50),
    repeat_pattern JSONB,
    location JSONB,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para a tabela de tarefas
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_technician ON tasks(technician_id);
CREATE INDEX IF NOT EXISTS idx_tasks_operacao ON tasks(operacao);

-- Criar trigger para atualizar o campo updated_at na tabela de tarefas
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para técnicos
CREATE TABLE IF NOT EXISTS technicians (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    operacao VARCHAR(50),
    vehicle VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ativo',
    current_location JSONB,
    skills JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para a tabela de técnicos
CREATE INDEX IF NOT EXISTS idx_technicians_operacao ON technicians(operacao);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);

-- Criar trigger para atualizar o campo updated_at na tabela de técnicos
CREATE TRIGGER update_technicians_updated_at
    BEFORE UPDATE ON technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para manutenções de veículos
CREATE TABLE IF NOT EXISTS maintenance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle VARCHAR(100) NOT NULL,
    operacao VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    date_performed TIMESTAMP WITH TIME ZONE NOT NULL,
    cost DECIMAL(10, 2),
    next_maintenance_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'concluído',
    performed_by VARCHAR(100),
    odometer INT,
    attachments JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para a tabela de manutenções
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle);
CREATE INDEX IF NOT EXISTS idx_maintenance_operacao ON maintenance(operacao);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance(date_performed);

-- Criar trigger para atualizar o campo updated_at na tabela de manutenções
CREATE TRIGGER update_maintenance_updated_at
    BEFORE UPDATE ON maintenance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário administrador padrão (com senha criptografada)
-- Senha: admin123
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    full_name, 
    role, 
    permissions, 
    is_active
) VALUES (
    'admin',
    'admin@system.com',
    '$2a$10$YYsUTZksqsFjdZMdERs.feAf6g8CZw2xJ4ZYEFrPHvHmsWiCLqVCO', -- bcrypt hash para 'admin123'
    'Administrador do Sistema',
    'ADMIN',
    '["manage_users", "view_tasks", "create_tasks", "edit_tasks", "delete_tasks", "complete_tasks", "view_completed", "view_technicians", "add_technician", "edit_technician", "delete_technician", "view_statistics", "view_map", "view_maintenance", "add_maintenance", "edit_maintenance", "delete_maintenance", "view_by_operation"]'::jsonb,
    true
) ON CONFLICT (username) DO NOTHING; 