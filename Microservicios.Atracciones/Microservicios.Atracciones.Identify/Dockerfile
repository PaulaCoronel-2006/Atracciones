# ============================================================
# Dockerfile - Identify Microservice (Paula Coronel)
# Arquitectura: Clean Architecture (.NET 10)
# Ruta pública: /api/v1/coronel_paula/identify/...
# ============================================================

# --- STAGE 1: Build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["Microservicios.Atracciones.Identify.API/Microservicios.Atracciones.Identify.API.csproj", "Microservicios.Atracciones.Identify.API/"]
COPY ["Microservicios.Atracciones.Identify.Business/Microservicios.Atracciones.Identify.Business.csproj", "Microservicios.Atracciones.Identify.Business/"]
COPY ["Microservicios.Atracciones.Identify.DataAccess/Microservicios.Atracciones.Identify.DataAccess.csproj", "Microservicios.Atracciones.Identify.DataAccess/"]
COPY ["Microservicios.Atracciones.Identify.DataManagement/Microservicios.Atracciones.Identify.DataManagement.csproj", "Microservicios.Atracciones.Identify.DataManagement/"]

RUN dotnet restore "Microservicios.Atracciones.Identify.API/Microservicios.Atracciones.Identify.API.csproj"

COPY . .
RUN dotnet publish "Microservicios.Atracciones.Identify.API/Microservicios.Atracciones.Identify.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# --- STAGE 2: Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

COPY --from=build /app/publish .

EXPOSE 80

ENTRYPOINT ["dotnet", "Microservicios.Atracciones.Identify.API.dll"]
