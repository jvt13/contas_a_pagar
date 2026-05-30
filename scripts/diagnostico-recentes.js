import pool from '../src/database/conexao.js';

async function main() {
  const recent = await pool.query(`
    SELECT id, nome, vencimento, valor, mes, ano, organization,
           EXTRACT(MONTH FROM vencimento)::int AS mes_venc,
           EXTRACT(YEAR FROM vencimento)::int AS ano_venc
    FROM contas
    WHERE organization = 6
    ORDER BY id DESC LIMIT 25
  `);

  console.log('\n=== Últimas 25 contas org=6 ===');
  console.table(recent.rows);

  const parcelPattern = await pool.query(`
    SELECT COUNT(*) AS qtd FROM contas WHERE nome ~ '[0-9]+/[0-9]+$'
  `);
  console.log('\nContas com padrão X/Y no nome:', parcelPattern.rows[0].qtd);

  const byMesAno = await pool.query(`
    SELECT mes, ano, COUNT(*) FROM contas WHERE organization = 6 GROUP BY mes, ano ORDER BY ano, mes
  `);
  console.log('\nContagem por mes/ano (colunas legadas):');
  console.table(byMesAno.rows);

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
