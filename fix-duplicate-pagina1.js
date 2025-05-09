// Script para corrigir a duplicação em Pagina1 (1).html
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo original
const originalFilePath = path.resolve('Pagina1 (1).html');

// Caminho para o arquivo de backup (antes da correção)
const backupFilePath = path.resolve('Pagina1_antes_da_correcao.html');

// Caminho para o arquivo temporário
const tempFilePath = path.resolve('Pagina1_temp.html');

console.log('Iniciando correção de Pagina1 (1).html');

// Fazer backup do arquivo original
try {
    fs.copyFileSync(originalFilePath, backupFilePath);
    console.log(`Backup criado: ${backupFilePath}`);
} catch (error) {
    console.error('Erro ao criar backup:', error);
    process.exit(1);
}

// Ler o conteúdo do arquivo original
let content;
try {
    content = fs.readFileSync(originalFilePath, 'utf8');
    console.log('Arquivo original lido com sucesso');
} catch (error) {
    console.error('Erro ao ler arquivo original:', error);
    process.exit(1);
}

// Identificar onde a duplicação começa
const startPattern = '// Adicionar botão "OK"';
const startIndex = content.indexOf(startPattern, 2000); // Buscando depois da linha 2000
if (startIndex === -1) {
    console.error('Padrão de início não encontrado');
    process.exit(1);
}

// Avançar para a próxima linha
const duplicateStartIndex = content.indexOf('\n', startIndex) + 1;

// Identificar o final correto da função
// Buscar baseado no padrão conhecido de outros botões OK no arquivo
const endPattern = 'document.body.appendChild(modal);';
const endIndex = content.indexOf(endPattern, duplicateStartIndex);
if (endIndex === -1) {
    console.error('Padrão de final não encontrado');
    process.exit(1);
}

// Avançar para a próxima linha após o fim da função
const duplicateEndIndex = content.indexOf('\n', endIndex) + 1;

// Obter o código correto do botão "OK" baseado em outro exemplo no arquivo
// Procurar no início do arquivo (antes da linha 2100)
const correctStartPattern = '// Adicionar botão "OK"';
const correctStartIndex = content.indexOf(correctStartPattern, 2000);
const correctStart = content.indexOf('\n', correctStartIndex) + 1;

const correctEndPattern = 'document.body.appendChild(modal);';
const correctEndIndex = content.indexOf(correctEndPattern, correctStart);
const correctEnd = content.indexOf('\n', correctEndIndex) + 1;

// Extrair o código correto
const correctCode = content.substring(correctStart, correctEnd);

// Construir o conteúdo corrigido
const correctedContent = 
    content.substring(0, duplicateStartIndex) + 
    correctCode +
    content.substring(duplicateEndIndex);

// Escrever o conteúdo corrigido em um arquivo temporário
try {
    fs.writeFileSync(tempFilePath, correctedContent, 'utf8');
    console.log('Arquivo temporário criado com sucesso');
} catch (error) {
    console.error('Erro ao criar arquivo temporário:', error);
    process.exit(1);
}

// Substituir o arquivo original pelo corrigido
try {
    fs.renameSync(tempFilePath, originalFilePath);
    console.log('Arquivo original substituído com sucesso');
    console.log('Correção concluída! A duplicação foi removida.');
} catch (error) {
    console.error('Erro ao substituir arquivo original:', error);
    process.exit(1);
} 