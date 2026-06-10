-- Schema de referência (contas_a_pagar) — alinhado com estrutura.js e migrations idempotentes.

CREATE TABLE IF NOT EXISTS public.organizations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  chave VARCHAR(16) NOT NULL DEFAULT substring(md5(random()::text), 1, 16),
  CONSTRAINT organizations_chave_unique UNIQUE (chave)
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

CREATE TABLE IF NOT EXISTS public.tipo_cartao (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  vencimento NUMERIC NOT NULL,
  dia_util INTEGER NOT NULL,
  numero_parcelas INTEGER,
  tipo_cartao VARCHAR DEFAULT 'credito' NOT NULL,
  conta_user INTEGER,
  organization INTEGER,
  limite_credito NUMERIC(12, 2),
  banco_slug VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS public.contas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  vencimento DATE NOT NULL,
  data_lancamento DATE,
  valor NUMERIC(10, 2) NOT NULL,
  categoria VARCHAR(50),
  subcategoria VARCHAR(50),
  tipo_cartao INTEGER,
  paga BOOLEAN DEFAULT FALSE,
  conta_user INTEGER,
  organization INTEGER,
  data_inclusao TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP(0),
  grupo_parcelamento UUID,
  parcela_atual SMALLINT,
  total_parcelas SMALLINT,
  grupo_recorrencia UUID,
  recorrencia_atual SMALLINT,
  total_recorrencias SMALLINT
);

CREATE INDEX IF NOT EXISTS idx_contas_grupo_parcelamento
  ON public.contas (grupo_parcelamento)
  WHERE grupo_parcelamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contas_grupo_recorrencia
  ON public.contas (grupo_recorrencia)
  WHERE grupo_recorrencia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contas_data_lancamento
  ON public.contas (data_lancamento)
  WHERE data_lancamento IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.limites (
  id SERIAL PRIMARY KEY,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  limite NUMERIC(10, 2) NOT NULL,
  conta_user INTEGER,
  organization INTEGER
);

CREATE TABLE IF NOT EXISTS public.tipo_contas_fixa (
  id SERIAL PRIMARY KEY,
  conta VARCHAR NOT NULL,
  conta_user INTEGER,
  organization INTEGER
);
