-- ============================================================
-- DB_IDENTITY — Microservicio Identify
-- Proyecto: postgres.cdjwkanairobhsxodpnx (us-west-2)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS identity_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_by     VARCHAR(256),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE IF NOT EXISTS role (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 VARCHAR(256) NOT NULL UNIQUE,
    password_hash         TEXT         NOT NULL,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at         TIMESTAMPTZ,
    refresh_token         TEXT,
    reset_password_token  VARCHAR(255),
    reset_password_expiry TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_role (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS client (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    birth_date      DATE,
    nationality     VARCHAR(100),
    document_type   VARCHAR(20),
    document_number VARCHAR(50),
    location_id     UUID,
    avatar_url      TEXT,
    preferred_lang  SMALLINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Seed data: roles iniciales
INSERT INTO role (name, description) VALUES
    ('admin', 'Administrador del sistema con acceso total'),
    ('partner', 'Operador de atracción registrado'),
    ('client', 'Cliente viajero registrado')
ON CONFLICT (name) DO NOTHING;
