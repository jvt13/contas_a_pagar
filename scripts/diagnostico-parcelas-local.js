import pool from '../src/database/conexao.js';

async function main() {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'contas'
      ORDER BY ordinal_position;
    `);
    console.log('\n=== COLUNAS contas (local) ===');
    console.table(cols.rows);

    const rows = await pool.query(`
      SELECT id, nome, vencimento, valor, organization,
             EXTRACT(MONTH FROM vencimento)::int AS mes,
             EXTRACT(YEAR FROM vencimento)::int AS ano
      FROM contas
      WHERE nome ILIKE '%Notebook%' OR nome ILIKE '%Tênis%' OR nome ILIKE '%Tenis%'
      ORDER BY id;
    `);
    console.log('\n=== Notebook / Tênis (local, sem colunas parcela) ===');
    console.table(rows.rows);
    console.log('Total:', rows.rows.length);
  } catch (err) {
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

main();
