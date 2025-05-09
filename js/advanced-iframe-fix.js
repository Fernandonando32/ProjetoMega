/**
 * Script avançado para corrigir a duplicação de conteúdo no iframe
 * Este script detecta e corrige a duplicação de documentos HTML no iframe
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando script avançado de correção...');
    
    // Referência ao iframe
    const iframe = document.getElementById('mainFrame');
    if (!iframe) {
        console.error('Iframe não encontrado!');
        return;
    }
    
    // Ocultar iframe inicialmente para evitar flash de conteúdo duplicado
    iframe.style.visibility = 'hidden';
    
    // Função para remover o overlay de carregamento
    function hideLoadingOverlay() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
                // Mostrar iframe após remover o overlay
                iframe.style.visibility = 'visible';
            }, 500);
        } else {
            iframe.style.visibility = 'visible';
        }
    }
    
    // Quando o iframe for carregado
    iframe.onload = function() {
        try {
            // Verificar se podemos acessar o conteúdo (pode ser bloqueado por segurança cross-origin)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Função para injetar o script de correção
            function injectFixScript() {
                console.log('Injetando script de correção avançada...');
                
                const scriptEl = iframeDoc.createElement('script');
                scriptEl.textContent = `
                    // Função para corrigir a duplicação de documentos HTML
                    (function() {
                        console.log('Executando correção de duplicação avançada...');
                        
                        // Função para verificar e corrigir elementos duplicados
                        function fixDuplicateElements() {
                            // Verificar todos os doctype nodes e remover duplicados
                            const doctypes = [];
                            for (let i = 0; i < document.childNodes.length; i++) {
                                if (document.childNodes[i].nodeType === Node.DOCUMENT_TYPE_NODE) {
                                    doctypes.push(document.childNodes[i]);
                                }
                            }
                            if (doctypes.length > 1) {
                                console.log("Encontrados " + doctypes.length + " DOCTYPE. Removendo extras...");
                                for (let i = 1; i < doctypes.length; i++) {
                                    document.removeChild(doctypes[i]);
                                }
                            }
                            
                            // Localizar e remover elementos HTML duplicados
                            const htmlElements = document.querySelectorAll('html');
                            if (htmlElements.length > 1) {
                                console.log("Encontrados " + htmlElements.length + " elementos HTML. Removendo extras...");
                                // Manter apenas o primeiro e remover os outros
                                for (let i = 1; i < htmlElements.length; i++) {
                                    if (htmlElements[i].parentNode) {
                                        htmlElements[i].parentNode.removeChild(htmlElements[i]);
                                    }
                                }
                            }
                            
                            // Localizar e remover cabeçalhos duplicados
                            const headElements = document.querySelectorAll('head');
                            if (headElements.length > 1) {
                                console.log("Encontrados " + headElements.length + " elementos HEAD. Removendo extras...");
                                // Manter apenas o primeiro e remover os outros
                                for (let i = 1; i < headElements.length; i++) {
                                    if (headElements[i].parentNode) {
                                        headElements[i].parentNode.removeChild(headElements[i]);
                                    }
                                }
                            }
                            
                            // Localizar e remover corpos duplicados
                            const bodyElements = document.querySelectorAll('body');
                            if (bodyElements.length > 1) {
                                console.log("Encontrados " + bodyElements.length + " elementos BODY. Removendo extras...");
                                
                                // Manter apenas o primeiro e remover os outros
                                const firstBody = bodyElements[0];
                                for (let i = 1; i < bodyElements.length; i++) {
                                    // Opcional: transferir conteúdo antes de remover
                                    while (bodyElements[i].firstChild) {
                                        // Remover nós duplicados
                                        if (isNodeDuplicate(bodyElements[i].firstChild)) {
                                            const toRemove = bodyElements[i].firstChild;
                                            bodyElements[i].removeChild(toRemove);
                                        } else {
                                            firstBody.appendChild(bodyElements[i].firstChild);
                                        }
                                    }
                                    
                                    if (bodyElements[i].parentNode) {
                                        bodyElements[i].parentNode.removeChild(bodyElements[i]);
                                    }
                                }
                            }
                            
                            // Verificar se um nó é duplicado (comparação simples)
                            function isNodeDuplicate(node) {
                                // Verificar IDs duplicados
                                if (node.id && document.querySelectorAll('#' + node.id).length > 1) {
                                    return true;
                                }
                                
                                // Para elementos de script, verificar se já existe um com o mesmo src
                                if (node.tagName === 'SCRIPT' && node.src) {
                                    const scripts = document.querySelectorAll('script[src="' + node.src + '"]');
                                    return scripts.length > 1;
                                }
                                
                                // Para links de CSS, verificar se já existe um com o mesmo href
                                if (node.tagName === 'LINK' && 
                                    node.rel === 'stylesheet' && 
                                    node.href) {
                                    const links = document.querySelectorAll('link[href="' + node.href + '"]');
                                    return links.length > 1;
                                }
                                
                                return false;
                            }
                            
                            // Verificar elementos específicos da sua aplicação que podem estar duplicados
                            const mapContainers = document.querySelectorAll('#map');
                            if (mapContainers.length > 1) {
                                console.log("Encontrados " + mapContainers.length + " containers de mapa. Removendo extras...");
                                for (let i = 1; i < mapContainers.length; i++) {
                                    if (mapContainers[i].parentNode) {
                                        mapContainers[i].parentNode.removeChild(mapContainers[i]);
                                    }
                                }
                            }
                            
                            // Verificar outros elementos importantes da sua aplicação
                            const botoesFixos = document.querySelectorAll('.botoes-fixos');
                            if (botoesFixos.length > 1) {
                                console.log("Encontrados " + botoesFixos.length + " conjuntos de botões fixos. Removendo extras...");
                                for (let i = 1; i < botoesFixos.length; i++) {
                                    if (botoesFixos[i].parentNode) {
                                        botoesFixos[i].parentNode.removeChild(botoesFixos[i]);
                                    }
                                }
                            }
                            
                            console.log("Correção de duplicação concluída com sucesso!");
                        }
                        
                        // Executar a correção inicial
                        fixDuplicateElements();
                        
                        // Repetir a correção após um pequeno intervalo
                        setTimeout(fixDuplicateElements, 500);
                        
                        // Executar novamente após o carregamento completo da página
                        window.addEventListener('load', function() {
                            setTimeout(fixDuplicateElements, 1000);
                        });
                        
                        // Enviar mensagem para o pai indicando que a correção foi aplicada
                        try {
                            window.parent.postMessage('fix-applied', '*');
                        } catch (e) {
                            console.error('Erro ao enviar mensagem para o pai:', e);
                        }
                    })();
                `;
                
                // Adicionar o script ao início do <head> para garantir que execute o mais cedo possível
                if (iframeDoc.head) {
                    iframeDoc.head.insertBefore(scriptEl, iframeDoc.head.firstChild);
                } else {
                    // Fallback se <head> não existir por algum motivo
                    iframeDoc.documentElement.appendChild(scriptEl);
                }
                
                console.log('Script de correção injetado com sucesso!');
            }
            
            // Injetar o script de correção
            injectFixScript();
            
            // Ouvir mensagem do iframe 
            window.addEventListener('message', function(event) {
                if (event.data === 'fix-applied') {
                    console.log('Correção aplicada no iframe, removendo overlay...');
                    // Dar mais tempo para garantir que a renderização esteja completa
                    setTimeout(hideLoadingOverlay, 1000);
                }
            });
            
            // Fallback: se não recebermos a mensagem dentro de um tempo razoável, esconder o overlay mesmo assim
            setTimeout(function() {
                console.log('Timeout de segurança atingido, removendo overlay...');
                hideLoadingOverlay();
            }, 5000);
            
        } catch (error) {
            console.error('Erro ao acessar o conteúdo do iframe:', error);
            // Em caso de erro, esconder o overlay e mostrar o iframe mesmo assim
            setTimeout(hideLoadingOverlay, 1000);
        }
    };
}); 