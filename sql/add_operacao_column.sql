-- Script para adicionar a coluna 'operacao' à tabela 'users'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS operacao TEXT;

-- Comentário para documentação
COMMENT ON COLUMN users.operacao IS 'Operação associada ao usuário (ex: BJ Fibra, Megalink)';

-- Atualizar usuários existentes com valor padrão vazio
UPDATE users SET operacao = '' WHERE operacao IS NULL; 