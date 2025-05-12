# Migração para PostgreSQL

Este documento contém instruções para migrar o sistema do Supabase para o PostgreSQL.

## Configurações de Conexão

O banco de dados PostgreSQL está configurado com as seguintes informações:

- **Host**: 187.62.153.52
- **Porta**: 6432
- **Banco**: acompanhamento_ftth
- **Usuário**: ftth
- **Senha**: ftth@123.

## Arquivos Atualizados

Os seguintes arquivos foram modificados ou criados para suportar a nova configuração:

1. `js/pg-config.js` - Novo arquivo de configuração do PostgreSQL
2. `js/auth.js` - Atualizado para usar PostgreSQL em vez do Supabase
3. `js/users-api.js` - Atualizado para usar PostgreSQL em vez do Supabase
4. `sql/create_tables_postgres.sql` - Script SQL para criar as tabelas no PostgreSQL

## Arquivos Removidos

Os seguintes arquivos não são mais necessários e podem ser removidos:

1. `js/supabase-config.js` - Configuração do Supabase
2. `js/db-config.js` - Configuração específica do Supabase
3. Outros arquivos específicos do Supabase que não são mais utilizados

## Estrutura do Banco de Dados

O banco de dados PostgreSQL contém as seguintes tabelas:

1. `users` - Informações dos usuários do sistema
2. `tasks` - Tarefas/eventos da agenda
3. `technicians` - Informações dos técnicos
4. `maintenance` - Registros de manutenção de veículos

## Procedimento de Migração

Para migrar dados existentes do Supabase para o PostgreSQL:

1. Execute o script SQL `sql/create_tables_postgres.sql` no novo banco PostgreSQL para criar as tabelas
2. Exporte os dados das tabelas do Supabase (se necessário)
3. Importe os dados para o PostgreSQL

## Criação de API REST

Para que o sistema funcione corretamente, é necessário criar uma API REST que servirá como intermediária entre o frontend e o banco de dados PostgreSQL. Esta API deve implementar os seguintes endpoints:

### Autenticação

- `POST /api/auth/login` - Autenticar usuário

### Usuários

- `GET /api/users` - Listar todos os usuários
- `GET /api/users/:id` - Obter um usuário específico
- `POST /api/users` - Criar um novo usuário
- `PUT /api/users/:id` - Atualizar um usuário existente
- `DELETE /api/users/:id` - Excluir um usuário
- `GET /api/users/count` - Obter a contagem de usuários

### Tarefas (Agenda)

- `GET /api/tasks` - Listar todas as tarefas
- `GET /api/tasks/:id` - Obter uma tarefa específica
- `POST /api/tasks` - Criar uma nova tarefa
- `PUT /api/tasks/:id` - Atualizar uma tarefa existente
- `DELETE /api/tasks/:id` - Excluir uma tarefa

### Técnicos

- `GET /api/technicians` - Listar todos os técnicos
- `GET /api/technicians/:id` - Obter um técnico específico
- `POST /api/technicians` - Criar um novo técnico
- `PUT /api/technicians/:id` - Atualizar um técnico existente
- `DELETE /api/technicians/:id` - Excluir um técnico

### Manutenção

- `GET /api/maintenance` - Listar todos os registros de manutenção
- `GET /api/maintenance/:id` - Obter um registro de manutenção específico
- `POST /api/maintenance` - Criar um novo registro de manutenção
- `PUT /api/maintenance/:id` - Atualizar um registro de manutenção existente
- `DELETE /api/maintenance/:id` - Excluir um registro de manutenção

## Estrutura de Dados para Exportação

Para facilitar a exportação de dados para planilhas, é recomendável implementar endpoints específicos:

### Exportação de Dados

- `GET /api/export/tasks` - Exportar tarefas para formato CSV ou Excel
- `GET /api/export/technicians` - Exportar dados de técnicos para formato CSV ou Excel
- `GET /api/export/maintenance` - Exportar registros de manutenção para formato CSV ou Excel
- `GET /api/export/users` - Exportar usuários para formato CSV ou Excel (acesso restrito a administradores)

## Teste de Conexão

Para testar a conexão com o banco de dados, use o endpoint:

- `GET /api/health` - Verificar a saúde do servidor e a conexão com o banco de dados 