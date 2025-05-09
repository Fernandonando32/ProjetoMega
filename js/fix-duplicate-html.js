// Script para corrigir a duplicação na Pagina1 (1).html

// Esta função deve ser chamada após o carregamento da página
function fixDuplicateHTML() {
    console.log("Iniciando correção de duplicação HTML...");
    
    // Verifica se há elementos duplicados na página
    const docTypes = document.querySelectorAll('html');
    
    if (docTypes.length > 1) {
        console.log(`Encontrados ${docTypes.length} elementos HTML na página. Corrigindo...`);
        
        // Remove todos os elementos HTML duplicados, mantendo apenas o primeiro
        for (let i = 1; i < docTypes.length; i++) {
            docTypes[i].parentNode.removeChild(docTypes[i]);
        }
        
        console.log("Correção aplicada para elementos HTML duplicados.");
    } else {
        console.log("Não foram encontrados elementos HTML duplicados.");
    }
    
    // Verificar elementos de cabeçalho duplicados
    const heads = document.querySelectorAll('head');
    if (heads.length > 1) {
        console.log(`Encontrados ${heads.length} elementos HEAD na página. Corrigindo...`);
        
        // Remove todos os elementos HEAD duplicados, mantendo apenas o primeiro
        for (let i = 1; i < heads.length; i++) {
            heads[i].parentNode.removeChild(heads[i]);
        }
        
        console.log("Correção aplicada para elementos HEAD duplicados.");
    }
    
    // Verificar elementos de corpo duplicados
    const bodies = document.querySelectorAll('body');
    if (bodies.length > 1) {
        console.log(`Encontrados ${bodies.length} elementos BODY na página. Corrigindo...`);
        
        // Remove todos os elementos BODY duplicados, mantendo apenas o primeiro
        for (let i = 1; i < bodies.length; i++) {
            bodies[i].parentNode.removeChild(bodies[i]);
        }
        
        console.log("Correção aplicada para elementos BODY duplicados.");
    }
    
    console.log("Correção de duplicação HTML concluída.");
}

// Adicionando o script ao window para acesso global
window.fixDuplicateHTML = fixDuplicateHTML;

// Executar a correção após o carregamento da página
window.addEventListener('DOMContentLoaded', fixDuplicateHTML); 