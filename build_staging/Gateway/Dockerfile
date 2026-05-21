# ============================================================
# Dockerfile - API Gateway (YARP Reverse Proxy)
# Paula Coronel — Atracciones Microservicios
# Ingress: EXTERNAL (público) — puerto 80
# Enruta hacia los 4 microservicios internos del ACA Environment
# ============================================================

# --- STAGE 1: Build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["Microservicios.Atracciones.Gateway.csproj", "."]
RUN dotnet restore "Microservicios.Atracciones.Gateway.csproj"

COPY . .
RUN dotnet publish "Microservicios.Atracciones.Gateway.csproj" \
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

ENTRYPOINT ["dotnet", "Microservicios.Atracciones.Gateway.dll"]
