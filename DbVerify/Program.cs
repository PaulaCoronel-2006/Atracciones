using Npgsql;

const string PASS = "AtraccionesCoronel2026!";

// ─────────────────────────────────────────────
// CATALOG
// ─────────────────────────────────────────────
Console.WriteLine("========== CATALOG ==========");
var catalogConn = new NpgsqlConnection($"Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.kimthxyijmgfglyirded;Password={PASS};SSL Mode=Require;Trust Server Certificate=true;");
await catalogConn.OpenAsync();
Console.WriteLine("✅ Conectado");

var c = catalogConn.CreateCommand();
c.CommandTimeout = 60;
c.CommandText = @"
INSERT INTO language (iso_code, name, is_active) VALUES ('es','Español',TRUE),('en','English',TRUE) ON CONFLICT (iso_code) DO NOTHING;
INSERT INTO media_type (id, name) VALUES (1,'image'),(2,'video'),(3,'document') ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, name, type, parent_id) VALUES
  ('a1000000-0000-0000-0000-000000000001','Ecuador','country',NULL),
  ('a1000000-0000-0000-0000-000000000011','Pichincha','state','a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000012','Quito','city','a1000000-0000-0000-0000-000000000011'),
  ('a1000000-0000-0000-0000-000000000021','Tungurahua','state','a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000022','Baños de Agua Santa','city','a1000000-0000-0000-0000-000000000021'),
  ('a1000000-0000-0000-0000-000000000031','Galápagos','state','a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000032','Puerto Ayora','city','a1000000-0000-0000-0000-000000000031'),
  ('a1000000-0000-0000-0000-000000000041','Imbabura','state','a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000042','Otavalo','city','a1000000-0000-0000-0000-000000000041')
ON CONFLICT DO NOTHING;

