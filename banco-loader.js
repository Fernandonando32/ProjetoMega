/**
 * Script para resolver o problema de carregamento de dados do banco de dados
 * Adicione este script à sua página usando a tag <script src="banco-loader.js"></script>
 */

// Esperar pelo carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Banco Loader: Inicializando correção para carregamento de dados do banco...');
    
    // Adicionar botão ao menu de navegação
    setTimeout(adicionarBotaoAoMenu, 500);
    
    // Garantir que as configurações estão corretas
    corrigirConfiguracoes();
});

/**
 * Corrige as configurações para habilitar o carregamento do banco
 */
function corrigirConfiguracoes() {
    if (window.CONFIGS_FTTH) {
        console.log('Banco Loader: Corrigindo configurações FTTH...');
        
        // Garantir que as configurações estão corretas
        window.CONFIGS_FTTH.SALVAR_APENAS_LOCAL = false;
        window.CONFIGS_FTTH.CARREGAR_DO_BANCO_AO_INICIAR = true;
        window.CONFIGS_FTTH.AUTO_SYNC_DISABLED = false;
        
        // Adicionar origens permitidas se não existirem
        if (!Array.isArray(window.CONFIGS_FTTH.ORIGENS_PERMITIDAS)) {
            window.CONFIGS_FTTH.ORIGENS_PERMITIDAS = [];
        }
        
        // Adicionar origens necessárias
        ['manual', 'import_csv', 'user_action'].forEach(origem => {
            if (!window.CONFIGS_FTTH.ORIGENS_PERMITIDAS.includes(origem)) {
                window.CONFIGS_FTTH.ORIGENS_PERMITIDAS.push(origem);
            }
        });
        
        console.log('Banco Loader: Configurações corrigidas:', window.CONFIGS_FTTH);
    } else {
        console.warn('Banco Loader: CONFIGS_FTTH não encontrado. Será criado quando a página carregar completamente.');
        
        // Tentar novamente após um tempo
        setTimeout(corrigirConfiguracoes, 1000);
    }
}

/**
 * Adiciona um botão ao menu de navegação para forçar o carregamento dos dados
 */
function adicionarBotaoAoMenu() {
    const menuUl = document.querySelector('nav.main-menu ul');
    
    if (!menuUl) {
        console.warn('Banco Loader: Menu não encontrado. Tentando novamente em 500ms...');
        setTimeout(adicionarBotaoAoMenu, 500);
        return;
    }
    
    // Verificar se o botão já existe
    if (document.getElementById('menu-item-banco')) {
        console.log('Banco Loader: Botão já existe no menu.');
        return;
    }
    
    // Criar novo item de menu
    const menuItem = document.createElement('li');
    menuItem.className = 'menu-item';
    menuItem.id = 'menu-item-banco';
    menuItem.innerHTML = `
        <a href="#" onclick="carregarDoBancoManual(); return false;">
            <i class="fas fa-database" style="margin-right: 8px;"></i>
            <span>Carregar do Banco</span>
        </a>
        <div class="menu-hover-indicator"></div>
    `;
    
    // Adicionar ao menu
    menuUl.appendChild(menuItem);
    
    console.log('Banco Loader: Botão de carregamento do banco adicionado ao menu.');
}

/**
 * Carrega dados do banco de dados manualmente
 */
async function carregarDoBancoManual() {
    try {
        // Mostrar indicação visual de que está carregando
        const statusElement = document.createElement('div');
        statusElement.id = 'status-msg-temp';
        statusElement.style.position = 'fixed';
        statusElement.style.top = '20px';
        statusElement.style.left = '50%';
        statusElement.style.transform = 'translateX(-50%)';
        statusElement.style.padding = '15px 30px';
        statusElement.style.backgroundColor = '#007bff';
        statusElement.style.color = 'white';
        statusElement.style.borderRadius = '8px';
        statusElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        statusElement.style.zIndex = '9999';
        statusElement.style.fontWeight = 'bold';
        statusElement.textContent = 'Carregando dados do banco...';
        document.body.appendChild(statusElement);
        
        console.log('Banco Loader: Forçando carregamento de dados do banco...');
        
        // Forçar carregamento do banco ignorando a configuração
        if (window.CONFIGS_FTTH) {
            window.CONFIGS_FTTH.CARREGAR_DO_BANCO_AO_INICIAR = true;
        }
        
        // Determinar a URL base da API
        const baseUrl = window.getBaseApiUrl ? window.getBaseApiUrl() : 'http://localhost:3000';
        
        // Fazer a requisição para carregar os registros
        const response = await fetch(`${baseUrl}/api?action=carregar-ftth-registros&limit=1000&offset=0`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar do banco: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.registros) && result.registros.length > 0) {
            // Atualizar registros globais com dados do banco
            console.log(`Banco Loader: Carregados ${result.registros.length} registros do banco de dados.`);
            window.registros = result.registros;
            
            // Atualizar mensagem
            statusElement.textContent = `Dados carregados com sucesso! ${result.registros.length} registros.`;
            statusElement.style.backgroundColor = '#28a745';
            
            // Renderizar a tabela após o carregamento
            if (typeof renderizarTabela === 'function') {
                console.log('Banco Loader: Atualizando tabela...');
                renderizarTabela();
            } else if (typeof renderTabela === 'function') {
                console.log('Banco Loader: Atualizando tabela (método alternativo)...');
                renderTabela();
            } else {
                console.error('Banco Loader: Função de renderização não encontrada!');
            }
        } else {
            console.log(`Banco Loader: Nenhum registro encontrado no banco de dados ou erro: ${result.message || 'sem detalhes'}.`);
            
            statusElement.textContent = "Nenhum registro encontrado no banco de dados.";
            statusElement.style.backgroundColor = '#ffc107';
            statusElement.style.color = '#212529';
        }
        
        // Remover mensagem após 3 segundos
        setTimeout(() => {
            if (statusElement && statusElement.parentNode) {
                statusElement.parentNode.removeChild(statusElement);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Banco Loader: Erro ao carregar dados do banco manualmente:', error);
        
        // Mostrar erro
        const statusElement = document.getElementById('status-msg-temp') || document.createElement('div');
        statusElement.id = 'status-msg-temp';
        statusElement.style.position = 'fixed';
        statusElement.style.top = '20px';
        statusElement.style.left = '50%';
        statusElement.style.transform = 'translateX(-50%)';
        statusElement.style.padding = '15px 30px';
        statusElement.style.backgroundColor = '#dc3545';
        statusElement.style.color = 'white';
        statusElement.style.borderRadius = '8px';
        statusElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        statusElement.style.zIndex = '9999';
        statusElement.style.fontWeight = 'bold';
        statusElement.textContent = `Erro: ${error.message}`;
        
        if (!statusElement.parentNode) {
            document.body.appendChild(statusElement);
        }
        
        // Remover mensagem após 5 segundos
        setTimeout(() => {
            if (statusElement && statusElement.parentNode) {
                statusElement.parentNode.removeChild(statusElement);
            }
        }, 5000);
    }
} 