const { Client, Pool } = require('pg');

async function createDatabaseIfNotExists() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        password: '4053',
        port: 5432,
        database: 'postgres', // Conecta-se ao banco padrão
    });

    try {
        await client.connect();

        const dbName = 'contas_a_pagar';

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`Banco de dados '${dbName}' criado com sucesso.`);
        } else {
            console.log(`Banco de dados '${dbName}' já existe.`);
        }
    } catch (err) {
        console.error('Erro ao verificar/criar o banco de dados:', err);
    } finally {
        await client.end();
    }
}

async function createTablesIfNotExist() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        password: '4053',
        port: 5432,
        database: 'contas_a_pagar', // Agora conecta no banco já existente
    });

    const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS public.contas (
            id SERIAL PRIMARY KEY,
            nome character varying(255) NOT NULL,
            vencimento date NOT NULL,
            valor numeric(10,2) NOT NULL,
            categoria character varying(50),
            tipo_cartao character varying(50),
            paga boolean DEFAULT false,
            data_inclusao timestamp without time zone DEFAULT CURRENT_TIMESTAMP(0)
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

        CREATE TABLE IF NOT EXISTS public.usuarios (
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
            ativo BOOLEAN DEFAULT true,
            user_agent TEXT,
            nivel_acesso VARCHAR(50) DEFAULT 'usuario',
            foto_perfil BYTEA,
            verificacao_email BOOLEAN DEFAULT false
        );

        CREATE TABLE IF NOT EXISTS public.tipo_cartao (
            id SERIAL PRIMARY KEY,
            nome character varying(100) NOT NULL,
            vencimento numeric NOT NULL,
            dia_util integer NOT NULL,
            numero_parcelas integer,
            tipo_cartao character varying DEFAULT 'credito'::character varying NOT NULL
        );
    `;

    try {
        const client = await pool.connect();
        await client.query(createTablesQuery);
        console.log('Tabelas criadas ou já existentes.');
        client.release();
    } catch (err) {
        console.error('Erro ao criar as tabelas:', err);
    } finally {
        await pool.end(); // Fecha o pool ao final
    }
}

/*(async () => {
    await createDatabaseIfNotExists();      // Garante que o banco existe
    await createTablesIfNotExist();         // Cria tabelas usando o pool no banco correto
})();*/

module.exports = {
    createDatabaseIfNotExists,
    createTablesIfNotExist
}
