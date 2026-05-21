# ==============================================================================
# SCRIPT MAESTRO DE DESPLIEGUE — ATRACCIONES CORONEL
# Azure Container Registry (ACR) + Azure Container Apps (ACA)
# 6 servicios: catalog | booking | billing | identify | gateway (público) | frontend (público)
# Autor: Paula Coronel | .NET 10 Microservicios + Frontend
# Ejecutar con: .\deploy-azure.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────────────────
# VARIABLES GLOBALES
# ─────────────────────────────────────────────────────────────────────────────
$LOCATION     = "eastus"
$RG           = "rg-atracciones-coronel"
$ACR_NAME     = "acratraccionescoronel"
$ACA_ENV      = "aca-env-atracciones"

$APP_CATALOG  = "catalog-api"
$APP_BOOKING  = "booking-api"
$APP_BILLING  = "billing-api"
$APP_IDENTIFY = "identify-api"
$APP_GATEWAY  = "gateway-api"
$APP_FRONTEND = "frontend"

$ROOT = ".\Microservicios.Atracciones"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     DESPLIEGUE — ATRACCIONES CORONEL EN AZURE               ║" -ForegroundColor Magenta
Write-Host "║     ACR + Azure Container Apps — 6 servicios                ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# ==============================================================================
# PASO 1: EXTENSIÓN DE CONTAINER APPS
# ==============================================================================
Write-Host "► [1/8] Registrando extensiones y proveedores Azure..." -ForegroundColor Cyan
az extension add --name containerapp --upgrade --only-show-errors 2>$null
az provider register --namespace Microsoft.App --only-show-errors 2>$null
az provider register --namespace Microsoft.OperationalInsights --only-show-errors 2>$null
Write-Host "  ✅ Extensiones listas" -ForegroundColor Green

# ==============================================================================
# PASO 2: RESOURCE GROUP
# ==============================================================================
Write-Host ""
Write-Host "► [2/8] Creando Resource Group: $RG en $LOCATION..." -ForegroundColor Cyan
az group create --name $RG --location $LOCATION --output none
Write-Host "  ✅ Resource Group: $RG" -ForegroundColor Green

# ==============================================================================
# PASO 3: AZURE CONTAINER REGISTRY
# ==============================================================================
Write-Host ""
Write-Host "► [3/8] Creando Azure Container Registry: $ACR_NAME..." -ForegroundColor Cyan
az acr create `
  --resource-group $RG `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true `
  --output none

$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv
$ACR_PASSWORD     = az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv
Write-Host "  ✅ ACR: $ACR_LOGIN_SERVER" -ForegroundColor Green

# ==============================================================================
# PASO 4: CONTAINER APPS ENVIRONMENT
# ==============================================================================
Write-Host ""
Write-Host "► [4/8] Creando Container Apps Environment: $ACA_ENV..." -ForegroundColor Cyan
az containerapp env create `
  --name $ACA_ENV `
  --resource-group $RG `
  --location $LOCATION `
  --output none
Write-Host "  ✅ Environment ACA: $ACA_ENV" -ForegroundColor Green

# ==============================================================================
# PASO 5: BUILD Y PUSH DE IMÁGENES AL ACR (cloud build — sin Docker local)
# ==============================================================================
Write-Host ""
Write-Host "► [5/8] Compilando y subiendo imágenes al ACR..." -ForegroundColor Cyan
Write-Host "  (Usando az acr build — compilación en la nube, no requiere Docker local)" -ForegroundColor Gray

Write-Host "  ⏳ Building: identify-api..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "identify-api:latest" `
  --file "$ROOT\Microservicios.Atracciones.Identify\Dockerfile" `
  "$ROOT\Microservicios.Atracciones.Identify" `
  --output none
Write-Host "  ✅ identify-api → $ACR_LOGIN_SERVER/identify-api:latest" -ForegroundColor Green

Write-Host "  ⏳ Building: catalog-api..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "catalog-api:latest" `
  --file "$ROOT\Microservicios.Atracciones.Catalog\Dockerfile" `
  "$ROOT\Microservicios.Atracciones.Catalog" `
  --output none
Write-Host "  ✅ catalog-api → $ACR_LOGIN_SERVER/catalog-api:latest" -ForegroundColor Green

Write-Host "  ⏳ Building: booking-api..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "booking-api:latest" `
  --file "$ROOT\Microservicios.Atracciones.Booking\Dockerfile" `
  "$ROOT\Microservicios.Atracciones.Booking" `
  --output none
Write-Host "  ✅ booking-api → $ACR_LOGIN_SERVER/booking-api:latest" -ForegroundColor Green

Write-Host "  ⏳ Building: billing-api..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "billing-api:latest" `
  --file "$ROOT\Microservicios.Atracciones.Billing\Dockerfile" `
  "$ROOT\Microservicios.Atracciones.Billing" `
  --output none
