--
-- PostgreSQL database dump
--

\restrict SR82Vtvyrz6hcckYUuKG9LaDy5nCbf9mVyqrBvgzYz6K7qTGvbfjfWYmPXL8YnF

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: customer_mdm; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA IF NOT EXISTS averis_customer;


ALTER SCHEMA customer_mdm OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: customer_mdm; Owner: postgres
--

CREATE TABLE averis_customer.users (
    id integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    created_by character varying(255),
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_login timestamp without time zone,
    last_name character varying(255),
    preferences jsonb DEFAULT '{}'::jsonb,
    roles jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    stytch_user_id character varying(255) NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    updated_by character varying(255)
);


ALTER TABLE averis_customer.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: customer_mdm; Owner: postgres
--

CREATE SEQUENCE averis_customer.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE averis_customer.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: customer_mdm; Owner: postgres
--

ALTER SEQUENCE averis_customer.users_id_seq OWNED BY averis_customer.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: customer_mdm; Owner: postgres
--

ALTER TABLE ONLY averis_customer.users ALTER COLUMN id SET DEFAULT nextval('averis_customer.users_id_seq'::regclass);


--
-- Data for Name: users; Type: TABLE DATA; Schema: customer_mdm; Owner: postgres
--

COPY averis_customer.users (id, created_at, created_by, email, first_name, last_login, last_name, preferences, roles, status, stytch_user_id, updated_at, updated_by) FROM stdin;
4	2025-08-26 22:37:40.308755	system	eric.d.brand@gmail.com	Eric	\N	Brand	{}	["admin", "product_contracts", "product_contracts_approve", "product_finance", "product_finance_approve", "product_launch", "product_legal", "product_legal_approve", "product_marketing", "product_marketing_approve", "product_mdm", "product_salesops", "product_salesops_approve", "user_admin"]	active	user-test-c7765655-24d8-4848-be8e-0f065b81cac6	2025-08-26 22:37:40.440468	system
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: customer_mdm; Owner: postgres
--

SELECT pg_catalog.setval('averis_customer.users_id_seq', 4, true);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: customer_mdm; Owner: postgres
--

ALTER TABLE ONLY averis_customer.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: customer_mdm; Owner: postgres
--

ALTER TABLE ONLY averis_customer.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_stytch_user_id_key; Type: CONSTRAINT; Schema: customer_mdm; Owner: postgres
--

ALTER TABLE ONLY averis_customer.users
    ADD CONSTRAINT users_stytch_user_id_key UNIQUE (stytch_user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict SR82Vtvyrz6hcckYUuKG9LaDy5nCbf9mVyqrBvgzYz6K7qTGvbfjfWYmPXL8YnF

