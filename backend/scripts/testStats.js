// scripts/testStats.js - quick stats test
import axios from 'axios';

const API = 'http://localhost:3001/api';

const credentialsByUser = {
  admin: { nombreUsuario: 'admin', contraseña: 'Admin123!@#' },
  super1: { nombreUsuario: 'super1', contraseña: 'Super1@2024' },
  super2: { nombreUsuario: 'super2', contraseña: 'Super2@2024' }
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function run(userKey = 'admin', startArg, endArg) {
  const creds = credentialsByUser[userKey];
  if (!creds) throw new Error(`Unknown user key: ${userKey}`);

  console.log(`\n🔐 Logging in as ${userKey}...`);
  const loginRes = await axios.post(`${API}/auth/login`, creds);
  const token = loginRes.data?.token;
  if (!token) throw new Error('No token in login response');
  console.log('✅ Logged in');

  const params = new URLSearchParams();
  const start = startArg || todayISO();
  const end = endArg || todayISO();
  params.append('fechaInicio', start);
  params.append('fechaFin', end);

  console.log(`📊 Fetching stats for ${start}..${end}`);
  const statsRes = await axios.get(`${API}/stats/stats?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const registros = statsRes.data || [];
  console.log(`✅ Registros recibidos: ${registros.length}`);

  if (registros.length > 0) {
    const sample = registros.slice(0, 3).map((r) => ({
      id: r.id,
      usuario: r.usuario?.nombreCompleto,
      actividad: r.actividad?.nombreActividad,
      inicio: r.horaInicio,
      fin: r.horaFin
    }));
    console.log('🧪 Sample:', sample);
  }
}

const userKey = process.argv[2] || 'admin';
const startArg = process.argv[3];
const endArg = process.argv[4];
run(userKey, startArg, endArg).catch((err) => {
  console.error('❌ Error:', err?.response?.data || err.message);
  process.exit(1);
});
