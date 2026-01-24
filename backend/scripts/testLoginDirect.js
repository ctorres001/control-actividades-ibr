// Prueba directa del endpoint de login usando fetch nativo de Node 18+

const API_URL = 'http://localhost:3001/api';

async function testLogin() {
  console.log('🧪 Probando login en:', API_URL + '/auth/login');
  
  const tests = [
    { nombreUsuario: 'admin', contraseña: 'Admin123!@#' },
    { username: 'admin', password: 'Admin123!@#' },
  ];

  for (const [idx, creds] of tests.entries()) {
    console.log(`\n--- Test ${idx + 1} ---`);
    console.log('Credenciales enviadas:', JSON.stringify(creds, null, 2));
    
    try {
      const response = await fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });

      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Respuesta:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ Login exitoso');
      } else {
        console.log('❌ Login fallido:', data.error);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testLogin().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
