// src/database/conexao.js
import pkg from 'pg';
const { Pool } = pkg;

// Configuração para conectar ao banco "contas_a_pagar"
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'contas_a_pagar',
  password: '4053',
  port: 5432
});

pool.on('connect', () => {
  console.log('Conectado ao banco de dados PostgreSQL.');
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
});

export default pool;
