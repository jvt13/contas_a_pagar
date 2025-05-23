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
export async function getContas(mes, ano) {
  const mesInt = Number.isInteger(parseInt(mes)) ? parseInt(mes) : null;
  const anoInt = Number.isInteger(parseInt(ano)) ? parseInt(ano) : null;

  const result = await pool.query(
    `
      SELECT * FROM contas
      WHERE ($1::int IS NULL OR EXTRACT(MONTH FROM vencimento) = $1::int)
      AND ($2::int IS NULL OR EXTRACT(YEAR FROM vencimento) = $2::int)
      ORDER BY vencimento
    `,
    [mesInt, anoInt]
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
    'INSERT INTO contas (nome, vencimento, valor, categoria, tipo_cartao, paga) VALUES ($1, $2, $3, $4, $5, FALSE)',
    [conta.nome, conta.dataFormatada, conta.valor_convertido, conta.categoria, conta.tipo_cartao]
  );
}

export async function updateContas(id, status) {
  await pool.query('UPDATE contas SET paga = $2 WHERE id = $1', [id, status]);
}

export async function getContasPagas() {
  const result = await pool.query('SELECT * FROM contas WHERE paga = TRUE');
  return result.rows.map(conta => ({
    ...conta,
    valor: parseFloat(conta.valor) || 0,
    vencimento: format(new Date(conta.vencimento), 'dd/MM/yyyy')
  }));
}

export async function getContasPendentes() {
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

export async function getLimite(mes, ano) {
  console.log(`Ano: ${ano} Mês: ${mes}`);
  const mesInt = parseInt(mes);
  const anoInt = parseInt(ano);
  if (isNaN(mesInt) || isNaN(anoInt)) {
    throw new Error('O mês ou o ano fornecido não são válidos.');
  }

  const query = 'SELECT id, limite FROM public.limites WHERE mes = $1 AND ano = $2 LIMIT 1';
  const result = await pool.query(query, [mesInt, anoInt]);
  return result.rows.length > 0
    ? { id: result.rows[0].id, limite: result.rows[0].limite }
    : null;
}

export async function insertLimite(mes, ano, limite) {
  const query = 'INSERT INTO public.limites (mes, ano, limite) VALUES ($1, $2, $3) RETURNING id';
  console.log(`Mês ${mes}/${ano} limite: ${limite}`);
  try {
    const result = await pool.query(query, [mes, ano, limite]);
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

export async function getAnos() {
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
