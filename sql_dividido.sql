CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ************************************************************
-- 1. DB_IDENTITY (Identidad y Perfiles)
-- ************************************************************
CREATE TABLE identity_audit_log (
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

CREATE TABLE role (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
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

CREATE TABLE user_role (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE client (
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

-- ************************************************************
-- 2. DB_METADATA
-- ************************************************************
CREATE TABLE metadata_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE language (
    id        SMALLSERIAL PRIMARY KEY,
    iso_code  VARCHAR(5)  NOT NULL UNIQUE,
    name      VARCHAR(50) NOT NULL,
    is_active BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE media_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE ticket_category (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(50) NOT NULL,
    name_en       VARCHAR(80) NOT NULL,
    age_range_min SMALLINT,
    age_range_max SMALLINT
);

CREATE TABLE locations (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    type      VARCHAR(50)  NOT NULL,
    parent_id UUID         REFERENCES locations(id)
);

CREATE TABLE category (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       VARCHAR(100) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon_url   TEXT,
    sort_order SMALLINT     NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategory (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID         NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    icon_url    TEXT,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE tag (
    id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE inclusion_item (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    icon_slug    VARCHAR(50),
    default_text TEXT        NOT NULL,
    language_id  SMALLINT    NOT NULL REFERENCES language(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ************************************************************
-- 3. DB_CATALOG (El corazón de la información)
-- ************************************************************
CREATE TABLE catalog_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE attraction (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id       UUID         NOT NULL REFERENCES locations(id),
    subcategory_id    UUID         NOT NULL REFERENCES subcategory(id),
    slug              VARCHAR(200) NOT NULL UNIQUE,
    name              VARCHAR(150) NOT NULL,
    description_short VARCHAR(255),
    description_full  TEXT,
    address           TEXT,
    latitude          NUMERIC(9,6),
    longitude         NUMERIC(9,6),
    meeting_point     TEXT,
    rating_average    NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count      INTEGER      NOT NULL DEFAULT 0,
    min_age           SMALLINT,
    max_group_size    SMALLINT,
    difficulty_level  VARCHAR(20)  CHECK (difficulty_level IN ('easy','moderate','hard')),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    is_published      BOOLEAN      NOT NULL DEFAULT FALSE,
    managed_by_id     UUID,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE TABLE attraction_tag (
    attraction_id UUID NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    tag_id        UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (attraction_id, tag_id)
);

CREATE TABLE attraction_inclusion (
    attraction_id     UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    inclusion_item_id UUID        NOT NULL REFERENCES inclusion_item(id),
    type              VARCHAR(20) NOT NULL CHECK (type IN ('included','not_included','optional','bring')),
    PRIMARY KEY (attraction_id, inclusion_item_id)
);

CREATE TABLE attraction_language (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    language_id   SMALLINT    NOT NULL,
    guide_type    VARCHAR(20) NOT NULL CHECK (guide_type IN ('live','audio','written','app')),
    UNIQUE (attraction_id, language_id, guide_type)
);

CREATE TABLE attraction_media (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    media_type_id SMALLINT    NOT NULL REFERENCES media_type(id),
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    title         VARCHAR(150),
    language_id   SMALLINT,
    is_main       BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order    SMALLINT    NOT NULL DEFAULT 0,
    file_size_kb  INTEGER,
    duration_secs INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_option (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id        UUID         NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    slug                 VARCHAR(150) NOT NULL,
    title                VARCHAR(150) NOT NULL,
    description          TEXT,
    duration_minutes     INTEGER,
    duration_description VARCHAR(100),
    cancel_policy_hours  INTEGER      NOT NULL DEFAULT 24,
    cancel_policy_text   TEXT,
    max_group_size       SMALLINT,
    min_participants     SMALLINT     NOT NULL DEFAULT 1,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    is_private           BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order           SMALLINT     NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (attraction_id, slug)
);

CREATE TABLE product_inclusion (
    product_id        UUID        NOT NULL REFERENCES product_option(id) ON DELETE CASCADE,
    inclusion_item_id UUID        NOT NULL REFERENCES inclusion_item(id),
    type              VARCHAR(20) NOT NULL CHECK (type IN ('included','not_included','optional','bring')),
    PRIMARY KEY (product_id, inclusion_item_id)
);

CREATE TABLE price_tier (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id         UUID         NOT NULL REFERENCES product_option(id) ON DELETE CASCADE,
    ticket_category_id UUID         NOT NULL,
    price              NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency_code      CHAR(3)      NOT NULL DEFAULT 'USD',
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE product_schedule_template (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID        NOT NULL REFERENCES product_option(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    monday           BOOLEAN     NOT NULL DEFAULT FALSE,
    tuesday          BOOLEAN     NOT NULL DEFAULT FALSE,
    wednesday        BOOLEAN     NOT NULL DEFAULT FALSE,
    thursday         BOOLEAN     NOT NULL DEFAULT FALSE,
    friday           BOOLEAN     NOT NULL DEFAULT FALSE,
    saturday         BOOLEAN     NOT NULL DEFAULT FALSE,
    sunday           BOOLEAN     NOT NULL DEFAULT FALSE,
    valid_from       DATE        NOT NULL,
    valid_to         DATE,
    default_capacity SMALLINT    NOT NULL,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_schedule_time (
    id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id       UUID     NOT NULL REFERENCES product_schedule_template(id) ON DELETE CASCADE,
    start_time        TIME     NOT NULL,
    end_time          TIME,
    capacity_override SMALLINT,
    sort_order        SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE tour_itinerary (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id     UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    language_id       SMALLINT    NOT NULL,
    title             VARCHAR(150) NOT NULL,
    overview          TEXT,
    total_distance_km NUMERIC(6,2),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tour_stop (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id     UUID        NOT NULL REFERENCES tour_itinerary(id) ON DELETE CASCADE,
    stop_number      SMALLINT    NOT NULL,
    name             VARCHAR(150) NOT NULL,
    description      TEXT,
    latitude         NUMERIC(9,6),
    longitude        NUMERIC(9,6),
    duration_minutes SMALLINT,
    admission_type   VARCHAR(20) CHECK (admission_type IN ('included','optional','not_included','excluded','bring')),
    UNIQUE (itinerary_id, stop_number)
);

CREATE TABLE tour_stop_media (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id       UUID        NOT NULL REFERENCES tour_stop(id) ON DELETE CASCADE,
    media_type_id SMALLINT    NOT NULL REFERENCES media_type(id),
    url           TEXT        NOT NULL,
    sort_order    SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audio_guide (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id          UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    language_id            SMALLINT    NOT NULL,
    title                  VARCHAR(150) NOT NULL,
    description            TEXT,
    total_duration_seconds INTEGER,
    is_active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attraction_id, language_id)
);

CREATE TABLE audio_guide_stop (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_guide_id   UUID        NOT NULL REFERENCES audio_guide(id) ON DELETE CASCADE,
    stop_number      SMALLINT    NOT NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT,
    audio_url        TEXT        NOT NULL,
    duration_seconds INTEGER,
    latitude         NUMERIC(9,6),
    longitude         NUMERIC(9,6),
    image_url        TEXT,
    UNIQUE (audio_guide_id, stop_number)
);

-- ************************************************************
-- 4. DB_BOOKING (Inventario y Reservas)
-- ************************************************************
CREATE TABLE booking_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE booking_status (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE availability_slot (
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

CREATE TABLE booking (
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

CREATE TABLE booking_detail (
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

CREATE TABLE review_criteria (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE review (
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

CREATE TABLE review_rating (
    id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID     NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    criteria_id SMALLINT NOT NULL REFERENCES review_criteria(id),
    score       SMALLINT NOT NULL
);

CREATE TABLE review_media (
    id        UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID     NOT NULL REFERENCES review(id) ON DELETE CASCADE,
    url       TEXT     NOT NULL
);

-- ************************************************************
-- 5. DB_BILLING (Facturación)
-- ************************************************************
CREATE TABLE billing_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

CREATE TABLE payment_status_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE payment_method_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE payment (
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

CREATE TABLE invoice (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id     UUID         NOT NULL,
    invoice_number VARCHAR(20)  NOT NULL UNIQUE,
    customer_name  VARCHAR(150) NOT NULL,
    tax_id         VARCHAR(20)  NOT NULL,
    total          NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    currency_code  CHAR(3)      NOT NULL DEFAULT 'USD',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE invoice_detail (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID         NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity    INTEGER      NOT NULL,
    unit_price  NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_item  NUMERIC(12,2) NOT NULL CHECK (total_item >= 0)
);