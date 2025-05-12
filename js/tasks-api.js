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
                return localTasks ? JSON.parse(localTasks) : [];
            }
            
            // Buscar tarefas do banco de dados usando dbManager
            const tasks = await window.dbManager.getAllTasks();
            
            // Também armazenar no localStorage para fallback offline
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            return tasks;
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            
            // Em caso de erro, tentar carregar do localStorage
            const localTasks = localStorage.getItem('tasks');
            return localTasks ? JSON.parse(localTasks) : [];
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
     * @returns {Promise<boolean>} true se excluída com sucesso
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
                
                return true;
            }
            
            // Excluir tarefa no banco de dados
            await window.dbManager.deleteTask(taskId);
            
            // Atualizar cache local
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const filteredTasks = localTasks.filter(t => t.id !== taskId);
            
            localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            
            return true;
        } catch (error) {
            console.error(`Erro ao excluir tarefa ${taskId}:`, error);
            
            // Em caso de erro, tentar excluir apenas localmente
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const filteredTasks = localTasks.filter(t => t.id !== taskId);
            
            localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            
            return true;
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
        
        if (uiTask.date) {
            // Se temos data e hora separadas, combinar
            if (uiTask.startTime) {
                const [startHours, startMinutes] = uiTask.startTime.split(':');
                startDate = new Date(uiTask.date);
                startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
            }
            
            if (uiTask.endTime) {
                const [endHours, endMinutes] = uiTask.endTime.split(':');
                endDate = new Date(uiTask.date);
                endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
            }
        }
        
        // Se não temos data/hora formatadas, usar as originais
        if (!startDate && uiTask.start_date) {
            startDate = new Date(uiTask.start_date);
        }
        
        if (!endDate && uiTask.end_date) {
            endDate = new Date(uiTask.end_date);
        }
        
        // Converter assigned_to para formato adequado (array para string ou JSONB)
        let assignedTo = uiTask.assignedTo;
        if (Array.isArray(assignedTo)) {
            assignedTo = assignedTo.length > 0 ? assignedTo[0] : null;
        }
        
        return {
            title: uiTask.title,
            description: uiTask.description || '',
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString(),
            status: uiTask.completed ? 'concluida' : 'pendente',
            priority: uiTask.priority || 'normal',
            technician_id: uiTask.technicianId || null,
            created_by: uiTask.createdBy || null,
            assigned_to: assignedTo,
            operacao: uiTask.operacao || null,
            color: uiTask.color || '#3788d8',
            repeat_pattern: uiTask.repeatPattern ? JSON.stringify(uiTask.repeatPattern) : null,
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
        
        if (dbTask.start_date) {
            const startDate = new Date(dbTask.start_date);
            date = startDate.toISOString().split('T')[0];
            startTime = startDate.toTimeString().substr(0, 5);
        }
        
        if (dbTask.end_date) {
            const endDate = new Date(dbTask.end_date);
            if (!date) {
                date = endDate.toISOString().split('T')[0];
            }
            endTime = endDate.toTimeString().substr(0, 5);
        }
        
        // Converter repeat_pattern, location e attachments de volta para objetos
        let repeatPattern = null;
        let location = null;
        let attachments = null;
        
        try {
            if (dbTask.repeat_pattern) {
                repeatPattern = typeof dbTask.repeat_pattern === 'string' 
                    ? JSON.parse(dbTask.repeat_pattern) 
                    : dbTask.repeat_pattern;
            }
            
            if (dbTask.location) {
                location = typeof dbTask.location === 'string' 
                    ? JSON.parse(dbTask.location) 
                    : dbTask.location;
            }
            
            if (dbTask.attachments) {
                attachments = typeof dbTask.attachments === 'string' 
                    ? JSON.parse(dbTask.attachments) 
                    : dbTask.attachments;
            }
        } catch (error) {
            console.error('Erro ao converter campos JSON:', error);
        }
        
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description || '',
            date: date,
            startTime: startTime,
            endTime: endTime,
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
            updated_at: dbTask.updated_at
        };
    }
};

// Exportar a API de tarefas para uso global
window.TasksAPI = TasksAPI; 