// database/models/query_config.js
import pool from '../conexao.js';

/**
 * Insere um novo tipo de cartão no banco de dados.
 * @param {string} nome - Nome do cartão.
 * @param {string} tipo_cartao - Tipo do cartão.
 * @param {string} vencimento - Data de vencimento.
 * @param {number} dia_util - Dia útil do cartão.
 * @param {number} numero_parcelas - Número de parcelas.
 * @returns {Promise<Object>} Objeto com o ID do novo registro.
 */
export async function insert(nome, tipo_cartao, vencimento, dia_util, numero_parcelas) {
    console.log(`Inserindo cartão: ${nome}, ${tipo_cartao}, ${vencimento}, ${dia_util}, ${numero_parcelas}`);
    const sql = `
    INSERT INTO tipo_cartao (nome, tipo_cartao, vencimento, dia_util, numero_parcelas)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

    try {
        const res = await pool.query(sql, [nome, tipo_cartao, vencimento, dia_util, numero_parcelas]);
        console.log('Novo tipo de cartão inserido com ID:', res.rows[0].id);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao inserir tipo de cartão:', err);
        throw err;
    }
}

/**
 * Retorna todos os tipos de cartão cadastrados.
 * @returns {Promise<Array>} Lista de cartões.
 */
export async function selectAll() {
    const sql = 'SELECT * FROM tipo_cartao ORDER BY nome';

    try {
        const res = await pool.query(sql);
        return res.rows;
    } catch (err) {
        console.error('Erro ao buscar cartões:', err);
        throw err;
    }
}

/**
 * Retorna um tipo de cartão específico pelo ID.
 * @param {number} id - ID do cartão.
 * @returns {Promise<Object>} Dados do cartão.
 */
export async function selectId(id) {
    const sql = 'SELECT * FROM tipo_cartao WHERE id = $1';

    try {
        const res = await pool.query(sql, [id]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao buscar cartão:', err);
        throw err;
    }
}

/**
 * Atualiza um tipo de cartão existente.
 * @param {number} id - ID do cartão.
 * @param {string} nome - Novo nome.
 * @param {string} tipo_cartao - Novo tipo.
 * @param {string} vencimento - Novo vencimento.
 * @param {number} dia_util - Novo dia útil.
 * @param {number} numero_parcelas - Novo número de parcelas.
 * @returns {Promise<Object>} Dados atualizados.
 */
export async function update(id, nome, tipo_cartao, vencimento, dia_util, numero_parcelas) {
    // Define valor padrão para numero_parcelas se necessário
    const sql = `
    UPDATE tipo_cartao
    SET nome = $1, tipo_cartao = $2, vencimento = $3, dia_util = $4, numero_parcelas = $5
    WHERE id = $6
    RETURNING *
  `;

    try {
        const res = await pool.query(sql, [nome, tipo_cartao, vencimento, dia_util, numero_parcelas, id]);
        console.log('Cartão atualizado:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao atualizar cartão:', err);
        throw err;
    }
}

/**
 * Exclui um tipo de cartão pelo ID.
 * @param {number} id - ID do cartão.
 * @returns {Promise<Object>} Dados do cartão excluído.
 */
export async function deleteId(id) {
    const sql = 'DELETE FROM tipo_cartao WHERE id = $1 RETURNING *';

    try {
        const res = await pool.query(sql, [id]);
        console.log('Cartão excluído:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao excluir cartão:', err);
        throw err;
    }
}