# ============================================================
# Dockerfile - Billing Microservice (Paula Coronel)
# Arquitectura: Clean Architecture (.NET 10)
# Ruta pública: /api/v1/coronel_paula/billing/...
# ============================================================

# --- STAGE 1: Build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["Microservicios.Atracciones.Billing.API/Microservicios.Atracciones.Billing.API.csproj", "Microservicios.Atracciones.Billing.API/"]
COPY ["Microservicios.Atracciones.Billing.Business/Microservicios.Atracciones.Billing.Business.csproj", "Microservicios.Atracciones.Billing.Business/"]
COPY ["Microservicios.Atracciones.Billing.DataAccess/Microservicios.Atracciones.Billing.DataAccess.csproj", "Microservicios.Atracciones.Billing.DataAccess/"]
COPY ["Microservicios.Atracciones.Billing.DataManagement/Microservicios.Atracciones.Billing.DataManagement.csproj", "Microservicios.Atracciones.Billing.DataManagement/"]

RUN dotnet restore "Microservicios.Atracciones.Billing.API/Microservicios.Atracciones.Billing.API.csproj"

COPY . .
RUN dotnet publish "Microservicios.Atracciones.Billing.API/Microservicios.Atracciones.Billing.API.csproj" \
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

ENTRYPOINT ["dotnet", "Microservicios.Atracciones.Billing.API.dll"]
