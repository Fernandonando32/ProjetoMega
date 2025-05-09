/**
 * Script para corrigir as funções de estatísticas no iframe
 * Este script deve ser incluído no index.html
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando correção das estatísticas...');
    
    // Referência ao iframe
    const iframe = document.getElementById('mainFrame');
    if (!iframe) {
        console.error('Iframe não encontrado!');
        return;
    }
    
    // Quando o iframe for carregado
    iframe.onload = function() {
        // Aguardar para garantir que o iframe esteja totalmente carregado
        setTimeout(function() {
            try {
                // Acessar o documento e janela do iframe
                const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
                const frameWin = iframe.contentWindow;
                
                // Verificar se Auth está disponível
                if (!frameWin.Auth) {
                    console.warn('Auth não disponível ainda no iframe, aguardando...');
                    // Tentar novamente após um intervalo
                    setTimeout(injectStatsFix, 1500);
                    return;
                }
                
                injectStatsFix();
                
                // Função para injetar correções nas estatísticas
                function injectStatsFix() {
                    console.log('Injetando correções para estatísticas...');
                    
                    // Salvar as funções originais se existirem
                    if (typeof frameWin.atualizarEstatisticas === 'function') {
                        frameWin._originalAtualizarEstatisticas = frameWin.atualizarEstatisticas;
                    }
                    
                    if (typeof frameWin.renderTabelaFiltrada === 'function') {
                        frameWin._originalRenderTabelaFiltrada = frameWin.renderTabelaFiltrada;
                    }
                    
                    // Corrigir a função atualizarEstatisticas
                    frameWin.atualizarEstatisticas = function() {
                        console.log('Executando atualizarEstatisticas corrigida...');
                        
                        try {
                            // Verificar se Auth está disponível
                            if (!frameWin.Auth) {
                                console.error('Auth não disponível em atualizarEstatisticas');
                                return;
                            }
                            
                            // Obter usuário atual
                            const currentUser = frameWin.Auth.getCurrentUser();
                            if (!currentUser) {
                                console.warn('Usuário não autenticado em atualizarEstatisticas');
                                return;
                            }
                            
                            // Verificar se registros existe
                            if (!frameWin.registros || !Array.isArray(frameWin.registros)) {
                                console.error('Array de registros não disponível');
                                return;
                            }
                            
                            // Verificar permissão para visualizar todas operações
                            const podeVerTodasOperacoes = frameWin.Auth.hasPermission(currentUser, frameWin.Auth.PERMISSIONS.VIEW_BY_OPERATION);
                            
                            // Filtrar registros pela operação do usuário se necessário
                            let registrosFiltrados = frameWin.registros;
                            if (!podeVerTodasOperacoes && currentUser.operacao) {
                                registrosFiltrados = frameWin.registros.filter(r => r.operacao === currentUser.operacao);
                            }
                            
                            // Verificar se os elementos de estatísticas existem
                            const totalTecnicos = frameDoc.getElementById("totalTecnicos");
                            const totalVeiculos = frameDoc.getElementById("totalVeiculos");
                            const totalCidades = frameDoc.getElementById("totalCidades");
                            
                            if (!totalTecnicos || !totalVeiculos || !totalCidades) {
                                console.error('Elementos de estatísticas não encontrados');
                                return;
                            }
                            
                            // Total de técnicos (nomes únicos)
                            const tecnicosUnicos = new Set(registrosFiltrados.map(r => r.tecnico && r.tecnico.toLowerCase().trim()));
                            tecnicosUnicos.delete(""); // Remover strings vazias
                            tecnicosUnicos.delete(undefined); // Remover undefined
                            
                            // Total de auxiliares (nomes únicos)
                            const auxiliaresUnicos = new Set();
                            registrosFiltrados.forEach(r => {
                                if (r.auxiliar && r.auxiliar.trim()) {
                                    auxiliaresUnicos.add(r.auxiliar.toLowerCase().trim());
                                }
                            });
                            
                            // Total de pessoal técnico (técnicos + auxiliares)
                            const totalPessoalTecnico = tecnicosUnicos.size + auxiliaresUnicos.size;
                            
                            totalTecnicos.textContent = totalPessoalTecnico;
                            
                            // Total de veículos (placas únicas, apenas registros com placa)
                            const veiculosUnicos = new Set();
                            registrosFiltrados.forEach(r => {
                                if (r.placa && r.placa.trim()) {
                                    veiculosUnicos.add(r.placa.toUpperCase().trim());
                                }
                            });
                            totalVeiculos.textContent = veiculosUnicos.size;
                            
                            // Total de cidades distintas
                            const cidadesUnicas = new Set();
                            registrosFiltrados.forEach(r => {
                                if (r.cidade && r.cidade.trim()) {
                                    cidadesUnicas.add(r.cidade.toLowerCase().trim());
                                }
                            });
                            totalCidades.textContent = cidadesUnicas.size;
                            
                            // Técnicos por operação
                            const bjfibraContainer = frameDoc.getElementById("bjfibraContainer");
                            const megalinkContainer = frameDoc.getElementById("megalinkContainer");
                            const bjfibraVeiculosContainer = frameDoc.getElementById("bjfibraVeiculosContainer");
                            const megalinkVeiculosContainer = frameDoc.getElementById("megalinkVeiculosContainer");
                            
                            if (bjfibraContainer && megalinkContainer) {
                                // Estatísticas de técnicos por operação
                                const bjfibraTecnicos = new Set();
                                const bjfibraAuxiliares = new Set();
                                const megalinkTecnicos = new Set();
                                const megalinkAuxiliares = new Set();
                                
                                registrosFiltrados.forEach(r => {
                                    if (r.operacao === "BJ Fibra") {
                                        if (r.tecnico && r.tecnico.trim()) bjfibraTecnicos.add(r.tecnico.toLowerCase().trim());
                                        if (r.auxiliar && r.auxiliar.trim()) bjfibraAuxiliares.add(r.auxiliar.toLowerCase().trim());
                                    } else if (r.operacao === "Megalink") {
                                        if (r.tecnico && r.tecnico.trim()) megalinkTecnicos.add(r.tecnico.toLowerCase().trim());
                                        if (r.auxiliar && r.auxiliar.trim()) megalinkAuxiliares.add(r.auxiliar.toLowerCase().trim());
                                    }
                                });
                                
                                // Atualizar contadores
                                const bjfibraCount = frameDoc.getElementById("bjfibraCount");
                                const megalinkCount = frameDoc.getElementById("megalinkCount");
                                
                                if (bjfibraCount) bjfibraCount.textContent = bjfibraTecnicos.size + bjfibraAuxiliares.size;
                                if (megalinkCount) megalinkCount.textContent = megalinkTecnicos.size + megalinkAuxiliares.size;
                                
                                // Mostrar/ocultar contadores por operação com base nas permissões
                                if (!podeVerTodasOperacoes && currentUser.operacao) {
                                    // Se o usuário só pode ver uma operação, mostrar apenas a sua
                                    if (bjfibraContainer) bjfibraContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
                                    if (megalinkContainer) megalinkContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
                                    if (bjfibraVeiculosContainer) bjfibraVeiculosContainer.style.display = currentUser.operacao === "BJ Fibra" ? "block" : "none";
                                    if (megalinkVeiculosContainer) megalinkVeiculosContainer.style.display = currentUser.operacao === "Megalink" ? "block" : "none";
                                } else {
                                    // Se pode ver todas, mostrar ambas
                                    if (bjfibraContainer) bjfibraContainer.style.display = "block";
                                    if (megalinkContainer) megalinkContainer.style.display = "block";
                                    if (bjfibraVeiculosContainer) bjfibraVeiculosContainer.style.display = "block";
                                    if (megalinkVeiculosContainer) megalinkVeiculosContainer.style.display = "block";
                                }
                                
                                // Veículos por operação
                                const bjfibraVeiculos = new Set();
                                const megalinkVeiculos = new Set();
                                
                                registrosFiltrados.forEach(r => {
                                    if (r.placa && r.placa.trim()) {
                                        if (r.operacao === "BJ Fibra") {
                                            bjfibraVeiculos.add(r.placa.toUpperCase().trim());
                                        } else if (r.operacao === "Megalink") {
                                            megalinkVeiculos.add(r.placa.toUpperCase().trim());
                                        }
                                    }
                                });
                                
                                // Atualizar contadores de veículos
                                const bjfibraVeiculosCount = frameDoc.getElementById("bjfibraVeiculosCount");
                                const megalinkVeiculosCount = frameDoc.getElementById("megalinkVeiculosCount");
                                
                                if (bjfibraVeiculosCount) bjfibraVeiculosCount.textContent = bjfibraVeiculos.size;
                                if (megalinkVeiculosCount) megalinkVeiculosCount.textContent = megalinkVeiculos.size;
                            }
                            
                            console.log('Estatísticas atualizadas com sucesso');
                        } catch (error) {
                            console.error('Erro ao executar atualizarEstatisticas:', error);
                        }
                    };
                    
                    // Substituir a função renderizarTabela para garantir que atualizarEstatisticas seja chamada
                    frameWin.renderizarTabela = function() {
                        console.log('Executando renderizarTabela corrigida...');
                        
                        try {
                            // Verificar se Auth está disponível
                            if (!frameWin.Auth) {
                                console.error('Auth não disponível. A autenticação pode não ter sido inicializada corretamente.');
                                setTimeout(() => {
                                    // Tentar novamente em 500ms
                                    if (frameWin.Auth) {
                                        frameWin.renderizarTabela();
                                    } else {
                                        console.error('Auth ainda não disponível após aguardar.');
                                    }
                                }, 500);
                                return;
                            }
                            
                            // Obter usuário atual
                            const currentUser = frameWin.Auth.getCurrentUser();
                            if (!currentUser) {
                                console.warn('Usuário não autenticado ao renderizar tabela.');
                                return;
                            }
                            
                            // Chamar a função de renderização de tabela
                            if (typeof frameWin.renderTabelaFiltrada === 'function') {
                                frameWin.renderTabelaFiltrada(frameWin.registros);
                            } else {
                                console.error('Função renderTabelaFiltrada não disponível');
                            }
                            
                            // Atualizar estatísticas após renderizar a tabela
                            frameWin.atualizarEstatisticas();
                            
                            // Aplicar ajustes de permissões após renderizar a tabela
                            if (typeof frameWin.ajustarPermissoes === 'function') {
                                setTimeout(frameWin.ajustarPermissoes, 100);
                            }
                        } catch (error) {
                            console.error('Erro ao executar renderizarTabela:', error);
                        }
                    };
                    
                    // Garantir que renderTabela também chame a nova versão
                    frameWin.renderTabela = frameWin.renderizarTabela;
                    
                    console.log('Funções de estatísticas corrigidas com sucesso');
                    
                    // Força uma atualização das estatísticas
                    setTimeout(function() {
                        if (typeof frameWin.atualizarEstatisticas === 'function') {
                            console.log('Forçando atualização das estatísticas...');
                            frameWin.atualizarEstatisticas();
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Erro ao acessar o conteúdo do iframe para estatísticas:', error);
            }
        }, 2000);
    };
}); 