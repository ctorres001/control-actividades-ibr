// Script para simular el flujo completo: login -> iniciar actividad
// Node 20+ tiene fetch global

const API_URL = 'http://localhost:3001/api';

async function testFlow() {
  try {
    console.log('🔍 Probando flujo completo...\n');

    // 1. Login
    console.log('1️⃣ Haciendo login con asesor1...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario: 'asesor1',
        contraseña: 'Asesor1@2024'
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Error en login:', loginRes.status, loginRes.statusText);
      const errorData = await loginRes.text();
      console.error('Respuesta:', errorData);
      return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Login exitoso');
    console.log('Usuario:', loginData.usuario.nombreCompleto);
    console.log('Token:', loginData.token.substring(0, 20) + '...');
    
    const token = loginData.token;

    // 2. Obtener actividades
    console.log('\n2️⃣ Obteniendo actividades activas...');
    const actividadesRes = await fetch(`${API_URL}/activities/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!actividadesRes.ok) {
      console.error('❌ Error obteniendo actividades:', actividadesRes.status);
      const errorData = await actividadesRes.text();
      console.error('Respuesta:', errorData);
      return;
    }

    const actividadesData = await actividadesRes.json();
    console.log('✅ Actividades obtenidas:', actividadesData.data.length);
    
    const ingresoActivity = actividadesData.data.find(a => a.nombreActividad === 'Ingreso');
    if (!ingresoActivity) {
      console.error('❌ No se encontró la actividad Ingreso');
      return;
    }
    
    console.log('Actividad a iniciar:', ingresoActivity.nombreActividad, '(ID:', ingresoActivity.id + ')');

    // 3. Iniciar actividad
    console.log('\n3️⃣ Iniciando actividad...');
    const startRes = await fetch(`${API_URL}/activities/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actividadId: ingresoActivity.id
      })
    });

    console.log('Status:', startRes.status, startRes.statusText);

    if (!startRes.ok) {
      console.error('❌ Error iniciando actividad');
      const errorData = await startRes.text();
      console.error('Respuesta completa:', errorData);
      return;
    }

    const startData = await startRes.json();
    console.log('✅ Actividad iniciada exitosamente');
    console.log('Registro:', {
      id: startData.data.id,
      actividad: startData.data.actividad.nombreActividad,
      fecha: startData.data.fecha,
      horaInicio: startData.data.horaInicio,
      estado: startData.data.estado
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testFlow();
