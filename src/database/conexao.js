const { Pool } = require('pg');

// Configuração para conectar ao banco "portal_assinatura"
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'contas_a_pagar',
    password: '4053',
    port: 5432,
});

pool.on('connect', () => {
    console.log('Conectado ao banco de dados PostgreSQL.');
});

pool.on('error', (err) => {
    console.error('Erro no pool de conexões:', err);
});

module.exports = pool; // Exporta o pool para ser reutilizado em outros arquivos