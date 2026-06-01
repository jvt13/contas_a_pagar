/**
 * Adiciona limite_credito em tipo_cartao (idempotente).
 * Executar: node scripts/migrate-limite-cartao.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.tipo_cartao
        ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(12,2);
    `);
    console.log('Migration limite_credito aplicada com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migration:', err.message);
  process.exit(1);
});
