# ============================================================
# Dockerfile - Booking Microservice (Paula Coronel)
# Arquitectura: Clean Architecture (.NET 10)
# Ruta pública: /api/v1/coronel_paula/booking/...
# ============================================================

# --- STAGE 1: Build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

COPY ["Microservicios.Atracciones.Booking.API/Microservicios.Atracciones.Booking.API.csproj", "Microservicios.Atracciones.Booking.API/"]
COPY ["Microservicios.Atracciones.Booking.Business/Microservicios.Atracciones.Booking.Business.csproj", "Microservicios.Atracciones.Booking.Business/"]
COPY ["Microservicios.Atracciones.Booking.DataAccess/Microservicios.Atracciones.Booking.DataAccess.csproj", "Microservicios.Atracciones.Booking.DataAccess/"]
COPY ["Microservicios.Atracciones.Booking.DataManagement/Microservicios.Atracciones.Booking.DataManagement.csproj", "Microservicios.Atracciones.Booking.DataManagement/"]

RUN dotnet restore "Microservicios.Atracciones.Booking.API/Microservicios.Atracciones.Booking.API.csproj"

COPY . .
RUN dotnet publish "Microservicios.Atracciones.Booking.API/Microservicios.Atracciones.Booking.API.csproj" \
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

ENTRYPOINT ["dotnet", "Microservicios.Atracciones.Booking.API.dll"]
