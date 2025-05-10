/**
 * Ferramenta de Diagnóstico de Banco de Dados
 * Fornece funcionalidades para verificar e corrigir problemas de conexão
 */

const DiagnosticHelper = {
    /**
     * Executa um diagnóstico completo do banco de dados
     * @returns {Promise<Object>} Resultado do diagnóstico
     */
    async runDiagnostic() {
        try {
            // Usar a função de diagnóstico do Auth
            const diagnostic = await Auth.runDatabaseDiagnostic();
            
            // Verificar status do cache
            diagnostic.cacheWorking = this.checkCacheStatus();
            
            return diagnostic;
        } catch (error) {
            console.error('Erro ao executar diagnóstico:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    /**
     * Verifica o status do cache
     * @returns {boolean} true se o cache está funcionando, false caso contrário
     */
    checkCacheStatus() {
        if (!window.supabaseManager) {
            return false;
        }
        
        return window.supabaseManager.isCacheWorking();
    },
    
    /**
     * Exibe o relatório de diagnóstico na interface
     * @param {string} containerId - ID do elemento para exibir o relatório
     */
    async displayDiagnosticReport(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Contêiner não encontrado:', containerId);
            return;
        }
        
        // Mostrar indicador de carregamento
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                <p style="margin-top: 10px;">Executando diagnóstico...</p>
            </div>
        `;
        
        // Executar diagnóstico
        const diagnostic = await this.runDiagnostic();
        const date = new Date(diagnostic.timestamp || Date.now());
        
        // Formatar data
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Montar o relatório
        const statusChecks = [
            { label: 'Servidor acessível', status: diagnostic.serverReachable },
            { label: 'Banco de dados conectado', status: diagnostic.databaseConnected },
            { label: 'Tabelas existem', status: diagnostic.tablesExist },
            { label: 'Permissões OK', status: diagnostic.permissionsOk },
            { label: 'Pode criar usuários', status: diagnostic.canCreateUser },
            { label: 'Status online', status: diagnostic.environment?.isOnline },
            { label: 'Cache funcionando', status: diagnostic.cacheWorking }
        ];
        
        // Gerar recomendações
        const recommendations = this.generateRecommendations(diagnostic);
        
        // Construir HTML do relatório
        let html = `
            <h3 style="margin-bottom: 15px;">Relatório de Diagnóstico</h3>
            <p style="margin-bottom: 15px;"><strong>Data:</strong> ${formattedDate}</p>
            
            <h4 style="margin-bottom: 10px;">Status do Sistema</h4>
            <div style="margin-bottom: 20px;">
                ${statusChecks.map(check => `
                    <div style="margin-bottom: 5px;">${check.label}: 
                        ${check.status 
                            ? '<span style="color: #27ae60;">✅ Sim</span>' 
                            : '<span style="color: #c0392b;">❌ Não</span>'
                        }
                    </div>
                `).join('')}
            </div>
        `;
        
        // Adicionar recomendações se houver
        if (recommendations.length > 0) {
            html += `
                <h4 style="margin-bottom: 10px;">Recomendações</h4>
                <div>
                    ${recommendations.map(rec => `
                        <div style="margin-bottom: 15px;">
                            <strong>${rec.title}</strong>
                            <p style="margin-top: 5px;">${rec.description}</p>
                            ${rec.actions ? `
                                <p style="margin-top: 5px;"><strong>Ações recomendadas:</strong></p>
                                <ul style="margin-top: 5px; padding-left: 20px;">
                                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Exibir o relatório
        container.innerHTML = html;
    },
    
    /**
     * Gera recomendações com base no diagnóstico
     * @param {Object} diagnostic - Resultado do diagnóstico
     * @returns {Array} Lista de recomendações
     */
    generateRecommendations(diagnostic) {
        const recommendations = [];
        
        // Problema de conexão com o servidor
        if (!diagnostic.serverReachable) {
            recommendations.push({
                title: 'Servidor não acessível',
                description: 'O sistema não consegue se conectar ao servidor Supabase.',
                actions: [
                    'Verifique sua conexão com a internet',
                    'Confirme se a URL do Supabase está correta',
                    'Verifique se o projeto Supabase está ativo'
                ]
            });
        }
        
        // Problema de criação de usuários
        if (diagnostic.databaseConnected && !diagnostic.canCreateUser) {
            recommendations.push({
                title: 'Não é possível criar usuários',
                description: 'O banco de dados está conectado, mas a criação de usuários não está funcionando. Isso pode ser devido a problemas de permissão.',
                actions: [
                    'Verifique as políticas de segurança do Supabase',
                    'Confirme se o usuário anônimo tem permissão para inserir na tabela users',
                    'Verifique se há gatilhos ou restrições impedindo a criação'
                ]
            });
        }
        
        // Problema com o cache
        if (!diagnostic.cacheWorking) {
            recommendations.push({
                title: 'Cache de dados não disponível',
                description: 'O sistema de cache não está funcionando, o que pode afetar o desempenho offline.',
                actions: [
                    'Recarregue a página para inicializar o cache',
                    'Verifique se há erros no console',
                    'Certifique-se que o localStorage está habilitado no navegador'
                ]
            });
        }
        
        return recommendations;
    },
    
    /**
     * Tenta corrigir automaticamente os problemas encontrados
     * @returns {Promise<Object>} Resultado das correções
     */
    async attemptFixes() {
        const result = {
            actionsAttempted: [],
            successful: []
        };
        
        // 1. Tentar reconectar ao servidor
        if (!window.SERVER_STATUS.serverReachable) {
            result.actionsAttempted.push({
                action: 'Reconexão ao servidor',
                description: 'Tentando estabelecer conexão com o servidor Supabase'
            });
            
            try {
                // Tentar reconectar
                const reconnectResult = await window.supabaseManager.reconnect();
                result.successful.push({
                    action: 'Reconexão ao servidor',
                    success: reconnectResult,
                    message: reconnectResult 
                        ? 'Conexão reestabelecida com sucesso' 
                        : 'Falha ao reestabelecer conexão'
                });
            } catch (error) {
                result.successful.push({
                    action: 'Reconexão ao servidor',
                    success: false,
                    message: `Erro: ${error.message}`
                });
            }
        }
        
        // 2. Reinicializar o cache
        if (!this.checkCacheStatus()) {
            result.actionsAttempted.push({
                action: 'Inicialização do cache',
                description: 'Tentando inicializar o sistema de cache'
            });
            
            try {
                // Tentar inicializar o cache
                window.supabaseManager.initializeCache();
                const cacheStatus = this.checkCacheStatus();
                
                result.successful.push({
                    action: 'Inicialização do cache',
                    success: cacheStatus,
                    message: cacheStatus 
                        ? 'Cache inicializado com sucesso' 
                        : 'Falha ao inicializar o cache'
                });
            } catch (error) {
                result.successful.push({
                    action: 'Inicialização do cache',
                    success: false,
                    message: `Erro: ${error.message}`
                });
            }
        }
        
        // 3. Tentar processar operações pendentes
        if (window.supabaseManager && window.supabaseManager.offlineQueue.length > 0) {
            result.actionsAttempted.push({
                action: 'Sincronização de operações',
                description: 'Tentando sincronizar operações pendentes'
            });
            
            try {
                // Tentar processar operações pendentes
                await window.supabaseManager.processPendingOperations();
                
                // Verificar se ainda há operações pendentes
                const pendingCount = window.supabaseManager.offlineQueue.length;
                
                result.successful.push({
                    action: 'Sincronização de operações',
                    success: pendingCount === 0,
                    message: pendingCount === 0 
                        ? 'Todas as operações foram sincronizadas' 
                        : `Ainda há ${pendingCount} operações pendentes`
                });
            } catch (error) {
                result.successful.push({
                    action: 'Sincronização de operações',
                    success: false,
                    message: `Erro: ${error.message}`
                });
            }
        }
        
        return result;
    }
};

// Exportar para uso global
window.DiagnosticHelper = DiagnosticHelper;
