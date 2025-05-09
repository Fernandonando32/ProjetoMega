-- Esquema para o banco de dados Supabase do Sistema FTTH
-- Este script cria as tabelas necessárias para armazenar registros de técnicos e veículos

-- Tabela principal de registros (técnicos e veículos)
CREATE TABLE registros (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    cidade VARCHAR(100) NOT NULL,
    tecnico VARCHAR(100) NOT NULL,
    auxiliar VARCHAR(100),
    placa VARCHAR(20),
    modelo VARCHAR(50),
    operacao VARCHAR(50) NOT NULL,
    equipes VARCHAR(100),
    km_atual VARCHAR(20),
    ultima_troca_oleo VARCHAR(50),
    renavam VARCHAR(50),
    latitude VARCHAR(20),
    longitude VARCHAR(20),
    observacoes TEXT,
    data_inicio_contrato DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de manutenções de veículos
CREATE TABLE manutencoes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    registro_id BIGINT NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
    tipo_manutencao VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    km_atual INTEGER,
    valor DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registrar importações de CSV
CREATE TABLE importacoes_csv (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nome_arquivo VARCHAR(255) NOT NULL,
    registros_importados INTEGER NOT NULL DEFAULT 0,
    registros_duplicados INTEGER NOT NULL DEFAULT 0,
    registros_com_problema INTEGER NOT NULL DEFAULT 0,
    linhas_ignoradas INTEGER NOT NULL DEFAULT 0,
    arquivo_original TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Índices para melhorar performance de consultas
CREATE INDEX idx_registros_cidade ON registros(cidade);
CREATE INDEX idx_registros_tecnico ON registros(tecnico);
CREATE INDEX idx_registros_placa ON registros(placa);
CREATE INDEX idx_registros_operacao ON registros(operacao);
CREATE INDEX idx_manutencoes_registro_id ON manutencoes(registro_id);
CREATE INDEX idx_manutencoes_data ON manutencoes(data);
CREATE INDEX idx_manutencoes_tipo ON manutencoes(tipo_manutencao);

-- Função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar o timestamp de updated_at automaticamente
CREATE TRIGGER update_registros_updated_at
BEFORE UPDATE ON registros
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manutencoes_updated_at
BEFORE UPDATE ON manutencoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas para documentação
COMMENT ON TABLE registros IS 'Registros de técnicos e veículos do sistema FTTH';
COMMENT ON TABLE manutencoes IS 'Histórico de manutenções dos veículos';
COMMENT ON TABLE importacoes_csv IS 'Registro de importações de arquivos CSV';

-- Dados de exemplo para testes (opcional)
INSERT INTO registros (cidade, tecnico, auxiliar, placa, modelo, operacao, equipes, km_atual)
VALUES 
('TERESINA', 'JOSE SILVA', 'CARLOS SANTOS', 'ABC1234', 'FIAT STRADA', 'BJ Fibra', 'EQUIPE 1', '15000'),
('TIMON', 'MARIA OLIVEIRA', '', 'XYZ5678', 'FORD RANGER', 'Megalink', 'EQUIPE 2', '22000'),
('TERESINA', 'JOAO FERREIRA', 'ANTONIO LIMA', 'DEF4321', 'VW GOL', 'BJ Fibra', 'EQUIPE 3', '18500');

-- Inserir algumas manutenções de exemplo
INSERT INTO manutencoes (registro_id, tipo_manutencao, data, km_atual, valor, observacoes)
VALUES 
(1, 'Troca de Óleo', '2025-04-15', 14500, 120.00, 'Troca de óleo e filtro'),
(1, 'Revisão', '2025-05-01', 15000, 350.00, 'Revisão completa'),
(2, 'Troca de Pneus', '2025-04-20', 21800, 1200.00, 'Troca dos 4 pneus');

-- Função para criar a tabela de registros FTTH
CREATE OR REPLACE FUNCTION create_ftth_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar tabela para armazenar os registros FTTH
  CREATE TABLE IF NOT EXISTS ftth_registros (
    id BIGSERIAL PRIMARY KEY,
    cidade TEXT,
    tecnico TEXT,
    auxiliar TEXT,
    placa TEXT,
    placaOuId TEXT,
    modelo TEXT,
    operacao TEXT,
    equipes TEXT,
    kmAtual TEXT,
    ultimaTrocaOleo TEXT,
    renavam TEXT,
    lat TEXT,
    lng TEXT,
    observacoes TEXT,
    semVeiculo BOOLEAN,
    dataInicioContrato TEXT,
    manutencoes JSONB,
    importacao_id BIGINT,
    data_importacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id BIGINT,
    atualizacao_id BIGINT,
    data_atualizacao TIMESTAMP WITH TIME ZONE
  );
  
  -- Criar índices para melhorar a performance
  CREATE INDEX IF NOT EXISTS idx_ftth_registros_placa ON ftth_registros(placa);
  CREATE INDEX IF NOT EXISTS idx_ftth_registros_tecnico ON ftth_registros(tecnico);
  CREATE INDEX IF NOT EXISTS idx_ftth_registros_cidade ON ftth_registros(cidade);
  CREATE INDEX IF NOT EXISTS idx_ftth_registros_operacao ON ftth_registros(operacao);
  CREATE INDEX IF NOT EXISTS idx_ftth_registros_importacao ON ftth_registros(importacao_id);
  
  -- Desabilitar RLS para evitar problemas com políticas
  ALTER TABLE ftth_registros DISABLE ROW LEVEL SECURITY;
  
  -- Conceder permissões
  GRANT ALL PRIVILEGES ON TABLE ftth_registros TO postgres, anon, authenticated, service_role;
  GRANT ALL PRIVILEGES ON SEQUENCE ftth_registros_id_seq TO postgres, anon, authenticated, service_role;
  
  RAISE NOTICE 'Tabela ftth_registros criada ou atualizada com sucesso!';
END;
$$;

-- Função para criar a tabela de importações
CREATE OR REPLACE FUNCTION create_ftth_import_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar tabela para registrar as importações
  CREATE TABLE IF NOT EXISTS ftth_importacoes (
    id BIGSERIAL PRIMARY KEY,
    tipo TEXT,
    usuario_id BIGINT,
    quantidade INTEGER,
    registros_salvos INTEGER,
    registros_erro INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'iniciado',
    sucesso BOOLEAN DEFAULT FALSE,
    erro TEXT,
    detalhes JSONB
  );
  
  -- Criar índices
  CREATE INDEX IF NOT EXISTS idx_ftth_importacoes_user ON ftth_importacoes(usuario_id);
  CREATE INDEX IF NOT EXISTS idx_ftth_importacoes_timestamp ON ftth_importacoes(timestamp);
  
  -- Desabilitar RLS para evitar problemas com políticas
  ALTER TABLE ftth_importacoes DISABLE ROW LEVEL SECURITY;
  
  -- Conceder permissões
  GRANT ALL PRIVILEGES ON TABLE ftth_importacoes TO postgres, anon, authenticated, service_role;
  GRANT ALL PRIVILEGES ON SEQUENCE ftth_importacoes_id_seq TO postgres, anon, authenticated, service_role;
  
  RAISE NOTICE 'Tabela ftth_importacoes criada ou atualizada com sucesso!';
END;
$$; 