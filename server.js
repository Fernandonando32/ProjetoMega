const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const exceljs = require('exceljs');
const csv = require('fast-csv');

// Configuração do aplicativo Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Importar rotas para tarefas
const tasksRoutes = require('./api-tasks');

// Registrar as rotas de tarefas
app.use('/api', tasksRoutes);

// Configuração do PostgreSQL
const pool = new Pool({
    host: '187.62.153.52',
    port: 6432,
    database: 'acompanhamento_ftth',
    user: 'ftth',
    password: 'ftth@123.',
    ssl: false
});

// Segredo para JWT
const JWT_SECRET = 'ftth_secret_key_2023';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Rota de teste de saúde
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        
        res.json({ 
            status: 'online', 
            database: 'connected', 
            timestamp: result.rows[0].now 
        });
    } catch (error) {
        console.error('Erro ao verificar saúde do sistema:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
});

// Rota de autenticação
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nome de usuário e senha são obrigatórios' 
        });
    }
    
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );
        
        if (result.rows.length === 0) {
            client.release();
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado ou inativo' 
            });
        }
        
        const user = result.rows[0];
        
        // Verificar senha com bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            client.release();
            return res.status(401).json({ 
                success: false, 
                message: 'Senha incorreta' 
            });
        }
        
        // Atualizar último login
        await client.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        client.release();
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Remover a senha do objeto de resposta
        delete user.password_hash;
        
        return res.json({
            success: true,
            token,
            user
        });
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro no servidor: ' + error.message 
        });
    }
});

