/**
 * Utilitário de diagnóstico para o sistema de banco de dados
 * Ajuda a identificar e resolver problemas com o Supabase
 */

const DiagnosticHelper = {
    // Executa diagnóstico completo do sistema
    async runFullDiagnostic() {
        console.log('Iniciando diagnóstico completo...');
        
        const results = {
            timestamp: new Date().toISOString(),
            serverStatus: { ...window.SERVER_STATUS },
            environment: {
                isOnline: navigator.onLine,
                userAgent: navigator.userAgent,
                localStorage: this.checkLocalStorage()
            },
            supabaseStatus: await this.checkSupabaseConnection(),
            offlineQueue: this.getOfflineQueueStatus(),
            recommendations: []
        };
        
        // Adicionar recomendações com base nos resultados
        this.addRecommendations(results);
        
        console.log('Diagnóstico completo finalizado:', results);
        return results;
    },
    
    // Verifica se o localStorage está funcionando
    checkLocalStorage() {
        try {
            const testKey = '__test_storage__';
            localStorage.setItem(testKey, 'test');
            const result = localStorage.getItem(testKey) === 'test';
            localStorage.removeItem(testKey);
            return {
                working: result,
                available: true
            };
        } catch (error) {
            return {
                working: false,
                available: false,
                error: error.message
            };
        }
    },
    
    // Verifica a conexão com o Supabase
    async checkSupabaseConnection() {
        try {
            // Tenta fazer uma requisição simples para o Supabase
            const result = {
                connectionAttempted: true,
                connectionSuccessful: false,
                tableAccess: false,
                authWorking: false,
                cacheAvailable: !!window.supabaseManager?.cache?.size
            };
            
            // Verificar se o cliente existe
            if (!window.supabaseClient) {
                result.error = 'Cliente Supabase não inicializado';
                return result;
            }
            
            // Testar conexão básica
            try {
                const { error } = await window.supabaseClient.from('users').select('count').limit(1);
                result.connectionSuccessful = !error;
                result.tableAccess = !error;
                
                if (error) {
                    result.tableError = error.message;
                }
            } catch (e) {
                result.connectionError = e.message;
            }
            
            // Testar autenticação
            try {
                const { error } = await window.supabaseClient.auth.getSession();
                result.authWorking = !error;
                
                if (error) {
                    result.authError = error.message;
                }
            } catch (e) {
                result.authError = e.message;
            }
            
            return result;
        } catch (error) {
            return {
                connectionAttempted: true,
                connectionSuccessful: false,
                error: error.message
            };
        }
    },
    
    // Obtém status da fila offline
    getOfflineQueueStatus() {
        if (!window.supabaseManager?.offlineQueue) {
            return {
                available: false,
                message: 'Fila offline não disponível'
            };
        }
        
        const queue = window.supabaseManager.offlineQueue;
        
        return {
            available: true,
            count: queue.length,
            oldestOperation: queue.length > 0 ? new Date(queue[0].timestamp).toISOString() : null,
            operations: queue.map(op => ({
                type: op.type,
                table: op.table,
                timestamp: new Date(op.timestamp).toISOString()
            }))
        };
    },
    
    // Adiciona recomendações com base nos resultados do diagnóstico
    addRecommendations(results) {
        const { serverStatus, supabaseStatus, environment, offlineQueue } = results;
        
        // Problema: Servidor não acessível
        if (!serverStatus.serverReachable) {
            results.recommendations.push({
                issue: 'Servidor inacessível',
                message: 'O servidor da API não pode ser acessado. Isso pode ocorrer devido a problemas de rede ou porque o servidor está offline.',
                actions: [
                    'Verifique sua conexão com a internet',
                    'Confirme se o servidor da API está em execução',
                    'Tente novamente mais tarde'
                ],
                severity: 'alta'
            });
        }
        
        // Problema: Banco de dados conectado mas usuários não podem ser criados
        if (serverStatus.databaseConnected && !serverStatus.canCreateUser) {
            results.recommendations.push({
                issue: 'Não é possível criar usuários',
                message: 'O banco de dados está conectado, mas a criação de usuários não está funcionando. Isso pode ser devido a problemas de permissão.',
                actions: [
                    'Verifique as políticas de segurança do Supabase',
                    'Confirme se o usuário anônimo tem permissão para inserir na tabela users',
                    'Verifique se há gatilhos ou restrições impedindo a criação'
                ],
                severity: 'média'
            });
        }
        
        // Problema: Fila offline com muitas operações pendentes
        if (offlineQueue.available && offlineQueue.count > 10) {
            results.recommendations.push({
                issue: 'Muitas operações offline pendentes',
                message: `Existem ${offlineQueue.count} operações pendentes na fila offline.`,
                actions: [
                    'Tente reconectar com o servidor para sincronizar os dados',
                    'Verifique a conexão com a internet',
                    'Clique em "Sincronizar dados" na interface do administrador quando estiver online'
                ],
                severity: offlineQueue.count > 50 ? 'alta' : 'média'
            });
        }
        
        // Problema: Cache não disponível
        if (!supabaseStatus.cacheAvailable) {
            results.recommendations.push({
                issue: 'Cache de dados não disponível',
                message: 'O sistema de cache não está funcionando, o que pode afetar o desempenho offline.',
                actions: [
                    'Recarregue a página para inicializar o cache',
                    'Verifique se há erros no console'
                ],
                severity: 'baixa'
            });
        }
        
        // Adicionar recomendação geral se nenhuma específica foi adicionada
        if (results.recommendations.length === 0) {
            if (!serverStatus.serverReachable && environment.isOnline) {
                results.recommendations.push({
                    issue: 'Problema de conectividade com o servidor',
                    message: 'Você está online, mas o servidor não está acessível. O sistema continuará funcionando em modo offline.',
                    actions: [
                        'Os dados serão salvos localmente e sincronizados quando o servidor estiver disponível',
                        'Evite fechar o navegador para não perder as alterações não sincronizadas'
                    ],
                    severity: 'informativa'
                });
            }
        }
        
        return results;
    },
    
    // Tenta corrigir problemas comuns
    async attemptFixes() {
        console.log('Tentando corrigir problemas comuns...');
        
        const fixes = {
            timestamp: new Date().toISOString(),
            actionsAttempted: [],
            successful: []
        };
        
        // Tentativa 1: Reconectar com o Supabase
        fixes.actionsAttempted.push('reconnect');
        try {
            if (window.supabaseManager) {
                const reconnected = await window.supabaseManager.reconnect();
                fixes.successful.push({
                    action: 'reconnect',
                    success: reconnected
                });
            } else {
                fixes.successful.push({
                    action: 'reconnect',
                    success: false,
                    reason: 'Gerenciador Supabase não disponível'
                });
            }
        } catch (error) {
            fixes.successful.push({
                action: 'reconnect',
                success: false,
                error: error.message
            });
        }
        
        // Tentativa 2: Processar operações pendentes
        fixes.actionsAttempted.push('processPending');
        try {
            if (window.supabaseManager?.processPendingOperations) {
                await window.supabaseManager.processPendingOperations();
                fixes.successful.push({
                    action: 'processPending',
                    success: true
                });
            } else {
                fixes.successful.push({
                    action: 'processPending',
                    success: false,
                    reason: 'Função não disponível'
                });
            }
        } catch (error) {
            fixes.successful.push({
                action: 'processPending',
                success: false,
                error: error.message
            });
        }
        
        // Tentativa 3: Limpar cache para forçar recarregamento
        fixes.actionsAttempted.push('clearCache');
        try {
            if (window.supabaseManager?.clearCache) {
                window.supabaseManager.clearCache();
                fixes.successful.push({
                    action: 'clearCache',
                    success: true
                });
            } else {
                fixes.successful.push({
                    action: 'clearCache',
                    success: false,
                    reason: 'Função não disponível'
                });
            }
        } catch (error) {
            fixes.successful.push({
                action: 'clearCache',
                success: false,
                error: error.message
            });
        }
        
        // Verificar novamente o status após as tentativas de correção
        fixes.newDiagnostic = await this.runFullDiagnostic();
        
        return fixes;
    },
    
    // Exibe relatório de diagnóstico na interface
    displayDiagnosticReport(targetElementId) {
        this.runFullDiagnostic().then(results => {
            const targetElement = document.getElementById(targetElementId);
            if (!targetElement) {
                console.error(`Elemento alvo ${targetElementId} não encontrado`);
                return;
            }
            
            let html = `
                <div class="diagnostic-report">
                    <h3>Relatório de Diagnóstico</h3>
                    <p><strong>Data:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
                    
                    <div class="status-section">
                        <h4>Status do Sistema</h4>
                        <ul>
                            <li><strong>Servidor acessível:</strong> ${results.serverStatus.serverReachable ? '✅ Sim' : '❌ Não'}</li>
                            <li><strong>Banco de dados conectado:</strong> ${results.serverStatus.databaseConnected ? '✅ Sim' : '❌ Não'}</li>
                            <li><strong>Tabelas existem:</strong> ${results.serverStatus.tablesExist ? '✅ Sim' : '❌ Não'}</li>
                            <li><strong>Permissões OK:</strong> ${results.serverStatus.permissionsOk ? '✅ Sim' : '❌ Não'}</li>
                            <li><strong>Pode criar usuários:</strong> ${results.serverStatus.canCreateUser ? '✅ Sim' : '❌ Não'}</li>
                            <li><strong>Status online:</strong> ${results.environment.isOnline ? '✅ Sim' : '❌ Não'}</li>
                        </ul>
                    </div>
                    
                    <div class="recommendations-section">
                        <h4>Recomendações</h4>
                        ${results.recommendations.length > 0 
                            ? `<ul>${results.recommendations.map(rec => `
                                <li>
                                    <div class="issue ${rec.severity}">
                                        <strong>${rec.issue}</strong>
                                        <p>${rec.message}</p>
                                        <strong>Ações recomendadas:</strong>
                                        <ul>
                                            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                        </ul>
                                    </div>
                                </li>
                              `).join('')}</ul>`
                            : '<p>Nenhuma recomendação necessária no momento.</p>'
                        }
                    </div>
                    
                    ${results.offlineQueue.available && results.offlineQueue.count > 0 
                        ? `<div class="offline-queue-section">
                               <h4>Fila Offline</h4>
                               <p>Existem <strong>${results.offlineQueue.count}</strong> operações pendentes para sincronização.</p>
                               ${results.offlineQueue.count > 0 
                                   ? `<button id="syncOfflineData" class="btn-primary">Sincronizar Dados</button>` 
                                   : ''}
                           </div>` 
                        : ''}
                    
                    <div class="actions-section">
                        <h4>Ações</h4>
                        <button id="attemptFixesBtn" class="btn-primary">Tentar Corrigir Problemas</button>
                        <button id="refreshDiagnosticBtn" class="btn-secondary">Atualizar Diagnóstico</button>
                    </div>
                </div>
            `;
            
            targetElement.innerHTML = html;
            
            // Adicionar event listeners para os botões
            document.getElementById('attemptFixesBtn').addEventListener('click', async () => {
                // Mostrar mensagem de carregamento
                targetElement.innerHTML = '<p>Tentando corrigir problemas... Aguarde.</p>';
                
                const fixes = await this.attemptFixes();
                this.displayDiagnosticReport(targetElementId);
                
                // Informar sobre as correções tentadas
                alert(`${fixes.successful.filter(f => f.success).length} de ${fixes.actionsAttempted.length} correções foram aplicadas com sucesso.`);
            });
            
            document.getElementById('refreshDiagnosticBtn').addEventListener('click', () => {
                targetElement.innerHTML = '<p>Atualizando diagnóstico... Aguarde.</p>';
                this.displayDiagnosticReport(targetElementId);
            });
            
            // Configurar botão de sincronização se existir
            const syncBtn = document.getElementById('syncOfflineData');
            if (syncBtn) {
                syncBtn.addEventListener('click', async () => {
                    if (window.supabaseManager?.processPendingOperations) {
                        targetElement.innerHTML = '<p>Sincronizando dados... Aguarde.</p>';
                        await window.supabaseManager.processPendingOperations();
                        this.displayDiagnosticReport(targetElementId);
                        alert('Sincronização concluída!');
                    } else {
                        alert('Não foi possível acessar o gerenciador de sincronização.');
                    }
                });
            }
        });
    }
};

// Disponibilizar globalmente
window.DiagnosticHelper = DiagnosticHelper; 