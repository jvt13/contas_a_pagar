/**
 * Adiciona coluna subcategoria em contas (idempotente).
 * Executar: node scripts/migrate-subcategoria.js
 */
import pool from '../src/database/conexao.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE public.contas
        ADD COLUMN IF NOT EXISTS subcategoria VARCHAR(50);
    `);

    console.log('Migration subcategoria aplicada.');

    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contas'
        AND column_name = 'subcategoria';
    `);
    console.log('Coluna presente:', cols.rows.length > 0 ? 'subcategoria' : 'NÃO ENCONTRADA');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Erro na migration subcategoria:', err.message);
  process.exit(1);
});
