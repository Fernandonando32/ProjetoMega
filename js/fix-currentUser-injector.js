// Script para injetar automaticamente o corretor de currentUser

// Função auto-executável para evitar poluição do escopo global
(function() {
    // Adicionar o script corretivo à página
    function injectScript() {
        const script = document.createElement('script');
        script.src = 'js/fix-currentUser.js';
        script.onload = function() {
            console.log('Script corretivo carregado com sucesso!');
        };
        script.onerror = function() {
            console.error('Erro ao carregar o script corretivo.');
        };
        document.body.appendChild(script);
    }

    // Verificar se o documento já está carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }

    // Verificar se estamos na página correta
    if (window.location.href.includes('Pagina1 (1).html')) {
        // Mensagem para o desenvolvedor
        console.log('Script injector de correção para currentUser está ativo');
    }
})(); 