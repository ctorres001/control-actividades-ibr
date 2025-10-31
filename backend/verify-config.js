#!/usr/bin/env node

/**
 * Script de verificación de configuración
 * Verifica que todas las optimizaciones estén correctamente aplicadas
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Verificando configuración para 80 usuarios...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar connection_limit en .env
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  const connectionLimit = envContent.match(/connection_limit=(\d+)/);
  
  if (connectionLimit) {
    const limit = parseInt(connectionLimit[1]);
    if (limit >= 50) {
      console.log(`✅ Connection limit: ${limit} (suficiente para 80+ usuarios)`);
    } else if (limit >= 30) {
      console.log(`⚠️  Connection limit: ${limit} (mínimo para 50+ usuarios, considera aumentar a 50)`);
      warnings++;
    } else {
      console.log(`❌ Connection limit: ${limit} (insuficiente, debe ser al menos 50)`);
      errors++;
    }
  } else {
    console.log('❌ No se encontró connection_limit en DATABASE_URL');
    errors++;
  }
} catch (err) {
  console.log('❌ Error leyendo .env:', err.message);
  errors++;
}

// 2. Verificar compression en package.json
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
  if (packageJson.dependencies.compression) {
    console.log('✅ Compression instalado:', packageJson.dependencies.compression);
  } else {
    console.log('❌ Compression no instalado');
    errors++;
  }
} catch (err) {
  console.log('❌ Error leyendo package.json:', err.message);
  errors++;
}

// 3. Verificar ecosystem.config.cjs existe
try {
  const ecosystemContent = readFileSync(join(__dirname, 'ecosystem.config.cjs'), 'utf-8');
  if (ecosystemContent.includes('cluster')) {
    console.log('✅ Configuración PM2 en modo cluster');
  } else {
    console.log('⚠️  PM2 configurado pero no en modo cluster');
    warnings++;
  }
} catch (err) {
  console.log('❌ ecosystem.config.cjs no encontrado');
  errors++;
}

// 4. Verificar rate-limit en index.js
try {
  const indexContent = readFileSync(join(__dirname, 'src', 'index.js'), 'utf-8');
  if (indexContent.includes('express-rate-limit')) {
    console.log('✅ Rate limiting configurado');
  } else {
    console.log('⚠️  Rate limiting no encontrado en index.js');
    warnings++;
  }
  
  if (indexContent.includes('compression')) {
    console.log('✅ Compression middleware configurado');
  } else {
    console.log('❌ Compression no configurado en index.js');
    errors++;
  }
} catch (err) {
  console.log('❌ Error leyendo src/index.js:', err.message);
  errors++;
}

// 5. Verificar directorio logs
try {
  const fs = await import('fs');
  if (fs.existsSync(join(__dirname, 'logs'))) {
    console.log('✅ Directorio logs/ creado');
  } else {
    console.log('⚠️  Directorio logs/ no existe (se creará automáticamente con PM2)');
    warnings++;
  }
} catch (err) {
  console.log('⚠️  No se pudo verificar directorio logs/');
  warnings++;
}

// Resumen
console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
  console.log('✅ ¡Perfecto! Configuración lista para 80 usuarios');
  console.log('\n📊 Capacidad estimada:');
  console.log('   - Conexiones BD: 50 simultáneas');
  console.log('   - Backend: 60-80 usuarios concurrentes');
  console.log('   - Modo: Clustering con PM2');
  console.log('\n🚀 Siguiente paso: npm run start:cluster');
} else if (errors === 0) {
  console.log(`⚠️  Configuración funcional con ${warnings} advertencia(s)`);
  console.log('   Se recomienda resolver las advertencias para mejor rendimiento');
} else {
  console.log(`❌ Se encontraron ${errors} error(es) y ${warnings} advertencia(s)`);
  console.log('   Revisa los errores antes de continuar');
  process.exit(1);
}
console.log('='.repeat(50) + '\n');
