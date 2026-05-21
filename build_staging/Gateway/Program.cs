// ============================================================
// API GATEWAY - Microservicios Atracciones (Paula Coronel)
// Motor: YARP (Yet Another Reverse Proxy) — Microsoft
// Punto de entrada ÚNICO y PÚBLICO de toda la arquitectura
// Rutas expuestas: /api/v1/coronel_paula/{servicio}/...
// ============================================================

var builder = WebApplication.CreateBuilder(args);

// ── CORS: permite que el Frontend SPA consuma el Gateway ──────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ── YARP: carga la configuración de rutas desde appsettings ───
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("AllowAll");

// Endpoint de salud — útil para probar que el Gateway responde
app.MapGet("/health", () => Results.Ok(new
{
    status  = "healthy",
    service = "API Gateway — Atracciones Paula Coronel",
    version = "1.0.0",
    routes  = new[]
    {
        "GET|POST /api/v1/coronel_paula/catalog/{**path}  → catalog-api (internal)",
        "GET|POST /api/v1/coronel_paula/booking/{**path}  → booking-api (internal)",
        "GET|POST /api/v1/coronel_paula/billing/{**path}  → billing-api (internal)",
        "GET|POST /api/v1/coronel_paula/{**path}          → identify-api (internal)"
    }
}));

app.MapGet("/", () => Results.Redirect("/health"));

// YARP maneja todo el proxy hacia microservicios internos
app.MapReverseProxy();

app.Run();
