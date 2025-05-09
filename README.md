# Sistema de Gestão FTTH com Supabase

Este sistema de gestão para técnicos e veículos FTTH foi aprimorado para usar o Supabase como banco de dados persistente, substituindo o armazenamento local anterior (localStorage).

## Funcionalidades Implementadas

1. **Integração com Supabase**
   - Armazenamento persistente em banco de dados PostgreSQL
   - Sincronização automática dos dados
   - Suporte a múltiplos usuários

2. **Gestão de Registros**
   - Cadastro de técnicos e veículos
   - Filtragem e busca avançada
   - Estatísticas em tempo real
   - Visualização em mapa (coordenadas geográficas)

3. **Importação de CSV**
   - Importação de dados de planilhas
   - Registro histórico de importações
   - Validação de dados duplicados

4. **Manutenção de Veículos**
   - Registro de manutenções
   - Alertas para trocas de óleo
   - Histórico completo por veículo

## Arquitetura do Sistema

O sistema usa uma arquitetura cliente-servidor com o Supabase provendo a camada de backend:

- **Frontend**: HTML, CSS e JavaScript puro
- **Backend**: Supabase (PostgreSQL + API RESTful)
- **Interface**: Wrapper HTML com injeção de scripts

### Estrutura de Arquivos

- `index.html` - Ponto de entrada do sistema com wrapper
- `Pagina1 (1).html` - Página principal com a interface do usuário
- `js/` - Diretório com scripts JavaScript
  - `supabase-db.js` - Integração primária com Supabase
  - `db-integrator.js` - Interfaces para banco de dados
  - `supabase-integration.js` - Script de injeção dinâmica
- `sql/` - Esquemas SQL para o Supabase
  - `criar_tabelas_ftth.sql` - Script de criação das tabelas

## Configuração do Supabase

