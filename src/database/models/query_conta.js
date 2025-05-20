// database/queries_contas.js
const pool = require('../conexao'); // Importa a conexão com o banco
const { format } = require('date-fns');
const {formatarParaBRL} = require('../../utils/util'); // Importa funções utilitárias

/**
 * Função para obter todas as contas do banco de dados.
 * @param {number} mes - Mês para filtrar os resultados (opcional).
 * @returns {Promise<Array>} Lista de contas.
 */
const getContas = async (mes, ano) => {
    const mesInt = Number.isInteger(parseInt(mes)) ? parseInt(mes) : null;
    const anoInt = Number.isInteger(parseInt(ano)) ? parseInt(ano) : null;

    const result = await pool.query(`
        SELECT * FROM contas
        WHERE ($1::int IS NULL OR EXTRACT(MONTH FROM vencimento) = $1::int)
        AND ($2::int IS NULL OR EXTRACT(YEAR FROM vencimento) = $2::int) ORDER BY vencimento
    `, [mesInt, anoInt]);

    return result.rows.map(conta => ({
        ...conta,
        valor: parseFloat(conta.valor) || 0,
        vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy') // Formata a data
    }));
};

/**
 * Função para adicionar uma nova conta ao banco de dados.
 * @param {Object} conta - Objeto com os dados da conta.
 * @returns {Promise<void>}
 */
const addConta = async (conta) => {
    console.log('Adicionando conta:', conta);
    await pool.query('INSERT INTO contas (nome, vencimento, valor, categoria, tipo_cartao, paga) VALUES ($1, $2, $3, $4, $5, FALSE)', [
        conta.nome,
        conta.dataFormatada,
        conta.valor_convertido,
        conta.categoria,
        conta.tipo_cartao
    ]);
};

/**
 * Função para atualizar o status de uma conta no banco de dados.
 * @param {number} id - ID da conta a ser atualizada.
 * @param {boolean} status - Novo status da conta (paga ou pendente).
 * @returns {Promise<void>}
 */
const updateContas = async (id, status) => {
    await pool.query('UPDATE contas SET paga = $2 WHERE id = $1', [id, status]);
};

/**
 * Função para obter contas pagas do banco de dados.
 * @returns {Promise<Array>} Lista de contas pagas.
 */
const getContasPagas = async () => {
    const result = await pool.query('SELECT * FROM contas WHERE paga = TRUE');
    return result.rows.map(conta => ({
        ...conta,
        valor: parseFloat(conta.valor) || 0,
        vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
    }));
};

/**
 * Função para obter contas pendentes do banco de dados.
 * @returns {Promise<Array>} Lista de contas pendentes.
 */
const getContasPendentes = async () => {
    const result = await pool.query('SELECT * FROM contas WHERE paga = FALSE');
    return result.rows.map(conta => ({
        ...conta,
        valor: parseFloat(conta.valor) || 0,
        vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
    }));
};

const getLimiteAll = async (mes, ano) => {
    const query = 'SELECT DISTINCT limite';
    const result = await pool.query(query);

    if (result.rows.length > 0) {
        return result.rows[0].limite;
    }
    return 0;
}

const isValidInteger = (val) => {
    if (typeof val === 'string' || typeof val === 'number') {
        const parsed = parseInt(val);
        return !isNaN(parsed) ? parsed : null;
    }
    return null;
};

const getLimite = async (mes, ano) => {
    console.log(`Ano: ${ano.ano} Mês: ${mes}`)
    // Corrigindo a conversão dos valores
    const mesInt = parseInt(mes);
    const anoInt = parseInt(ano);

    // Verifica se mesInt ou anoInt são NaN
    if (isNaN(mesInt) || isNaN(anoInt)) {
        throw new Error('O mês ou o ano fornecido não são válidos.');
    }

    const query = 'SELECT id, limite FROM public.limites WHERE mes = $1 AND ano = $2 LIMIT 1';
    const result = await pool.query(query, [mesInt, anoInt]);

    if (result.rows.length > 0) {
        return { id: result.rows[0].id, limite: result.rows[0].limite };
    }
    return null;
};

const insertLimite = async (mes, ano, limite) => {
    const query = 'INSERT INTO public.limites (mes, ano, limite) VALUES ($1, $2, $3) RETURNING id';

    console.log(`Mês ${mes}/${ano} limite: ${limite}`)
    try {
        const result = await pool.query(query, [mes, ano, limite]);
        if (result.rows.length > 0) {
            return result.rows[0].id; // Retorna o ID do novo limite inserido
        }
        throw new Error('Erro ao inserir limite, nenhum ID retornado.');
    } catch (error) {
        console.error('Erro durante a inserção:', error);
        throw new Error('Falha na inserção do limite: ' + error.message); // Lançar um erro detalhado
    }
};


const updateLimite = async (id, limite) => {
    const query = 'UPDATE public.limites SET limite = $1 WHERE id = $2 RETURNING *';
    console.log('Executando update com id:', id, 'limite:', limite);
    const result = await pool.query(query, [limite, id]);

    console.log('Resultado do update:', result.rows);
    if (result.rows.length > 0) {
        return result.rows[0]; // Retorna a linha atualizada
    }
    return null; // Retorna null se a atualização não afetou nenhuma linha
};


const getAnos = async () => {
    const result = await pool.query("SELECT DISTINCT ano FROM public.limites order by ano desc"); // Exemplo
    return result.rows; // Certifique-se que isso retorna um array
};

const excluirConta = async (id) => {
    const query = 'DELETE FROM contas WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
        return true; // Conta excluída com sucesso
    } else {
        return false; // Nenhuma conta excluída (ID não encontrado)
    }
};

const getContaID = async (id) => {
    const query = `SELECT id, nome, TO_CHAR(vencimento, 'YYYY-MM-DD') as vencimento, valor, categoria, tipo_cartao 
                    FROM contas 
                    WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    console.log('Resultado da consulta:', result.rows.length);
    if (result.rows.length > 0) {
        console.log('Conta encontrada:', result.rows[0].nome);
        return result.rows[0]; // Retorna a conta encontrada
    } else {
        return null; // Nenhuma conta encontrada com o ID fornecido
    }
};


module.exports = {
    getContas,
    addConta,
    updateContas,
    getContasPagas,
    getContasPendentes,
    insertLimite,
    updateLimite,
    getLimite,
    getLimiteAll,
    getAnos,
    excluirConta,
    getContaID
};