INSERT INTO category (id, slug, name, sort_order, is_active) VALUES
  ('c0000001-0000-0000-0000-000000000001','naturaleza','Naturaleza',1,TRUE),
  ('c0000001-0000-0000-0000-000000000002','aventura','Aventura',2,TRUE),
  ('c0000001-0000-0000-0000-000000000003','cultural','Cultural',3,TRUE),
  ('c0000001-0000-0000-0000-000000000004','familiar','Familiar',4,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO subcategory (id, category_id, slug, name, sort_order, is_active) VALUES
  ('d0000001-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000001','volcanes-montanas','Volcanes y Montañas',1,TRUE),
  ('d0000001-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000001','islas-playas','Islas y Playas',2,TRUE),
  ('d0000001-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000002','deportes-extremos','Deportes Extremos',1,TRUE),
  ('d0000001-0000-0000-0000-000000000004','c0000001-0000-0000-0000-000000000003','mercados-arte','Mercados y Arte',1,TRUE),
  ('d0000001-0000-0000-0000-000000000005','c0000001-0000-0000-0000-000000000003','trenes-historicos','Trenes Históricos',2,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO ticket_category (id, name, name_en) VALUES
  ('e0000001-0000-0000-0000-000000000001','Adulto','Adult'),
  ('e0000001-0000-0000-0000-000000000002','Niño','Child'),
  ('e0000001-0000-0000-0000-000000000003','Tercera Edad','Senior')
ON CONFLICT DO NOTHING;

-- difficulty_level CHECK: 'easy' | 'moderate' | 'hard'
INSERT INTO attraction (id, location_id, subcategory_id, slug, name, description_short, description_full,
  address, latitude, longitude, rating_average, rating_count, max_group_size, difficulty_level, is_active, is_published) VALUES
  ('b2000000-0001-0001-0001-000000000001','a1000000-0000-0000-0000-000000000012','d0000001-0000-0000-0000-000000000001',
   'tour-cotopaxi-limpiopungo','Tour al Cotopaxi & Laguna de Limpiopungo',
   'Explora uno de los volcanes activos más altos del mundo.',
   'Senderismo hasta el Refugio José Rivas a 4,860m y caminata en la Laguna de Limpiopungo con avistamiento de aves andinas.',
   'Parque Nacional Cotopaxi, Ecuador',-0.6833,-78.4333,4.8,124,15,'moderate',TRUE,TRUE),
  ('b2000000-0001-0001-0001-000000000002','a1000000-0000-0000-0000-000000000022','d0000001-0000-0000-0000-000000000003',
   'aventura-banos-agua-santa','Aventura Completa en Baños de Agua Santa',
   'Adrenalina pura: Columpio del Fin del Mundo y Pailón del Diablo.',
   'Columpio del Fin del Mundo en La Casa del Árbol + cascada Pailón del Diablo con puentes colgantes.',
   'Baños de Agua Santa, Tungurahua, Ecuador',-1.3964,-78.4247,4.9,210,20,'easy',TRUE,TRUE),
  ('b2000000-0001-0001-0001-000000000003','a1000000-0000-0000-0000-000000000032','d0000001-0000-0000-0000-000000000002',
   'crucero-galapagos','Crucero de un Día en Islas Galápagos',
   'Snorkel con tortugas marinas, iguanas y lobos marinos.',
   'Expedición por las Galápagos: nada con tortugas gigantes e iguanas marinas, guiado por naturalistas certificados.',
   'Puerto Ayora, Santa Cruz, Galápagos',-0.7402,-90.3121,5.0,88,12,'easy',TRUE,TRUE),
  ('b2000000-0001-0001-0001-000000000004','a1000000-0000-0000-0000-000000000042','d0000001-0000-0000-0000-000000000004',
   'mercado-otavalo','Mercado de Otavalo & Lago San Pablo',
   'El mercado artesanal más famoso de Sudamérica.',
   'Textiles, artesanías y joyería Kichwa + visita al sereno Lago San Pablo con vistas al Volcán Imbabura.',
   'Plaza de los Ponchos, Otavalo, Imbabura, Ecuador',0.2342,-78.2618,4.7,156,25,'easy',TRUE,TRUE),
  ('b2000000-0001-0001-0001-000000000005','a1000000-0000-0000-0000-000000000012','d0000001-0000-0000-0000-000000000005',
   'tren-nariz-del-diablo','Tren del Nariz del Diablo',
   'El recorrido ferroviario más espectacular de Ecuador.',
   'El Nariz del Diablo: el tren desciende en zigzag por el cañón de Alausí con vistas panorámicas de los Andes.',
   'Estación de Tren, Alausí, Chimborazo, Ecuador',-2.1989,-78.8462,4.8,203,30,'easy',TRUE,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO product_option (id, attraction_id, slug, title, description, duration_minutes, cancel_policy_hours, min_participants, is_active, is_private, sort_order) VALUES
  ('f0000001-0001-0001-0001-000000000001','b2000000-0001-0001-0001-000000000001','tour-cotopaxi-completo','Tour Completo Cotopaxi','Transporte, guía y almuerzo incluidos',480,24,1,TRUE,FALSE,1),
  ('f0000001-0001-0001-0001-000000000002','b2000000-0001-0001-0001-000000000002','paquete-aventura-banos','Paquete Aventura Baños','Columpio + Pailón + Canopy',600,24,1,TRUE,FALSE,1),
  ('f0000001-0001-0001-0001-000000000003','b2000000-0001-0001-0001-000000000003','crucero-galapagos-dia','Crucero Día Completo','Snorkel + Caminata volcánica + Almuerzo',720,48,1,TRUE,FALSE,1),
  ('f0000001-0001-0001-0001-000000000004','b2000000-0001-0001-0001-000000000004','tour-cultural-otavalo','Tour Cultural Otavalo','Mercado + Lago San Pablo',300,12,1,TRUE,FALSE,1),
  ('f0000001-0001-0001-0001-000000000005','b2000000-0001-0001-0001-000000000005','ruta-tren-diablo','Ruta Tren Nariz del Diablo','Alausí-Sibambe en tren histórico',120,12,1,TRUE,FALSE,1)
ON CONFLICT DO NOTHING;

INSERT INTO price_tier (id, product_id, ticket_category_id, price, currency_code, is_active) VALUES
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000001','e0000001-0000-0000-0000-000000000001',49.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000001','e0000001-0000-0000-0000-000000000002',25.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000002','e0000001-0000-0000-0000-000000000001',59.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000002','e0000001-0000-0000-0000-000000000002',30.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000003','e0000001-0000-0000-0000-000000000001',180.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000003','e0000001-0000-0000-0000-000000000002',90.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000004','e0000001-0000-0000-0000-000000000001',35.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000004','e0000001-0000-0000-0000-000000000002',18.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000005','e0000001-0000-0000-0000-000000000001',45.00,'USD',TRUE),
  (gen_random_uuid(),'f0000001-0001-0001-0001-000000000005','e0000001-0000-0000-0000-000000000002',22.00,'USD',TRUE)
ON CONFLICT DO NOTHING;
";
await c.ExecuteNonQueryAsync();
Console.WriteLine("✅ Seed catalog aplicado");

c.CommandText = "SELECT name, difficulty_level, rating_average FROM attraction ORDER BY name;";
var r = await c.ExecuteReaderAsync();
Console.WriteLine("\n🎯 ATRACCIONES:");
while (await r.ReadAsync()) Console.WriteLine($"  • {r[0]} | {r[1]} | ⭐{r[2]}");
await r.CloseAsync();

c.CommandText = "SELECT COUNT(*) FROM price_tier;"; 
Console.WriteLine($"💰 Price tiers: {await c.ExecuteScalarAsync()}");
await catalogConn.DisposeAsync();

// ─────────────────────────────────────────────
// BOOKING
// ─────────────────────────────────────────────
Console.WriteLine("\n========== BOOKING ==========");
try
{
    var bookingConn = new NpgsqlConnection($"Host=aws-1-us-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.nnwzfvfhveoelyyrrplv;Password={PASS};SSL Mode=Require;Trust Server Certificate=true;");
    await bookingConn.OpenAsync();
    Console.WriteLine("✅ Conectado");

    var b = bookingConn.CreateCommand();
    b.CommandTimeout = 60;
    b.CommandText = @"
    CREATE TABLE IF NOT EXISTS booking_status (id SMALLINT PRIMARY KEY, name VARCHAR(20) NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS booking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pnr_code VARCHAR(20) NOT NULL UNIQUE,
        attraction_id UUID NOT NULL,
        attraction_name VARCHAR(200),
        client_name VARCHAR(150),
        client_email VARCHAR(256),
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        passengers_count SMALLINT NOT NULL DEFAULT 1,
        total_amount NUMERIC(12,2) NOT NULL,
        status_id SMALLINT NOT NULL REFERENCES booking_status(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO booking_status (id, name) VALUES
      (1,'pending'),(2,'confirmed'),(3,'cancelled'),(4,'completed'),(5,'no_show')
    ON CONFLICT (id) DO NOTHING;
    ";
    await b.ExecuteNonQueryAsync();
    Console.WriteLine("✅ Seed y Tablas de Booking creadas exitosamente");

    b.CommandText = "SELECT id, name FROM booking_status ORDER BY id;";
    var rb = await b.ExecuteReaderAsync();
    Console.WriteLine("📋 Booking status:");
    while (await rb.ReadAsync()) Console.WriteLine($"  {rb[0]}. {rb[1]}");
    await rb.CloseAsync();
    await bookingConn.DisposeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error en BOOKING: {ex.Message}");
}

// ─────────────────────────────────────────────
// IDENTIFY
// ─────────────────────────────────────────────
Console.WriteLine("\n========== IDENTIFY ==========");
try
{
    var identifyConn = new NpgsqlConnection($"Host=aws-1-us-west-2.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.cdjwkanairobhsxodpnx;Password={PASS};SSL Mode=Require;Trust Server Certificate=true;");
    await identifyConn.OpenAsync();
    Console.WriteLine("✅ Conectado exitosamente a IDENTIFY DB");
    await identifyConn.DisposeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error en IDENTIFY: {ex.Message}");
}

// ─────────────────────────────────────────────
// BILLING
// ─────────────────────────────────────────────
Console.WriteLine("\n========== BILLING ==========");
try
{
    var billingConn = new NpgsqlConnection($"Host=aws-1-us-west-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.hkjzvfcourzjyzxheran;Password={PASS};SSL Mode=Require;Trust Server Certificate=true;");
    await billingConn.OpenAsync();
    Console.WriteLine("✅ Conectado exitosamente a BILLING DB");
    await billingConn.DisposeAsync();
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error en BILLING: {ex.Message}");
}

Console.WriteLine("\n\n✅ COMPROBACIÓN FINALIZADA!");

