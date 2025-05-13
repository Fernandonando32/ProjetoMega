// Funções para gerenciamento de registros no localStorage

// Função para carregar registros do localStorage e/ou do servidor
async function carregarRegistros(forcarLocal = false) {
    // Inicializar array global de registros se não existir
    if (!window.registros) {
        window.registros = [];
    }
    
    console.log('Iniciando carregamento de registros...');
    
    // Verificar configuração para decidir se carrega do banco
    const carregarDoBancoDesabilitado = window.CONFIGS_FTTH && 
                                        window.CONFIGS_FTTH.CARREGAR_DO_BANCO_AO_INICIAR === false;
    
    // Se estiver configurado para não carregar do banco, forçar carregamento local
    if (carregarDoBancoDesabilitado) {
        console.log('Carregamento do banco desabilitado por configuração. Usando apenas localStorage.');
        forcarLocal = true;
    }
    
    // Se não estamos forçando apenas local, tentar carregar do banco primeiro
    if (!forcarLocal) {
        try {
            console.log('Tentando carregar registros do banco de dados...');
            
            // Verificar se a função carregarDoBanco está disponível
            if (typeof window.carregarDoBanco === 'function') {
                const result = await window.carregarDoBanco();
                
                if (result.success && Array.isArray(result.registros) && result.registros.length > 0) {
                    // Atualizar registros globais com dados do banco
                    console.log(`Carregados ${result.registros.length} registros do banco de dados.`);
                    window.registros = result.registros;
                    
                    try {
                        // Atualizar o localStorage apenas com registros mais recentes para evitar exceder quota
                        // Limitar para os últimos 100 registros para economizar espaço
                        const MAX_LOCAL_REGISTROS = 100;
                        const registrosParaSalvar = window.registros.slice(0, MAX_LOCAL_REGISTROS);
                        
                        console.log(`Salvando ${registrosParaSalvar.length} registros no localStorage para backup local (limitado para evitar erro de quota).`);
                        localStorage.setItem('registrosFTTH', JSON.stringify(registrosParaSalvar));
                        localStorage.setItem('ftth_total_registros', window.registros.length.toString());
                        console.log('Dados do banco parcialmente sincronizados com localStorage para backup.');
                    } catch (storageError) {
                        console.warn('Não foi possível salvar no localStorage devido a limite de quota:', storageError);
                        // Tentar limpar o localStorage e salvar apenas informação mínima
                        try {
                            localStorage.removeItem('registrosFTTH');
                            localStorage.setItem('ftth_total_registros', window.registros.length.toString());
                            localStorage.setItem('ftth_dados_no_banco', 'true');
                            console.log('Limpei localStorage e salvei apenas metadados dos registros');
                        } catch (e) {
                            console.error('Falha ao limpar localStorage:', e);
                        }
                    }
                    
                    return window.registros;
                } else {
                    console.log(`Nenhum registro encontrado no banco de dados ou erro: ${result.message || 'sem detalhes'}. Verificando localStorage...`);
                }
            } else {
                console.warn('Função carregarDoBanco não disponível. Verificando localStorage...');
            }
        } catch (error) {
            console.error('Erro ao carregar do banco, usando localStorage como fallback:', error);
        }
    } else {
        console.log('Carregamento forçado de localStorage solicitado, ignorando banco de dados.');
    }
    
    // Fallback: carregar do localStorage se não conseguiu carregar do banco
    const dados = localStorage.getItem('registrosFTTH');
    if (dados) {
        try {
            window.registros = JSON.parse(dados);
            console.log(`Carregados ${window.registros.length} registros do localStorage.`);
            
            // Verificar se tem mais registros no banco do que no localStorage
            const totalRegistros = parseInt(localStorage.getItem('ftth_total_registros') || '0');
            if (totalRegistros > window.registros.length) {
                console.warn(`Atenção: há ${totalRegistros} registros no banco, mas apenas ${window.registros.length} no localStorage. Use o banco de dados para acesso completo.`);
            }
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
    console.log(`Salvando registros. Origem: ${origem}, Apenas Local: ${apenasLocal}, Registros: ${window.registros ? window.registros.length : 0}`);
    
    // Verificar se registros está inicializado
    if (!window.registros) {
        console.error('Array de registros não inicializado');
        return {
            localStorage: false,
            banco: false,
            error: 'Array de registros não inicializado'
        };
    }
    
    // Primeiro, tentar salvar no localStorage (de forma limitada para evitar erro de quota)
    try {
        // Salvar apenas os primeiros registros para evitar exceder a quota
        const MAX_LOCAL_REGISTROS = 100;
        const registrosParaSalvar = window.registros.slice(0, MAX_LOCAL_REGISTROS);
        
        localStorage.setItem('registrosFTTH', JSON.stringify(registrosParaSalvar));
        localStorage.setItem('ftth_total_registros', window.registros.length.toString());
        console.log(`Salvos ${registrosParaSalvar.length} registros no localStorage (de um total de ${window.registros.length}).`);
    } catch (storageError) {
        console.warn('Erro ao salvar no localStorage devido a limite de quota:', storageError);
        // Tentar limpar e salvar apenas metadados
        try {
            localStorage.removeItem('registrosFTTH');
            localStorage.setItem('ftth_total_registros', window.registros.length.toString());
            localStorage.setItem('ftth_dados_no_banco', 'true');
            console.log('Limpei localStorage e salvei apenas metadados dos registros');
        } catch (e) {
            console.error('Falha ao limpar localStorage:', e);
        }
    }
    
    // Se for para salvar apenas localmente, retornar aqui
    if (apenasLocal) {
        return {
            localStorage: true,
            banco: false,
            motivo: 'Configurado para salvar apenas localmente'
        };
    }
    
    // Se a origem não for manual ou explicitamente aprovada, não salvar no banco
    const origensPermitidas = window.CONFIGS_FTTH?.ORIGENS_PERMITIDAS || 
                              ['manual', 'user_action', 'import_csv', 'csv_import'];
    const salvarNoBanco = origensPermitidas.includes(origem);
    
    // Registrar para debug
    console.log(`Origem '${origem}' ${salvarNoBanco ? 'permitida' : 'não permitida'} para salvamento no banco`);
    
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