Write-Host "  ✅ billing-api → $ACR_LOGIN_SERVER/billing-api:latest" -ForegroundColor Green

Write-Host "  ⏳ Building: gateway-api..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "gateway-api:latest" `
  --file "$ROOT\Microservicios.Atracciones.Gateway\Dockerfile" `
  "$ROOT\Microservicios.Atracciones.Gateway" `
  --output none
Write-Host "  ✅ gateway-api → $ACR_LOGIN_SERVER/gateway-api:latest" -ForegroundColor Green

Write-Host "  ⏳ Building: frontend..." -ForegroundColor Yellow
az acr build --registry $ACR_NAME --image "frontend:latest" `
  --file ".\Atracciones.Frontend\Dockerfile" `
  ".\Atracciones.Frontend" `
  --output none
Write-Host "  ✅ frontend → $ACR_LOGIN_SERVER/frontend:latest" -ForegroundColor Green

# ==============================================================================
# PASO 6: DESPLIEGUE DE MICROSERVICIOS INTERNOS (sin IP pública)
# ==============================================================================
Write-Host ""
Write-Host "► [6/8] Desplegando microservicios INTERNOS en Azure Container Apps..." -ForegroundColor Cyan
Write-Host "  (ingress: internal — sin IP pública, solo accesibles dentro del ACA)" -ForegroundColor Gray

$JWT_KEY = "AtraccionesCoronelSuperSecretJWTKey2026MinimumLengthRequirementLongString!"

# ── IDENTIFY API (se despliega primero: es la base de autenticación) ──────────
Write-Host "  ⏳ Desplegando: identify-api (internal)..." -ForegroundColor Yellow
az containerapp create `
  --name $APP_IDENTIFY `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/identify-api:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress internal `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1.0Gi `
  --env-vars `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "ASPNETCORE_URLS=http://+:80" `
    "ConnectionStrings__DefaultConnection=Host=aws-1-us-west-2.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.cdjwkanairobhsxodpnx;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;" `
    "Jwt__Key=$JWT_KEY" `
    "Jwt__Issuer=Microservicios.Atracciones.Identify" `
    "Jwt__Audience=Microservicios.Atracciones.IdentifyUsers" `
    "Jwt__DurationMinutes=30" `
  --output none
Write-Host "  ✅ identify-api desplegado (DNS interno: http://identify-api)" -ForegroundColor Green

# ── CATALOG API ───────────────────────────────────────────────────────────────
Write-Host "  ⏳ Desplegando: catalog-api (internal)..." -ForegroundColor Yellow
az containerapp create `
  --name $APP_CATALOG `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/catalog-api:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress internal `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1.0Gi `
  --env-vars `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "ASPNETCORE_URLS=http://+:80" `
    "ConnectionStrings__DefaultConnection=Host=aws-1-sa-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.kimthxyijmgfglyirded;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;" `
    "Jwt__Key=$JWT_KEY" `
    "Jwt__Issuer=MicroserviciosAtraccionesCatalog" `
    "Jwt__Audience=MicroserviciosAtraccionesCatalogUsers" `
    "Jwt__DurationMinutes=30" `
  --output none
Write-Host "  ✅ catalog-api desplegado (DNS interno: http://catalog-api)" -ForegroundColor Green

# ── BOOKING API ───────────────────────────────────────────────────────────────
Write-Host "  ⏳ Desplegando: booking-api (internal)..." -ForegroundColor Yellow
az containerapp create `
  --name $APP_BOOKING `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/booking-api:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress internal `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1.0Gi `
  --env-vars `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "ASPNETCORE_URLS=http://+:80" `
    "ConnectionStrings__DefaultConnection=Host=aws-1-us-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.nnwzfvfhveoelyyrrplv;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;" `
    "Jwt__Key=$JWT_KEY" `
    "Jwt__Issuer=ServicioAtraccion" `
    "Jwt__Audience=ServicioAtraccionUsers" `
    "Jwt__DurationMinutes=30" `
    "Services__CatalogUrl=http://catalog-api" `
    "Services__IdentifyUrl=http://identify-api" `
  --output none
Write-Host "  ✅ booking-api desplegado (DNS interno: http://booking-api)" -ForegroundColor Green

# ── BILLING API ───────────────────────────────────────────────────────────────
Write-Host "  ⏳ Desplegando: billing-api (internal)..." -ForegroundColor Yellow
az containerapp create `
  --name $APP_BILLING `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/billing-api:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress internal `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1.0Gi `
  --env-vars `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "ASPNETCORE_URLS=http://+:80" `
    "ConnectionStrings__DefaultConnection=Host=aws-1-us-west-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.hkjzvfcourzjyzxheran;Password=AtraccionesCoronel2026!;SSL Mode=Require;Trust Server Certificate=true;" `
    "Jwt__Key=$JWT_KEY" `
    "Jwt__Issuer=BillingService" `
    "Jwt__Audience=BillingServiceUsers" `
    "Jwt__DurationMinutes=30" `
    "Billing__TaxRate=0.15" `
    "Services__BookingUrl=http://booking-api" `
    "Services__IdentifyUrl=http://identify-api" `
  --output none
