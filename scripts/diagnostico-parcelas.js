import pool from '../src/database/conexao.js';

const SQL = `
  SELECT
    id,
    nome,
    parcela_atual,
    total_parcelas,
    vencimento,
    EXTRACT(MONTH FROM vencimento)::int AS mes,
    EXTRACT(YEAR FROM vencimento)::int AS ano,
    grupo_parcelamento,
    valor,
    organization
  FROM contas
  WHERE nome ILIKE '%Notebook%'
     OR nome ILIKE '%Tênis%'
     OR nome ILIKE '%Tenis%'
  ORDER BY grupo_parcelamento NULLS LAST, parcela_atual, id;
`;

const SQL_COUNT_GROUPS = `
  SELECT
    grupo_parcelamento,
    MIN(nome) AS exemplo_nome,
    COUNT(*) AS qtd,
    MIN(parcela_atual) AS min_parcela,
    MAX(parcela_atual) AS max_parcela,
    MAX(total_parcelas) AS total_parcelas,
    array_agg(DISTINCT EXTRACT(MONTH FROM vencimento)::int ORDER BY EXTRACT(MONTH FROM vencimento)::int) AS meses,
    array_agg(DISTINCT EXTRACT(YEAR FROM vencimento)::int ORDER BY EXTRACT(YEAR FROM vencimento)::int) AS anos
  FROM contas
  WHERE grupo_parcelamento IS NOT NULL
  GROUP BY grupo_parcelamento
  ORDER BY MIN(id);
`;

const SQL_ALL_PARCELED = `
  SELECT COUNT(*) AS total_com_grupo FROM contas WHERE grupo_parcelamento IS NOT NULL;
`;

async function main() {
  try {
    const { rows } = await pool.query(SQL);
    console.log('\n=== REGISTROS Notebook / Tênis ===\n');
    console.table(rows);

    const { rows: groups } = await pool.query(SQL_COUNT_GROUPS);
    console.log('\n=== RESUMO POR GRUPO ===\n');
    console.table(groups);

    const { rows: total } = await pool.query(SQL_ALL_PARCELED);
    console.log('\nTotal registros com grupo_parcelamento:', total[0]?.total_com_grupo);

    const notebook = rows.filter((r) => r.nome.toLowerCase().includes('notebook'));
    const tenis = rows.filter((r) =>
      r.nome.toLowerCase().includes('tênis') || r.nome.toLowerCase().includes('tenis')
    );

    console.log('\n=== CONTAGEM ESPERADA vs REAL ===');
    console.log('Notebook: esperado 12, encontrado', notebook.length);
    console.log('Tênis: esperado 3, encontrado', tenis.length);

    if (notebook.length > 0) {
      const mesesNb = [...new Set(notebook.map((r) => `${r.mes}/${r.ano}`))];
      console.log('Notebook meses distintos:', mesesNb.join(', '));
    }
    if (tenis.length > 0) {
      const mesesT = [...new Set(tenis.map((r) => `${r.mes}/${r.ano}`))];
      console.log('Tênis meses distintos:', mesesT.join(', '));
    }
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
