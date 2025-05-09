/**
 * Serviço para integração com Supabase
 * Gerencia todas as operações relacionadas aos registros de técnicos e veículos
 */

// Importação da configuração do Supabase
import SUPABASE_CONFIG from '../config.js';

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    /**
     * Inicializa o cliente Supabase
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Carrega dinamicamente a biblioteca Supabase
            if (!window.supabase) {
                console.log('Carregando biblioteca Supabase...');
                await this.loadSupabaseLibrary();
            }
            
            // Cria o cliente Supabase
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.key
            );
            
            this.initialized = true;
            console.log('Cliente Supabase inicializado com sucesso');
            
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Supabase:', error);
            return false;
        }
    }

    /**
     * Carrega a biblioteca Supabase dinamicamente
     */
    loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/umd/supabase.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Falha ao carregar biblioteca Supabase'));
            document.head.appendChild(script);
        });
    }

    /**
     * Obtém todos os registros com filtros opcionais
     * @param {Object} filters - Filtros opcionais (cidade, tecnico, operacao)
     * @returns {Array} - Lista de registros
     */
    async getRegistros(filters = {}) {
        await this.init();
        
        try {
            let query = this.supabase.from('registros').select('*, manutencoes(*)');
            
            // Aplicar filtros se fornecidos
            if (filters.cidade) query = query.ilike('cidade', `%${filters.cidade}%`);
            if (filters.tecnico) query = query.ilike('tecnico', `%${filters.tecnico}%`);
            if (filters.operacao) query = query.eq('operacao', filters.operacao);
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Formatar registros para compatibilidade com o formato atual
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
            console.error('Erro ao buscar registros:', error);
            return [];
        }
    }

    /**
     * Cria um novo registro
     * @param {Object} registro - Dados do registro
     * @returns {Object} - Registro criado
     */
    async createRegistro(registro) {
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
            
            const { data, error } = await this.supabase
                .from('registros')
                .insert(registroDb)
                .select('*')
                .single();
            
            if (error) throw error;
            
            // Retornar registro no formato da aplicação
            return {
                id: data.id,
                cidade: data.cidade,
                tecnico: data.tecnico,
                auxiliar: data.auxiliar || '',
                placa: data.placa || '',
                modelo: data.modelo || '',
                operacao: data.operacao,
                equipes: data.equipes || '',
                kmAtual: data.km_atual || '',
                ultimaTrocaOleo: data.ultima_troca_oleo || '',
                renavam: data.renavam || '',
                lat: data.latitude || '',
                lng: data.longitude || '',
                observacoes: data.observacoes || '',
                dataInicioContrato: data.data_inicio_contrato ? new Date(data.data_inicio_contrato) : null,
                manutencoes: []
            };
        } catch (error) {
            console.error('Erro ao criar registro:', error);
            throw error;
        }
    }

    /**
     * Atualiza um registro existente
     * @param {number} id - ID do registro
     * @param {Object} registro - Dados atualizados
     * @returns {Object} - Registro atualizado
     */
    async updateRegistro(id, registro) {
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
            
            const { data, error } = await this.supabase
                .from('registros')
                .update(registroDb)
                .eq('id', id)
                .select('*')
                .single();
            
            if (error) throw error;
            
            return {
                id: data.id,
                cidade: data.cidade,
                tecnico: data.tecnico,
                auxiliar: data.auxiliar || '',
                placa: data.placa || '',
                modelo: data.modelo || '',
                operacao: data.operacao,
                equipes: data.equipes || '',
                kmAtual: data.km_atual || '',
                ultimaTrocaOleo: data.ultima_troca_oleo || '',
                renavam: data.renavam || '',
                lat: data.latitude || '',
                lng: data.longitude || '',
                observacoes: data.observacoes || '',
                dataInicioContrato: data.data_inicio_contrato ? new Date(data.data_inicio_contrato) : null,
                manutencoes: registro.manutencoes || []
            };
        } catch (error) {
            console.error('Erro ao atualizar registro:', error);
            throw error;
        }
    }

    /**
     * Exclui um registro
     * @param {number} id - ID do registro
     * @returns {boolean} - Sucesso da operação
     */
    async deleteRegistro(id) {
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
     * Adiciona uma manutenção a um registro
     * @param {number} registroId - ID do registro
     * @param {Object} manutencao - Dados da manutenção
     * @returns {Object} - Manutenção criada
     */
    async addManutencao(registroId, manutencao) {
        await this.init();
        
        try {
            const manutencaoDb = {
                registro_id: registroId,
                tipo_manutencao: manutencao.tipoManutencao,
                data: manutencao.data,
                km_atual: manutencao.kmAtual,
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
                tipoManutencao: data.tipo_manutencao,
                data: new Date(data.data),
                kmAtual: data.km_atual,
                observacoes: data.observacoes
            };
        } catch (error) {
            console.error('Erro ao adicionar manutenção:', error);
            throw error;
        }
    }

    /**
     * Registra uma importação de CSV
     * @param {Object} importacao - Dados da importação
     * @returns {Object} - Importação registrada
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
                .select();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Erro ao registrar importação CSV:', error);
            return null;
        }
    }

    /**
     * Calcula estatísticas a partir dos registros
     * @param {Object} filtros - Filtros opcionais (operacao)
     * @returns {Object} - Estatísticas calculadas
     */
    async calcularEstatisticas(filtros = {}) {
        await this.init();
        
        try {
            // Buscar todos os registros (ou filtrados por operação)
            let query = this.supabase.from('registros').select('*');
            if (filtros.operacao) {
                query = query.eq('operacao', filtros.operacao);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Calcular estatísticas
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
                registrosData: data // Dados brutos para cálculos adicionais
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
}

// Instância global do serviço
const supabaseService = new SupabaseService();

export default supabaseService; 