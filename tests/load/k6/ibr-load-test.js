import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/*****
 k6 load test for Control de Actividades

 USAGE (PowerShell):
 $env:BASE_URL="http://localhost:3001/api"; $env:K6_USERNAME="asesor1"; $env:K6_PASSWORD="Asesor1@2024"; k6 run tests/load/k6/ibr-load-test.js
*****/

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp-up
    { duration: '30s', target: 50 },
    { duration: '1m', target: 80 },  // reach 80 VUs
    { duration: '8m', target: 80 },  // sustain 80 VUs
    { duration: '30s', target: 0 },  // ramp-down
  ],
  thresholds: {
    // Consider only expected responses for latency threshold
    'http_req_duration{expected_response:true}': ['p(95)<600'],
    fail_rate: ['rate<0.01'], // custom failure rate <1%
  },
  noConnectionReuse: false,
  userAgent: 'k6-loadtest/ibr-control-actividades',
};
const WRITE_RATE = parseFloat(__ENV.WRITE_RATE || '0.2'); // 20% write ops by default

export const fail_rate = new Rate('fail_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';
const DEFAULT_USERNAME = __ENV.K6_USERNAME || 'asesor1';
const DEFAULT_PASSWORD = __ENV.K6_PASSWORD || 'Asesor1@2024';
const USER_LIST = (__ENV.K6_USERS || '').split(',').map((s) => s.trim()).filter(Boolean);
const SUPERVISOR_USER = __ENV.K6_SUPERVISOR || '';
const SUPERVISOR_PASS = __ENV.K6_SUPERVISOR_PASSWORD || '';

function loginWith(user, pass) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ nombreUsuario: user, contraseña: pass }), {
    headers: { 'Content-Type': 'application/json' }
  });
  check(res, {
    'login status 200': (r) => r.status === 200,
    'login success true': (r) => r.json('success') === true,
  });
  const token = res.json('token');
  return token;
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
}

function getActivities(token) {
  const res = http.get(`${BASE_URL}/activities/active`, authHeaders(token));
  check(res, { 'activities 200': (r) => r.status === 200 });
  return res.json('data') || [];
}

function pickActivity(list) {
  // Avoid Ingreso/Salida to not end day in test; if none left, use first
  const filtered = list.filter((a) => !['Ingreso', 'Salida'].includes(a.nombreActividad));
  if (filtered.length === 0) return list[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function startActivity(token, actividadId) {
  const res = http.post(`${BASE_URL}/activities/start`, JSON.stringify({ actividadId }), authHeaders(token));
  // Bajo alta concurrencia con pocos usuarios, 409 es esperable (actividad ya iniciada)
  check(res, { 'start 2xx/409': (r) => (r.status >= 200 && r.status < 300) || r.status === 409 });
  if (res.status >= 500 || res.status === 429) fail_rate.add(1); else fail_rate.add(0);
  return res.json('data');
}

function stopActivity(token) {
  const res = http.post(`${BASE_URL}/activities/stop`, null, authHeaders(token));
  // Puede no haber actividad: considerar 404 como aceptable en esta prueba
  check(res, { 'stop 2xx/404': (r) => (r.status >= 200 && r.status < 300) || r.status === 404 });
  if (res.status >= 500 || res.status === 429) fail_rate.add(1); else fail_rate.add(0);
  return res.json('data');
}

function todayStr() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

function getSummary(token) {
  const res = http.get(`${BASE_URL}/activities/today/summary?date=${todayStr()}`, authHeaders(token));
  check(res, { 'summary 200': (r) => r.status === 200 });
  if (res.status >= 500 || res.status === 429) fail_rate.add(1); else fail_rate.add(0);
}

function getLog(token) {
  const res = http.get(`${BASE_URL}/activities/today/log?date=${todayStr()}`, authHeaders(token));
  check(res, { 'log 200': (r) => r.status === 200 });
  if (res.status >= 500 || res.status === 429) fail_rate.add(1); else fail_rate.add(0);
}

function getActiveAgents(token) {
  const res = http.get(`${BASE_URL}/stats/asesores-activos`, authHeaders(token));
  check(res, { 'asesores-activos 200/403': (r) => r.status === 200 || r.status === 403 });
  if (res.status >= 500 || res.status === 429) fail_rate.add(1); else fail_rate.add(0);
}

function inferPasswordFor(user) {
  // Infer password based on username pattern for dev seed
  // asesorN -> AsesorN@2024, superN -> SuperN@2024, admin -> Admin123!@#
  const mAs = user.match(/^asesor(\d+)$/i);
  if (mAs) return `Asesor${mAs[1]}@2024`;
  const mSup = user.match(/^super(\d+)$/i);
  if (mSup) return `Super${mSup[1]}@2024`;
  if (user.toLowerCase() === 'admin') return 'Admin123!@#';
  return DEFAULT_PASSWORD;
}

export function setup() {
  // Pre-login supervisor if provided
  let supervisorToken = '';
  if (SUPERVISOR_USER) {
    const sp = SUPERVISOR_PASS || inferPasswordFor(SUPERVISOR_USER);
    supervisorToken = loginWith(SUPERVISOR_USER, sp);
  }
  // Pre-login user tokens (if list provided), else fallback to default user
  const users = USER_LIST.length ? USER_LIST : [DEFAULT_USERNAME];
  const tokens = users.map((u) => loginWith(u, inferPasswordFor(u)));
  // Share tokens via setup data
  return { supervisorToken, users, tokens };
}

export default function (data) {
  // Per VU: select a pre-logged token from setup
  const users = data.users || [];
  const tokens = data.tokens || [];
  const idx = (__VU - 1) % (users.length || tokens.length || 1);
  const token = (tokens.length ? tokens[idx] : '') || '';

  // 1) list activities
  const activities = getActivities(token);

  // 1b) with probability WRITE_RATE, do a start or stop (not both)
  if (Math.random() < WRITE_RATE && activities.length > 0) {
    if (Math.random() < 0.5) {
      const a = pickActivity(activities);
      startActivity(token, a.id);
    } else {
      stopActivity(token);
    }
  }

  // 2) think time
  sleep(Math.random() * 2 + 1); // 1-3s

  // 3) read summary and log
  getSummary(token);
  getLog(token);

  // 5) occasionally hit active agents
  if (Math.random() < 0.3) {
    // Si hay supervisor, usa ese token; si no, acepta 403 (rol asesor)
    const supTok = data.supervisorToken || token;
    getActiveAgents(supTok);
  }

  // think time before next iteration
  sleep(Math.random() * 2 + 1);
}
