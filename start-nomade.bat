@echo off
echo 🚀 Iniciando NOMADE.IO...
echo.

echo 📋 PASOS:
echo 1. Iniciando aplicacion en puerto 8085...
echo 2. Iniciando ngrok para exponer la aplicacion...
echo.

echo 🌐 Iniciando aplicacion...
start "NOMADE.IO App" cmd /k "npm run dev"

echo ⏳ Esperando 5 segundos para que la aplicacion se inicie...
timeout /t 5 /nobreak >nul

echo 🔗 Iniciando ngrok...
start "ngrok Tunnel" cmd /k "npx ngrok http 8085"

echo.
echo ✅ ¡Listo!
echo.
echo 📋 INSTRUCCIONES:
echo 1. Ve a la ventana de ngrok y copia la URL (ej: https://abc123.ngrok.io)
echo 2. Abre esa URL en tu navegador
echo 3. Ve a /shopify/connect para conectar tu tienda
echo.
echo ⚠️  Manten ambas ventanas abiertas mientras desarrollas
echo.
pause
