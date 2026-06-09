/**
 * Adiciona data_lancamento e faz backfill idempotente.
 * Executar: node scripts/migrate-data-lancamento.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.contas
        ADD COLUMN IF NOT EXISTS data_lancamento DATE;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contas_data_lancamento
        ON public.contas (data_lancamento)
        WHERE data_lancamento IS NOT NULL;
    `);

    const backfill = await client.query(`
      UPDATE public.contas
      SET data_lancamento = COALESCE(data_inclusao::date, vencimento)
      WHERE data_lancamento IS NULL;
    `);

    console.log(`Migration data_lancamento aplicada. Registros atualizados: ${backfill.rowCount}.`);

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contas'
        AND column_name = 'data_lancamento';
    `);
    console.log('Coluna presente:', cols.rows.length > 0 ? 'data_lancamento' : 'NÃO ENCONTRADA');

    const pendentes = await client.query(`
      SELECT COUNT(*)::int AS qtd FROM public.contas WHERE data_lancamento IS NULL;
    `);
    console.log('Contas sem data_lancamento:', pendentes.rows[0].qtd);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migration data_lancamento:', err.message);
  process.exit(1);
});
