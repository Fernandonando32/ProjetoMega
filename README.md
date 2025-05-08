# Sistema de Gestão FTTH

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

### Usuários Padrão

| Usuário | Senha | Nível de Acesso |
|---------|-------|-----------------|
| admin | admin123 | Administrador |
| tecnico | tech123 | Gestor de Técnicos |
| manutencao | maint123 | Gestor de Manutenção |
| usuario | user123 | Usuário Padrão |
| visualizador | view123 | Visualizador |

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