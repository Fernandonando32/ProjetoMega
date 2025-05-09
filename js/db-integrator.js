/**
 * Módulo que integra a interface do Pagina1 (1).html com o banco de dados Supabase
 * Implementa funções para substituir o localStorage com armazenamento persistente
 */

// Array global para armazenar os registros em memória
let registros = [];

/**
 * Inicializa a integração com o banco de dados
 * Deve ser chamada no carregamento da página
 */
async function inicializarBancoDados() {
    try {
        // Exibir mensagem de carregamento
        const tbody = document.querySelector("#tabelaRegistros tbody");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="15" style="text-align: center; padding: 20px;">Conectando ao banco de dados...</td></tr>';
        }
        
        // Inicializar o Supabase
        await supabaseDB.init();
        console.log('Banco de dados inicializado com sucesso');
        
        // Carregar os registros
        await carregarRegistrosDB();
        
        return true;
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        
        // Exibir erro na tabela
        const tbody = document.querySelector("#tabelaRegistros tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; padding: 20px; color: red;">
                Erro ao conectar com o banco de dados: ${error.message || 'Falha de conexão'}
            </td></tr>`;
        }
        
        return false;
    }
}

/**
 * Carrega os registros do banco de dados
 * @param {Object} filtros - Filtros opcionais a aplicar
 * @returns {Promise<Array>} - Registros carregados
 */
async function carregarRegistrosDB(filtros = {}) {
    try {
        // Verificar autenticação
        if (!window.Auth) {
            console.error('Auth não disponível ao carregar registros');
            return [];
        }
        
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            console.warn('Usuário não autenticado ao carregar registros');
            return [];
        }
        
        // Aplicar filtro de operação se necessário
        const podeVerTodasOperacoes = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
        if (!podeVerTodasOperacoes && currentUser.operacao) {
            filtros.operacao = currentUser.operacao;
        }
        
        // Exibir mensagem de carregamento
        const tbody = document.querySelector("#tabelaRegistros tbody");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="15" style="text-align: center; padding: 20px;">Carregando registros...</td></tr>';
        }
        
        // Carregar do banco de dados
        registros = await supabaseDB.carregarRegistros(filtros);
        console.log(`Carregados ${registros.length} registros do banco de dados`);
        
        // Renderizar interface
        if (typeof renderTabelaFiltrada === 'function') {
            renderTabelaFiltrada(registros);
        }
        
        if (typeof atualizarEstatisticas === 'function') {
            await atualizarEstatisticas();
        }
        
        // Aplicar ajustes de permissões
        if (typeof ajustarPermissoes === 'function') {
            setTimeout(ajustarPermissoes, 100);
        }
        
        return registros;
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        
        // Exibir erro na tabela
        const tbody = document.querySelector("#tabelaRegistros tbody");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; padding: 20px; color: red;">
                Erro ao carregar registros: ${error.message || 'Falha na consulta ao banco de dados'}
            </td></tr>`;
        }
        
        return [];
    }
}

/**
 * Salva um registro no banco de dados
 * @param {Object} registro - Dados do registro
 * @returns {Promise<Object>} - Registro salvo
 */
async function salvarRegistroDB(registro) {
    try {
        // Salvar no banco
        const registroSalvo = await supabaseDB.salvarRegistro(registro);
        console.log('Registro salvo com sucesso:', registroSalvo);
        
        // Atualizar a lista em memória
        if (registro.id) {
            // Atualização - substituir o registro existente
            const index = registros.findIndex(r => r.id === registro.id);
            if (index !== -1) {
                registros[index] = registroSalvo;
            }
        } else {
            // Novo registro - adicionar ao início da lista
            registros.unshift(registroSalvo);
        }
        
        // Atualizar a interface
        if (typeof renderTabelaFiltrada === 'function') {
            renderTabelaFiltrada(registros);
        }
        
        if (typeof atualizarEstatisticas === 'function') {
            await atualizarEstatisticas();
        }
        
        return registroSalvo;
    } catch (error) {
        console.error('Erro ao salvar registro:', error);
        alert(`Erro ao salvar registro: ${error.message || 'Falha na conexão com o banco de dados'}`);
        throw error;
    }
}

