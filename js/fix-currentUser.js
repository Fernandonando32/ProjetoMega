// Arquivo de correção para problemas com referências undefined a currentUser

// Corrigir a função renderTabelaFiltrada para garantir que currentUser exista
window.renderTabelaFiltrada = function(registrosFiltrados) {
    // Garantir que currentUser esteja definido
    const currentUser = window.Auth ? Auth.getCurrentUser() : null;
    
    // Se não tivermos um usuário autenticado, apenas mostrar uma mensagem e retornar
    if (!currentUser) {
        console.warn('Usuário não autenticado ou Auth não disponível ao renderizar tabela.');
        alert('Você precisa estar autenticado para visualizar os registros. Redirecionando para a página de login...');
        window.location.href = 'login.html';
        return;
    }
    
    const tbody = document.querySelector("#tabelaRegistros tbody");
    tbody.innerHTML = "";
    
    // O restante da função permanece igual
    const podeVerPorOperacao = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
    let registrosPermitidos = registrosFiltrados;
    
    // Se o usuário não tem permissão para ver todas as operações e tem uma operação específica,
    // filtrar os registros para mostrar apenas os da sua operação
    if (!podeVerPorOperacao && currentUser.operacao) {
        registrosPermitidos = registrosFiltrados.filter(reg => reg.operacao === currentUser.operacao);
    }
    
    // Continuar com o código original da função
    if (registrosPermitidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; padding: 20px;">Nenhum registro encontrado.</td></tr>`;
        return;
    }
    
    registrosPermitidos.forEach((reg, idx) => {
        const tr = document.createElement("tr");
        
        // Mapear os campos para as células da tabela
        const fields = ["cidade", "tecnico", "auxiliar", "placa", "modelo", "operacao", "equipes", "kmAtual", "ultimaTrocaOleo", "renavam", "lat", "lng", "observacoes", "dataInicioContrato"];
        
        fields.forEach(field => {
            const td = document.createElement("td");
            if (field === 'dataInicioContrato' && reg[field]) {
                const date = new Date(reg[field]);
                td.textContent = date.toLocaleDateString('pt-BR');
            } else {
                td.textContent = reg[field] || "";
            }
            tr.appendChild(td);
        });
        
        // Célula de ações
        const tdActions = document.createElement("td");
        tdActions.className = "actions";
        tdActions.innerHTML = `
            ${Auth.hasPermission(currentUser, Auth.PERMISSIONS.EDIT_TECHNICIAN) ?
            `<button class="btnEditar" onclick="editarRegistro(${idx})">Editar</button>` : ''}
            ${Auth.hasPermission(currentUser, Auth.PERMISSIONS.DELETE_TECHNICIAN) ?
            `<button class="btnExcluir" onclick="removerRegistro(${idx})">Excluir</button>` : ''}
            <button class="btnManutencao" onclick="abrirModalManutencao(${idx})">Manutenção</button>
        `;
        tr.appendChild(tdActions);
        
        tbody.appendChild(tr);
    });
};