// Rotas de API para usuários
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
        client.release();
        
        // Remover password_hash dos resultados
        const users = result.rows.map(user => {
            const { password_hash, ...userData } = user;
            return userData;
        });
        
        res.json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/count', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) FROM users');
        client.release();
        
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Erro ao contar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query(
            'SELECT * FROM users WHERE id = $1',
            [req.params.id]
        );
        client.release();
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Remover password_hash do resultado
        const { password_hash, ...userData } = result.rows[0];
        
        res.json(userData);
    } catch (error) {
        console.error(`Erro ao buscar usuário ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    const { username, email, full_name, password, role, permissions, operacao } = req.body;
    
    if (!username || !email || !full_name || !password || !role) {
        return res.status(400).json({ 
            error: 'Campos obrigatórios não fornecidos' 
        });
    }
    
    try {
        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);
        
        const client = await pool.connect();
        
        // Verificar se o usuário já existe
        const checkResult = await client.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (checkResult.rows.length > 0) {
            client.release();
            return res.status(409).json({ error: 'Nome de usuário ou e-mail já existe' });
        }
        
        // Inserir o novo usuário
        const result = await client.query(
            `INSERT INTO users 
            (username, email, password_hash, full_name, role, permissions, operacao, is_active, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
            RETURNING *`,
            [username, email, passwordHash, full_name, role, permissions || null, operacao, true]
        );
        
        client.release();
        
        // Remover password_hash do resultado
        const { password_hash: _, ...newUser } = result.rows[0];
        
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const { full_name, email, role, permissions, operacao, password, is_active } = req.body;
    
    try {
        const client = await pool.connect();
        
        // Verificar se o usuário existe
        const checkResult = await client.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (checkResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Construir a consulta dinâmica
        let query = 'UPDATE users SET ';
        const queryParams = [];
        const queryFields = [];
        
        if (full_name) {
            queryParams.push(full_name);
            queryFields.push(`full_name = $${queryParams.length}`);
        }
        
        if (email) {
            queryParams.push(email);
            queryFields.push(`email = $${queryParams.length}`);
        }
        
        if (role) {
            queryParams.push(role);
            queryFields.push(`role = $${queryParams.length}`);
        }
        
        if (permissions) {
            queryParams.push(permissions);
            queryFields.push(`permissions = $${queryParams.length}`);
        }
        
        if (operacao !== undefined) {
            queryParams.push(operacao);
            queryFields.push(`operacao = $${queryParams.length}`);
        }
        
        if (is_active !== undefined) {
            queryParams.push(is_active);
            queryFields.push(`is_active = $${queryParams.length}`);
        }
        
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            queryParams.push(passwordHash);
            queryFields.push(`password_hash = $${queryParams.length}`);
        }
        
        // Adicionar campo updated_at
        queryParams.push(new Date());
        queryFields.push(`updated_at = $${queryParams.length}`);
        
        // Adicionar ID do usuário
        queryParams.push(userId);
        
        query += queryFields.join(', ') + ` WHERE id = $${queryParams.length} RETURNING *`;
        
        // Executar a consulta
        const result = await client.query(query, queryParams);
        client.release();
        
        // Remover password_hash do resultado
        const { password_hash, ...updatedUser } = result.rows[0];
        
        res.json(updatedUser);
    } catch (error) {
        console.error(`Erro ao atualizar usuário ${userId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const client = await pool.connect();
        
        // Verificar se o usuário existe
        const checkResult = await client.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (checkResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Excluir o usuário
        await client.query(
            'DELETE FROM users WHERE id = $1',
            [userId]
        );
        
        client.release();
        
        res.json({ success: true });
    } catch (error) {
        console.error(`Erro ao excluir usuário ${userId}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de exportação
app.get('/api/export/users', authenticateToken, async (req, res) => {
    try {
        // Verificar permissões do usuário
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Permissão negada' });
        }
        
        const format = req.query.format || 'xlsx';
        const client = await pool.connect();
        
        // Buscar dados
        const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
        client.release();
        
        // Remover password_hash dos resultados
        const users = result.rows.map(user => {
            const { password_hash, ...userData } = user;
            return userData;
        });
        
        // Exportar no formato adequado
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="usuarios.csv"');
            
            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);
            users.forEach(user => csvStream.write(user));
            csvStream.end();
            
        } else if (format === 'xlsx') {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Usuários');
            
            // Definir cabeçalhos
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 36 },
                { header: 'Nome Completo', key: 'full_name', width: 30 },
                { header: 'Nome de Usuário', key: 'username', width: 20 },
                { header: 'E-mail', key: 'email', width: 30 },
                { header: 'Nível de Acesso', key: 'role', width: 15 },
                { header: 'Operação', key: 'operacao', width: 15 },
                { header: 'Ativo', key: 'is_active', width: 10 },
                { header: 'Último Acesso', key: 'last_login', width: 20 },
                { header: 'Data de Criação', key: 'created_at', width: 20 }
            ];
            
            // Adicionar dados
            worksheet.addRows(users);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="usuarios.xlsx"');
            
            await workbook.xlsx.write(res);
            
        } else {
            res.json(users);
        }
    } catch (error) {
        console.error('Erro ao exportar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para salvar registros FTTH
app.post('/api', async (req, res) => {
    const action = req.query.action;
    
    // Verificar se a ação é salvar registros FTTH
    if (action === 'salvar-ftth-registros') {
        try {
            const { registros, tipo, usuario } = req.body;
            
            // Validar dados
            if (!registros || !Array.isArray(registros)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Formato inválido: registros deve ser um array' 
                });
            }
            
            // Preparar registros para inserção no banco
            const client = await pool.connect();
            
            try {
                // Iniciar transação
                await client.query('BEGIN');
                
                // Verificar se a tabela existe, caso contrário, criá-la
                await client.query(`
                    CREATE TABLE IF NOT EXISTS ftth_registros (
                        id SERIAL PRIMARY KEY,
                        cidade VARCHAR(100),
                        tecnico VARCHAR(100),
                        auxiliar VARCHAR(100),
                        placa VARCHAR(20),
                        modelo VARCHAR(50),
                        operacao VARCHAR(50),
                        equipes VARCHAR(100),
                        km_atual VARCHAR(20),
                        ultima_troca_oleo VARCHAR(50),
                        renavam VARCHAR(50),
                        lat VARCHAR(20),
                        lng VARCHAR(20),
                        observacoes TEXT,
                        data_inicio_contrato DATE,
                        usuario_id VARCHAR(50),
                        tipo_operacao VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Inserir registros
                let registrosInseridos = 0;
                
                for (const reg of registros) {
                    const result = await client.query(`
                        INSERT INTO ftth_registros 
                        (cidade, tecnico, auxiliar, placa, modelo, operacao, equipes, 
                         km_atual, ultima_troca_oleo, renavam, lat, lng, observacoes, 
                         data_inicio_contrato, usuario_id, tipo_operacao)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                        RETURNING id
                    `, [
                        reg.cidade || '',
                        reg.tecnico || '',
                        reg.auxiliar || '',
                        reg.placa || '',
                        reg.modelo || '',
                        reg.operacao || '',
                        reg.equipes || '',
                        reg.kmAtual || '',
                        reg.ultimaTrocaOleo || '',
                        reg.renavam || '',
                        reg.lat || '',
                        reg.lng || '',
                        reg.observacoes || '',
                        reg.dataInicioContrato || null,
                        usuario || null,
                        tipo || 'manual'
                    ]);
                    
                    registrosInseridos++;
                }
                
                // Confirmar transação
                await client.query('COMMIT');
                
                return res.json({
                    success: true,
                    message: `${registrosInseridos} registros salvos com sucesso no banco de dados`,
                    total: registrosInseridos
                });
                
            } catch (error) {
                // Reverter em caso de erro
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Erro ao salvar registros FTTH:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao salvar registros no banco de dados',
                error: error.message
            });
        }
    } else {
        // Se a ação não for reconhecida
        return res.status(404).json({
            success: false,
            message: 'Ação não reconhecida'
        });
    }
});

// Rota para carregar registros FTTH
app.get('/api', async (req, res) => {
    const action = req.query.action;
    
    // Verificar se a ação é carregar registros FTTH
    if (action === 'carregar-ftth-registros') {
        try {
            // Extrair parâmetros de consulta para filtragem
            const { cidade, tecnico, operacao, placa, auxiliar, limit, offset } = req.query;
            
            // Preparar consulta
            let whereConditions = [];
            let queryParams = [];
            let whereClause = '';
            
            // Adicionar condições de filtro, se fornecidas
            if (cidade) {
                queryParams.push(`%${cidade}%`);
                whereConditions.push(`LOWER(cidade) LIKE LOWER($${queryParams.length})`);
            }
            
            if (tecnico) {
                queryParams.push(`%${tecnico}%`);
                whereConditions.push(`LOWER(tecnico) LIKE LOWER($${queryParams.length})`);
            }
            
            if (operacao) {
                queryParams.push(operacao);
                whereConditions.push(`operacao = $${queryParams.length}`);
            }
            
            if (placa) {
                queryParams.push(`%${placa}%`);
                whereConditions.push(`LOWER(placa) LIKE LOWER($${queryParams.length})`);
            }
            
            if (auxiliar) {
                queryParams.push(`%${auxiliar}%`);
                whereConditions.push(`LOWER(auxiliar) LIKE LOWER($${queryParams.length})`);
            }
            
            // Construir cláusula WHERE se existirem condições
            if (whereConditions.length > 0) {
                whereClause = 'WHERE ' + whereConditions.join(' AND ');
            }
            
            // Configurar paginação
            const limitValue = limit ? parseInt(limit) : 100;
            const offsetValue = offset ? parseInt(offset) : 0;
            
            // Adicionar parâmetros de paginação
            queryParams.push(limitValue);
            queryParams.push(offsetValue);
            
            // Executar consulta
            const client = await pool.connect();
            
            // Verificar se a tabela existe
            const tableExists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'ftth_registros'
                );
            `);
            
            if (!tableExists.rows[0].exists) {
                // Se a tabela não existir, criar a tabela antes de continuar
                await client.query(`
                    CREATE TABLE IF NOT EXISTS ftth_registros (
                        id SERIAL PRIMARY KEY,
                        cidade VARCHAR(100),
                        tecnico VARCHAR(100),
                        auxiliar VARCHAR(100),
                        placa VARCHAR(20),
                        modelo VARCHAR(50),
                        operacao VARCHAR(50),
                        equipes VARCHAR(100),
                        km_atual VARCHAR(20),
                        ultima_troca_oleo VARCHAR(50),
                        renavam VARCHAR(50),
                        lat VARCHAR(20),
                        lng VARCHAR(20),
                        observacoes TEXT,
                        data_inicio_contrato DATE,
                        usuario_id VARCHAR(50),
                        tipo_operacao VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                client.release();
                
                // Retornar array vazio já que a tabela acabou de ser criada
                return res.json({
                    success: true,
                    message: 'Nenhum registro encontrado',
                    registros: [],
                    total: 0
                });
            }
            
            // Consultar total de registros que correspondem ao filtro
            const countQuery = `SELECT COUNT(*) FROM ftth_registros ${whereClause}`;
            const countResult = await client.query(countQuery, queryParams.slice(0, queryParams.length - 2));
            const total = parseInt(countResult.rows[0].count);
            
            // Consultar registros com paginação
            const query = `
                SELECT * FROM ftth_registros 
                ${whereClause} 
                ORDER BY created_at DESC 
                LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
            `;
            
            const result = await client.query(query, queryParams);
            client.release();
            
            // Converter dados do banco para o formato esperado pelo frontend
            const registros = result.rows.map(row => ({
                id: row.id,
                cidade: row.cidade,
                tecnico: row.tecnico,
                auxiliar: row.auxiliar,
                placa: row.placa,
                modelo: row.modelo,
                operacao: row.operacao,
                equipes: row.equipes,
                kmAtual: row.km_atual,
                ultimaTrocaOleo: row.ultima_troca_oleo,
                renavam: row.renavam,
                lat: row.lat,
                lng: row.lng,
                observacoes: row.observacoes,
                dataInicioContrato: row.data_inicio_contrato,
                // Outras propriedades conforme necessário
                dataCriacao: row.created_at,
                dataAtualizacao: row.updated_at
            }));
            
            return res.json({
                success: true,
                message: `${registros.length} registros encontrados`,
                registros,
                total,
                limit: limitValue,
                offset: offsetValue
            });
            
        } catch (error) {
            console.error('Erro ao carregar registros FTTH:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao carregar registros do banco de dados',
                error: error.message
            });
        }
    } else {
        // Se a ação não for reconhecida
        return res.status(404).json({
            success: false,
            message: 'Ação não reconhecida'
        });
    }
});

// Função para inicializar o banco de dados
async function initializeDatabase() {
    try {
        console.log('Verificando tabelas do banco de dados...');
        
        const client = await pool.connect();
        
        // Verificar se a tabela de usuários existe
        const tableCheckResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        // Se a tabela não existir, executar o script de criação
        if (!tableCheckResult.rows[0].exists) {
            console.log('Tabelas não encontradas. Criando tabelas...');
            
            // Ler o script SQL do arquivo
            const sqlScriptPath = path.join(__dirname, 'sql', 'create_tables_postgres.sql');
            
            if (fs.existsSync(sqlScriptPath)) {
                const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
                
                // Executar o script SQL
                await client.query(sqlScript);
                console.log('Tabelas criadas com sucesso!');
            } else {
                console.error('Arquivo SQL não encontrado:', sqlScriptPath);
            }
        } else {
            console.log('Tabelas já existem no banco de dados.');
        }
        
        client.release();
    } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
    }
}

// Inicializar o banco de dados e depois iniciar o servidor
initializeDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${port} e acessível em todas as interfaces de rede (http://192.168.68.189:3000)`);
    });
}); 