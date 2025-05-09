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