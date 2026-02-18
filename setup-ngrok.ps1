# Script para configurar ngrok en Windows
# Ejecutar como administrador si es necesario

Write-Host "🚀 Configurando ngrok para NOMADE.IO..." -ForegroundColor Green

# Verificar si ngrok está instalado
try {
    $ngrokVersion = & ngrok version 2>$null
    Write-Host "✅ ngrok está instalado: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok no está en el PATH. Reinstalando..." -ForegroundColor Red
    
    # Instalar ngrok usando winget
    winget install ngrok.ngrok
    
    # Agregar al PATH si es necesario
    $ngrokPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe"
    if (Test-Path $ngrokPath) {
        $env:PATH += ";$ngrokPath"
        Write-Host "✅ ngrok agregado al PATH" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 PASOS PARA CONFIGURAR NGROK:" -ForegroundColor Yellow
Write-Host "1. Ve a https://dashboard.ngrok.com/get-started/setup/windows" -ForegroundColor Cyan
Write-Host "2. Inicia sesión o crea una cuenta gratuita" -ForegroundColor Cyan
Write-Host "3. Ve a 'Your Authtoken' y copia tu token" -ForegroundColor Cyan
Write-Host "4. Ejecuta: ngrok config add-authtoken TU_AUTHTOKEN" -ForegroundColor Cyan
Write-Host ""

# Función para exponer la aplicación
function Start-NomadeTunnel {
    param(
        [int]$Port = 5173
    )
    
    Write-Host "🌐 Iniciando túnel ngrok en puerto $Port..." -ForegroundColor Green
    Write-Host "Esto expondrá tu aplicación local a internet" -ForegroundColor Yellow
    Write-Host ""
    
    # Iniciar ngrok
    ngrok http $Port
}

# Función para configurar webhooks de Shopify
function Setup-ShopifyWebhooks {
    param(
        [string]$NgrokUrl
    )
    
    Write-Host "🛍️ Configurando webhooks de Shopify..." -ForegroundColor Green
    Write-Host "URL del túnel: $NgrokUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Webhooks a configurar en Shopify:" -ForegroundColor Yellow
    Write-Host "- Orders/create: $NgrokUrl/api/webhooks/shopify/orders" -ForegroundColor White
    Write-Host "- Orders/updated: $NgrokUrl/api/webhooks/shopify/orders" -ForegroundColor White
    Write-Host "- Products/create: $NgrokUrl/api/webhooks/shopify/products" -ForegroundColor White
    Write-Host "- Products/update: $NgrokUrl/api/webhooks/shopify/products" -ForegroundColor White
    Write-Host ""
}

Write-Host "🎯 COMANDOS ÚTILES:" -ForegroundColor Yellow
Write-Host "Start-NomadeTunnel -Port 5173  # Exponer aplicación en puerto 5173" -ForegroundColor White
Write-Host "Start-NomadeTunnel -Port 3000  # Exponer aplicación en puerto 3000" -ForegroundColor White
Write-Host ""

# Verificar si hay un puerto específico en uso
$vitePort = 5173
$nextPort = 3000

Write-Host "🔍 Verificando puertos disponibles..." -ForegroundColor Green

if (Get-NetTCPConnection -LocalPort $vitePort -ErrorAction SilentlyContinue) {
    Write-Host "✅ Puerto $vitePort está en uso (probablemente Vite)" -ForegroundColor Green
    Write-Host "💡 Usa: Start-NomadeTunnel -Port $vitePort" -ForegroundColor Cyan
} elseif (Get-NetTCPConnection -LocalPort $nextPort -ErrorAction SilentlyContinue) {
    Write-Host "✅ Puerto $nextPort está en uso (probablemente Next.js)" -ForegroundColor Green
    Write-Host "💡 Usa: Start-NomadeTunnel -Port $nextPort" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ No se detectó ningún servidor de desarrollo activo" -ForegroundColor Yellow
    Write-Host "💡 Inicia tu aplicación primero con: npm run dev" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 ¡Configuración completada!" -ForegroundColor Green
Write-Host "Siguiente paso: Configura tu authtoken de ngrok" -ForegroundColor Yellow
