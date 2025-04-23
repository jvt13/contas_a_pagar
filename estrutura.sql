--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contas (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    vencimento date NOT NULL,
    valor numeric(10,2) NOT NULL,
    paga boolean DEFAULT false,
    data_inclusao timestamp without time zone DEFAULT CURRENT_TIMESTAMP(0)
);


ALTER TABLE public.contas OWNER TO postgres;

--
-- Name: contas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contas_id_seq OWNER TO postgres;

--
-- Name: contas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contas_id_seq OWNED BY public.contas.id;


--
-- Name: limites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.limites (
    id integer NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    limite numeric(10,2) NOT NULL
);


ALTER TABLE public.limites OWNER TO postgres;

--
-- Name: limites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.limites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.limites_id_seq OWNER TO postgres;

--
-- Name: limites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.limites_id_seq OWNED BY public.limites.id;


--
-- Name: tipo_contas_fixa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_contas_fixa (
    id integer NOT NULL,
    conta character varying NOT NULL
);


ALTER TABLE public.tipo_contas_fixa OWNER TO postgres;

--
-- Name: tipo_contas_fixa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipo_contas_fixa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_contas_fixa_id_seq OWNER TO postgres;

--
-- Name: tipo_contas_fixa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_contas_fixa_id_seq OWNED BY public.tipo_contas_fixa.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome_completo character varying(150) NOT NULL,
    username character varying(150) NOT NULL,
    email character varying(100) NOT NULL,
    salt text NOT NULL,
    hash text NOT NULL,
    telefone character varying(15),
    data_nascimento date,
    cpf character varying(11),
    endereco text,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultimo_login timestamp without time zone,
    ativo boolean DEFAULT true,
    user_agent text,
    nivel_acesso character varying(50) DEFAULT 'usuario'::character varying,
    foto_perfil bytea,
    verificacao_email boolean DEFAULT false
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: contas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas ALTER COLUMN id SET DEFAULT nextval('public.contas_id_seq'::regclass);


--
-- Name: limites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.limites ALTER COLUMN id SET DEFAULT nextval('public.limites_id_seq'::regclass);


--
-- Name: tipo_contas_fixa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_contas_fixa ALTER COLUMN id SET DEFAULT nextval('public.tipo_contas_fixa_id_seq'::regclass);


--
-- Name: contas contas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contas
    ADD CONSTRAINT contas_pkey PRIMARY KEY (id);


--
-- Name: limites limites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.limites
    ADD CONSTRAINT limites_pkey PRIMARY KEY (id);


--
-- Name: tipo_contas_fixa tipo_contas_fixa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_contas_fixa
    ADD CONSTRAINT tipo_contas_fixa_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

