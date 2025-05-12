/**
 * API de Tarefas - Interface para comunicação com o banco de dados
 * Fornece métodos para operações CRUD de tarefas na agenda
 */

const TasksAPI = {
    /**
     * Busca todas as tarefas do banco de dados
     * @returns {Promise<Array>} Lista de tarefas
     */
    async getAllTasks() {
        try {
            // Verificar se o dbManager está disponível
            if (!window.dbManager) {
                console.error('dbManager não está disponível');
                
                // Fallback para localStorage se o dbManager não estiver disponível
                const localTasks = localStorage.getItem('tasks');
                const parsed = localTasks ? JSON.parse(localTasks) : [];
                console.log('Carregadas tarefas do localStorage:', parsed.length);
                return parsed;
            }
            
            // Buscar tarefas do banco de dados usando dbManager
            console.log('Buscando tarefas do banco de dados via dbManager...');
            const dbTasks = await window.dbManager.getAllTasks();
            console.log('Tarefas recebidas do banco:', dbTasks.length);
            
            // Converter para o formato da UI
            const tasks = Array.isArray(dbTasks) ? dbTasks.map(task => this._convertFromDbFormat(task)) : [];
            console.log('Tarefas convertidas para formato UI:', tasks.length);
            
            // Também armazenar no localStorage para fallback offline
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            return tasks;
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            
            // Em caso de erro, tentar carregar do localStorage
            const localTasks = localStorage.getItem('tasks');
            const fallbackTasks = localTasks ? JSON.parse(localTasks) : [];
            console.log('Usando fallback do localStorage:', fallbackTasks.length);
            return fallbackTasks;
        }
    },
    
    /**
     * Salva uma nova tarefa no banco de dados
     * @param {Object} taskData - Dados da tarefa a ser criada
     * @returns {Promise<Object>} A tarefa criada
     */
    async createTask(taskData) {
        try {
            // Verificar se o dbManager está disponível
            if (!window.dbManager) {
                console.error('dbManager não está disponível');
                
                // Fallback para localStorage
                const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const newTask = {
                    ...taskData,
                    id: 'local_' + Date.now(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                localTasks.push(newTask);
                localStorage.setItem('tasks', JSON.stringify(localTasks));
                
                return newTask;
            }
            
            // Converter dados do formato da interface para o formato do banco
            const dbTaskData = this._convertToDbFormat(taskData);
            
            // Criar tarefa no banco de dados
            const result = await window.dbManager.createTask(dbTaskData);
            
            // Atualizar cache local
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const taskForLocalStorage = this._convertFromDbFormat(result);
            
            localTasks.push(taskForLocalStorage);
            localStorage.setItem('tasks', JSON.stringify(localTasks));
            
            return taskForLocalStorage;
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            
            // Em caso de erro, salvar apenas localmente
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const newTask = {
                ...taskData,
                id: 'local_' + Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                _is_local_only: true
            };
            
            localTasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(localTasks));
            
            return newTask;
        }
    },
    
    /**
     * Atualiza uma tarefa existente
     * @param {string} taskId - ID da tarefa a ser atualizada
     * @param {Object} taskData - Novos dados da tarefa
     * @returns {Promise<Object>} A tarefa atualizada
     */
    async updateTask(taskId, taskData) {
        try {
            // Verificar se o dbManager está disponível
            if (!window.dbManager) {
                console.error('dbManager não está disponível');
                
                // Fallback para localStorage
                const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const index = localTasks.findIndex(t => t.id === taskId);
                
                if (index === -1) {
                    throw new Error('Tarefa não encontrada');
                }
                
                const updatedTask = {
                    ...localTasks[index],
                    ...taskData,
                    updated_at: new Date().toISOString()
                };
                
                localTasks[index] = updatedTask;
                localStorage.setItem('tasks', JSON.stringify(localTasks));
                
                return updatedTask;
            }
            
            // Converter dados do formato da interface para o formato do banco
            const dbTaskData = this._convertToDbFormat(taskData);
            
            // Atualizar tarefa no banco de dados
            const result = await window.dbManager.updateTask(taskId, dbTaskData);
            
            // Atualizar cache local
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const index = localTasks.findIndex(t => t.id === taskId);
            
            if (index !== -1) {
                const taskForLocalStorage = this._convertFromDbFormat(result);
                localTasks[index] = taskForLocalStorage;
                localStorage.setItem('tasks', JSON.stringify(localTasks));
            }
            
            return this._convertFromDbFormat(result);
        } catch (error) {
            console.error(`Erro ao atualizar tarefa ${taskId}:`, error);
            
            // Em caso de erro, atualizar apenas localmente
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const index = localTasks.findIndex(t => t.id === taskId);
            
            if (index === -1) {
                throw new Error('Tarefa não encontrada');
            }
            
            const updatedTask = {
                ...localTasks[index],
                ...taskData,
                updated_at: new Date().toISOString(),
                _is_local_only: true
            };
            
            localTasks[index] = updatedTask;
            localStorage.setItem('tasks', JSON.stringify(localTasks));
            
            return updatedTask;
        }
    },
    
    /**
     * Exclui uma tarefa
     * @param {string} taskId - ID da tarefa a ser excluída
     * @returns {Promise<Object>} Resultado da operação
     */
    async deleteTask(taskId) {
        try {
            // Verificar se o dbManager está disponível
            if (!window.dbManager) {
                console.error('dbManager não está disponível');
                
                // Fallback para localStorage
                const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const filteredTasks = localTasks.filter(t => t.id !== taskId);
                
                localStorage.setItem('tasks', JSON.stringify(filteredTasks));
                
                return { success: true, message: 'Tarefa excluída (modo offline)' };
            }
            
            // Excluir tarefa no banco de dados
            await window.dbManager.deleteTask(taskId);
            
            // Atualizar cache local
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const filteredTasks = localTasks.filter(t => t.id !== taskId);
            
            localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            
            return { success: true, message: 'Tarefa excluída com sucesso' };
        } catch (error) {
            console.error(`Erro ao excluir tarefa ${taskId}:`, error);
            
            // Em caso de erro, tentar excluir apenas localmente
            try {
                const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const filteredTasks = localTasks.filter(t => t.id !== taskId);
                
                localStorage.setItem('tasks', JSON.stringify(filteredTasks));
                
                return { success: true, message: 'Tarefa excluída apenas localmente' };
            } catch (localError) {
                return { success: false, message: error.message || 'Erro ao excluir tarefa' };
            }
        }
    },
    
    /**
     * Marca uma tarefa como concluída
     * @param {string} taskId - ID da tarefa a ser concluída
     * @returns {Promise<Object>} Resultado da operação
     */
    async completeTask(taskId) {
        try {
            // Buscar a tarefa atual
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const taskIndex = localTasks.findIndex(t => t.id === taskId);
            
            if (taskIndex === -1) {
                return { success: false, message: 'Tarefa não encontrada' };
            }
            
            // Verificar se o dbManager está disponível
            if (!window.dbManager) {
                console.error('dbManager não está disponível');
                
                // Atualizar localmente
                localTasks[taskIndex].completed = true;
                localTasks[taskIndex].completedAt = new Date().toISOString();
                localTasks[taskIndex].status = 'concluida';
                localStorage.setItem('tasks', JSON.stringify(localTasks));
                
                return { success: true, message: 'Tarefa concluída (modo offline)' };
            }
            
            // Atualizar no banco de dados
            const taskData = {
                ...localTasks[taskIndex],
                completed: true,
                status: 'concluida',
                completedAt: new Date().toISOString()
            };
            
            // Converter para formato do banco
            const dbTaskData = this._convertToDbFormat(taskData);
            
            // Atualizar no banco
            const result = await window.dbManager.updateTask(taskId, dbTaskData);
            
            // Atualizar no localStorage
            localTasks[taskIndex].completed = true;
            localTasks[taskIndex].status = 'concluida';
            localTasks[taskIndex].completedAt = new Date().toISOString();
            localStorage.setItem('tasks', JSON.stringify(localTasks));
            
            return { success: true, result };
        } catch (error) {
            console.error(`Erro ao concluir tarefa ${taskId}:`, error);
            return { success: false, message: error.message };
        }
    },
    
    /**
     * Sincroniza tarefas locais com o banco de dados
     * @returns {Promise<Object>} Resultado da sincronização
     */
    async syncTasks() {
        // Esta função pode ser implementada mais tarde para sincronizar
        // tarefas que foram criadas/modificadas offline
        return { success: true, message: 'Sincronização não implementada' };
    },
    
    /**
     * Converte o formato de tarefa da interface para o formato do banco de dados
     * @private
     * @param {Object} uiTask - Tarefa no formato da interface
     * @returns {Object} Tarefa no formato do banco de dados
     */
    _convertToDbFormat(uiTask) {
        // Converter formato de data e hora
        let startDate = null;
        let endDate = null;
        
        // Certificar-se de que as datas sejam convertidas corretamente
        if (uiTask.date) {
            // Se temos data e hora separadas, combinar
            if (uiTask.startTime) {
                const [startHours, startMinutes] = uiTask.startTime.split(':');
                // Usar UTC para evitar deslocamentos de fuso horário
                startDate = new Date(Date.UTC(
                    parseInt(uiTask.date.substring(0, 4), 10),
                    parseInt(uiTask.date.substring(5, 7), 10) - 1, // Mês em JS é 0-indexed
                    parseInt(uiTask.date.substring(8, 10), 10),
                    parseInt(startHours, 10),
                    parseInt(startMinutes, 10),
                    0
                ));
            } else {
                // Se não temos hora de início, usar 00:00
                startDate = new Date(Date.UTC(
                    parseInt(uiTask.date.substring(0, 4), 10),
                    parseInt(uiTask.date.substring(5, 7), 10) - 1,
                    parseInt(uiTask.date.substring(8, 10), 10),
                    0, 0, 0
                ));
            }
            
            if (uiTask.endTime) {
                const [endHours, endMinutes] = uiTask.endTime.split(':');
                endDate = new Date(Date.UTC(
                    parseInt(uiTask.date.substring(0, 4), 10),
                    parseInt(uiTask.date.substring(5, 7), 10) - 1,
                    parseInt(uiTask.date.substring(8, 10), 10),
                    parseInt(endHours, 10),
                    parseInt(endMinutes, 10),
                    0
                ));
            } else if (startDate) {
                // Se não temos hora de término, usar hora de início + 1 hora
                endDate = new Date(startDate);
                endDate.setUTCHours(endDate.getUTCHours() + 1);
            } else {
                // Se nenhuma hora for especificada, usar fim do dia
                endDate = new Date(Date.UTC(
                    parseInt(uiTask.date.substring(0, 4), 10),
                    parseInt(uiTask.date.substring(5, 7), 10) - 1,
                    parseInt(uiTask.date.substring(8, 10), 10),
                    23, 59, 59
                ));
            }
        }
        
        // Se não temos data/hora formatadas, usar as originais
        if (!startDate && uiTask.start_date) {
            startDate = new Date(uiTask.start_date);
        }
        
        if (!endDate && uiTask.end_date) {
            endDate = new Date(uiTask.end_date);
        }
        
        // Tratar atribuição a múltiplos usuários
        let assignedTo = uiTask.assignedTo;
        if (Array.isArray(assignedTo) && assignedTo.length > 0) {
            // O banco de dados atualmente suporta apenas um único usuário atribuído
            // Se houver mais, pegar apenas o primeiro da lista
            assignedTo = assignedTo[0];
        }
        
        // Serializar o padrão de repetição se disponível
        let repeatPattern = null;
        if (uiTask.repeat || uiTask.repeatPattern) {
            repeatPattern = JSON.stringify(uiTask.repeat || uiTask.repeatPattern);
        }
        
        return {
            title: uiTask.title,
            description: uiTask.description || '',
            start_date: startDate ? startDate.toISOString() : null,
            end_date: endDate ? endDate.toISOString() : null,
            status: uiTask.completed ? 'concluida' : 'pendente',
            priority: uiTask.priority || 'normal',
            technician_id: uiTask.technicianId || null,
            created_by: uiTask.createdBy || null,
            assigned_to: assignedTo,
            operacao: uiTask.operacao || null,
            color: uiTask.color || '#3788d8',
            repeat_pattern: repeatPattern,
            location: uiTask.location ? JSON.stringify(uiTask.location) : null,
            attachments: uiTask.attachments ? JSON.stringify(uiTask.attachments) : null
        };
    },
    
    /**
     * Converte o formato de tarefa do banco de dados para o formato da interface
     * @private
     * @param {Object} dbTask - Tarefa no formato do banco de dados
     * @returns {Object} Tarefa no formato da interface
     */
    _convertFromDbFormat(dbTask) {
        // Extrair data e horários
        let date = null;
        let startTime = null;
        let endTime = null;
        
        // Verificar se temos datas válidas
        if (dbTask.start_date) {
            // Converter para objeto Date mantendo o formato UTC
            const startDate = new Date(dbTask.start_date);
            
            // Formatar a data como YYYY-MM-DD para o campo date
            // Garantir que a data seja baseada no valor UTC original
            const year = startDate.getUTCFullYear();
            const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(startDate.getUTCDate()).padStart(2, '0');
            date = `${year}-${month}-${day}`;
            
            // Formatar a hora como HH:MM para o campo startTime
            const hours = String(startDate.getUTCHours()).padStart(2, '0');
            const minutes = String(startDate.getUTCMinutes()).padStart(2, '0');
            startTime = `${hours}:${minutes}`;
        }
        
        if (dbTask.end_date) {
            // Converter para objeto Date mantendo o formato UTC
            const endDate = new Date(dbTask.end_date);
            
            // Formatar a hora como HH:MM para o campo endTime
            const hours = String(endDate.getUTCHours()).padStart(2, '0');
            const minutes = String(endDate.getUTCMinutes()).padStart(2, '0');
            endTime = `${hours}:${minutes}`;
            
            // Se não temos data de início, usar a data de término
            if (!date) {
                const year = endDate.getUTCFullYear();
                const month = String(endDate.getUTCMonth() + 1).padStart(2, '0');
                const day = String(endDate.getUTCDate()).padStart(2, '0');
                date = `${year}-${month}-${day}`;
            }
        }
        
        // Extrair padrão de repetição
        let repeatPattern = null;
        if (dbTask.repeat_pattern) {
            try {
                repeatPattern = typeof dbTask.repeat_pattern === 'string' 
                    ? JSON.parse(dbTask.repeat_pattern) 
                    : dbTask.repeat_pattern;
            } catch (error) {
                console.error('Erro ao converter padrão de repetição:', error);
            }
        }
        
        // Extrair localização
        let location = null;
        if (dbTask.location) {
            try {
                location = typeof dbTask.location === 'string' 
                    ? JSON.parse(dbTask.location) 
                    : dbTask.location;
            } catch (error) {
                console.error('Erro ao converter localização:', error);
            }
        }
        
        // Extrair anexos
        let attachments = null;
        if (dbTask.attachments) {
            try {
                attachments = typeof dbTask.attachments === 'string' 
                    ? JSON.parse(dbTask.attachments) 
                    : dbTask.attachments;
            } catch (error) {
                console.error('Erro ao converter anexos:', error);
            }
        }
        
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description || '',
            date: date,
            startTime: startTime,
            endTime: endTime,
            start_date: dbTask.start_date,  // Manter o formato original para comparações
            end_date: dbTask.end_date,      // Manter o formato original para comparações
            completed: dbTask.status === 'concluida',
            priority: dbTask.priority || 'normal',
            technicianId: dbTask.technician_id || null,
            createdBy: dbTask.created_by || null,
            assignedTo: dbTask.assigned_to ? [dbTask.assigned_to] : [],
            operacao: dbTask.operacao || null,
            color: dbTask.color || '#3788d8',
            repeatPattern: repeatPattern,
            location: location,
            attachments: attachments,
            created_at: dbTask.created_at,
            updated_at: dbTask.updated_at,
            completedAt: dbTask.status === 'concluida' ? dbTask.updated_at : null
        };
    }
};

// Exportar a API de tarefas para uso global
window.TasksAPI = TasksAPI; 