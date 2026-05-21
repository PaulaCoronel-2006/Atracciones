# ============================================================
# Dockerfile - Catalog Microservice (Paula Coronel)
# Arquitectura: Clean Architecture (.NET 10)
# Ruta pública: /api/v1/coronel_paula/catalog/...
# ============================================================

# --- STAGE 1: Build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copiar los archivos .csproj para restaurar dependencias primero (cache de capas)
COPY ["Microservicios.Atracciones.Catalog.API/Microservicios.Atracciones.Catalog.API.csproj", "Microservicios.Atracciones.Catalog.API/"]
COPY ["Microservicios.Atracciones.Catalog.Business/Microservicios.Atracciones.Catalog.Business.csproj", "Microservicios.Atracciones.Catalog.Business/"]
COPY ["Microservicios.Atracciones.Catalog.DataAccess/Microservicios.Atracciones.Catalog.DataAccess.csproj", "Microservicios.Atracciones.Catalog.DataAccess/"]
COPY ["Microservicios.Atracciones.Catalog.DataManagement/Microservicios.Atracciones.Catalog.DataManagement.csproj", "Microservicios.Atracciones.Catalog.DataManagement/"]

RUN dotnet restore "Microservicios.Atracciones.Catalog.API/Microservicios.Atracciones.Catalog.API.csproj"

# Copiar todo el código fuente y compilar
COPY . .
RUN dotnet publish "Microservicios.Atracciones.Catalog.API/Microservicios.Atracciones.Catalog.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# --- STAGE 2: Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

# Variables de entorno de producción
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

# Copiar artefactos publicados desde el stage de build
COPY --from=build /app/publish .

EXPOSE 80

ENTRYPOINT ["dotnet", "Microservicios.Atracciones.Catalog.API.dll"]
