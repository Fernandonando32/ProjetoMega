/**
 * Sistema de Notificações
 * Fornece métodos para exibir notificações ao usuário
 */

const NotificationSystem = {
    /**
     * Configurações do sistema
     */
    config: {
        autoHide: true,
        hideDelay: 5000, // 5 segundos
        container: null,
        maxNotifications: 5,
        position: 'top-right',
        sound: true
    },

    /**
     * Notificações ativas
     */
    activeNotifications: [],

    /**
     * Inicializa o sistema de notificações
     * @param {Object} options - Opções de configuração
     * @returns {NotificationSystem} Instância do sistema
     */
    init(options = {}) {
        console.log('Inicializando sistema de notificações...');
        
        // Aplicar opções
        this.config = { ...this.config, ...options };
        
        // Criar contêiner de notificações se não existir
        if (!this.config.container) {
            this.createContainer();
        }
        
        console.log('Sistema de notificações inicializado.');
        return this;
    },
    
    /**
     * Cria o contêiner para as notificações
     * @private
     */
    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container ' + this.config.position;
        
        // Definir estilos
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        container.style.width = '300px';
        
        // Posicionar de acordo com a configuração
        switch (this.config.position) {
            case 'top-right':
                container.style.top = '20px';
                container.style.right = '20px';
                break;
            case 'top-left':
                container.style.top = '20px';
                container.style.left = '20px';
                break;
            case 'bottom-right':
                container.style.bottom = '20px';
                container.style.right = '20px';
                break;
            case 'bottom-left':
                container.style.bottom = '20px';
                container.style.left = '20px';
                break;
            case 'top-center':
                container.style.top = '20px';
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
                break;
            default:
                container.style.top = '20px';
                container.style.right = '20px';
        }
        
        // Adicionar ao corpo do documento
        document.body.appendChild(container);
        this.config.container = container;
    },
    
    /**
     * Exibe uma notificação informativa
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {Object} options - Opções adicionais
     * @returns {HTMLElement} Elemento da notificação
     */
    showInfo(title, message, options = {}) {
        return this.showNotification(title, message, 'info', options);
    },
    
    /**
     * Exibe uma notificação de sucesso
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {Object} options - Opções adicionais
     * @returns {HTMLElement} Elemento da notificação
     */
    showSuccess(title, message, options = {}) {
        return this.showNotification(title, message, 'success', options);
    },
    
    /**
     * Exibe uma notificação de erro
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {Object} options - Opções adicionais
     * @returns {HTMLElement} Elemento da notificação
     */
    showError(title, message, options = {}) {
        return this.showNotification(title, message, 'error', options);
    },
    
    /**
     * Exibe uma notificação de alerta
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {Object} options - Opções adicionais
     * @returns {HTMLElement} Elemento da notificação
     */
    showWarning(title, message, options = {}) {
        return this.showNotification(title, message, 'warning', options);
    },
    
    /**
     * Método principal para exibir uma notificação
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo de notificação (info, success, error, warning)
     * @param {Object} options - Opções adicionais
     * @returns {HTMLElement} Elemento da notificação
     */
    showNotification(title, message, type = 'info', options = {}) {
        // Verificar se o contêiner existe
        if (!this.config.container) {
            this.createContainer();
        }
        
        // Limitar número de notificações
        if (this.activeNotifications.length >= this.config.maxNotifications) {
            const oldestNotification = this.activeNotifications.shift();
            this.removeNotification(oldestNotification);
        }
        
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.id = 'notification-' + Date.now();
        
        // Definir estilos
        notification.style.padding = '15px';
        notification.style.marginBottom = '10px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        notification.style.cursor = 'pointer';
        notification.style.display = 'flex';
        notification.style.flexDirection = 'column';
        
        // Definir cores de acordo com o tipo
        switch (type) {
            case 'info':
                notification.style.backgroundColor = '#3498db';
                notification.style.color = 'white';
                break;
            case 'success':
                notification.style.backgroundColor = '#2ecc71';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f39c12';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#3498db';
                notification.style.color = 'white';
        }
        
        // Adicionar título
        if (title) {
            const titleElement = document.createElement('h4');
            titleElement.style.margin = '0 0 5px 0';
            titleElement.style.padding = '0';
            titleElement.style.fontWeight = 'bold';
            titleElement.textContent = title;
            notification.appendChild(titleElement);
        }
        
        // Adicionar mensagem
        if (message) {
            const messageElement = document.createElement('p');
            messageElement.style.margin = '0';
            messageElement.style.padding = '0';
            messageElement.style.fontSize = '14px';
            messageElement.textContent = message;
            notification.appendChild(messageElement);
        }
        
        // Adicionar botões de ação, se necessário
        if (options.action) {
            const actionButton = document.createElement('button');
            actionButton.textContent = options.action.text || 'OK';
            actionButton.style.marginTop = '10px';
            actionButton.style.alignSelf = 'flex-end';
            actionButton.style.padding = '5px 10px';
            actionButton.style.backgroundColor = 'rgba(255,255,255,0.3)';
            actionButton.style.border = 'none';
            actionButton.style.borderRadius = '3px';
            actionButton.style.cursor = 'pointer';
            actionButton.style.color = 'white';
            
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeNotification(notification);
                if (typeof options.action.callback === 'function') {
                    options.action.callback();
                }
            });
            
            notification.appendChild(actionButton);
        }
        
        // Adicionar evento de clique para fechar
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Adicionar ao contêiner
        this.config.container.appendChild(notification);
        
        // Adicionar à lista de notificações ativas
        this.activeNotifications.push(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            
            // Reproduzir som, se habilitado
            if (this.config.sound && options.sound !== false) {
                this.playSound(type);
            }
        }, 10);
        
        // Auto-esconder, se habilitado
        if (this.config.autoHide && options.autoHide !== false) {
            const hideDelay = options.hideDelay || this.config.hideDelay;
            setTimeout(() => {
                this.removeNotification(notification);
            }, hideDelay);
        }
        
        return notification;
    },
    
    /**
     * Remove uma notificação
     * @param {HTMLElement} notification - Elemento da notificação
     */
    removeNotification(notification) {
        if (!notification) return;
        
        // Animar saída
        notification.style.opacity = '0';
        
        // Remover após animação
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // Remover da lista de notificações ativas
            this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
        }, 300);
    },
    
    /**
     * Reproduz um som de acordo com o tipo de notificação
     * @param {string} type - Tipo de notificação
     */
    playSound(type) {
        // Implementação simples usando o Audio API
        const sounds = {
            info: 'data:audio/mp3;base64,//uQxAAAEvGLIVT0AAuBtax3P2QCIAAIAGAQB4H+QD4Pn/yAIAgCAIASDweD589/IAg...',
            success: 'data:audio/mp3;base64,//uQxAAAEvGLIVT0AAuBtax3P2QCIAAIAGAQB4H+QD4Pn/yAIAgCAIASDweD589/IAg...',
            warning: 'data:audio/mp3;base64,//uQxAAAEvGLIVT0AAuBtax3P2QCIAAIAGAQB4H+QD4Pn/yAIAgCAIASDweD589/IAg...',
            error: 'data:audio/mp3;base64,//uQxAAAEvGLIVT0AAuBtax3P2QCIAAIAGAQB4H+QD4Pn/yAIAgCAIASDweD589/IAg...'
        };
        
        // Se implementação futura for necessária, adicionar sons reais aqui
    },
    
    /**
     * Remove todas as notificações ativas
     */
    clearAll() {
        this.activeNotifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.activeNotifications = [];
    }
};

// Inicializar automaticamente e expor globalmente
window.NotificationSystem = NotificationSystem;
document.addEventListener('DOMContentLoaded', () => NotificationSystem.init()); 