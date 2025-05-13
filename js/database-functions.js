// Funções para gerenciamento de registros no localStorage

// Função para carregar registros do localStorage
function carregarRegistros() {
    const dados = localStorage.getItem('registrosFTTH');
    if (dados) {
        try {
            window.registros = JSON.parse(dados);
            console.log(`Carregados ${window.registros.length} registros do localStorage.`);
        } catch (e) {
            console.error('Erro ao carregar registros:', e);
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
    return true;
}

// Exportar funções como globais
window.carregarRegistros = carregarRegistros;
window.salvarRegistros = salvarRegistros; 