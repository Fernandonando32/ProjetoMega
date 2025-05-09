/**
 * Módulo de integração com Supabase para o Sistema de Gestão FTTH
 * Fornece funções para carregar e gerenciar registros de técnicos e veículos
 */

// Carrega a configuração do Supabase
const SUPABASE_CONFIG = {
    url: "https://ryttlyigvimycygnzfju.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHRseWlndmlteWN5Z256Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzE5OTYsImV4cCI6MjA2MjMwNzk5Nn0.njG4i1oZ3Ex9s490eTdXCaREInxM4aEgHazf8UhRTOA"
};

// Classe principal de serviço de banco de dados
class SupabaseDB {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    /**
     * Inicializa a conexão com o Supabase
     * @returns {Promise<boolean>} Sucesso da inicialização
     */
    async init() {
        if (this.initialized) return true;
        
        try {
            // Carrega dinamicamente o cliente Supabase se necessário
            if (!window.supabase) {
                console.log('Carregando biblioteca Supabase...');
                await this._loadSupabaseScript();
            }
            
            // Cria cliente com a configuração
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.key
            );
            
            this.initialized = true;
            console.log('Supabase inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
            return false;
        }
    }
    
    /**
     * Carrega o script do Supabase dinamicamente
     * @private
     */
    _loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Falha ao carregar biblioteca Supabase'));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Carrega todos os registros do banco
     * @param {Object} filtros - Filtros opcionais a aplicar
     * @returns {Promise<Array>} Registros encontrados
     */
    async carregarRegistros(filtros = {}) {
        await this.init();
        
        try {
            let query = this.supabase
                .from('registros')
                .select('*, manutencoes(*)');
                
            // Aplicar filtros se fornecidos
            if (filtros.cidade) query = query.ilike('cidade', `%${filtros.cidade}%`);
            if (filtros.tecnico) query = query.ilike('tecnico', `%${filtros.tecnico}%`);
            if (filtros.operacao) query = query.eq('operacao', filtros.operacao);
            
            const { data, error } = await query
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Converter registros para o formato usado na aplicação
            return data.map(reg => ({
                id: reg.id,
                cidade: reg.cidade,
                tecnico: reg.tecnico,
                auxiliar: reg.auxiliar || '',
                placa: reg.placa || '',
                modelo: reg.modelo || '',
                operacao: reg.operacao,
                equipes: reg.equipes || '',
                kmAtual: reg.km_atual || '',
                ultimaTrocaOleo: reg.ultima_troca_oleo || '',
                renavam: reg.renavam || '',
                lat: reg.latitude || '',
                lng: reg.longitude || '',
                observacoes: reg.observacoes || '',
                dataInicioContrato: reg.data_inicio_contrato ? new Date(reg.data_inicio_contrato) : null,
                manutencoes: reg.manutencoes || []
            }));
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            return [];
        }
    }
    
    /**
     * Salva um registro no banco
     * @param {Object} registro - Dados do registro
     * @returns {Promise<Object>} Registro criado
     */
    async salvarRegistro(registro) {
        await this.init();
        
        try {
            // Converter para o formato do banco
            const registroDb = {
                cidade: registro.cidade,
                tecnico: registro.tecnico,
                auxiliar: registro.auxiliar,
                placa: registro.placa,
                modelo: registro.modelo,
                operacao: registro.operacao,
                equipes: registro.equipes,
                km_atual: registro.kmAtual,
                ultima_troca_oleo: registro.ultimaTrocaOleo,
                renavam: registro.renavam,
                latitude: registro.lat,
                longitude: registro.lng,
                observacoes: registro.observacoes,
                data_inicio_contrato: registro.dataInicioContrato
            };
            
            // Verifica se tem ID (atualizar) ou não (criar)
            if (registro.id) {
                // Atualização
                const { data, error } = await this.supabase
                    .from('registros')
                    .update(registroDb)
                    .eq('id', registro.id)
                    .select('*')
                    .single();
                    
                if (error) throw error;
                return this._formatarRegistroBD(data);
            } else {
                // Criação
                const { data, error } = await this.supabase
                    .from('registros')
                    .insert(registroDb)
                    .select('*')
                    .single();
                    
                if (error) throw error;
                return this._formatarRegistroBD(data);
            }
        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            throw error;
        }
    }
    
    /**
     * Exclui um registro do banco
     * @param {number} id - ID do registro
     * @returns {Promise<boolean>} Sucesso da operação
     */
    async excluirRegistro(id) {
        await this.init();
        
        try {
            const { error } = await this.supabase
                .from('registros')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao excluir registro:', error);
            return false;
        }
    }
    
    /**
     * Adiciona uma manutenção ao registro
     * @param {number} registroId - ID do registro
     * @param {Object} manutencao - Dados da manutenção
     * @returns {Promise<Object>} Manutenção criada
     */
    async adicionarManutencao(registroId, manutencao) {
        await this.init();
        
        try {
            const manutencaoDb = {
                registro_id: registroId,
                tipo_manutencao: manutencao.tipo,
                data: manutencao.data,
                km_atual: manutencao.kmAtual,
                valor: manutencao.valor,
                observacoes: manutencao.observacoes
            };
            
            const { data, error } = await this.supabase
                .from('manutencoes')
                .insert(manutencaoDb)
                .select('*')
                .single();
                
            if (error) throw error;
            
            return {
                id: data.id,
                tipo: data.tipo_manutencao,
                data: new Date(data.data),
                kmAtual: data.km_atual,
                valor: data.valor,
                observacoes: data.observacoes
            };
        } catch (error) {
            console.error('Erro ao adicionar manutenção:', error);
            throw error;
        }
    }
    
