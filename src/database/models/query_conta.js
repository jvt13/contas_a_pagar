// database/queries_contas.js
import pool from '../conexao.js';
import { format } from 'date-fns';
import { formatarParaBRL } from '../../utils/util.js';

/**
 * Função para obter todas as contas do banco de dados.
 * @param {number} mes - Mês para filtrar os resultados (opcional).
 * @param {number} ano - Ano para filtrar os resultados (opcional).
 * @returns {Promise<Array>} Lista de contas.
 */
export async function getContas(mes, ano, organization) {
  const mesInt = Number.isInteger(parseInt(mes)) ? parseInt(mes) : null;
  const anoInt = Number.isInteger(parseInt(ano)) ? parseInt(ano) : null;
  const key_share = organization;

  console.log("Chave: " + key_share)

  const query = `
                SELECT 
                    c.id, 
                    c.nome, 
                    tc.nome as tipo_cartao, 
                    c.categoria, 
                    c.vencimento, 
                    c.valor,
                    c.organization,
                    c.conta_user,
                    c.paga,
                    c.data_inclusao
                FROM 
                    contas c
                LEFT JOIN 
                    public.tipo_cartao tc ON tc.id = c.tipo_cartao
                WHERE 
                    ($1::integer IS NULL OR EXTRACT(MONTH FROM c.vencimento) = $1::integer)
                    AND ($2::integer IS NULL OR EXTRACT(YEAR FROM c.vencimento) = $2::integer)
                    AND c.organization = $3  -- ou $3::text se for string
                ORDER BY 
                    c.vencimento, 
                    c.id;
    `;
  const result = await pool.query(query, [mesInt, anoInt, key_share]
  );

  return result.rows.map(conta => ({
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
  }));
}

/**
 * Função para adicionar uma nova conta ao banco de dados.
 * @param {Object} conta - Objeto com os dados da conta.
 * @returns {Promise<void>}
 */
export async function addConta(conta) {
  console.log('Adicionando conta:', conta);
  await pool.query(
    'INSERT INTO contas (nome, vencimento, valor, categoria, tipo_cartao, paga, conta_user, organization) VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)',
    [conta.nome, conta.dataFormatada, conta.valor, conta.categoria, conta.tipo_cartao, conta.conta_user, conta.organization]
  );
}

export async function updateConta(conta) {
  console.log('Atualizando conta:', conta);
  await pool.query(
    'UPDATE contas SET nome = $1, vencimento = $2, valor = $3, categoria = $4, tipo_cartao = $5 WHERE id = $6',
    [conta.nome, conta.dataFormatada, conta.valor, conta.categoria, conta.tipo_cartao, conta.id]
  );
}

export async function updateContasStatus(id, status) {
  await pool.query('UPDATE contas SET paga = $2 WHERE id = $1', [id, status]);
}

export async function getContasPagas(ano, mes, organization) {
  const query = `SELECT * FROM contas
      WHERE paga = TRUE
      AND ($1::int IS NULL OR EXTRACT(MONTH FROM vencimento) = $1::int)
      AND ($2::int IS NULL OR EXTRACT(YEAR FROM vencimento) = $2::int)
      AND organization = $3
      ORDER BY vencimento, id`;

  const result = await pool.query(query, [mes, ano, organization]);
  console.log('Contas pagas:', result.rows.length);


  //const result = await pool.query('SELECT * FROM contas WHERE paga = TRUE');
  return result.rows.map(conta => ({
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
  }));
}

export async function getContasPendentes(ano, mes, organization) {
  const query = `SELECT * FROM contas
      WHERE paga = FALSE
      AND ($1::int IS NULL OR EXTRACT(MONTH FROM vencimento) = $1::int)
      AND ($2::int IS NULL OR EXTRACT(YEAR FROM vencimento) = $2::int)
      AND organization = $3
      ORDER BY vencimento, id`;
  const result = await pool.query(query, [mes, ano, organization]);
  console.log('Contas pendentes:', result.rows.length);
  //const result = await pool.query('SELECT * FROM contas WHERE paga = FALSE');
  if (result.rows.length === 0) {
    return [];
  }
  console.log('Contas pendentes:', result.rows.length);
  console.log('Contas pendentes:', result.rows);
  console.log('Contas pendentes:', result.rows[0]);
  return result.rows.map(conta => ({
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
  }));
}


export async function getContasPendentes__() {
  const result = await pool.query('SELECT * FROM contas WHERE paga = FALSE');
  return result.rows.map(conta => ({
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
  }));
}

export async function getLimiteAll(mes, ano) {
  const query = 'SELECT DISTINCT limite FROM public.limites';
  const result = await pool.query(query);
  return result.rows.length > 0 ? result.rows[0].limite : 0;
}

export async function getLimite(mes, ano, organization) {
  console.log(`Ano: ${ano} Mês: ${mes}`);
  const mesInt = parseInt(mes);
  const anoInt = parseInt(ano);
  if (isNaN(mesInt) || isNaN(anoInt)) {
    throw new Error('O mês ou o ano fornecido não são válidos.');
  }

  const query = 'SELECT id, limite FROM public.limites WHERE mes = $1 AND ano = $2 AND organization = $3 LIMIT 1';
  const result = await pool.query(query, [mesInt, anoInt, organization]);
  return result.rows.length > 0
    ? { id: result.rows[0].id, limite: result.rows[0].limite }
    : null;
}

export async function insertLimite(mes, ano, limite, conta_user, organization) {
  const query = 'INSERT INTO public.limites (mes, ano, limite, conta_user, organization) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  console.log(`Mês ${mes}/${ano} limite: ${limite}`);
  try {
    const result = await pool.query(query, [mes, ano, limite, conta_user, organization]);
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    throw new Error('Erro ao inserir limite, nenhum ID retornado.');
  } catch (error) {
    console.error('Erro durante a inserção:', error);
    throw new Error('Falha na inserção do limite: ' + error.message);
  }
}

export async function updateLimite(id, limite) {
  const query = 'UPDATE public.limites SET limite = $1 WHERE id = $2 RETURNING *';
  console.log('Executando update com id:', id, 'limite:', limite);
  const result = await pool.query(query, [limite, id]);
  console.log('Resultado do update:', result.rows);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getFiltroAnos(organization) {
  const result = await pool.query(
    "SELECT DISTINCT ano FROM public.limites WHERE organization = $1 ORDER BY ano DESC"
    , [organization]);
  return result.rows;
}

export async function getTodosAnos() {
  const result = await pool.query(
    "SELECT DISTINCT ano FROM public.limites ORDER BY ano DESC"
  );
  return result.rows;
}

export async function excluirConta(id) {
  const query = 'DELETE FROM contas WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

export async function getContaID(id) {
  const query = `
      SELECT id, nome,
             TO_CHAR(vencimento, 'YYYY-MM-DD') as vencimento,
             valor, categoria, tipo_cartao
      FROM contas
      WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  console.log('Resultado da consulta:', result.rows.length);
  return result.rows.length > 0 ? result.rows[0] : null;
}
