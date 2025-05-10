/**
 * Função para atualizar estatísticas usando o Supabase
 */
async function atualizarEstatisticas() {
    try {
        // Verificar se o supabaseService está disponível
        if (!window.supabaseService) {
            console.error('supabaseService não está disponível');
            return;
        }
        
        // Obter usuário atual
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            console.warn('Usuário não autenticado em atualizarEstatisticas');
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
        
        // Aplicar filtro de operação se necessário
        const filtro = {};
        const podeVerTodasOperacoes = Auth.hasPermission(currentUser, Auth.PERMISSIONS.VIEW_BY_OPERATION);
        if (!podeVerTodasOperacoes && currentUser.operacao) {
            filtro.operacao = currentUser.operacao;
        }
        
        // Buscar estatísticas do Supabase
        const estatisticas = await window.supabaseService.calcularEstatisticas(filtro);
        
        // Atualizar elementos na interface
        totalTecnicos.textContent = estatisticas.totalTecnicos || 0;
        totalVeiculos.textContent = estatisticas.totalVeiculos || 0;
        totalCidades.textContent = estatisticas.totalCidades || 0;
        
        // Atualizar estatísticas por operação se disponíveis
        const bjfibraCount = document.getElementById("bjfibraCount");
        const megalinkCount = document.getElementById("megalinkCount");
        const bjfibraVeiculosCount = document.getElementById("bjfibraVeiculosCount");
        const megalinkVeiculosCount = document.getElementById("megalinkVeiculosCount");
        
        if (bjfibraCount) bjfibraCount.textContent = estatisticas.bjfibraCount || 0;
        if (megalinkCount) megalinkCount.textContent = estatisticas.megalinkCount || 0;
        if (bjfibraVeiculosCount) bjfibraVeiculosCount.textContent = estatisticas.bjfibraVeiculosCount || 0;
        if (megalinkVeiculosCount) megalinkVeiculosCount.textContent = estatisticas.megalinkVeiculosCount || 0;
        
        console.log('Estatísticas atualizadas com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// Expor a função globalmente
window.atualizarEstatisticas = atualizarEstatisticas; 