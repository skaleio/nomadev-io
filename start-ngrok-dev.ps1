# Script de PowerShell para iniciar ngrok con desarrollo de Shopify
# Uso: .\start-ngrok-dev.ps1

Write-Host "🚀 Iniciando ngrok para desarrollo de Shopify..." -ForegroundColor Green

# Verificar si ngrok está instalado
try {
    $ngrokVersion = ngrok version 2>$null
    Write-Host "✅ Ngrok encontrado: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Ngrok no está instalado. Instalando..." -ForegroundColor Red
    npm install -g ngrok
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando ngrok" -ForegroundColor Red
        exit 1
    }
}

# Puerto del servidor de desarrollo
$PORT = 8081

# Verificar si el puerto está en uso
$portInUse = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Puerto $PORT está en uso. Deteniendo procesos..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*$PORT*" } | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "🌐 Iniciando túnel ngrok en puerto $PORT..." -ForegroundColor Cyan

# Iniciar ngrok en segundo plano
$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", $PORT, "--log=stdout" -PassThru -WindowStyle Hidden

# Esperar un momento para que ngrok se inicie
Start-Sleep -Seconds 3

# Obtener la URL de ngrok
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
    $ngrokUrl = $response.tunnels[0].public_url
    
    if ($ngrokUrl) {
        Write-Host "✅ Ngrok iniciado correctamente!" -ForegroundColor Green
        Write-Host "🌐 URL pública: $ngrokUrl" -ForegroundColor Cyan
        Write-Host "🔗 Puerto local: $PORT" -ForegroundColor Cyan
        
        # Guardar la configuración
        $config = @{
            url = $ngrokUrl
            port = $PORT
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        } | ConvertTo-Json
        
        $config | Out-File -FilePath "ngrok-config.json" -Encoding UTF8
        Write-Host "📝 Configuración guardada en ngrok-config.json" -ForegroundColor Green
        
        # Mostrar información para Shopify
        Write-Host "`n📋 Para configurar en Shopify:" -ForegroundColor Yellow
        Write-Host "   1. Ve a tu app en Shopify Partners" -ForegroundColor White
        Write-Host "   2. En 'App setup', actualiza la URL de la app:" -ForegroundColor White
        Write-Host "      App URL: $ngrokUrl" -ForegroundColor Cyan
        Write-Host "   3. En 'App URLs', actualiza:" -ForegroundColor White
        Write-Host "      Allowed redirection URL(s): $ngrokUrl/auth/callback" -ForegroundColor Cyan
        
        Write-Host "`n🔄 Para iniciar el servidor de desarrollo:" -ForegroundColor Yellow
        Write-Host "   npm run dev" -ForegroundColor White
        
        Write-Host "`n⚠️  IMPORTANTE: Mantén esta ventana abierta mientras desarrollas" -ForegroundColor Red
        Write-Host "   Presiona Ctrl+C para detener ngrok" -ForegroundColor White
        
        # Mantener el script ejecutándose
        try {
            while ($true) {
                Start-Sleep -Seconds 1
            }
        } catch {
            Write-Host "`n🛑 Deteniendo ngrok..." -ForegroundColor Yellow
            Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        }
        
    } else {
        Write-Host "❌ No se pudo obtener la URL de ngrok" -ForegroundColor Red
        Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host "❌ Error obteniendo información de ngrok: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
