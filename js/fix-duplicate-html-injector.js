// Script para injetar a correção de duplicação HTML no iframe

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando injetor de correção de duplicação HTML...');
    
    const mainFrame = document.getElementById('mainFrame');
    if (!mainFrame) {
        console.error('Iframe principal não encontrado!');
        return;
    }
    
    // Aguardar que o iframe seja carregado
    mainFrame.onload = function() {
        try {
            console.log('Iframe carregado, injetando código de correção...');
            const frameDoc = mainFrame.contentDocument || mainFrame.contentWindow.document;
            
            // Criar elemento de script para o corretor de duplicação
            const scriptElement = frameDoc.createElement('script');
            scriptElement.textContent = `
                // Função para remover elementos HTML duplicados
                function fixDuplicateHTML() {
                    console.log("Iniciando correção de duplicação HTML dentro do iframe...");
                    
                    // Verificar elementos HTML duplicados
                    const htmlElements = document.querySelectorAll('html');
                    if (htmlElements.length > 1) {
                        console.log("Encontrados " + htmlElements.length + " elementos HTML. Removendo duplicados...");
                        for (let i = 1; i < htmlElements.length; i++) {
                            if (htmlElements[i] && htmlElements[i].parentNode) {
                                htmlElements[i].parentNode.removeChild(htmlElements[i]);
                            }
                        }
                    }
                    
                    // Verificar elementos HEAD duplicados
                    const headElements = document.querySelectorAll('head');
                    if (headElements.length > 1) {
                        console.log("Encontrados " + headElements.length + " elementos HEAD. Removendo duplicados...");
                        for (let i = 1; i < headElements.length; i++) {
                            if (headElements[i] && headElements[i].parentNode) {
                                headElements[i].parentNode.removeChild(headElements[i]);
                            }
                        }
                    }
                    
                    // Verificar elementos BODY duplicados
                    const bodyElements = document.querySelectorAll('body');
                    if (bodyElements.length > 1) {
                        console.log("Encontrados " + bodyElements.length + " elementos BODY. Removendo duplicados...");
                        for (let i = 1; i < bodyElements.length; i++) {
                            if (bodyElements[i] && bodyElements[i].parentNode) {
                                bodyElements[i].parentNode.removeChild(bodyElements[i]);
                            }
                        }
                    }
                    
                    console.log("Correção de duplicação HTML concluída no iframe.");
                }
                
                // Executar a correção imediatamente
                fixDuplicateHTML();
                
                // Executar novamente após um breve intervalo para pegar elementos que possam ter sido carregados posteriormente
                setTimeout(fixDuplicateHTML, 1000);
            `;
            
            // Adicionar o script ao documento do iframe
            frameDoc.head.appendChild(scriptElement);
            console.log('Código de correção injetado com sucesso no iframe!');
            
            // Após 2 segundos, esconder o overlay de carregamento
            setTimeout(function() {
                document.getElementById('loading').style.opacity = '0';
                setTimeout(function() {
                    document.getElementById('loading').style.display = 'none';
                }, 500);
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao injetar correção no iframe:', error);
        }
    };
}); 