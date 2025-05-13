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

async function testConnection() {
    console.log('Testando conexão com o banco de dados PostgreSQL...');
    
    try {
        const client = await pool.connect();
        console.log('Conexão estabelecida com sucesso!');
        
        const result = await client.query('SELECT NOW() as time');
        console.log('Resposta do banco de dados:', result.rows[0]);
        
        console.log('Verificando tabelas existentes...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        
        if (tables.rows.length === 0) {
            console.log('Nenhuma tabela encontrada no banco de dados.');
        } else {
            console.log('Tabelas encontradas:');
            tables.rows.forEach(row => {
                console.log(`- ${row.table_name}`);
            });
        }
        
        client.release();
        console.log('Teste concluído com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } finally {
        // Encerrar o pool
        await pool.end();
    }
}

// Executar o teste
testConnection(); 