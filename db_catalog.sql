-- ============================================================
-- DB_CATALOG — Microservicio Catalog
-- Proyecto: postgres.kimthxyijmgfglyirded (sa-east-1)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS catalog_audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id UUID,
    table_name     VARCHAR(100),
    record_id      UUID,
    action         VARCHAR(10),
    changed_at     TIMESTAMPTZ DEFAULT NOW(),
    old_values     JSONB,
    new_values     JSONB
);

-- Catálogos base
CREATE TABLE IF NOT EXISTS language (
    id        SMALLSERIAL PRIMARY KEY,
    iso_code  VARCHAR(5)  NOT NULL UNIQUE,
    name      VARCHAR(50) NOT NULL,
    is_active BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS media_type (
    id   SMALLINT    PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ticket_category (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(50) NOT NULL,
    name_en       VARCHAR(80) NOT NULL,
    age_range_min SMALLINT,
    age_range_max SMALLINT
);

CREATE TABLE IF NOT EXISTS locations (
    id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    type      VARCHAR(50)  NOT NULL,
    parent_id UUID         REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS category (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       VARCHAR(100) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    icon_url   TEXT,
    sort_order SMALLINT     NOT NULL DEFAULT 0,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategory (
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

CREATE TABLE IF NOT EXISTS tag (
    id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS inclusion_item (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    icon_slug    VARCHAR(50),
    default_text TEXT        NOT NULL,
    language_id  SMALLINT    NOT NULL REFERENCES language(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attraction (
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

CREATE TABLE IF NOT EXISTS attraction_tag (
    attraction_id UUID NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    tag_id        UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (attraction_id, tag_id)
);

CREATE TABLE IF NOT EXISTS attraction_inclusion (
    attraction_id     UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    inclusion_item_id UUID        NOT NULL REFERENCES inclusion_item(id),
    type              VARCHAR(20) NOT NULL CHECK (type IN ('included','not_included','optional','bring')),
    PRIMARY KEY (attraction_id, inclusion_item_id)
);

CREATE TABLE IF NOT EXISTS attraction_language (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    language_id   SMALLINT    NOT NULL,
    guide_type    VARCHAR(20) NOT NULL CHECK (guide_type IN ('live','audio','written','app')),
    UNIQUE (attraction_id, language_id, guide_type)
);

CREATE TABLE IF NOT EXISTS attraction_media (
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

CREATE TABLE IF NOT EXISTS product_option (
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

CREATE TABLE IF NOT EXISTS price_tier (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id         UUID         NOT NULL REFERENCES product_option(id) ON DELETE CASCADE,
    ticket_category_id UUID         NOT NULL,
    price              NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency_code      CHAR(3)      NOT NULL DEFAULT 'USD',
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_schedule_template (
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

CREATE TABLE IF NOT EXISTS product_schedule_time (
    id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id       UUID     NOT NULL REFERENCES product_schedule_template(id) ON DELETE CASCADE,
    start_time        TIME     NOT NULL,
    end_time          TIME,
    capacity_override SMALLINT,
    sort_order        SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tour_itinerary (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    attraction_id     UUID        NOT NULL REFERENCES attraction(id) ON DELETE CASCADE,
    language_id       SMALLINT    NOT NULL,
    title             VARCHAR(150) NOT NULL,
    overview          TEXT,
    total_distance_km NUMERIC(6,2),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tour_stop (
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

CREATE TABLE IF NOT EXISTS tour_stop_media (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id       UUID        NOT NULL REFERENCES tour_stop(id) ON DELETE CASCADE,
    media_type_id SMALLINT    NOT NULL REFERENCES media_type(id),
    url           TEXT        NOT NULL,
    sort_order    SMALLINT    NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audio_guide (
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

CREATE TABLE IF NOT EXISTS audio_guide_stop (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_guide_id   UUID        NOT NULL REFERENCES audio_guide(id) ON DELETE CASCADE,
    stop_number      SMALLINT    NOT NULL,
    title            VARCHAR(150) NOT NULL,
    description      TEXT,
    audio_url        TEXT        NOT NULL,
    duration_seconds INTEGER,
    latitude         NUMERIC(9,6),
    longitude        NUMERIC(9,6),
    image_url        TEXT,
    UNIQUE (audio_guide_id, stop_number)
);

-- Seed data
INSERT INTO language (iso_code, name) VALUES ('es', 'Español'), ('en', 'English') ON CONFLICT (iso_code) DO NOTHING;
INSERT INTO media_type (id, name) VALUES (1, 'image'), (2, 'video'), (3, 'audio'), (4, 'document') ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_category (name, name_en, age_range_min, age_range_max) VALUES
    ('Adulto', 'Adult', 18, 99),
    ('Niño', 'Child', 3, 17),
    ('Infante', 'Infant', 0, 2)
ON CONFLICT DO NOTHING;
