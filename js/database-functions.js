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
async function salvarRegistros(origem = 'auto') {
    // Verificar se o salvamento é permitido
    const apenasLocal = window.CONFIGS_FTTH && window.CONFIGS_FTTH.SALVAR_APENAS_LOCAL === true;
    
    // Registrar informação para debug
    console.log(`Salvando registros. Origem: ${origem}, Apenas Local: ${apenasLocal}, Registros: ${window.registros.length}`);
    
    // Primeiro, salvar no localStorage
    localStorage.setItem('registrosFTTH', JSON.stringify(window.registros));
    console.log(`Salvos ${window.registros.length} registros no localStorage.`);
    
    // Se for para salvar apenas localmente, retornar aqui
    if (apenasLocal) {
        return {
            localStorage: true,
            banco: false,
            motivo: 'Configurado para salvar apenas localmente'
        };
    }
    
    // Se a origem não for manual ou explicitamente aprovada, não salvar no banco
    const origensPermitidas = ['manual', 'user_action', 'import_csv'];
    const salvarNoBanco = origensPermitidas.includes(origem);
    
    // Se não for uma ação explícita do usuário, verificar hash para evitar salvamentos duplicados
    if (!salvarNoBanco && origem === 'auto') {
        const dadosHash = JSON.stringify(window.registros).length.toString();
        const ultimoSalvamento = localStorage.getItem('ultimo_salvamento_hash');
        
        if (ultimoSalvamento === dadosHash) {
            console.log('Dados sem alterações significativas, evitando salvamento no banco desnecessário');
            return {
                localStorage: true,
                banco: false,
                ignorado: true,
                message: 'Salvamento no banco ignorado - sem alterações'
            };
        }
        
        // Registrar o hash atual apenas para comparações futuras
        localStorage.setItem('ultimo_salvamento_hash', dadosHash);
    }
    
    // Se não for para salvar no banco, retornar aqui
    if (!salvarNoBanco) {
        console.log(`Não salvando no banco - origem '${origem}' não permitida para salvamento automático`);
        return {
            localStorage: true,
            banco: false,
            motivo: `Origem '${origem}' não autorizada para salvamento automático`
        };
    }
    
    // Se existir a função para salvar no banco e a origem for permitida, chamar
    if (typeof window.salvarNoBanco === 'function') {
        try {
            console.log(`Tentando salvar registros no banco de dados (origem: ${origem})...`);
            const resultado = await window.salvarNoBanco(window.registros, origem);
            
            if (resultado.success) {
                console.log('Registros salvos com sucesso no banco:', resultado);
            } else {
                console.warn('Registros salvos apenas localmente. Erro ao salvar no banco:', resultado.error);
            }
            
            return {
                localStorage: true,
                banco: resultado.success,
                resultado
            };
        } catch (error) {
            console.error('Erro ao salvar no banco:', error);
            return {
                localStorage: true,
                banco: false,
                error: error.message
            };
        }
    }
    
    return {
        localStorage: true,
        banco: false,
        motivo: 'Função salvarNoBanco não disponível'
    };
}

// Exportar funções como globais
window.carregarRegistros = carregarRegistros;
window.salvarRegistros = salvarRegistros; 