    /**
     * Registra uma importação de CSV no banco
     * @param {Object} importacao - Dados da importação
     * @returns {Promise<Object>} Importação registrada
     */
    async registrarImportacaoCSV(importacao) {
        await this.init();
        
        try {
            const importacaoDb = {
                nome_arquivo: importacao.nomeArquivo,
                registros_importados: importacao.registrosImportados,
                registros_duplicados: importacao.registrosDuplicados,
                registros_com_problema: importacao.registrosComProblema,
                linhas_ignoradas: importacao.linhasIgnoradas,
                arquivo_original: importacao.arquivoOriginal
            };
            
            const { data, error } = await this.supabase
                .from('importacoes_csv')
                .insert(importacaoDb)
                .select('*')
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao registrar importação CSV:', error);
            return null;
        }
    }
    
    /**
     * Calcula estatísticas do sistema
     * @param {Object} filtros - Filtros a aplicar
     * @returns {Promise<Object>} Estatísticas calculadas
     */
    async calcularEstatisticas(filtros = {}) {
        await this.init();
        
        try {
            // Buscar registros (filtrados ou não)
            let query = this.supabase.from('registros').select('*');
            
            if (filtros.operacao) {
                query = query.eq('operacao', filtros.operacao);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Calcular métricas
            const tecnicosUnicos = new Set();
            const auxiliaresUnicos = new Set();
            const veiculosUnicos = new Set();
            const cidadesUnicas = new Set();
            const bjfibraTecnicos = new Set();
            const bjfibraAuxiliares = new Set();
            const bjfibraVeiculos = new Set();
            const megalinkTecnicos = new Set();
            const megalinkAuxiliares = new Set();
            const megalinkVeiculos = new Set();
            
            data.forEach(reg => {
                // Estatísticas gerais
                if (reg.tecnico) tecnicosUnicos.add(reg.tecnico.toLowerCase().trim());
                if (reg.auxiliar) auxiliaresUnicos.add(reg.auxiliar.toLowerCase().trim());
                if (reg.placa) veiculosUnicos.add(reg.placa.toUpperCase().trim());
                if (reg.cidade) cidadesUnicas.add(reg.cidade.toLowerCase().trim());
                
                // Estatísticas por operação
                if (reg.operacao === 'BJ Fibra') {
                    if (reg.tecnico) bjfibraTecnicos.add(reg.tecnico.toLowerCase().trim());
                    if (reg.auxiliar) bjfibraAuxiliares.add(reg.auxiliar.toLowerCase().trim());
                    if (reg.placa) bjfibraVeiculos.add(reg.placa.toUpperCase().trim());
                } else if (reg.operacao === 'Megalink') {
                    if (reg.tecnico) megalinkTecnicos.add(reg.tecnico.toLowerCase().trim());
                    if (reg.auxiliar) megalinkAuxiliares.add(reg.auxiliar.toLowerCase().trim());
                    if (reg.placa) megalinkVeiculos.add(reg.placa.toUpperCase().trim());
                }
            });
            
            return {
                totalTecnicos: tecnicosUnicos.size + auxiliaresUnicos.size,
                totalVeiculos: veiculosUnicos.size,
                totalCidades: cidadesUnicas.size,
                bjfibraCount: bjfibraTecnicos.size + bjfibraAuxiliares.size,
                megalinkCount: megalinkTecnicos.size + megalinkAuxiliares.size,
                bjfibraVeiculosCount: bjfibraVeiculos.size,
                megalinkVeiculosCount: megalinkVeiculos.size,
                registrosData: data
            };
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            return {
                totalTecnicos: 0,
                totalVeiculos: 0,
                totalCidades: 0,
                bjfibraCount: 0,
                megalinkCount: 0,
                bjfibraVeiculosCount: 0,
                megalinkVeiculosCount: 0,
                registrosData: []
            };
        }
    }
    
    /**
     * Formata um registro vindo do BD para o formato da aplicação
     * @private
     * @param {Object} dbRecord - Registro do banco
     * @returns {Object} Registro formatado
     */
    _formatarRegistroBD(dbRecord) {
        return {
            id: dbRecord.id,
            cidade: dbRecord.cidade,
            tecnico: dbRecord.tecnico,
            auxiliar: dbRecord.auxiliar || '',
            placa: dbRecord.placa || '',
            modelo: dbRecord.modelo || '',
            operacao: dbRecord.operacao,
            equipes: dbRecord.equipes || '',
            kmAtual: dbRecord.km_atual || '',
            ultimaTrocaOleo: dbRecord.ultima_troca_oleo || '',
            renavam: dbRecord.renavam || '',
            lat: dbRecord.latitude || '',
            lng: dbRecord.longitude || '',
            observacoes: dbRecord.observacoes || '',
            dataInicioContrato: dbRecord.data_inicio_contrato ? new Date(dbRecord.data_inicio_contrato) : null,
            manutencoes: []
        };
    }
}

// Instância global para uso na aplicação
const supabaseDB = new SupabaseDB();

// Exporta a instância para uso em outros arquivos
window.supabaseDB = supabaseDB; 