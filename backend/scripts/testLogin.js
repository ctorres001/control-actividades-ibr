// =====================================================
// scripts/testLogin.js - Prueba de login y API
// =====================================================

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin(username, password) {
  try {
    log('\n🔐 Probando login...', 'blue');
    log(`   Usuario: ${username}`, 'cyan');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      nombreUsuario: username,
      contraseña: password
    });

    if (response.data.success) {
      log('✅ Login exitoso!', 'green');
      log(`   Token: ${response.data.token.substring(0, 20)}...`, 'cyan');
      log(`   Usuario: ${response.data.usuario.nombreCompleto}`, 'cyan');
      log(`   Rol: ${response.data.usuario.rol}`, 'cyan');
      log(`   Campaña: ${response.data.usuario.campaña}`, 'cyan');
      return response.data.token;
    }
  } catch (error) {
    log('❌ Error en login:', 'red');
    log(`   ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testStatsEndpoint(token) {
  try {
    log('\n📊 Probando endpoint de estadísticas...', 'blue');
    
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.get(`${API_BASE_URL}/stats/stats`, {
      params: {
        fechaInicio: today,
        fechaFin: today
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    log('✅ Endpoint de estadísticas funcionando!', 'green');
    log(`   Registros encontrados: ${response.data.length}`, 'cyan');
    
    if (response.data.length > 0) {
      const registro = response.data[0];
      log(`   Ejemplo: ${registro.actividad.nombre} - ${registro.usuario.nombreCompleto}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    log('❌ Error en endpoint de estadísticas:', 'red');
    log(`   ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testUsersEndpoint(token) {
  try {
    log('\n👥 Probando endpoint de usuarios...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/stats/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    log('✅ Endpoint de usuarios funcionando!', 'green');
    log(`   Usuarios disponibles: ${response.data.length}`, 'cyan');
    
    response.data.forEach(user => {
      log(`   - ${user.nombreCompleto} (${user.rol})`, 'cyan');
    });
    
    return true;
  } catch (error) {
    log('❌ Error en endpoint de usuarios:', 'red');
    log(`   ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testCampaignsEndpoint(token) {
  try {
    log('\n🎯 Probando endpoint de campañas...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/stats/campaigns`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    log('✅ Endpoint de campañas funcionando!', 'green');
    log(`   Campañas disponibles: ${response.data.length}`, 'cyan');
    
    response.data.forEach(campaign => {
      log(`   - ${campaign.nombre}`, 'cyan');
    });
    
    return true;
  } catch (error) {
    log('❌ Error en endpoint de campañas:', 'red');
    log(`   ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════════════════════════', 'blue');
  log('🧪 PRUEBA DE LOGIN Y ENDPOINTS - Panel Supervisor', 'blue');
  log('═══════════════════════════════════════════════════════════', 'blue');

  // Probar con super1
  const token = await testLogin('super1', 'Super1@2024');
  
  if (!token) {
    log('\n❌ No se pudo obtener token. Abortando pruebas.', 'red');
    process.exit(1);
  }

  // Probar endpoints
  await testStatsEndpoint(token);
  await testUsersEndpoint(token);
  await testCampaignsEndpoint(token);

  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('✅ TODAS LAS PRUEBAS COMPLETADAS', 'green');
  log('═══════════════════════════════════════════════════════════', 'blue');
  
  log('\n💡 SIGUIENTE PASO:', 'yellow');
  log('   1. Abre el navegador en http://localhost:3000', 'cyan');
  log('   2. Inicia sesión con:', 'cyan');
  log('      Usuario: super1', 'cyan');
  log('      Contraseña: Super1@2024', 'cyan');
  log('   3. Deberías ser redirigido a /supervisor', 'cyan');
  log('   4. Prueba los filtros y la exportación a Excel\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error general: ${error.message}`, 'red');
  process.exit(1);
});
