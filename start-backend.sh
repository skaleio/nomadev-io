#!/bin/bash

echo "🚀 Iniciando servidor backend para Shopify Dashboard..."
echo

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde plantilla..."
    cp env.example .env
    echo
    echo "📝 Por favor edita el archivo .env con tus credenciales de Shopify:"
    echo "   - SHOPIFY_DOMAIN=tu-tienda-sin-myshopify"
    echo "   - SHOPIFY_ACCESS_TOKEN=shpat_tu_token_aqui"
    echo
    read -p "Presiona Enter para continuar..."
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install express cors node-fetch@2 dotenv
    echo
fi

# Iniciar el servidor
echo "🚀 Iniciando servidor backend en puerto 3001..."
echo "📡 El servidor estará disponible en: http://localhost:3001"
echo "🔍 Para verificar la salud: http://localhost:3001/api/health"
echo
node server.js
