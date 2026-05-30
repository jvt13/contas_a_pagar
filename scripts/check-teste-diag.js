import pool from '../src/database/conexao.js';

const r = await pool.query(`
  SELECT id, nome, valor, vencimento,
         EXTRACT(MONTH FROM vencimento)::int AS mes
  FROM contas WHERE nome ILIKE '%TesteDiag%' ORDER BY id
`);
console.table(r.rows);
console.log('Total TesteDiag:', r.rows.length);
await pool.end();
