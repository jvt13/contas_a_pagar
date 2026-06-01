/**
 * Migration: banco_slug em tipo_cartao (idempotente).
 * Executar: node scripts/migrate-banco-cartao.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.tipo_cartao
        ADD COLUMN IF NOT EXISTS banco_slug VARCHAR(50);
    `);
    console.log('Migration banco_slug aplicada com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migration:', err.message);
  process.exit(1);
});
