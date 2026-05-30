/**
 * Aplica colunas de parcelamento manualmente (idempotente).
 * Executar: node scripts/migrate-parcelamento.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.contas
        ADD COLUMN IF NOT EXISTS grupo_parcelamento UUID,
        ADD COLUMN IF NOT EXISTS parcela_atual SMALLINT,
        ADD COLUMN IF NOT EXISTS total_parcelas SMALLINT;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contas_grupo_parcelamento
        ON public.contas (grupo_parcelamento)
        WHERE grupo_parcelamento IS NOT NULL;
    `);
    console.log('Migration parcelamento aplicada com sucesso.');

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'contas'
        AND column_name IN ('grupo_parcelamento', 'parcela_atual', 'total_parcelas')
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
