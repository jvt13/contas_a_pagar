const pool = require('../conexao'); // Importa a conexão com o banco

const insert = async (nome, tipo_cartao, vencimento, dia_util, numero_parcelas) => {
    console.log(`Inserindo cartão: ${nome}, ${tipo_cartao}, ${vencimento}, ${dia_util}, ${numero_parcelas}`);
    const sql = 'INSERT INTO tipo_cartao (nome, tipo_cartao, vencimento, dia_util, numero_parcelas) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    
    try {
        const res = await pool.query(sql, [nome, tipo_cartao, vencimento, dia_util, numero_parcelas]);
        console.log('Novo tipo de cartão inserido com ID:', res.rows[0].id);
        return res.rows[0];
    } catch (err) {
        console.error(err);
        throw err;
    }
};

const selectAll = async () => {
    const sql = 'SELECT * FROM tipo_cartao ORDER BY nome';

    try {
        const res = await pool.query(sql);
        //console.log('Cartões encontrados:', res.rows);
        return res.rows;
    } catch (err) {
        console.error('Erro ao buscar cartões:', err);
        throw err;
    }
};

// Para selecionar um específico por ID
const selectId = async (id) => {
    const sql = 'SELECT * FROM tipo_cartao WHERE id = $1';

    try {
        const res = await pool.query(sql, [id]);
        //console.log('Cartão encontrado:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao buscar cartão:', err);
        throw err;
    }
};

const update = async (id, nome, tipo_cartao, vencimento, dia_util, numero_parcelas) => {
    numero_parcelas = 0; // Definindo o valor padrão para numero_parcelas
    const sql = 'UPDATE tipo_cartao SET nome = $1, tipo_cartao = $2, vencimento = $3, dia_util = $4, numero_parcelas = $5 WHERE id = $6 RETURNING *';
    
    try {
        const res = await pool.query(sql, [nome, tipo_cartao, vencimento, dia_util, numero_parcelas, id]);
        console.log('Cartão atualizado:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao atualizar cartão:', err);
        throw err;
    }
};

const deleteId = async (id) => {
    const sql = 'DELETE FROM tipo_cartao WHERE id = $1 RETURNING *';

    try {
        const res = await pool.query(sql, [id]);
        console.log('Cartão excluído:', res.rows[0]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao excluir cartão:', err);
        throw err;
    }
};

module.exports = {
    insert,
    selectAll,
    selectId,
    update,
    deleteId
};