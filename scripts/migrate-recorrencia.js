/**
 * Aplica colunas de recorrência manualmente (idempotente).
 * Executar: node scripts/migrate-recorrencia.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.contas
        ADD COLUMN IF NOT EXISTS grupo_recorrencia UUID,
        ADD COLUMN IF NOT EXISTS recorrencia_atual SMALLINT,
        ADD COLUMN IF NOT EXISTS total_recorrencias SMALLINT;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contas_grupo_recorrencia
        ON public.contas (grupo_recorrencia)
        WHERE grupo_recorrencia IS NOT NULL;
    `);
    console.log('Migration recorrência aplicada com sucesso.');

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'contas'
        AND column_name IN ('grupo_recorrencia', 'recorrencia_atual', 'total_recorrencias')
      ORDER BY column_name;
    `);
    console.log('Colunas presentes:', cols.rows.map((r) => r.column_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migration:', err.message);
  process.exit(1);
});
