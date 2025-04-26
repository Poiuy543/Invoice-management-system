
CREATE TABLE IF NOT EXISTS public.clients
(
    id integer NOT NULL DEFAULT nextval('clients_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    company character varying(100) COLLATE pg_catalog."default",
    email character varying(100) COLLATE pg_catalog."default",
    phone character varying(20) COLLATE pg_catalog."default",
    address text COLLATE pg_catalog."default",
    gst_no character varying(50) COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT clients_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.clients
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.invoice_items
(
    id integer NOT NULL DEFAULT nextval('invoice_items_id_seq'::regclass),
    invoice_id integer,
    description text COLLATE pg_catalog."default" NOT NULL,
    qty integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
    CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id)
        REFERENCES public.invoices (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT invoice_items_qty_check CHECK (qty > 0)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.invoice_items
    OWNER to postgres;


CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
    ON public.invoice_items USING btree
    (invoice_id ASC NULLS LAST)
    TABLESPACE pg_default;



CREATE TABLE IF NOT EXISTS public.invoices
(
    id integer NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
    invoice_no character varying(20) COLLATE pg_catalog."default" NOT NULL,
    client_id integer,
    total numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    status character varying(20) COLLATE pg_catalog."default" NOT NULL,
    due_date date NOT NULL,
    issue_date date NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_pkey PRIMARY KEY (id),
    CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no),
    CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id)
        REFERENCES public.clients (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT invoices_status_check CHECK (status::text = ANY (ARRAY['Draft'::character varying, 'Sent'::character varying, 'Paid'::character varying, 'Overdue'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.invoices
    OWNER to postgres;

CREATE INDEX IF NOT EXISTS idx_invoices_client_id
    ON public.invoices USING btree
    (client_id ASC NULLS LAST)
    TABLESPACE pg_default;


CREATE TABLE IF NOT EXISTS public.payments
(
    id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
    invoice_id integer,
    amount numeric(10,2) NOT NULL,
    mode character varying(20) COLLATE pg_catalog."default" NOT NULL,
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id)
        REFERENCES public.invoices (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT payments_amount_check CHECK (amount > 0::numeric),
    CONSTRAINT payments_mode_check CHECK (mode::text = ANY (ARRAY['Cash'::character varying, 'UPI'::character varying, 'Bank'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.payments
    OWNER to postgres;


CREATE INDEX IF NOT EXISTS idx_payments_invoice_id
    ON public.payments USING btree
    (invoice_id ASC NULLS LAST)
    TABLESPACE pg_default;



CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'accountant'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;