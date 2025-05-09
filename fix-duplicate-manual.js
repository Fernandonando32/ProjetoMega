// Script para corrigir manualmente a duplicação
const fs = require('fs');

// Definir o código correto para o botão "OK"
const correctButtonCode = `            // Adicionar botão "OK"
            const btnOk = document.createElement('button');
            btnOk.textContent = 'OK';
            btnOk.style.background = '#2a3d66';
            btnOk.style.color = 'white';
            btnOk.style.border = 'none';
            btnOk.style.borderRadius = '5px';
            btnOk.style.padding = '10px 20px';
            btnOk.style.marginTop = '15px';
            btnOk.style.cursor = 'pointer';
            btnOk.style.fontSize = '1em';
            btnOk.style.fontWeight = 'bold';
            btnOk.style.width = '100%';
            
            // Adicionar evento para fechar o modal
            const fecharModal = () => {
                document.body.removeChild(modal);
            };
            
            btnFechar.addEventListener('click', fecharModal);
            btnOk.addEventListener('click', fecharModal);
            
            // Montar o modal
            modalContent.appendChild(titulo);
            modalContent.appendChild(btnFechar);
            modalContent.appendChild(conteudoDiv);
            modalContent.appendChild(btnOk);
            modal.appendChild(modalContent);
            
            // Adicionar à página
            document.body.appendChild(modal);
        }`;

// Ler o arquivo original
fs.readFile('Pagina1 (1).html', 'utf8', (err, data) => {
    if (err) {
        console.error('Erro ao ler o arquivo:', err);
        return;
    }

    // Fazer backup
    fs.writeFile('Pagina1_backup_before_fix.html', data, (err) => {
        if (err) {
            console.error('Erro ao criar backup:', err);
            return;
        }
        console.log('Backup criado com sucesso');
    });

    // Encontrar onde a substituição deve começar
    const startMarker = '            // Adicionar botão "OK"';
    const startIndex = data.indexOf(startMarker, 2300);
    
    if (startIndex === -1) {
        console.error('Não foi possível encontrar o início da duplicação');
        return;
    }

    // Encontrar uma sequência única que vem depois do documento HTML duplicado
    // A parte JavaScript que vem após o botão OK e antes do próximo bloco principal
    const endMarker = '        // Adicionar função para excluir todos os registros';
    const endIndex = data.indexOf(endMarker, startIndex);
    
    if (endIndex === -1) {
        console.error('Não foi possível encontrar o fim da duplicação');
        return;
    }

    // Criar o novo conteúdo
    const newContent = 
        data.substring(0, startIndex) + 
        correctButtonCode + 
        '\n\n' +
        data.substring(endIndex);

    // Escrever o novo conteúdo
    fs.writeFile('Pagina1_sem_duplicacao.html', newContent, (err) => {
        if (err) {
            console.error('Erro ao escrever o arquivo:', err);
            return;
        }
        
        console.log('Arquivo corrigido criado com sucesso: Pagina1_sem_duplicacao.html');
        
        // Sobrescrever o arquivo original
        fs.writeFile('Pagina1 (1).html', newContent, (err) => {
            if (err) {
                console.error('Erro ao sobrescrever o arquivo original:', err);
                return;
            }
            console.log('Arquivo original substituído com sucesso');
        });
    });
}); 