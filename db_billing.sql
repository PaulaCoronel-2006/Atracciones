-- ============================================================
-- DB_BILLING — Microservicio Billing
-- Proyecto: postgres.hkjzvfcourzjyzxheran (us-west-1)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS billing_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE IF NOT EXISTS payment_status_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS payment_method_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS payment (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id    UUID,
    booking_id        UUID         NOT NULL,
    payment_method_id SMALLINT     NOT NULL REFERENCES payment_method_type(id),
    status_id         SMALLINT     NOT NULL REFERENCES payment_status_type(id),
    amount            NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency_code     CHAR(3)      NOT NULL DEFAULT 'USD',
    transaction_id    VARCHAR(100),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id     UUID         NOT NULL,
    invoice_number VARCHAR(20)  NOT NULL UNIQUE,
    customer_name  VARCHAR(150) NOT NULL,
    tax_id         VARCHAR(20)  NOT NULL,
    total          NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    currency_code  CHAR(3)      NOT NULL DEFAULT 'USD',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_detail (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID         NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity    INTEGER      NOT NULL,
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_item  NUMERIC(12,2) NOT NULL CHECK (total_item >= 0)
);

-- Seed data: estados y métodos de pago
INSERT INTO payment_status_type (id, name) VALUES
    (1, 'pending'),
    (2, 'completed'),
    (3, 'failed'),
    (4, 'refunded'),
    (5, 'cancelled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_method_type (id, name) VALUES
    (1, 'credit_card'),
    (2, 'debit_card'),
    (3, 'bank_transfer'),
    (4, 'cash'),
    (5, 'paypal')
ON CONFLICT (id) DO NOTHING;
