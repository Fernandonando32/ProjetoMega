/**
 * Gerenciador de Sincronização
 * Responsável por sincronizar dados entre armazenamento local e o servidor
 */

const SyncManager = {
    /**
     * Status da sincronização atual
     */
    status: {
        isSynchronizing: false,
        lastSyncTime: null,
        syncInProgress: false,
        queueSize: 0,
        errors: []
    },

    /**
     * Inicializa o gerenciador de sincronização
     */
    init() {
        console.log('Inicializando gerenciador de sincronização...');
        
        // Verificar status inicial
        this.checkSyncStatus();
        
        // Configurar eventos para sincronização automática
        window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
        
        // Programar verificações periódicas
        this.schedulePeriodicSync();
        
        console.log('Gerenciador de sincronização inicializado.');
        return this;
    },
    
    /**
     * Verifica o status atual da sincronização
     */
    checkSyncStatus() {
        if (!window.supabaseManager || !window.UserAPI) {
            console.warn('Componentes necessários não disponíveis para sincronização.');
            return;
        }
        
        const offlineQueue = window.UserAPI.getOfflineQueueStatus();
        this.status.queueSize = offlineQueue.count || 0;
        
        // Verificar se há operações pendentes
        if (this.status.queueSize > 0) {
            this.notifySyncNeeded();
        }
        
        // Atualizar status
        document.dispatchEvent(new CustomEvent('sync-status-updated', {
            detail: this.status
        }));
    },
    
    /**
     * Manipula mudanças no status de conexão
     */
    async handleOnlineStatusChange(event) {
        if (navigator.onLine) {
            console.log('Conexão recuperada. Verificando necessidade de sincronização...');
            
            // Verificar se há operações pendentes
            const offlineQueue = window.UserAPI.getOfflineQueueStatus();
            if (offlineQueue.count > 0) {
                console.log(`Há ${offlineQueue.count} operações pendentes. Iniciando sincronização automática...`);
                await this.syncData();
            }
        } else {
            console.log('Conexão perdida. Operações serão armazenadas localmente.');
        }
    },
    
    /**
     * Programa verificações periódicas de sincronização
     */
    schedulePeriodicSync() {
        // Verificar a cada 5 minutos
        setInterval(() => {
            if (navigator.onLine && !this.status.syncInProgress) {
                this.checkSyncStatus();
            }
        }, 5 * 60 * 1000);
    },
    
    /**
     * Notifica que há dados para sincronizar
     */
    notifySyncNeeded() {
        if (!window.NotificationSystem) {
            return;
        }
        
        // Mostrar notificação para o usuário
        window.NotificationSystem.showInfo(
            'Sincronização pendente',
            `Há ${this.status.queueSize} operações aguardando sincronização.`,
            {
                action: {
                    text: 'Sincronizar agora',
                    callback: () => this.syncData()
                }
            }
        );
        
        // Disparar evento para a interface
        document.dispatchEvent(new CustomEvent('sync-needed', {
            detail: {
                queueSize: this.status.queueSize
            }
        }));
    },
    
    /**
     * Sincroniza dados com o servidor
     */
    async syncData() {
        if (this.status.syncInProgress) {
            console.log('Sincronização já em andamento...');
            return {
                success: false,
                message: 'Sincronização já em andamento'
            };
        }
        
        if (!window.UserAPI) {
            console.error('API de usuários não disponível.');
            return {
                success: false,
                message: 'API de usuários não disponível'
            };
        }
        
        try {
            this.status.syncInProgress = true;
            this.status.isSynchronizing = true;
            
            // Notificar início da sincronização
            document.dispatchEvent(new CustomEvent('sync-started'));
            
            // Executar sincronização
            const result = await window.UserAPI.syncOfflineQueue();
            
            // Atualizar status
            this.status.lastSyncTime = new Date();
            this.status.isSynchronizing = false;
            this.status.syncInProgress = false;
            
            // Verificar novamente o status
            this.checkSyncStatus();
            
            // Notificar conclusão
            document.dispatchEvent(new CustomEvent('sync-completed', {
                detail: result
            }));
            
            return result;
        } catch (error) {
            console.error('Erro durante sincronização:', error);
            
            // Adicionar erro ao histórico
            this.status.errors.push({
                timestamp: new Date(),
                message: error.message,
                error
            });
            
            // Limitar histórico a 10 erros
            if (this.status.errors.length > 10) {
                this.status.errors.shift();
            }
            
            // Atualizar status
            this.status.isSynchronizing = false;
            this.status.syncInProgress = false;
            
            // Notificar erro
            document.dispatchEvent(new CustomEvent('sync-error', {
                detail: {
                    error,
                    message: error.message
                }
            }));
            
            return {
                success: false,
                message: `Erro durante sincronização: ${error.message}`,
                error
            };
        }
    },
    
    /**
     * Força sincronização imediata
     */
    async forceSyncNow() {
        if (!navigator.onLine) {
            return {
                success: false,
                message: 'Sem conexão com a internet'
            };
        }
        
        return await this.syncData();
    },
    
    /**
     * Retorna o status atual de sincronização
     */
    getSyncStatus() {
        return {
            ...this.status,
            isOnline: navigator.onLine,
            offlineQueueStatus: window.UserAPI?.getOfflineQueueStatus() || { count: 0 }
        };
    }
};

// Inicializar automaticamente e expor globalmente
window.SyncManager = SyncManager;
document.addEventListener('DOMContentLoaded', () => SyncManager.init()); 