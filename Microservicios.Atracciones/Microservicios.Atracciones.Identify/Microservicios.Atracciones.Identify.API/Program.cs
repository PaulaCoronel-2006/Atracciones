using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microservicios.Atracciones.Identify.DataAccess;       // Capa 1
using Microservicios.Atracciones.Identify.DataManagement;   // Capa 2
using Microservicios.Atracciones.Identify.Business;         // Capa 3
using Asp.Versioning;
using Microsoft.OpenApi.Models;
using Microservicios.Atracciones.Identify.API.Middleware;   // <-- Añadido

var builder = WebApplication.CreateBuilder(args);


// IHttpContextAccessor: requerido por el factory de conexiones por rol
builder.Services.AddHttpContextAccessor();

// ======================================================
// 1. CONFIGURACIÓN DE CAPAS (CLEAN ARCHITECTURE)
// ======================================================
builder.Services.AddDataAccessServices(builder.Configuration);
builder.Services.AddDataManagementServices();
builder.Services.AddBusinessServices();

// ======================================================
// 2. CONFIGURACIÓN API & CORS
// ======================================================
builder.Services.AddControllers(options => 
{
    options.Filters.Add<Microservicios.Atracciones.Identify.API.Filters.ApiResponseWrapperFilter>();
    // Añadir prefijo global: api/v1/coronel_paula/[controller]
    options.Conventions.Add(new RoutePrefixConvention("api/v1/coronel_paula"));
})
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();

// ======================================================
// 4. SWAGGER CON SEGURIDAD JWT
// ======================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Identity Service API", 
        Version = "v1",
        Description = "Microservicio de Identidad y Autenticación"
    });

    // Configuración básica para soportar JWT en la UI de Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingresa el token JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// ======================================================
// 3. JWT AUTHENTICATION
// ======================================================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "Microservicios.Atracciones.Identify_Super_Secret_Key_2026_Minimum_Length_Requirement_Long_String"; // Cambiar esto en appsettings.json
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Microservicios.Atracciones.Identify";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Microservicios.Atracciones.IdentifyUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();

// ======================================================
// 5. CONFIGURACIÓN DEL PIPELINE HTTP
// ======================================================
// ======================================================
// 5. CONFIGURACIÓN DEL PIPELINE HTTP
// ======================================================

// Esto hace que Swagger sea accesible siempre (o podrías añadir una condición más flexible)
app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Servicio Atracción API v1");
    c.RoutePrefix = string.Empty; // <-- ESTO ES CLAVE: Hace que Swagger aparezca en la raíz
});

// Middleware Global de Excepciones
app.UseMiddleware<Microservicios.Atracciones.Identify.API.Middleware.ExceptionMiddleware>();
// Habilitar el servicio de archivos estáticos para la carpeta wwwroot (uploads locales)
app.UseStaticFiles();

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Orden indispensable: Autenticación ANTES que Autorización
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Clase para la convención de prefijo global
public class RoutePrefixConvention : Microsoft.AspNetCore.Mvc.ApplicationModels.IApplicationModelConvention
{
    private readonly string _prefix;
    public RoutePrefixConvention(string prefix) => _prefix = prefix;

    public void Apply(Microsoft.AspNetCore.Mvc.ApplicationModels.ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        {
            foreach (var selector in controller.Selectors)
            {
                if (selector.AttributeRouteModel != null)
                {
                    // Reemplazamos api/v1/[controller] por api/v1/coronel_paula/[controller]
                    // Para que funcione dinámicamente con los [Route] existentes
                    var currentTemplate = selector.AttributeRouteModel.Template;
                    if (currentTemplate != null && currentTemplate.StartsWith("api/v1/"))
                    {
                        selector.AttributeRouteModel.Template = currentTemplate.Replace("api/v1/", _prefix + "/");
                    }
                }
            }
        }
    }
}
