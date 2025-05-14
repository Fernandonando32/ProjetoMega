// Script auxiliar para forçar o carregamento de dados do banco
console.log('Inicializando fix-load-data.js - Script auxiliar para carregamento de dados');

// Função para forçar o carregamento de dados
function forcarCarregamentoDados() {
    console.log('Tentando forçar carregamento de dados do banco...');
    
    // Verificar se a função carregarRegistros existe
    if (typeof window.carregarRegistros !== 'function') {
        console.error('Função carregarRegistros não encontrada. Não é possível carregar dados.');
        mostrarMensagemErro('Função de carregamento não encontrada');
        return;
    }

    // Mostrar mensagem de carregamento
    mostrarMensagemCarregando();

    try {
        // Forçar o carregamento do banco, passando false para não usar cache local
        console.log('Chamando carregarRegistros(false) para forçar carregamento do banco...');
        
        window.carregarRegistros(false)
            .then(function(registrosCarregados) {
                console.log(`Sucesso! Carregados ${registrosCarregados.length} registros do banco.`);
                
                // Armazenar os registros na variável global
                window.registros = registrosCarregados;
                
                // Renderizar a tabela com os novos dados
                if (typeof window.renderizarTabela === 'function') {
                    window.renderizarTabela();
                    console.log('Tabela renderizada com os novos dados.');
                } else if (typeof window.renderTabela === 'function') {
                    window.renderTabela();
                    console.log('Tabela renderizada com os novos dados (usando função alternativa).');
                } else {
                    console.warn('Função de renderização não encontrada. Os dados foram carregados, mas a tabela não foi atualizada.');
                }
                
                // Atualizar estatísticas se a função existir
                if (typeof window.atualizarEstatisticas === 'function') {
                    window.atualizarEstatisticas();
                    console.log('Estatísticas atualizadas.');
                }
                
                // Remover mensagem de carregamento e mostrar sucesso
                removerMensagemCarregando();
                mostrarMensagemSucesso(`${registrosCarregados.length} registros carregados com sucesso!`);
            })
            .catch(function(erro) {
                console.error('Erro ao carregar registros:', erro);
                removerMensagemCarregando();
                mostrarMensagemErro('Erro ao carregar registros: ' + (erro.message || 'Erro desconhecido'));
                
                // Mesmo em caso de erro, tentar renderizar com o que estiver disponível localmente
                if (window.registros && window.registros.length > 0) {
                    console.log('Tentando usar dados locais...');
                    if (typeof window.renderizarTabela === 'function') {
                        window.renderizarTabela();
                    } else if (typeof window.renderTabela === 'function') {
                        window.renderTabela();
                    }
                }
            });
    } catch (erro) {
        console.error('Exceção ao tentar carregar registros:', erro);
        removerMensagemCarregando();
        mostrarMensagemErro('Exceção ao carregar registros: ' + (erro.message || 'Erro desconhecido'));
    }
}

