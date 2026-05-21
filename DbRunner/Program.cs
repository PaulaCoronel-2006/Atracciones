using Npgsql;

var databases = new[]
{
    new {
        Name = "BILLING (hkjzvfcourzjyzxheran - us-west-1)",
        ConnStr = "Host=aws-1-us-west-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.hkjzvfcourzjyzxheran;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;",
        Sql = @"
CREATE EXTENSION IF NOT EXISTS ""pgcrypto"";

CREATE TABLE IF NOT EXISTS billing_audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), correlation_id UUID, table_name VARCHAR(100), record_id UUID, action VARCHAR(10), changed_at TIMESTAMPTZ DEFAULT NOW(), old_values JSONB, new_values JSONB);

CREATE TABLE IF NOT EXISTS payment_status_type (id SMALLINT PRIMARY KEY, name VARCHAR(20) NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS payment_method_type (id SMALLINT PRIMARY KEY, name VARCHAR(30) NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS payment (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), correlation_id UUID, booking_id UUID NOT NULL, payment_method_id SMALLINT NOT NULL REFERENCES payment_method_type(id), status_id SMALLINT NOT NULL REFERENCES payment_status_type(id), amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), currency_code CHAR(3) NOT NULL DEFAULT 'USD', transaction_id VARCHAR(100), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS invoice (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), booking_id UUID NOT NULL, invoice_number VARCHAR(20) NOT NULL UNIQUE, customer_name VARCHAR(150) NOT NULL, tax_id VARCHAR(20) NOT NULL, total NUMERIC(12,2) NOT NULL CHECK (total >= 0), currency_code CHAR(3) NOT NULL DEFAULT 'USD', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS invoice_detail (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE, description VARCHAR(255) NOT NULL, quantity INTEGER NOT NULL, unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0), total_item NUMERIC(12,2) NOT NULL CHECK (total_item >= 0));

INSERT INTO payment_status_type (id, name) VALUES (1,'pending'),(2,'completed'),(3,'failed'),(4,'refunded'),(5,'cancelled') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_method_type (id, name) VALUES (1,'credit_card'),(2,'debit_card'),(3,'bank_transfer'),(4,'cash'),(5,'paypal') ON CONFLICT (id) DO NOTHING;
"
    },
    new {
        Name = "IDENTIFY (cdjwkanairobhsxodpnx - us-west-2)",
        ConnStr = "Host=aws-1-us-west-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.cdjwkanairobhsxodpnx;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;",
        Sql = @"
CREATE EXTENSION IF NOT EXISTS ""pgcrypto"";

CREATE TABLE IF NOT EXISTS identity_audit_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), correlation_id UUID, table_name VARCHAR(100), record_id UUID, action VARCHAR(10), changed_by VARCHAR(256), changed_at TIMESTAMPTZ DEFAULT NOW(), old_values JSONB, new_values JSONB);

CREATE TABLE IF NOT EXISTS role (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(50) NOT NULL UNIQUE, description TEXT);

CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(256) NOT NULL UNIQUE, password_hash TEXT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, email_verified BOOLEAN NOT NULL DEFAULT FALSE, last_login_at TIMESTAMPTZ, refresh_token TEXT, reset_password_token VARCHAR(255), reset_password_expiry TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS user_role (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id UUID NOT NULL REFERENCES role(id), PRIMARY KEY (user_id, role_id));

CREATE TABLE IF NOT EXISTS client (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, phone VARCHAR(20), birth_date DATE, nationality VARCHAR(100), document_type VARCHAR(20), document_number VARCHAR(50), location_id UUID, avatar_url TEXT, preferred_lang SMALLINT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);

INSERT INTO role (name, description) VALUES ('admin','Administrador del sistema'),('partner','Operador de atraccion'),('client','Cliente viajero') ON CONFLICT (name) DO NOTHING;
"
    }
};

foreach (var db in databases)
{
    Console.WriteLine($"\n{'=',60}");
    Console.WriteLine($"Conectando a: {db.Name}");
    Console.WriteLine($"{'=',60}");
    try
    {
        await using var conn = new NpgsqlConnection(db.ConnStr);
        await conn.OpenAsync();
        Console.WriteLine("✅ Conexión exitosa!");

        await using var cmd = new NpgsqlCommand(db.Sql, conn);
        cmd.CommandTimeout = 60;
        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("✅ Script SQL ejecutado correctamente!");

        // Verificar tablas creadas
        await using var checkCmd = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;",
            conn);
        await using var reader = await checkCmd.ExecuteReaderAsync();
        Console.WriteLine("\n📋 Tablas creadas:");
        while (await reader.ReadAsync())
            Console.WriteLine($"   - {reader.GetString(0)}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error: {ex.Message}");
    }
}

Console.WriteLine("\n\n✅ Proceso completado para las 2 bases de datos.");
