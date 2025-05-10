/**
 * Sistema de Armazenamento Offline
 * Gerencia o armazenamento de dados quando o servidor não está disponível
 */

const OfflineStorage = {
    /**
     * Configurações do sistema
     */
    config: {
        prefix: 'offline_',
        tables: ['users', 'permissions'],
        maxStorageSize: 5 * 1024 * 1024, // 5MB
        compressionEnabled: true
    },

    /**
     * Inicializa o sistema de armazenamento offline
     * @param {Object} options - Opções de configuração
     * @returns {OfflineStorage} Instância do sistema
     */
    init(options = {}) {
        console.log('Inicializando sistema de armazenamento offline...');
        
        // Aplicar opções
        this.config = { ...this.config, ...options };
        
        // Verificar disponibilidade do localStorage
        if (!this.isLocalStorageAvailable()) {
            console.error('LocalStorage não está disponível. Armazenamento offline não funcionará.');
            return this;
        }
        
        // Inicializar tabelas
        this.initializeTables();
        
        console.log('Sistema de armazenamento offline inicializado.');
        return this;
    },
    
    /**
     * Verifica se o localStorage está disponível
     * @returns {boolean} true se disponível, false caso contrário
     */
    isLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Inicializa as tabelas no localStorage
     */
    initializeTables() {
        this.config.tables.forEach(table => {
            const key = `${this.config.prefix}${table}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
    },
    
    /**
     * Obtém o nome da chave para uma tabela
     * @param {string} table - Nome da tabela
     * @returns {string} Nome da chave no localStorage
     */
    getTableKey(table) {
        return `${this.config.prefix}${table}`;
    },
    
    /**
     * Busca todos os registros de uma tabela
     * @param {string} table - Nome da tabela
     * @returns {Array} Registros encontrados
     */
    getAll(table) {
        try {
            const key = this.getTableKey(table);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Erro ao buscar registros da tabela ${table}:`, error);
            return [];
        }
    },
    
    /**
     * Busca um registro por ID
     * @param {string} table - Nome da tabela
     * @param {string|number} id - ID do registro
     * @returns {Object|null} Registro encontrado ou null
     */
    getById(table, id) {
        try {
            const records = this.getAll(table);
            return records.find(record => record.id == id) || null;
        } catch (error) {
            console.error(`Erro ao buscar registro ${id} da tabela ${table}:`, error);
            return null;
        }
    },
    
    /**
     * Busca registros por um campo específico
     * @param {string} table - Nome da tabela
     * @param {string} field - Campo para filtrar
     * @param {*} value - Valor para comparar
     * @returns {Array} Registros encontrados
     */
    getByField(table, field, value) {
        try {
            const records = this.getAll(table);
            return records.filter(record => record[field] === value);
        } catch (error) {
            console.error(`Erro ao buscar registros na tabela ${table} por ${field}:`, error);
            return [];
        }
    },
    
    /**
     * Insere um novo registro
     * @param {string} table - Nome da tabela
     * @param {Object} data - Dados do registro
     * @returns {Object} Registro inserido com ID
     */
    insert(table, data) {
        try {
            const records = this.getAll(table);
            
            // Gerar ID temporário se não fornecido
            const newRecord = {
                ...data,
                id: data.id || `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                created_at: data.created_at || new Date().toISOString(),
                updated_at: data.updated_at || new Date().toISOString()
            };
            
            // Adicionar à tabela
            records.push(newRecord);
            
            // Salvar no localStorage
            localStorage.setItem(this.getTableKey(table), JSON.stringify(records));
            
            return newRecord;
        } catch (error) {
            console.error(`Erro ao inserir registro na tabela ${table}:`, error);
            throw error;
        }
    },
    
    /**
     * Atualiza um registro existente
     * @param {string} table - Nome da tabela
     * @param {string|number} id - ID do registro
     * @param {Object} data - Novos dados
     * @returns {Object|null} Registro atualizado ou null se não encontrado
     */
    update(table, id, data) {
        try {
            const records = this.getAll(table);
            const index = records.findIndex(record => record.id == id);
            
            if (index === -1) {
                console.warn(`Registro ${id} não encontrado na tabela ${table}.`);
                return null;
            }
            
            // Atualizar registro
            const updatedRecord = {
                ...records[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            
            records[index] = updatedRecord;
            
            // Salvar no localStorage
            localStorage.setItem(this.getTableKey(table), JSON.stringify(records));
            
            return updatedRecord;
        } catch (error) {
            console.error(`Erro ao atualizar registro ${id} na tabela ${table}:`, error);
            throw error;
        }
    },
    
    /**
     * Remove um registro
     * @param {string} table - Nome da tabela
     * @param {string|number} id - ID do registro
     * @returns {boolean} true se removido, false caso contrário
     */
    remove(table, id) {
        try {
            const records = this.getAll(table);
            const filteredRecords = records.filter(record => record.id != id);
            
            if (filteredRecords.length === records.length) {
                console.warn(`Registro ${id} não encontrado na tabela ${table}.`);
                return false;
            }
            
            // Salvar no localStorage
            localStorage.setItem(this.getTableKey(table), JSON.stringify(filteredRecords));
            
            return true;
        } catch (error) {
            console.error(`Erro ao remover registro ${id} da tabela ${table}:`, error);
            throw error;
        }
    },
    
    /**
     * Limpa todos os registros de uma tabela
     * @param {string} table - Nome da tabela
     * @returns {boolean} true se sucesso, false caso contrário
     */
    clearTable(table) {
        try {
            localStorage.setItem(this.getTableKey(table), JSON.stringify([]));
            return true;
        } catch (error) {
            console.error(`Erro ao limpar tabela ${table}:`, error);
            return false;
        }
    },
    
    /**
     * Limpa todo o armazenamento offline
     * @returns {boolean} true se sucesso, false caso contrário
     */
    clearAll() {
        try {
            this.config.tables.forEach(table => {
                this.clearTable(table);
            });
            return true;
        } catch (error) {
            console.error('Erro ao limpar armazenamento offline:', error);
            return false;
        }
    },
    
    /**
     * Verifica o tamanho atual do armazenamento
     * @returns {number} Tamanho em bytes
     */
    getStorageSize() {
        let size = 0;
        
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                size += localStorage.getItem(key).length * 2; // 2 bytes por caractere
            }
        }
        
        return size;
    },
    
    /**
     * Verifica se o armazenamento está próximo do limite
     * @returns {boolean} true se próximo do limite, false caso contrário
     */
    isStorageNearLimit() {
        const currentSize = this.getStorageSize();
        const limit = this.config.maxStorageSize;
        
        // Considerar próximo do limite se >= 90% da capacidade
        return currentSize >= limit * 0.9;
    },
    
    /**
     * Importa dados para o armazenamento offline
     * @param {string} table - Nome da tabela
     * @param {Array} data - Dados a serem importados
     */
    importData(table, data) {
        try {
            if (!Array.isArray(data)) {
                console.error(`Dados inválidos para importação na tabela ${table}. Esperado um array.`);
                return false;
            }
            
            // Verificar se a tabela existe
            if (!this.config.tables.includes(table)) {
                // Adicionar à lista de tabelas
                this.config.tables.push(table);
            }
            
            // Atualizar dados existentes
            localStorage.setItem(this.getTableKey(table), JSON.stringify(data));
            
            return true;
        } catch (error) {
            console.error(`Erro ao importar dados para a tabela ${table}:`, error);
            return false;
        }
    },
    
    /**
     * Exporta dados do armazenamento offline
     * @param {string} table - Nome da tabela
     * @returns {Array} Dados exportados
     */
    exportData(table) {
        return this.getAll(table);
    },
    
    /**
     * Comprime dados para armazenamento
     * @param {Object} data - Dados a serem comprimidos
     * @returns {string} Dados comprimidos
     */
    compressData(data) {
        // Implementação simples, sem compressão real
        return JSON.stringify(data);
    },
    
    /**
     * Descomprime dados do armazenamento
     * @param {string} compressedData - Dados comprimidos
     * @returns {Object} Dados descomprimidos
     */
    decompressData(compressedData) {
        // Implementação simples, sem descompressão real
        return JSON.parse(compressedData);
    }
};

// Inicializar automaticamente e expor globalmente
window.OfflineStorage = OfflineStorage;
document.addEventListener('DOMContentLoaded', () => OfflineStorage.init()); 