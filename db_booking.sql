-- ============================================================
-- DB_BOOKING — Microservicio Booking
-- Proyecto: postgres.nnwzfvfhveoelyyrrplv (us-east-1)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS booking_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE IF NOT EXISTS booking_status (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS availability_slot (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id         UUID        NOT NULL,
    slot_date          DATE        NOT NULL,
    start_time         TIME        NOT NULL,
    end_time           TIME,
    capacity_total     SMALLINT    NOT NULL CHECK (capacity_total > 0),
    capacity_available SMALLINT    NOT NULL CHECK (capacity_available >= 0),
    is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, slot_date, start_time),
    CHECK (capacity_available <= capacity_total)
);

CREATE TABLE IF NOT EXISTS booking (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    pnr_code       VARCHAR(8)   NOT NULL UNIQUE,
    attraction_id  UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    user_id        UUID         NOT NULL,
    slot_id        UUID         NOT NULL REFERENCES availability_slot(id),
    status_id      SMALLINT     NOT NULL REFERENCES booking_status(id),
    total_amount   NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    currency_code  CHAR(3)      NOT NULL DEFAULT 'USD',
    language_id    SMALLINT,
    notes          TEXT,
    internal_notes TEXT,
    cancelled_at   TIMESTAMPTZ,
    cancel_reason  TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_detail (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id               UUID         NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
    product_option_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    price_tier_id            UUID         NOT NULL,
    attraction_name_snapshot VARCHAR(200) NOT NULL DEFAULT '',
    option_name_snapshot     VARCHAR(200) NOT NULL DEFAULT '',
    tier_name_snapshot       VARCHAR(100) NOT NULL DEFAULT '',
    first_name               VARCHAR(100) NOT NULL,
    last_name                VARCHAR(100) NOT NULL,
    document_type            VARCHAR(20),
    document_number          VARCHAR(50)  NOT NULL DEFAULT '',
    ticket_category_name     VARCHAR(100) NOT NULL,
    quantity                 SMALLINT     NOT NULL DEFAULT 1,
    unit_price               NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    currency_code            CHAR(3)      NOT NULL DEFAULT 'USD',
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_criteria (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS review (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id    UUID         NOT NULL UNIQUE REFERENCES booking(id),
    user_id       UUID         NOT NULL,
    attraction_id UUID         NOT NULL,
    overall_score NUMERIC(3,2) NOT NULL,
    title         VARCHAR(150),
    comment       TEXT,
    response      TEXT,
    responded_at  TIMESTAMPTZ,
    is_visible    BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified   BOOLEAN      NOT NULL DEFAULT TRUE,
    language_id   SMALLINT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_rating (
    id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID     NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    criteria_id SMALLINT NOT NULL REFERENCES review_criteria(id),
    score       SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_media (
    id        UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID     NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    url       TEXT     NOT NULL
);

-- Seed data: estados de reserva
INSERT INTO booking_status (id, name) VALUES
    (1, 'pending'),
    (2, 'confirmed'),
    (3, 'cancelled'),
    (4, 'completed'),
    (5, 'no_show')
ON CONFLICT (id) DO NOTHING;

INSERT INTO review_criteria (id, name) VALUES
    (1, 'guide_quality'),
    (2, 'value_for_money'),
    (3, 'organization'),
    (4, 'safety'),
    (5, 'overall_experience')
ON CONFLICT (id) DO NOTHING;