// Função para mostrar diagnóstico do sistema
function mostrarDiagnostico() {
    const diagnostico = {
        funcoes: {
            carregarRegistros: typeof window.carregarRegistros === 'function',
            carregarDoBanco: typeof window.carregarDoBanco === 'function',
            salvarRegistros: typeof window.salvarRegistros === 'function',
            salvarNoBanco: typeof window.salvarNoBanco === 'function',
            renderizarTabela: typeof window.renderizarTabela === 'function',
            renderTabela: typeof window.renderTabela === 'function',
            atualizarEstatisticas: typeof window.atualizarEstatisticas === 'function'
        },
        objetos: {
            Auth: !!window.Auth,
            CONFIGS_FTTH: !!window.CONFIGS_FTTH,
            registros: !!window.registros,
            qntRegistros: window.registros ? window.registros.length : 0
        },
        localStorage: {
            registrosFTTH: !!localStorage.getItem('registrosFTTH'),
            currentUser: !!localStorage.getItem('currentUser'),
            authToken: !!localStorage.getItem('authToken'),
            ftth_total_registros: localStorage.getItem('ftth_total_registros') || '0'
        },
        autenticacao: {
            autenticado: window.Auth ? window.Auth.isAuthenticated() : false,
            usuario: window.Auth ? window.Auth.getCurrentUser() : null
        },
        configs: window.CONFIGS_FTTH || {}
    };
    
    console.log('Diagnóstico do sistema:', diagnostico);
    
    // Criar modal de diagnóstico
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.zIndex = '10000';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    const conteudo = document.createElement('div');
    conteudo.style.backgroundColor = 'white';
    conteudo.style.padding = '20px';
    conteudo.style.borderRadius = '5px';
    conteudo.style.maxWidth = '800px';
    conteudo.style.width = '90%';
    conteudo.style.maxHeight = '80vh';
    conteudo.style.overflow = 'auto';
    
    const titulo = document.createElement('h2');
    titulo.textContent = 'Diagnóstico do Sistema';
    titulo.style.color = '#2a3d66';
    titulo.style.marginTop = '0';
    
    const fechar = document.createElement('button');
    fechar.textContent = 'Fechar';
    fechar.style.float = 'right';
    fechar.style.backgroundColor = '#c0392b';
    fechar.style.color = 'white';
    fechar.style.border = 'none';
    fechar.style.padding = '5px 10px';
    fechar.style.borderRadius = '3px';
    fechar.style.cursor = 'pointer';
    fechar.onclick = function() {
        document.body.removeChild(modal);
    };
    
    const diagnosticoHtml = `
        <div style="margin-bottom: 20px;">
            <strong>Hora atual:</strong> ${new Date().toLocaleString()}
        </div>
        
        <h3 style="color: #2a3d66; margin-top: 0;">Funções Disponíveis</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Função</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Disponível</th>
            </tr>
            ${Object.entries(diagnostico.funcoes).map(([nome, disponivel]) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${nome}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${disponivel ? 'green' : 'red'};">${disponivel ? '✓' : '✕'}</td>
                </tr>
            `).join('')}
        </table>
        
        <h3 style="color: #2a3d66;">Objetos Globais</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Objeto</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Disponível</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Detalhes</th>
            </tr>
            ${Object.entries(diagnostico.objetos).map(([nome, disponivel]) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${nome}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${disponivel ? 'green' : 'red'};">${disponivel ? '✓' : '✕'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${nome === 'qntRegistros' ? disponivel : ''}</td>
                </tr>
            `).join('')}
        </table>
        
        <h3 style="color: #2a3d66;">LocalStorage</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Chave</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Valor</th>
            </tr>
            ${Object.entries(diagnostico.localStorage).map(([chave, valor]) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${chave}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${typeof valor === 'boolean' ? (valor ? 'Existe' : 'Não existe') : valor}</td>
                </tr>
            `).join('')}
        </table>
        
        <h3 style="color: #2a3d66;">Autenticação</h3>
        <div style="margin-bottom: 20px;">
            <p><strong>Autenticado:</strong> <span style="color: ${diagnostico.autenticacao.autenticado ? 'green' : 'red'};">${diagnostico.autenticacao.autenticado ? 'Sim' : 'Não'}</span></p>
            ${diagnostico.autenticacao.usuario ? `
                <p><strong>Usuário:</strong> ${diagnostico.autenticacao.usuario.name || 'N/A'}</p>
                <p><strong>Nível de Acesso:</strong> ${diagnostico.autenticacao.usuario.accessLevel || 'N/A'}</p>
                <p><strong>Operação:</strong> ${diagnostico.autenticacao.usuario.operacao || 'N/A'}</p>
            ` : '<p>Nenhum usuário logado</p>'}
        </div>
        
        <h3 style="color: #2a3d66;">Configurações</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Chave</th>
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Valor</th>
            </tr>
            ${Object.entries(diagnostico.configs).map(([chave, valor]) => `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${chave}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${typeof valor === 'object' ? JSON.stringify(valor) : valor}</td>
                </tr>
            `).join('')}
        </table>
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <button id="forcaCarregamentoBtn" style="background-color: #2a3d66; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer;">Forçar Carregamento</button>
            <button id="limparCacheBtn" style="background-color: #e67e22; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer;">Limpar Cache Local</button>
        </div>
    `;
    
    conteudo.innerHTML = diagnosticoHtml;
    conteudo.prepend(fechar);
    conteudo.prepend(titulo);
    modal.appendChild(conteudo);
    document.body.appendChild(modal);
    
    // Adicionar event listeners para os botões
    document.getElementById('forcaCarregamentoBtn').addEventListener('click', function() {
        document.body.removeChild(modal);
        forcarCarregamentoDados();
    });
    
    document.getElementById('limparCacheBtn').addEventListener('click', function() {
        try {
            localStorage.removeItem('registrosFTTH');
            localStorage.removeItem('ftth_total_registros');
            localStorage.removeItem('ftth_dados_no_banco');
            localStorage.removeItem('ultimo_salvamento_hash');
            
            alert('Cache local limpo com sucesso. O sistema irá tentar carregar os dados do banco de dados.');
            document.body.removeChild(modal);
            setTimeout(forcarCarregamentoDados, 500);
        } catch (erro) {
            alert('Erro ao limpar cache: ' + erro.message);
        }
    });
}

// Função para mostrar mensagem de carregamento
function mostrarMensagemCarregando() {
    // Remover mensagem existente, se houver
    removerMensagemCarregando();
    
    // Criar elemento de mensagem
    const mensagem = document.createElement('div');
    mensagem.id = 'mensagem-carregando';
    mensagem.style.position = 'fixed';
    mensagem.style.top = '50%';
    mensagem.style.left = '50%';
    mensagem.style.transform = 'translate(-50%, -50%)';
    mensagem.style.backgroundColor = 'white';
    mensagem.style.padding = '20px';
    mensagem.style.borderRadius = '5px';
    mensagem.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    mensagem.style.zIndex = '9999';
    mensagem.style.display = 'flex';
    mensagem.style.alignItems = 'center';
    mensagem.style.gap = '15px';
    
    // Adicionar spinner
    const spinner = document.createElement('div');
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '3px solid #f3f3f3';
    spinner.style.borderTop = '3px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    
    // Adicionar texto
    const texto = document.createElement('span');
    texto.textContent = 'Carregando dados do banco...';
    
    // Adicionar estilos para animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    // Montar o elemento
    document.head.appendChild(style);
    mensagem.appendChild(spinner);
    mensagem.appendChild(texto);
    document.body.appendChild(mensagem);
}

// Função para remover mensagem de carregamento
function removerMensagemCarregando() {
    const mensagem = document.getElementById('mensagem-carregando');
    if (mensagem) {
        mensagem.remove();
    }
}

// Função para mostrar mensagem de sucesso
function mostrarMensagemSucesso(texto) {
    mostrarMensagemTemporaria(texto, '#27ae60');
}

// Função para mostrar mensagem de erro
function mostrarMensagemErro(texto) {
    mostrarMensagemTemporaria(texto, '#c0392b');
}

// Função para mostrar mensagem temporária
function mostrarMensagemTemporaria(texto, cor) {
    const mensagem = document.createElement('div');
    mensagem.style.position = 'fixed';
    mensagem.style.top = '20px';
    mensagem.style.left = '50%';
    mensagem.style.transform = 'translateX(-50%)';
    mensagem.style.backgroundColor = 'white';
    mensagem.style.color = cor;
    mensagem.style.padding = '15px 20px';
    mensagem.style.borderRadius = '5px';
    mensagem.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    mensagem.style.zIndex = '9999';
    mensagem.style.fontWeight = 'bold';
    mensagem.style.borderLeft = `5px solid ${cor}`;
    mensagem.textContent = texto;
    
    document.body.appendChild(mensagem);
    
    // Remover após 5 segundos
    setTimeout(function() {
        mensagem.remove();
    }, 5000);
}

// Detectar quando o documento estiver pronto e chamar a função principal
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(forcarCarregamentoDados, 500);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(forcarCarregamentoDados, 500);
    });
}

// Adicionar botões flutuantes
document.addEventListener('DOMContentLoaded', function() {
    // Botão para recarregar dados
    const botaoRecarregar = document.createElement('button');
    botaoRecarregar.innerHTML = '🔄 Recarregar Dados';
    botaoRecarregar.style.position = 'fixed';
    botaoRecarregar.style.bottom = '20px';
    botaoRecarregar.style.right = '20px';
    botaoRecarregar.style.backgroundColor = '#2a3d66';
    botaoRecarregar.style.color = 'white';
    botaoRecarregar.style.border = 'none';
    botaoRecarregar.style.borderRadius = '5px';
    botaoRecarregar.style.padding = '10px 15px';
    botaoRecarregar.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    botaoRecarregar.style.cursor = 'pointer';
    botaoRecarregar.style.zIndex = '9998';
    
    botaoRecarregar.addEventListener('click', forcarCarregamentoDados);
    
    // Botão para diagnóstico
    const botaoDiagnostico = document.createElement('button');
    botaoDiagnostico.innerHTML = '🔍 Diagnóstico';
    botaoDiagnostico.style.position = 'fixed';
    botaoDiagnostico.style.bottom = '20px';
    botaoDiagnostico.style.right = '180px';
    botaoDiagnostico.style.backgroundColor = '#e67e22';
    botaoDiagnostico.style.color = 'white';
    botaoDiagnostico.style.border = 'none';
    botaoDiagnostico.style.borderRadius = '5px';
    botaoDiagnostico.style.padding = '10px 15px';
    botaoDiagnostico.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    botaoDiagnostico.style.cursor = 'pointer';
    botaoDiagnostico.style.zIndex = '9998';
    
    botaoDiagnostico.addEventListener('click', mostrarDiagnostico);
    
    document.body.appendChild(botaoRecarregar);
    document.body.appendChild(botaoDiagnostico);
});

console.log('fix-load-data.js carregado e pronto para uso.'); 