// Configurações de API para o sistema

// Determinar a URL base da API
const getBaseApiUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Se estiver rodando localmente, use o IP local em vez de localhost
    const useHostname = hostname === 'localhost' ? '192.168.68.189' : hostname;
    const port = "3000"; // Porta fixa do servidor
    
    return `${protocol}//${useHostname}:${port}`;
};

// URLs da API
const API_URLS = {
    LOGIN: `${getBaseApiUrl()}/api/auth/login`,
    REGISTER: `${getBaseApiUrl()}/api/auth/register`,
    USERS: `${getBaseApiUrl()}/api/users`,
    TASKS: `${getBaseApiUrl()}/api/tasks`,
    HEALTH: `${getBaseApiUrl()}/api/health`
};

// Exportar as constantes para uso global
window.API_URLS = API_URLS;
window.getBaseApiUrl = getBaseApiUrl; 