#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PORT = 8081;
const NGROK_CONFIG_FILE = path.join(__dirname, '..', 'ngrok-config.json');

// Función para obtener la URL de ngrok
function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    // Usar la ruta completa de ngrok en Windows
    const ngrokPath = process.platform === 'win32' 
      ? 'C:\\Users\\Antonio\\AppData\\Roaming\\npm\\ngrok.cmd'
      : 'ngrok';
    
    const ngrok = spawn(ngrokPath, ['http', PORT.toString(), '--log=stdout'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    
    ngrok.stdout.on('data', (data) => {
      output += data.toString();
      
      // Buscar la URL en el output
      const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
      if (urlMatch) {
        const url = urlMatch[0];
        console.log(`🚀 Ngrok iniciado: ${url}`);
        
        // Guardar la configuración
        const config = {
          url: url,
          port: PORT,
          timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(NGROK_CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log(`📝 Configuración guardada en: ${NGROK_CONFIG_FILE}`);
        
        resolve(url);
      }
    });

    ngrok.stderr.on('data', (data) => {
      console.error('Error ngrok:', data.toString());
    });

    ngrok.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Ngrok terminó con código ${code}`));
      }
    });

    // Timeout después de 10 segundos
    setTimeout(() => {
      if (!output.includes('ngrok-free.app')) {
        reject(new Error('Timeout: No se pudo obtener la URL de ngrok'));
      }
    }, 10000);
  });
}

// Función para actualizar vite.config.ts
function updateViteConfig(ngrokUrl) {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.log('⚠️  No se encontró vite.config.ts');
    return;
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
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando ngrok...');
    const url = await getNgrokUrl();
    
    console.log('\n📋 Información importante:');
    console.log(`   URL pública: ${url}`);
    console.log(`   Puerto local: ${PORT}`);
    console.log(`   Para Shopify: Usa esta URL en tu configuración de app`);
    
    // Actualizar configuración de Vite
    updateViteConfig(url);
    
    console.log('\n✅ Ngrok configurado correctamente!');
    console.log('   Presiona Ctrl+C para detener ngrok');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo ngrok...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deteniendo ngrok...');
  process.exit(0);
});

main();