/**
 * Remove um registro do banco de dados
 * @param {number} id - ID do registro a excluir
 * @returns {Promise<boolean>} - Sucesso da operação
 */
async function excluirRegistroDB(id) {
    try {
        // Excluir do banco
        const sucesso = await supabaseDB.excluirRegistro(id);
        
        if (sucesso) {
            console.log(`Registro ${id} excluído com sucesso`);
            
            // Remover da lista em memória
            const index = registros.findIndex(r => r.id === id);
            if (index !== -1) {
                registros.splice(index, 1);
            }
            
            // Atualizar a interface
            if (typeof renderTabelaFiltrada === 'function') {
                renderTabelaFiltrada(registros);
            }
            
            if (typeof atualizarEstatisticas === 'function') {
                await atualizarEstatisticas();
            }
            
            return true;
        } else {
            console.error(`Falha ao excluir registro ${id}`);
            return false;
        }
    } catch (error) {
        console.error('Erro ao excluir registro:', error);
        alert(`Erro ao excluir registro: ${error.message || 'Falha na conexão com o banco de dados'}`);
        return false;
    }
}

/**
 * Adiciona uma manutenção a um registro
 * @param {number} registroId - ID do registro
 * @param {Object} manutencao - Dados da manutenção
 * @returns {Promise<Object>} - Manutenção adicionada
 */
async function adicionarManutencaoDB(registroId, manutencao) {
    try {
        // Salvar no banco
        const manutencaoSalva = await supabaseDB.adicionarManutencao(registroId, manutencao);
        console.log('Manutenção adicionada com sucesso:', manutencaoSalva);
        
        // Atualizar na lista em memória
        const registro = registros.find(r => r.id === registroId);
        if (registro) {
            if (!registro.manutencoes) {
                registro.manutencoes = [];
            }
            registro.manutencoes.push(manutencaoSalva);
        }
        
        // Atualizar a tabela
        if (typeof renderTabelaFiltrada === 'function') {
            renderTabelaFiltrada(registros);
        }
        
        return manutencaoSalva;
    } catch (error) {
        console.error('Erro ao adicionar manutenção:', error);
        alert(`Erro ao adicionar manutenção: ${error.message || 'Falha na conexão com o banco de dados'}`);
        throw error;
    }
}

/**
 * Registra uma importação de CSV
 * @param {Object} importacao - Dados da importação
 * @returns {Promise<Object>} - Importação registrada
 */
async function registrarImportacaoCSVDB(importacao) {
    try {
        // Salvar no banco
        const importacaoSalva = await supabaseDB.registrarImportacaoCSV(importacao);
        console.log('Importação CSV registrada com sucesso:', importacaoSalva);
        return importacaoSalva;
    } catch (error) {
        console.error('Erro ao registrar importação CSV:', error);
        return null;
    }
}

/**
 * Calcula estatísticas atualizadas do sistema
 * @param {Object} filtros - Filtros a aplicar
 * @returns {Promise<Object>} - Estatísticas calculadas
 */
async function calcularEstatisticasDB(filtros = {}) {
    try {
        // Verificar autenticação
        if (!window.Auth) {
            console.error('Auth não disponível ao calcular estatísticas');
            return null;
        }
        
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            console.warn('Usuário não autenticado ao calcular estatísticas');
            return null;
        }
        
        // Aplicar filtro de operação se necessário
        const podeVerTodasOperacoes = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
        if (!podeVerTodasOperacoes && currentUser.operacao) {
            filtros.operacao = currentUser.operacao;
        }
        
        // Calcular estatísticas no banco
        const estatisticas = await supabaseDB.calcularEstatisticas(filtros);
        console.log('Estatísticas calculadas com sucesso:', estatisticas);
        return estatisticas;
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        return null;
    }
}

/**
 * Atualiza os elementos de estatísticas na interface
 * Substitui a função original atualizarEstatisticas
 */