// Corrigir a função atualizarEstatisticas para garantir que currentUser exista
window.atualizarEstatisticas = function() {
    // Verificar se Auth está disponível
    if (!window.Auth) {
        console.error('Auth não disponível em atualizarEstatisticas');
        return;
    }
    
    // Obter usuário atual
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        console.warn('Usuário não autenticado em atualizarEstatisticas');
        return;
    }
    
    // Verificar permissão para visualizar todas operações
    const podeVerTodasOperacoes = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
    
    // Filtrar registros pela operação do usuário se necessário
    let registrosFiltrados = registros;
    if (!podeVerTodasOperacoes && currentUser.operacao) {
        registrosFiltrados = registros.filter(r => r.operacao === currentUser.operacao);
    }
    
    // O resto do código permanece igual
    // Total de técnicos (nomes únicos)
    const tecnicosUnicos = new Set(registrosFiltrados.map(r => r.tecnico.toLowerCase().trim()));
    
    // Total de auxiliares (nomes únicos)
    const auxiliaresUnicos = new Set();
    registrosFiltrados.forEach(r => {
        if (r.auxiliar && r.auxiliar.trim()) {
            auxiliaresUnicos.add(r.auxiliar.toLowerCase().trim());
        }
    });
    
    // Total de pessoal técnico (técnicos + auxiliares)
    const totalPessoalTecnico = tecnicosUnicos.size + auxiliaresUnicos.size;
    
    document.getElementById("totalTecnicos").textContent = totalPessoalTecnico;
    
    // Total de veículos (placas únicas, apenas registros com placa)
    const veiculosUnicos = new Set();
    registrosFiltrados.forEach(r => {
        if (r.placa && r.placa.trim()) {
            veiculosUnicos.add(r.placa.toUpperCase().trim());
        }
    });
    document.getElementById("totalVeiculos").textContent = veiculosUnicos.size;
    
    // Total de cidades distintas
    const cidadesUnicas = new Set(registrosFiltrados.map(r => r.cidade.toLowerCase().trim()));
    document.getElementById("totalCidades").textContent = cidadesUnicas.size;
    
    // Técnicos por operação
    const bjfibraTecnicos = new Set(registrosFiltrados.filter(r => r.operacao === "BJ Fibra").map(r => r.tecnico.toLowerCase().trim()));
    const bjfibraAuxiliares = new Set();
    registrosFiltrados.filter(r => r.operacao === "BJ Fibra").forEach(r => {
        if (r.auxiliar && r.auxiliar.trim()) {
            bjfibraAuxiliares.add(r.auxiliar.toLowerCase().trim());
        }
    });
    
    const megalinkTecnicos = new Set(registrosFiltrados.filter(r => r.operacao === "Megalink").map(r => r.tecnico.toLowerCase().trim()));
    const megalinkAuxiliares = new Set();
    registrosFiltrados.filter(r => r.operacao === "Megalink").forEach(r => {
        if (r.auxiliar && r.auxiliar.trim()) {
            megalinkAuxiliares.add(r.auxiliar.toLowerCase().trim());
        }
    });
    
    document.getElementById("bjfibraCount").textContent = bjfibraTecnicos.size + bjfibraAuxiliares.size;
    document.getElementById("megalinkCount").textContent = megalinkTecnicos.size + megalinkAuxiliares.size;
    
    // Mostrar/ocultar contadores por operação com base nas permissões
    const bjfibraContainer = document.getElementById("bjfibraContainer");
    const megalinkContainer = document.getElementById("megalinkContainer");
    const bjfibraVeiculosContainer = document.getElementById("bjfibraVeiculosContainer");
    const megalinkVeiculosContainer = document.getElementById("megalinkVeiculosContainer");
    
    if (!podeVerTodasOperacoes && currentUser.operacao) {
        // Se o usuário só pode ver uma operação, mostrar apenas a sua
        bjfibraContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
        megalinkContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
        bjfibraVeiculosContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
        megalinkVeiculosContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
    } else {
        // Se pode ver todas, mostrar ambas
        bjfibraContainer.style.display = "block";
        megalinkContainer.style.display = "block";
        bjfibraVeiculosContainer.style.display = "block";
        megalinkVeiculosContainer.style.display = "block";
    }
    
    // Veículos por operação
    const bjfibraVeiculos = new Set();
    registrosFiltrados.filter(r => r.operacao === "BJ Fibra").forEach(r => {
        if (r.placa && r.placa.trim()) {
            bjfibraVeiculos.add(r.placa.toUpperCase().trim());
        }
    });
    
    const megalinkVeiculos = new Set();
    registrosFiltrados.filter(r => r.operacao === "Megalink").forEach(r => {
        if (r.placa && r.placa.trim()) {
            megalinkVeiculos.add(r.placa.toUpperCase().trim());
        }
    });
    
    document.getElementById("bjfibraVeiculosCount").textContent = bjfibraVeiculos.size;
    document.getElementById("megalinkVeiculosCount").textContent = megalinkVeiculos.size;

    // Estatísticas por cidade
    const estatisticasPorCidade = {};
    registrosFiltrados.forEach(reg => {
        const cidade = reg.cidade.trim();
        if (!cidade) return;

        if (!estatisticasPorCidade[cidade]) {
            estatisticasPorCidade[cidade] = {
                tecnicos: new Set(),
                auxiliares: new Set(),
                veiculos: new Set(),
                veiculosComAuxiliar: new Set()
            };
        }

        if (reg.tecnico) {
            estatisticasPorCidade[cidade].tecnicos.add(reg.tecnico.toLowerCase().trim());
        }
        if (reg.auxiliar && reg.auxiliar.trim()) {
            estatisticasPorCidade[cidade].auxiliares.add(reg.auxiliar.toLowerCase().trim());
            
            // Só contador como veículo com auxiliar se tiver placa 
            if (reg.placa && reg.placa.trim()) {
                estatisticasPorCidade[cidade].veiculosComAuxiliar.add(reg.placa.toUpperCase().trim());
            }
        }
        if (reg.placa && reg.placa.trim()) {
            estatisticasPorCidade[cidade].veiculos.add(reg.placa.toUpperCase().trim());
        }
    });

    // Remover aviso anterior se existir
    const avisoAnterior = document.getElementById('avisoFiltroOperacao');
    if (avisoAnterior) {
        avisoAnterior.remove();
    }
};

