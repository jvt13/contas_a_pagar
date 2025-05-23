// src/database/estrutura.js
import pkg from 'pg';
const { Client, Pool } = pkg;

/**
 * Garante que o banco de dados exista, criando-o se necessário.
 */
export async function createDatabaseIfNotExists() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: '4053',
    port: 5432,
    database: 'postgres'
  });

  try {
    await client.connect();
    const dbName = 'contas_a_pagar';
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Banco de dados '${dbName}' criado com sucesso.`);
    } else {
      console.log(`Banco de dados '${dbName}' já existe.`);
    }
  } catch (err) {
    console.error('Erro ao verificar/criar o banco de dados:', err);
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Cria as tabelas necessárias no banco de dados 'contas_a_pagar'.
 */
export async function createTablesIfNotExist() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '4053',
    port: 5432,
    database: 'contas_a_pagar'
  });

  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS public.contas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      vencimento DATE NOT NULL,
      valor NUMERIC(10,2) NOT NULL,
      categoria VARCHAR(50),
      tipo_cartao VARCHAR(50),
      paga BOOLEAN DEFAULT FALSE,
      data_inclusao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP(0)
    );

    CREATE TABLE IF NOT EXISTS public.limites (
      id SERIAL PRIMARY KEY,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      limite NUMERIC(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.tipo_contas_fixa (
      id SERIAL PRIMARY KEY,
      conta VARCHAR NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      nome_completo VARCHAR(150) NOT NULL,
      username VARCHAR(150) NOT NULL,
      email VARCHAR(100) NOT NULL,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      telefone VARCHAR(15),
      data_nascimento DATE,
      cpf VARCHAR(11),
      endereco TEXT,
      data_criacao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ultimo_login TIMESTAMP WITHOUT TIME ZONE,
      ativo BOOLEAN DEFAULT TRUE,
      user_agent TEXT,
      nivel_acesso VARCHAR(50) DEFAULT 'usuario',
      foto_perfil BYTEA,
      verificacao_email BOOLEAN DEFAULT FALSE,
      organizacao INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
      organizacao_compartilhada INTEGER REFERENCES organizations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS public.organizations (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        chave VARCHAR(16) NOT NULL DEFAULT substring(md5(random()::text), 1, 16),
        CONSTRAINT organizations_chave_unique UNIQUE(chave)
    );

    CREATE TABLE IF NOT EXISTS public.tipo_cartao (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      vencimento NUMERIC NOT NULL,
      dia_util INTEGER NOT NULL,
      numero_parcelas INTEGER,
      tipo_cartao VARCHAR DEFAULT 'credito' NOT NULL
    );
  `;

  let client;
  try {
    client = await pool.connect();
    await client.query(createTablesQuery);
    console.log('Tabelas criadas ou já existentes.');
  } catch (err) {
    console.error('Erro ao criar as tabelas:', err);
    throw err;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
