# Informações para Exportação de Planilhas

Este documento descreve a estrutura de dados para exportação de planilhas a partir do sistema.

## Estrutura das Planilhas

### 1. Planilha de Usuários (admin.html)

A planilha de usuários deve conter as seguintes colunas:

| Coluna | Descrição | Tipo de Dado |
|--------|-----------|--------------|
| ID | Identificador único do usuário | UUID |
| Nome Completo | Nome completo do usuário | Texto |
| Nome de Usuário | Login do usuário no sistema | Texto |
| E-mail | E-mail do usuário | Texto |
| Nível de Acesso | Nível de permissão no sistema | Texto |
| Operação | Operação associada (BJ Fibra/Megalink) | Texto |
| Ativo | Status do usuário no sistema | Booleano |
| Último Acesso | Data e hora do último acesso | Data/Hora |
| Data de Criação | Data e hora da criação do registro | Data/Hora |

### 2. Planilha de Tarefas (agenda.html)

A planilha de tarefas deve conter as seguintes colunas:

| Coluna | Descrição | Tipo de Dado |
|--------|-----------|--------------|
| ID | Identificador único da tarefa | UUID |
| Título | Nome da tarefa | Texto |
| Descrição | Descrição detalhada | Texto |
| Data de Início | Data e hora de início | Data/Hora |
| Data de Término | Data e hora de término | Data/Hora |
| Status | Status da tarefa (pendente, concluída, etc.) | Texto |
| Prioridade | Prioridade da tarefa | Texto |
| Técnico | Nome do técnico responsável | Texto |
| Criado Por | Nome do usuário que criou a tarefa | Texto |
| Atribuído Para | Nome do usuário responsável | Texto |
| Operação | Operação associada | Texto |
| Data de Criação | Data e hora da criação do registro | Data/Hora |
| Última Atualização | Data e hora da última atualização | Data/Hora |

### 3. Planilha de Técnicos (Pagina1 (1).html)

A planilha de técnicos deve conter as seguintes colunas:

| Coluna | Descrição | Tipo de Dado |
|--------|-----------|--------------|
| ID | Identificador único do técnico | UUID |
| Nome | Nome do técnico | Texto |
| Operação | Operação associada | Texto |
| Veículo | Veículo utilizado | Texto |
| Telefone | Número de telefone | Texto |
| E-mail | E-mail do técnico | Texto |
| Status | Status do técnico (ativo, inativo, etc.) | Texto |
| Habilidades | Lista de habilidades do técnico | Texto (lista separada por vírgulas) |
| Data de Criação | Data e hora da criação do registro | Data/Hora |
| Última Atualização | Data e hora da última atualização | Data/Hora |

### 4. Planilha de Manutenções (manutencao.html)

A planilha de manutenções deve conter as seguintes colunas:

| Coluna | Descrição | Tipo de Dado |
|--------|-----------|--------------|
| ID | Identificador único da manutenção | UUID |
| Veículo | Veículo em manutenção | Texto |
| Operação | Operação associada | Texto |
| Tipo de Manutenção | Tipo de serviço realizado | Texto |
| Descrição | Descrição detalhada | Texto |
| Data Realizada | Data e hora da manutenção | Data/Hora |
| Custo | Valor do serviço | Decimal |
| Próxima Manutenção | Data prevista para próxima manutenção | Data/Hora |
| Status | Status da manutenção | Texto |
| Realizado Por | Nome de quem realizou o serviço | Texto |
| Hodômetro | Leitura do hodômetro | Número |
| Criado Por | Nome do usuário que registrou | Texto |
| Data de Criação | Data e hora da criação do registro | Data/Hora |
| Última Atualização | Data e hora da última atualização | Data/Hora |

## Formatos de Exportação

O sistema deve suportar a exportação nos seguintes formatos:

1. **CSV** - Arquivo de texto com valores separados por vírgula
2. **XLSX** - Formato Excel moderno
3. **JSON** - Para integração com outros sistemas

## Processo de Exportação

Para exportar dados para planilhas, o sistema deve:

1. Implementar endpoints de API que retornem os dados no formato adequado
2. Oferecer botões de exportação nas interfaces correspondentes
3. Permitir filtrar os dados antes da exportação (por data, status, operação, etc.)
4. Incluir cabeçalhos com nomes amigáveis para as colunas

## Implementação de Backend

No backend, os endpoints de exportação devem:

1. Consultar o banco de dados PostgreSQL para obter os dados relevantes
2. Formatar os dados conforme necessário para o formato de saída
3. Incluir cabeçalhos adequados na resposta HTTP para indicar download de arquivo
4. Aplicar controle de acesso para garantir que apenas usuários autorizados possam exportar dados

## Uso com PostgreSQL

Para implementar a exportação de planilhas com PostgreSQL, recomenda-se:

1. Criar views ou funções específicas no banco de dados para otimizar consultas de exportação
2. Implementar paginação para grandes volumes de dados
3. Utilizar transações para garantir consistência dos dados exportados
4. Registrar logs de exportação para auditoria 