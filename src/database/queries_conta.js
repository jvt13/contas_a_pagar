// database/queries_contas.js
const pool = require('./conexao'); // Importa a conexão com o banco
const { format } = require('date-fns');

/**
 * Função para obter todas as contas do banco de dados.
 * @param {number} mes - Mês para filtrar os resultados (opcional).
 * @returns {Promise<Array>} Lista de contas.
 */
const getContas = async (mes, ano) => {
    const result = await pool.query(`
        SELECT * FROM contas
        WHERE ($1::int IS NULL OR EXTRACT(MONTH FROM vencimento) = $1::int)
        AND ($2::int IS NULL OR EXTRACT(YEAR FROM vencimento) = $2::int)
    `, [mes ? parseInt(mes) : null, ano ? parseInt(ano) : null]);

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
    await pool.query('INSERT INTO contas (nome, vencimento, valor, paga) VALUES ($1, $2, $3, FALSE)', [
        conta.nome,
        conta.vencimento,
        conta.valor
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

const getLimite = async (mes, ano) => {
    const query = 'SELECT id, limite FROM public.limites WHERE mes = $1 AND ano = $2 LIMIT 1';
    const result = await pool.query(query, [mes, ano]);

    console.log('Resultado da consulta:', result.rows); // Logando o resultado da consulta

    if (result.rows.length > 0) {
        return { id: result.rows[0].id, limite: result.rows[0].limite }; // Retornando o id juntamente com o limite
    }
    return null; // Retornando null se não encontrado
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
    getAnos
};