Write-Host "  ✅ billing-api desplegado (DNS interno: http://billing-api)" -ForegroundColor Green

# ==============================================================================
# PASO 7: DESPLIEGUE DEL API GATEWAY (EXTERNO — IP PÚBLICA)
# ==============================================================================
Write-Host ""
Write-Host "► [7/8] Desplegando API GATEWAY (EXTERNO — acceso público)..." -ForegroundColor Cyan
Write-Host "  (ingress: external — este redirige el tráfico público a los servicios internos)" -ForegroundColor Gray

az containerapp create `
  --name $APP_GATEWAY `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/gateway-api:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress external `
  --min-replicas 1 --max-replicas 5 `
  --cpu 0.5 --memory 1.0Gi `
  --env-vars `
    "ASPNETCORE_ENVIRONMENT=Production" `
    "ASPNETCORE_URLS=http://+:80" `
    "ReverseProxy__Clusters__catalog-cluster__Destinations__catalog-api__Address=http://catalog-api" `
    "ReverseProxy__Clusters__booking-cluster__Destinations__booking-api__Address=http://booking-api" `
    "ReverseProxy__Clusters__billing-cluster__Destinations__billing-api__Address=http://billing-api" `
    "ReverseProxy__Clusters__identify-cluster__Destinations__identify-api__Address=http://identify-api" `
  --output none

$GATEWAY_FQDN = az containerapp show `
  --name $APP_GATEWAY `
  --resource-group $RG `
  --query "properties.configuration.ingress.fqdn" `
  --output tsv
Write-Host "  ✅ gateway-api desplegado (PÚBLICO)" -ForegroundColor Green

# ==============================================================================
# PASO 8: DESPLIEGUE DEL FRONTEND ESTÁTICO (EXTERNO — IP PÚBLICA)
# ==============================================================================
Write-Host ""
Write-Host "► [8/8] Desplegando FRONTEND ESTÁTICO (EXTERNO — acceso público)..." -ForegroundColor Cyan

az containerapp create `
  --name $APP_FRONTEND `
  --resource-group $RG `
  --environment $ACA_ENV `
  --image "$ACR_LOGIN_SERVER/frontend:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_NAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress external `
  --min-replicas 1 --max-replicas 2 `
  --cpu 0.25 --memory 0.5Gi `
  --output none

$FRONTEND_FQDN = az containerapp show `
  --name $APP_FRONTEND `
  --resource-group $RG `
  --query "properties.configuration.ingress.fqdn" `
  --output tsv
Write-Host "  ✅ frontend desplegado (PÚBLICO)" -ForegroundColor Green

# ==============================================================================
# RESUMEN FINAL
# ==============================================================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ DESPLIEGUE COMPLETADO                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URL PÚBLICA DEL FRONTEND:" -ForegroundColor Yellow
Write-Host "   https://$FRONTEND_FQDN" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL PÚBLICA DEL GATEWAY:" -ForegroundColor Yellow
Write-Host "   https://$GATEWAY_FQDN" -ForegroundColor White
Write-Host ""
Write-Host "📡 ENDPOINTS DISPONIBLES (via Gateway):" -ForegroundColor Cyan
Write-Host "   GET  https://$GATEWAY_FQDN/health"
Write-Host "   *    https://$GATEWAY_FQDN/api/v1/coronel_paula/catalog/..."
Write-Host "   *    https://$GATEWAY_FQDN/api/v1/coronel_paula/booking/..."
Write-Host "   *    https://$GATEWAY_FQDN/api/v1/coronel_paula/billing/..."
Write-Host "   *    https://$GATEWAY_FQDN/api/v1/coronel_paula/..."
Write-Host ""
Write-Host "🔒 SERVICIOS INTERNOS (sin IP pública):" -ForegroundColor Gray
Write-Host "   identify-api  → http://identify-api  (solo dentro del ACA)"
Write-Host "   catalog-api   → http://catalog-api   (solo dentro del ACA)"
Write-Host "   booking-api   → http://booking-api   (solo dentro del ACA)"
Write-Host "   billing-api   → http://billing-api   (solo dentro del ACA)"
Write-Host ""

# Guardar la URL en un archivo para uso futuro
"GATEWAY_URL=https://$GATEWAY_FQDN" | Out-File -FilePath "gateway-url.txt" -Encoding UTF8
"FRONTEND_URL=https://$FRONTEND_FQDN" | Out-File -FilePath "frontend-url.txt" -Encoding UTF8
Write-Host "💾 URLs guardadas en: gateway-url.txt y frontend-url.txt" -ForegroundColor Gray
