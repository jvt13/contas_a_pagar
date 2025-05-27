// src/database/models/query_users.js
import pool from '../conexao.js';
import crypto from 'crypto';

const MAX_RETRIES = 5;

/** Retorna todos os usuários ordenados por nome */
export async function selectAll() {
    const sql = 'SELECT * FROM users ORDER BY nome';
    try {
        const res = await pool.query(sql);
        return res.rows;
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        throw err;
    }
}

/** Retorna um usuário pelo ID */
export async function selectId(id) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    try {
        const res = await pool.query(sql, [id]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        throw err;
    }
}

/** Retorna um usuário pelo email */
export async function selectEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    try {
        const res = await pool.query(sql, [email]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao buscar usuário por email:', err);
        throw err;
    }
}

/** Insere um novo usuário */
export async function insert(name, userName, email, salt, hash, userAgent) {
    const sql = `
    INSERT INTO users (nome_completo, username, email, salt, hash, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
    try {
        const res = await pool.query(sql, [name, userName, email, salt, hash, userAgent]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao inserir usuário:', err);
        throw err;
    }
}

/** Atualiza dados de um usuário */
export async function update(id, nome, email, senha) {
    const sql = `
    UPDATE users SET nome = $1, email = $2, senha = $3
    WHERE id = $4 RETURNING *
  `;
    try {
        const res = await pool.query(sql, [nome, email, senha, id]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        throw err;
    }
}

/** Exclui um usuário pelo ID */
export async function deleteId(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING *';
    try {
        const res = await pool.query(sql, [id]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        throw err;
    }
}

/** Autentica um usuário por email e senha */
export async function auth(email, senha) {
    const sql = 'SELECT * FROM users WHERE email = $1 AND senha = $2';
    try {
        const res = await pool.query(sql, [email, senha]);
        return res.rows[0] || null;
    } catch (err) {
        console.error('Erro ao autenticar usuário:', err);
        throw err;
    }
}

/** Cria uma nova organização com chave única */
export async function createOrganization() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const chave = crypto.randomBytes(8).toString('hex');
        try {
            const { rows } = await pool.query(
                `INSERT INTO organizations (chave) VALUES ($1) RETURNING id, chave`,
                [chave]
            );
            return rows[0];
        } catch (err) {
            if (err.code === '23505' && attempt < MAX_RETRIES) {
                console.warn(`Chave duplicada, tentativa ${attempt}`);
                continue;
            }
            console.error('Erro ao criar organização:', err);
            throw err;
        }
    }
    throw new Error('Falha ao gerar chave única de organização após várias tentativas.');
}

/** Atualiza a organização de um usuário */
export async function updateUserOrganization(userId, organizationId) {
    const sql = `
    UPDATE users SET organizacao = $1, organizacao_compartilhada = $1 WHERE id = $2 RETURNING *
  `;
    try {
        const res = await pool.query(sql, [organizationId, userId]);
        return res.rows[0];
    } catch (err) {
        console.error('Erro ao atualizar organização do usuário:', err);
        throw err;
    }
}

export async function updateUserSharedOrganization(userId, sharedOrgId) {
    const { rows } = await pool.query(
        `UPDATE users
     SET organizacao_compartilhada = $1
     WHERE id = $2
     RETURNING *`,
        [sharedOrgId, userId]
    );
    return rows[0];
}

export async function findOrganizationByKey(key) {
    console.log("Chave para consulta: " + key)
    const sql = 'SELECT id FROM organizations WHERE chave = $1';
    const { rows } = await pool.query(sql, [key]);
    return rows[0]?.id || null;
}

export async function findOrganizationById(id) {
    const sql = 'SELECT chave FROM organizations WHERE id = $1'
    const { rows } = await pool.query(sql, [id]);

    return rows[0]?.chave || null;
}