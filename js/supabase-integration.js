/**
 * Integração do Sistema FTTH com Supabase
 * Este script substitui funções nativas da página Pagina1 (1).html
 * para usar o banco de dados Supabase em vez de localStorage
 */

(function() {
    // Garantir que o script execute apenas uma vez
    if (window.supabaseIntegrationInitialized) return;
    window.supabaseIntegrationInitialized = true;
    
    console.log('Inicializando integração com Supabase...');
    
    // Carregar os scripts necessários dinamicamente
    loadScript('js/supabase-db.js')
        .then(() => loadScript('js/db-integrator.js'))
        .then(() => {
            console.log('Scripts do Supabase carregados com sucesso');
            // Substituir as funções originais pelas novas versões
            patchFunctions();
            // Inicializar o banco de dados
            if (typeof window.inicializarBancoDados === 'function') {
                window.inicializarBancoDados();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar scripts do Supabase:', error);
        });
    
    // Função para carregar um script dinamicamente
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Falha ao carregar o script: ${src}`));
            document.head.appendChild(script);
        });
    }
    
    // Substituir funções originais pelas versões do banco de dados
    function patchFunctions() {
        console.log('Substituindo funções para usar banco de dados Supabase...');
        
        // Backup das funções originais
        window.originalFunctions = {
            atualizarEstatisticas: window.atualizarEstatisticas,
            renderizarTabela: window.renderizarTabela,
            carregarRegistros: window.carregarRegistros,
            salvarRegistros: window.salvarRegistros,
            importCSVData: window.importCSVData
        };
        
        // Substituir atualizarEstatisticas
        window.atualizarEstatisticas = function() {
            if (typeof window.atualizarEstatisticasDB === 'function') {
                return window.atualizarEstatisticasDB();
            } else {
                console.warn('Função atualizarEstatisticasDB não disponível, usando implementação original');
                return window.originalFunctions.atualizarEstatisticas.apply(this, arguments);
            }
        };
        
        // Substituir renderizarTabela
        window.renderizarTabela = async function() {
            console.log('Renderizando tabela usando banco de dados...');
            
            // Verificar Auth e usuário
            if (!window.Auth) {
                console.error('Auth não disponível. Tentando novamente em 500ms...');
                setTimeout(window.renderizarTabela, 500);
                return;
            }
            
            const currentUser = window.Auth.getCurrentUser();
            if (!currentUser) {
                console.warn('Usuário não autenticado. Redirecionando para login...');
                window.location.href = 'login.html';
                return;
            }
            
            // Carregar registros do banco de dados
            if (typeof window.carregarRegistrosDB === 'function') {
                try {
                    await window.carregarRegistrosDB();
                } catch (error) {
                    console.error('Erro ao carregar registros do banco:', error);
                    // Fallback para implementação original
                    window.originalFunctions.renderizarTabela.apply(this, arguments);
                }
            } else {
                // Fallback para implementação original
                window.originalFunctions.renderizarTabela.apply(this, arguments);
            }
        };
        
        // Manter o alias para renderTabela
        window.renderTabela = window.renderizarTabela;
        
        // Modificar formulário de registro para usar o banco
        patchRegistroForm();
        
        // Modificar importação de CSV para usar o banco
        patchCSVImporter();
        
        console.log('Funções substituídas com sucesso');
    }
    
    // Substituir o comportamento do formulário de registro
    function patchRegistroForm() {
        document.addEventListener('DOMContentLoaded', () => {
            const registroForm = document.getElementById('registroForm');
            if (!registroForm) {
                console.warn('Formulário de registro não encontrado');
                return;
            }
            
            console.log('Modificando formulário de registro para usar banco de dados...');
            
            // Substituir o manipulador de evento de envio
            registroForm.onsubmit = async function(e) {
                e.preventDefault();
                
                // Verificar autenticação
                if (!window.Auth || !window.Auth.getCurrentUser()) {
                    alert('Você precisa estar autenticado para adicionar registros.');
                    return;
                }
                
                // Verificar permissão
                const currentUser = window.Auth.getCurrentUser();
                if (!window.Auth.hasPermission(currentUser, window.Auth.PERMISSIONS.ADD_TECHNICIAN)) {
                    alert('Você não tem permissão para adicionar registros.');
                    return;
                }
                
                // Coletar dados do formulário
                const registro = {
                    cidade: document.getElementById("cidade").value.trim().toUpperCase(),
                    tecnico: document.getElementById("tecnico").value.trim().toUpperCase(),
                    auxiliar: document.getElementById("auxiliar").value.trim().toUpperCase(),
                    placa: document.getElementById("placa").value.trim().toUpperCase(),
                    modelo: document.getElementById("modelo").value.trim().toUpperCase(),
                    operacao: document.getElementById("operacao").value,
                    equipes: document.getElementById("equipes").value.trim().toUpperCase(),
                    kmAtual: document.getElementById("kmAtual").value.trim().toUpperCase(),
                    ultimaTrocaOleo: '', // Campo somente leitura
                    renavam: document.getElementById("renavam").value.trim().toUpperCase(),
                    lat: document.getElementById("lat").value.trim(),
                    lng: document.getElementById("lng").value.trim(),
                    observacoes: document.getElementById("observacoes").value.trim().toUpperCase(),
                    dataInicioContrato: document.getElementById("dataInicioContrato").value,
                    manutencoes: []
                };
                
                // Adicionar ID se estiver editando
                if (window.editIndex !== null && window.registros[window.editIndex]) {
                    registro.id = window.registros[window.editIndex].id;
                }
                
                try {
                    // Usar Supabase se disponível
                    if (typeof window.salvarRegistroDB === 'function') {
                        await window.salvarRegistroDB(registro);
                    } else {
                        // Fallback para localStorage
                        if (window.editIndex === null) {
                            window.registros.push(registro);
                        } else {
                            window.registros[window.editIndex] = registro;
                            window.editIndex = null;
                        }
                        
                        if (typeof window.originalFunctions.salvarRegistros === 'function') {
                            window.originalFunctions.salvarRegistros();
                        }
                        
                        if (typeof window.originalFunctions.renderizarTabela === 'function') {
                            window.originalFunctions.renderizarTabela();
                        }
                    }
                    
                    // Limpar formulário e botão
                    this.reset();
                    const btnSalvar = document.getElementById("btnSalvar");
                    if (btnSalvar) btnSalvar.textContent = "Adicionar";
                    
                } catch (error) {
                    console.error('Erro ao salvar registro:', error);
                    alert('Erro ao salvar registro: ' + (error.message || 'Falha desconhecida'));
                }
            };
            
            console.log('Formulário de registro modificado com sucesso');
        });
    }
    
    // Substituir o importador de CSV
    function patchCSVImporter() {
        window.configureCSVImporter = function() {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                console.warn('Input de arquivo CSV não encontrado');
                return;
            }
            
            console.log('Modificando importador de CSV para usar banco de dados...');
            
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const text = e.target.result;
                    await importCSVToDB(text, file.name);
                };
                reader.readAsText(file);
            });
        };
        
        // Nova função de importação que usa o banco
        async function importCSVToDB(text, fileName) {
            console.log('Importando CSV para banco de dados...');
            
            // Estatísticas de importação
            let importCount = 0;
            let duplicateCount = 0;
            let tecnicosSemVeiculoCount = 0;
            let registrosComProblema = [];
            let linhasIgnoradas = 0;
            
            // Processar o CSV
            const lines = text.split('\n');
            
            // Mostrar progresso visual
            const tbody = document.querySelector("#tabelaRegistros tbody");
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="15" style="text-align: center; padding: 20px;">Importando dados para o banco...</td></tr>';
            }
            
            // Percorrer linhas (pular cabeçalho)
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) {
                    linhasIgnoradas++;
                    continue;
                }
                
                try {
                    // Dividir os campos
                    const values = line.split(';').map(v => v.trim());
                    
                    // Valores mínimos necessários
                    const cidade = values[0];
                    const tecnico = values[1];
                    
                    if (!cidade || !tecnico) {
                        linhasIgnoradas++;
                        continue;
                    }
                    
                    // Verificar duplicação
                    const registroDuplicado = window.registros.some(r => 
                        r.tecnico.toUpperCase() === tecnico.toUpperCase() && 
                        r.cidade.toUpperCase() === cidade.toUpperCase()
                    );
                    
                    if (registroDuplicado) {
                        duplicateCount++;
                        continue;
                    }
                    
                    // Criar objeto de registro
                    const registro = {
                        cidade: cidade.toUpperCase(),
                        tecnico: tecnico.toUpperCase(),
                        auxiliar: (values[2] || '').toUpperCase(),
                        placa: (values[3] || '').toUpperCase(),
                        modelo: (values[4] || '').toUpperCase(),
                        operacao: values[5] || 'Megalink',
                        equipes: (values[6] || '').toUpperCase(),
                        kmAtual: values[7] || '',
                        ultimaTrocaOleo: values[8] || '',
                        lat: values[9] ? values[9].replace('lat:', '').trim() : '',
                        lng: values[10] ? values[10].replace('"""lng"":', '').replace('}"', '').trim() : '',
                        renavam: (values[11] || '').toUpperCase(),
                        observacoes: (values[12] || '').toUpperCase(),
                        dataInicioContrato: values[13] || null,
                        manutencoes: []
                    };
                    
                    // Verificar se tem veículo
                    if (!registro.placa) {
                        tecnicosSemVeiculoCount++;
                    }
                    
                    // Salvar no banco ou no localStorage
                    if (typeof window.salvarRegistroDB === 'function') {
                        await window.salvarRegistroDB(registro);
                    } else if (typeof window.originalFunctions.salvarRegistros === 'function') {
                        window.registros.push(registro);
                        window.originalFunctions.salvarRegistros();
                    }
                    
                    importCount++;
                } catch (error) {
                    console.error(`Erro ao processar linha ${i+1} do CSV:`, error);
                    registrosComProblema.push({
                        linha: i + 1,
                        dados: line,
                        erro: error.message || 'Erro desconhecido'
                    });
                }
            }
            
            // Registrar a importação se possível
            if (typeof window.registrarImportacaoCSVDB === 'function') {
                try {
                    await window.registrarImportacaoCSVDB({
                        nomeArquivo: fileName,
                        registrosImportados: importCount,
                        registrosDuplicados: duplicateCount,
                        registrosComProblema: registrosComProblema.length,
                        linhasIgnoradas,
                        arquivoOriginal: text
                    });
                } catch (error) {
                    console.error('Erro ao registrar importação no banco:', error);
                }
            }
            
            // Recarregar e renderizar
            if (typeof window.carregarRegistrosDB === 'function') {
                await window.carregarRegistrosDB();
            } else if (typeof window.originalFunctions.renderizarTabela === 'function') {
                window.originalFunctions.renderizarTabela();
            }
            
            // Exibir resultados
            alert(`Importação concluída!\nRegistros importados: ${importCount}\nRegistros duplicados ignorados: ${duplicateCount}\nTécnicos sem veículo: ${tecnicosSemVeiculoCount}\nLinhas ignoradas: ${linhasIgnoradas}\nRegistros com problema: ${registrosComProblema.length}`);
            
            console.log('Importação CSV finalizada');
        }
        
        // Substituir a função original
        window.importCSVData = importCSVToDB;
        
        console.log('Importador de CSV modificado com sucesso');
    }
})(); 