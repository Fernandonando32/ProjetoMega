const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    try {
        // Configuração do banco de dados
        const pool = new Pool({
            host: '187.62.153.52',
            port: 6432,
            database: 'acompanhamento_ftth',
            user: 'ftth',
            password: 'ftth@123.'
        });

        console.log('Conectado ao banco de dados. Verificando usuário admin...');

        // Verificar se o usuário admin existe
        const checkResult = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
        
        // Senha simples para teste
        const newPassword = '123456';
        const passwordHash = await bcrypt.hash(newPassword, 10);
        
        if (checkResult.rows.length > 0) {
            // Atualizar a senha do usuário admin existente
            const userId = checkResult.rows[0].id;
            
            await pool.query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [passwordHash, userId]
            );
            
            console.log(`Senha do usuário admin foi redefinida para: ${newPassword}`);
        } else {
            // Criar um novo usuário admin
            const result = await pool.query(
                `INSERT INTO users 
                (username, email, password_hash, full_name, role, permissions, is_active, created_at, updated_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
                RETURNING id`,
                [
                    'admin',
                    'admin@system.com',
                    passwordHash,
                    'Administrador do Sistema',
                    'ADMIN',
                    JSON.stringify([
                        'manage_users', 'view_tasks', 'create_tasks', 'edit_tasks', 
                        'delete_tasks', 'complete_tasks', 'view_completed', 
                        'view_technicians', 'add_technician', 'edit_technician', 
                        'delete_technician', 'view_statistics', 'view_map', 
                        'view_maintenance', 'add_maintenance', 'edit_maintenance', 
                        'delete_maintenance', 'view_by_operation'
                    ]),
                    true
                ]
            );
            
            console.log(`Novo usuário admin criado com senha: ${newPassword}`);
        }
        
        console.log('Operação concluída com sucesso!');
        await pool.end();
        
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
    }
}

// Executar a função
resetAdminPassword(); 