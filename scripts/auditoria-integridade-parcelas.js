/**
 * Auditoria de integridade — parcelas no banco.
 * node scripts/auditoria-integridade-parcelas.js
 */
import pool from '../src/database/conexao.js';

async function main() {
  console.log('\n=== 1. Grupos incompletos (count != total_parcelas) ===\n');
  const incompletos = await pool.query(`
    SELECT grupo_parcelamento, MAX(total_parcelas) AS esperado,
           COUNT(*) AS encontrado,
           array_agg(parcela_atual ORDER BY parcela_atual) AS parcelas
    FROM contas
    WHERE grupo_parcelamento IS NOT NULL
    GROUP BY grupo_parcelamento
    HAVING COUNT(*) != MAX(total_parcelas)
       OR COUNT(DISTINCT total_parcelas) > 1
  `);
  console.table(incompletos.rows);
  console.log('Grupos incompletos:', incompletos.rows.length);

  console.log('\n=== 2. Parcelas órfãs (grupo NULL mas nome X/Y) ===\n');
  const orfas = await pool.query(`
    SELECT id, nome, parcela_atual, total_parcelas, grupo_parcelamento
    FROM contas
    WHERE nome ~ '[0-9]+/[0-9]+$'
      AND (grupo_parcelamento IS NULL OR parcela_atual IS NULL OR total_parcelas IS NULL)
  `);
  console.table(orfas.rows);
  console.log('Órfãs:', orfas.rows.length);

  console.log('\n=== 3. Inconsistência soma valor vs total (por grupo) ===\n');
  const somas = await pool.query(`
    SELECT grupo_parcelamento,
           MIN(nome) AS exemplo,
           SUM(valor)::numeric(12,2) AS soma_parcelas,
           MAX(total_parcelas) AS n_parcelas
    FROM contas
    WHERE grupo_parcelamento IS NOT NULL
    GROUP BY grupo_parcelamento
  `);
  console.table(somas.rows);

  console.log('\n=== 4. parcela_atual duplicada no mesmo grupo ===\n');
  const dup = await pool.query(`
    SELECT grupo_parcelamento, parcela_atual, COUNT(*) AS qtd
    FROM contas
    WHERE grupo_parcelamento IS NOT NULL
    GROUP BY grupo_parcelamento, parcela_atual
    HAVING COUNT(*) > 1
  `);
  console.table(dup.rows);

  console.log('\n=== 5. Após exclusão parcial — lacunas no grupo ===\n');
  const lacunas = await pool.query(`
    WITH grupos AS (
      SELECT grupo_parcelamento, MAX(total_parcelas) AS total
      FROM contas WHERE grupo_parcelamento IS NOT NULL
      GROUP BY grupo_parcelamento
    )
    SELECT g.grupo_parcelamento, g.total,
           COUNT(c.id) AS existentes,
           array_agg(c.parcela_atual ORDER BY c.parcela_atual) AS nums
    FROM grupos g
    JOIN contas c ON c.grupo_parcelamento = g.grupo_parcelamento
    GROUP BY g.grupo_parcelamento, g.total
    HAVING COUNT(c.id) < g.total
  `);
  console.table(lacunas.rows);

  console.log('\n=== 6. Colunas legadas mes/ano vs vencimento ===\n');
  const legado = await pool.query(`
    SELECT COUNT(*) AS qtd
    FROM contas
    WHERE grupo_parcelamento IS NOT NULL
      AND mes IS NOT NULL
      AND mes != EXTRACT(MONTH FROM vencimento)::int
  `);
  console.log('Parcelas com mes legado != month(vencimento):', legado.rows[0].qtd);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