// Corrigir a função renderizarTabela para garantir que Auth e currentUser existam
window.renderizarTabela = function() {
    // Verificar se Auth está disponível e se usuário está autenticado
    if (!window.Auth) {
        console.error('Auth não disponível. A autenticação pode não ter sido inicializada corretamente.');
        setTimeout(() => {
            // Tentar novamente em 500ms, dando tempo para Auth carregar
            if (window.Auth) {
                renderizarTabela();
            } else {
                console.error('Auth ainda não disponível após aguardar. Redirecionando para login.');
                window.location.href = 'login.html';
            }
        }, 500);
        return;
    }
    
    // Obter usuário atual
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        console.warn('Usuário não autenticado ao renderizar tabela.');
        window.location.href = 'login.html';
        return;
    }
    
    renderTabelaFiltrada(registros);
    atualizarEstatisticas();
    // Aplicar ajustes de permissões após renderizar a tabela
    setTimeout(ajustarPermissoes, 100);
};

// Também atualizar a função ajustarPermissoes
window.ajustarPermissoes = function() {
    // Verificar se Auth está disponível
    if (!window.Auth) {
        console.error('Auth não disponível em ajustarPermissoes');
        return;
    }
    
    // Obter usuário atual
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        console.warn('Usuário não autenticado em ajustarPermissoes');
        return;
    }
    
    const btnAdicionar = document.getElementById('btnAdicionar');
    const btnLimpar = document.getElementById('btnLimpar');
    const table = document.getElementById('tabelaRegistros');
    
    // Permissão para adicionar técnicos
    if (!Auth.hasPermission(currentUser, Auth.PERMISSIONS.ADD_TECHNICIAN)) {
        if (btnAdicionar) btnAdicionar.style.display = 'none';
        if (btnLimpar) btnLimpar.style.display = 'none';
        
        const formRegistro = document.getElementById('formRegistro');
        if (formRegistro) formRegistro.style.display = 'none';
    }
    
    // Verificar se a tabela existe
    if (!table) {
        console.warn('Tabela de registros não encontrada em ajustarPermissoes');
        return;
    }
    
    // Esconder os botões de editar e excluir para quem não tem permissão
    if (!Auth.hasPermission(currentUser, Auth.PERMISSIONS.EDIT_TECHNICIAN) && 
        !Auth.hasPermission(currentUser, Auth.PERMISSIONS.DELETE_TECHNICIAN)) {
        
        const acoes = table.querySelectorAll('.actions');
        acoes.forEach(acao => {
            acao.style.display = 'none';
        });
    }
    // Esconder apenas o botão de exclusão
    else if (!Auth.hasPermission(currentUser, Auth.PERMISSIONS.DELETE_TECHNICIAN)) {
        const botoesExcluir = table.querySelectorAll('.btnExcluir');
        botoesExcluir.forEach(btn => {
            btn.style.display = 'none';
        });
    }
    // Esconder apenas o botão de edição
    else if (!Auth.hasPermission(currentUser, Auth.PERMISSIONS.EDIT_TECHNICIAN)) {
        const botoesEditar = table.querySelectorAll('.btnEditar');
        botoesEditar.forEach(btn => {
            btn.style.display = 'none';
        });
    }
};

// Também atualizar o alias
window.renderTabela = window.renderizarTabela;

console.log("Scripts corretivos carregados com sucesso para corrigir problemas com currentUser"); 