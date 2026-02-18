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
          timestamp: new Date().toISOString(),
          shopify: {
            app_url: url,
            redirect_url: `${url}/auth/callback`,
            webhook_url: `${url}/webhooks/shopify`
          }
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

// Función para iniciar el servidor de desarrollo
function startDevServer() {
  console.log('🚀 Iniciando servidor de desarrollo...');
  
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  devServer.on('close', (code) => {
    console.log(`Servidor de desarrollo terminó con código ${code}`);
  });

  return devServer;
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando desarrollo con ngrok...');
    
    // Iniciar ngrok
    const ngrokUrl = await getNgrokUrl();
    
    console.log('\n📋 Información importante:');
    console.log(`   URL pública: ${ngrokUrl}`);
    console.log(`   Puerto local: ${PORT}`);
    console.log(`   Para Shopify: Usa esta URL en tu configuración de app`);
    
    console.log('\n📋 Para configurar en Shopify:');
    console.log(`   1. Ve a tu app en Shopify Partners`);
    console.log(`   2. En 'App setup', actualiza la URL de la app:`);
    console.log(`      App URL: ${ngrokUrl}`);
    console.log(`   3. En 'App URLs', actualiza:`);
    console.log(`      Allowed redirection URL(s): ${ngrokUrl}/auth/callback`);
    
    // Iniciar servidor de desarrollo
    const devServer = startDevServer();
    
    console.log('\n✅ Desarrollo iniciado correctamente!');
    console.log('   Presiona Ctrl+C para detener todo');
    
    // Manejar señales de terminación
    process.on('SIGINT', () => {
      console.log('\n🛑 Deteniendo desarrollo...');
      devServer.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Deteniendo desarrollo...');
      devServer.kill('SIGTERM');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