async function atualizarEstatisticasDB() {
    try {
        // Verificar se Auth está disponível
        if (!window.Auth) {
            console.error('Auth não disponível em atualizarEstatisticasDB');
            return;
        }
        
        // Obter usuário atual
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            console.warn('Usuário não autenticado em atualizarEstatisticasDB');
            return;
        }
        
        // Verificar se os elementos de estatísticas existem
        const totalTecnicos = document.getElementById("totalTecnicos");
        const totalVeiculos = document.getElementById("totalVeiculos");
        const totalCidades = document.getElementById("totalCidades");
        
        if (!totalTecnicos || !totalVeiculos || !totalCidades) {
            console.error('Elementos de estatísticas não encontrados');
            return;
        }
        
        // Filtros baseados nas permissões
        const filtros = {};
        const podeVerTodasOperacoes = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
        if (!podeVerTodasOperacoes && currentUser.operacao) {
            filtros.operacao = currentUser.operacao;
        }
        
        // Buscar estatísticas do Supabase
        const estatisticas = await calcularEstatisticasDB(filtros);
        if (!estatisticas) return;
        
        // Atualizar elementos na interface
        totalTecnicos.textContent = estatisticas.totalTecnicos;
        totalVeiculos.textContent = estatisticas.totalVeiculos;
        totalCidades.textContent = estatisticas.totalCidades;
        
        // Atualizar estatísticas por operação
        const bjfibraContainer = document.getElementById("bjfibraContainer");
        const megalinkContainer = document.getElementById("megalinkContainer");
        const bjfibraVeiculosContainer = document.getElementById("bjfibraVeiculosContainer");
        const megalinkVeiculosContainer = document.getElementById("megalinkVeiculosContainer");
        const bjfibraCount = document.getElementById("bjfibraCount");
        const megalinkCount = document.getElementById("megalinkCount");
        const bjfibraVeiculosCount = document.getElementById("bjfibraVeiculosCount");
        const megalinkVeiculosCount = document.getElementById("megalinkVeiculosCount");
        
        if (bjfibraCount) bjfibraCount.textContent = estatisticas.bjfibraCount;
        if (megalinkCount) megalinkCount.textContent = estatisticas.megalinkCount;
        if (bjfibraVeiculosCount) bjfibraVeiculosCount.textContent = estatisticas.bjfibraVeiculosCount;
        if (megalinkVeiculosCount) megalinkVeiculosCount.textContent = estatisticas.megalinkVeiculosCount;
        
        // Mostrar/ocultar contadores por operação com base nas permissões
        if (!podeVerTodasOperacoes && currentUser.operacao) {
            // Se o usuário só pode ver uma operação, mostrar apenas a sua
            if (bjfibraContainer) bjfibraContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
            if (megalinkContainer) megalinkContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
            if (bjfibraVeiculosContainer) bjfibraVeiculosContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
            if (megalinkVeiculosContainer) megalinkVeiculosContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
        } else {
            // Se pode ver todas, mostrar ambas
            if (bjfibraContainer) bjfibraContainer.style.display = "block";
            if (megalinkContainer) megalinkContainer.style.display = "block";
            if (bjfibraVeiculosContainer) bjfibraVeiculosContainer.style.display = "block";
            if (megalinkVeiculosContainer) megalinkVeiculosContainer.style.display = "block";
        }
        
        console.log('Estatísticas atualizadas com sucesso via banco de dados');
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Exportar funções para uso global
window.inicializarBancoDados = inicializarBancoDados;
window.carregarRegistrosDB = carregarRegistrosDB;
window.salvarRegistroDB = salvarRegistroDB;
window.excluirRegistroDB = excluirRegistroDB;
window.adicionarManutencaoDB = adicionarManutencaoDB;
window.registrarImportacaoCSVDB = registrarImportacaoCSVDB;
window.calcularEstatisticasDB = calcularEstatisticasDB;
window.atualizarEstatisticasDB = atualizarEstatisticasDB; 