#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para actualizar vite.config.ts con la URL de ngrok
function updateViteConfig(ngrokUrl) {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.log('⚠️  No se encontró vite.config.ts');
    return false;
  }

  let config = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Extraer el dominio de la URL
  const domain = ngrokUrl.replace('https://', '').replace('http://', '');
  
  // Buscar y actualizar allowedHosts
  const allowedHostsRegex = /allowedHosts:\s*\[([\s\S]*?)\]/;
  const match = config.match(allowedHostsRegex);
  
  if (match) {
    // Limpiar URLs antiguas de ngrok
    let hosts = match[1]
      .split(',')
      .map(host => host.trim().replace(/['"]/g, ''))
      .filter(host => !host.includes('.ngrok-free.app') && !host.includes('.ngrok.io'))
      .filter(host => host.length > 0);
    
    // Agregar la nueva URL
    hosts.push(`"${domain}"`);
    
    // Reconstruir la configuración
    const newAllowedHosts = `allowedHosts: [\n      ${hosts.join(',\n      ')}\n    ]`;
    config = config.replace(allowedHostsRegex, newAllowedHosts);
    
    fs.writeFileSync(viteConfigPath, config);
    console.log(`✅ Vite config actualizado con: ${domain}`);
    return true;
  } else {
    console.log('⚠️  No se encontró allowedHosts en vite.config.ts');
    return false;
  }
}

// Función para obtener la URL de ngrok desde la API
async function getNgrokUrl() {
  try {
    // Importar fetch dinámicamente para Node.js
    const { default: fetch } = await import('node-fetch');
    const response = await fetch('http://localhost:4040/api/tunnels');
    const data = await response.json();
    
    if (data.tunnels && data.tunnels.length > 0) {
      return data.tunnels[0].public_url;
    }
    return null;
  } catch (error) {
    console.log('⚠️  No se pudo conectar a la API de ngrok');
    return null;
  }
}

// Función principal
async function main() {
  const ngrokUrl = await getNgrokUrl();
  
  if (ngrokUrl) {
    console.log(`🌐 URL de ngrok encontrada: ${ngrokUrl}`);
    updateViteConfig(ngrokUrl);
  } else {
    console.log('❌ No se encontró ninguna URL de ngrok activa');
    console.log('   Asegúrate de que ngrok esté ejecutándose en el puerto 4040');
  }
}

main().catch(console.error);
