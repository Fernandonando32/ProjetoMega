// Funções para gerenciamento de registros no localStorage

// Função para carregar registros do localStorage e/ou do servidor
async function carregarRegistros(forcarLocal = false) {
    // Inicializar array global de registros se não existir
    if (!window.registros) {
        window.registros = [];
    }
    
    // Se não estamos forçando apenas local, tentar carregar do banco primeiro
    if (!forcarLocal && typeof window.carregarDoBanco === 'function') {
        try {
            console.log('Tentando carregar registros do banco de dados...');
            const result = await window.carregarDoBanco();
            
            if (result.success && Array.isArray(result.registros) && result.registros.length > 0) {
                // Atualizar registros globais e localStorage com dados do banco
                window.registros = result.registros;
                localStorage.setItem('registrosFTTH', JSON.stringify(window.registros));
                
                console.log(`Carregados ${window.registros.length} registros do banco de dados.`);
                return window.registros;
            } else {
                console.log('Nenhum registro encontrado no banco de dados ou erro ao conectar, verificando localStorage...');
            }
        } catch (error) {
            console.error('Erro ao carregar do banco, usando localStorage como fallback:', error);
        }
    }
    
    // Fallback: carregar do localStorage se não conseguiu carregar do banco
    const dados = localStorage.getItem('registrosFTTH');
    if (dados) {
        try {
            window.registros = JSON.parse(dados);
            console.log(`Carregados ${window.registros.length} registros do localStorage.`);
        } catch (e) {
            console.error('Erro ao carregar registros do localStorage:', e);
            window.registros = [];
        }
    } else {
        console.log('Nenhum registro encontrado no localStorage.');
        window.registros = [];
    }
    
    return window.registros;
}

// Função para salvar registros no localStorage
function salvarRegistros() {
    localStorage.setItem('registrosFTTH', JSON.stringify(window.registros));
    console.log(`Salvos ${window.registros.length} registros no localStorage.`);
    
    // Se existir a função para salvar no banco, chamar também
    if (typeof window.salvarNoBanco === 'function') {
        try {
            // Chamar assincronamente para não bloquear
            setTimeout(async () => {
                await window.salvarNoBanco(window.registros, 'auto_save');
            }, 100);
        } catch (error) {
            console.error('Erro ao salvar no banco (em segundo plano):', error);
        }
    }
    
    return true;
}

// Exportar funções como globais
window.carregarRegistros = carregarRegistros;
window.salvarRegistros = salvarRegistros; 