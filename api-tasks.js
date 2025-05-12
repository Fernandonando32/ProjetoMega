const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Configuração do PostgreSQL
const pool = new Pool({
    host: '187.62.153.52',
    port: 6432,
    database: 'acompanhamento_ftth',
    user: 'ftth',
    password: 'ftth@123.',
    ssl: false
});

// Middleware para verificar se a tabela tasks existe
async function ensureTasksTableExists(req, res, next) {
    try {
        const client = await pool.connect();
        
        // Verificar se a tabela tasks existe
        const tableCheckResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'tasks'
            );
        `);
        
        // Se a tabela não existir, criar
        if (!tableCheckResult.rows[0].exists) {
            console.log('Tabela tasks não encontrada. Criando...');
            
            await client.query(`
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
                
                CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
                CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
                CREATE INDEX IF NOT EXISTS idx_tasks_technician ON tasks(technician_id);
                CREATE INDEX IF NOT EXISTS idx_tasks_operacao ON tasks(operacao);
            `);
            
            console.log('Tabela tasks criada com sucesso.');
        }
        
        client.release();
        next();
    } catch (error) {
        console.error('Erro ao verificar/criar tabela tasks:', error);
        res.status(500).json({ error: 'Erro interno ao verificar tabela' });
    }
}

// Obter todas as tarefas
router.get('/tasks', ensureTasksTableExists, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM tasks ORDER BY start_date ASC');
        client.release();
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obter uma tarefa por ID
router.get('/tasks/:id', ensureTasksTableExists, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM tasks WHERE id = $1',
            [req.params.id]
        );
        client.release();
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar tarefa ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Criar uma nova tarefa
router.post('/tasks', ensureTasksTableExists, async (req, res) => {
    const { 
        title, description, start_date, end_date, status, priority,
        technician_id, created_by, assigned_to, operacao, color,
        repeat_pattern, location, attachments
    } = req.body;
    
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ 
            error: 'Os campos título, data de início e data de término são obrigatórios' 
        });
    }
    
    try {
        const client = await pool.connect();
        
        // Inserir a nova tarefa
        const result = await client.query(
            `INSERT INTO tasks 
            (title, description, start_date, end_date, status, priority, 
            technician_id, created_by, assigned_to, operacao, color,
            repeat_pattern, location, attachments, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) 
            RETURNING *`,
            [
                title, description, start_date, end_date, 
                status || 'pendente', priority || 'normal',
                technician_id, created_by, assigned_to, operacao, color,
                repeat_pattern, location, attachments
            ]
        );
        
        client.release();
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ error: error.message });
    }
});

// Atualizar uma tarefa existente
router.put('/tasks/:id', ensureTasksTableExists, async (req, res) => {
    const taskId = req.params.id;
    const { 
        title, description, start_date, end_date, status, priority,
        technician_id, created_by, assigned_to, operacao, color,
        repeat_pattern, location, attachments
    } = req.body;
    
    try {
        const client = await pool.connect();
        
        // Verificar se a tarefa existe
        const checkResult = await client.query(
            'SELECT id FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (checkResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        
        // Construir a consulta dinâmica
        let query = 'UPDATE tasks SET ';
        const queryParams = [];
        const queryFields = [];
        
        if (title) {
            queryParams.push(title);
            queryFields.push(`title = $${queryParams.length}`);
        }
        
        if (description !== undefined) {
            queryParams.push(description);
            queryFields.push(`description = $${queryParams.length}`);
        }
        
        if (start_date) {
            queryParams.push(start_date);
            queryFields.push(`start_date = $${queryParams.length}`);
        }
        
        if (end_date) {
            queryParams.push(end_date);
            queryFields.push(`end_date = $${queryParams.length}`);
        }
        
        if (status) {
            queryParams.push(status);
            queryFields.push(`status = $${queryParams.length}`);
        }
        
        if (priority) {
            queryParams.push(priority);
            queryFields.push(`priority = $${queryParams.length}`);
        }
        
        if (technician_id !== undefined) {
            queryParams.push(technician_id);
            queryFields.push(`technician_id = $${queryParams.length}`);
        }
        
        if (created_by !== undefined) {
            queryParams.push(created_by);
            queryFields.push(`created_by = $${queryParams.length}`);
        }
        
        if (assigned_to !== undefined) {
            queryParams.push(assigned_to);
            queryFields.push(`assigned_to = $${queryParams.length}`);
        }
        
        if (operacao !== undefined) {
            queryParams.push(operacao);
            queryFields.push(`operacao = $${queryParams.length}`);
        }
        
        if (color !== undefined) {
            queryParams.push(color);
            queryFields.push(`color = $${queryParams.length}`);
        }
        
        if (repeat_pattern !== undefined) {
            queryParams.push(repeat_pattern);
            queryFields.push(`repeat_pattern = $${queryParams.length}`);
        }
        
        if (location !== undefined) {
            queryParams.push(location);
            queryFields.push(`location = $${queryParams.length}`);
        }
        
        if (attachments !== undefined) {
            queryParams.push(attachments);
            queryFields.push(`attachments = $${queryParams.length}`);
        }
        
        // Adicionar campo updated_at
        queryParams.push(new Date());
        queryFields.push(`updated_at = $${queryParams.length}`);
        
        // Adicionar ID da tarefa
        queryParams.push(taskId);
        
        query += queryFields.join(', ') + ` WHERE id = $${queryParams.length} RETURNING *`;
        
        // Executar a consulta
        const result = await client.query(query, queryParams);
        client.release();
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(`Erro ao atualizar tarefa ${taskId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Excluir uma tarefa
router.delete('/tasks/:id', ensureTasksTableExists, async (req, res) => {
    const taskId = req.params.id;
    
    try {
        const client = await pool.connect();
        
        // Verificar se a tarefa existe
        const checkResult = await client.query(
            'SELECT id FROM tasks WHERE id = $1',
            [taskId]
        );
        
        if (checkResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Tarefa não encontrada' });
        }
        
        // Excluir a tarefa
        await client.query(
            'DELETE FROM tasks WHERE id = $1',
            [taskId]
        );
        
        client.release();
        
        res.json({ success: true });
    } catch (error) {
        console.error(`Erro ao excluir tarefa ${taskId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 