1. Acesse o [Supabase](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Execute o script SQL em `sql/criar_tabelas_ftth.sql`
4. Atualize as credenciais em `js/supabase-db.js`:

```javascript
const SUPABASE_CONFIG = {
    url: "SEU_URL_SUPABASE",
    key: "SUA_CHAVE_ANON_SUPABASE"
};
```

## Como Usar

1. Abra o arquivo `index.html` no navegador
2. Faça login com suas credenciais
3. A sincronização com o banco de dados ocorre automaticamente
4. Todas as operações (adicionar, editar, excluir) agora são persistentes

## Solução de Problemas

Se encontrar problemas ao usar o Supabase:

1. Verifique as configurações de URL e chave de API
2. Confirme que as tabelas foram criadas no Supabase
3. Consulte o console do navegador para mensagens de erro
4. Em caso de falha, o sistema reverte para o armazenamento local

## Desenvolvimento Futuro

- Autenticação direta com Supabase Auth
- Sincronização offline
- Melhorias na interface de importação
- Dashboard avançado de estatísticas

---

Desenvolvido como parte da solução para o Sistema de Gestão FTTH.

## Estrutura do Projeto

- `admin.html` - Página de administração de usuários
- `login.html` - Página de login
- `users.js` - Módulo de autenticação e gerenciamento de usuários
- `config.js` - Configurações do Supabase
- `supabase-schema.sql` - Esquema do banco de dados

## Usuários Padrão

O sistema vem com os seguintes usuários padrão:

| Usuário     | Senha     | Nível de Acesso      |
|-------------|-----------|----------------------|
| admin       | admin123  | Administrador        |
| tecnico     | tech123   | Gestor de Técnicos   |
| manutencao  | maint123  | Gestor de Manutenção |
| usuario     | user123   | Usuário Padrão       |
| visualizador| view123   | Visualizador         |

**Importante:** Em um ambiente de produção, altere as senhas padrão imediatamente após a configuração inicial.

## Funcionalidades

- Autenticação de usuários
- Gerenciamento de permissões
- Administração de usuários
- Acompanhamento de técnicos e veículos
- Estatísticas de operação

## Tecnologias Utilizadas

- HTML, CSS e JavaScript
- Supabase (Banco de dados PostgreSQL)
- Font Awesome (ícones)

## Desenvolvimento

Para desenvolver localmente, você pode usar qualquer servidor web local como:
- Live Server (extensão do VS Code)
- http-server (Node.js)
- Python SimpleHTTPServer

## Segurança

Em um ambiente de produção:
1. Use HTTPS para todas as comunicações
2. Implemente hashing de senha (bcrypt ou similar)
3. Configure adequadamente as políticas de segurança (RLS) no Supabase
4. Revise e atualize regularmente as permissões de usuário

## Visão Geral

O Sistema de Gestão FTTH é uma aplicação web integrada para gerenciamento de técnicos, veículos e tarefas em operações de fibra óptica. O sistema consiste em três módulos principais:

1. **Acompanhamento de Técnicos e Veículos** - Gestão e monitoramento de técnicos e veículos em campo
2. **Manutenção de Veículos** - Controle de manutenções preventivas e corretivas da frota
3. **Agenda de Tarefas** - Planejamento e agendamento de atividades e compromissos

## Sistema de Permissões

O sistema utiliza um modelo de controle de acesso baseado em permissões (RBAC - Role-Based Access Control) para garantir que os usuários só possam acessar as funcionalidades para as quais estão autorizados.

### Níveis de Acesso

O sistema possui os seguintes níveis de acesso pré-definidos:

| Nível | Descrição |
|-------|-----------|
| Administrador | Acesso completo a todas as funcionalidades do sistema |
| Gestor de Técnicos | Gerenciamento completo de técnicos e veículos, acesso limitado a outras áreas |
| Gestor de Manutenção | Gerenciamento completo de manutenções, acesso limitado a outras áreas |
| Usuário Padrão | Permissões básicas em todas as áreas |
| Visualizador | Apenas visualização de dados sem poder de modificação |

### Permissões Disponíveis

#### Permissões da Agenda
- `view_tasks` - Visualizar tarefas e agenda
- `create_tasks` - Criar novas tarefas
- `edit_tasks` - Editar tarefas existentes
- `delete_tasks` - Excluir tarefas
- `complete_tasks` - Marcar tarefas como concluídas
- `view_completed` - Visualizar tarefas concluídas

#### Permissões de Acompanhamento de Técnicos e Veículos
- `view_technicians` - Visualizar informações de técnicos e veículos
- `add_technician` - Adicionar novos registros de técnicos e veículos
- `edit_technician` - Editar registros existentes
- `delete_technician` - Excluir registros
- `view_statistics` - Visualizar estatísticas e dashboards
- `view_map` - Visualizar o mapa de localização

#### Permissões de Manutenção de Veículos
- `view_maintenance` - Visualizar registros de manutenção
- `add_maintenance` - Adicionar novas manutenções
- `edit_maintenance` - Editar manutenções existentes
- `delete_maintenance` - Excluir registros de manutenção

#### Permissões de Administração
- `manage_users` - Gerenciar usuários do sistema

## Administração de Usuários

Os administradores podem acessar o módulo de administração de usuários para:

1. Adicionar novos usuários
2. Editar informações de usuários existentes
3. Excluir usuários
4. Definir níveis de acesso
5. Personalizar permissões específicas

A personalização de permissões permite criar combinações não disponíveis nos níveis de acesso padrão, oferecendo flexibilidade para adaptar o sistema às necessidades organizacionais.

## Navegação entre Módulos

- Da página principal de Técnicos e Veículos: use o botão "Agendar" para ir para Agenda ou "Manutenção" para o módulo de Manutenção de Veículos
- Da página de Agenda: use o botão "Voltar para Acom. Tec. e Veicu." para retornar à página principal
- Da página de Manutenção: use o botão "Voltar" para retornar à página principal 