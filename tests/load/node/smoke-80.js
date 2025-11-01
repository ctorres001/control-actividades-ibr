// Simple smoke load: 4 users x 20 parallel tasks = ~80 concurrent ops
// Uses the built-in backend API. Intended for local quick validation when k6 isn't available.

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001/api';
const USERS = [
  { nombreUsuario: process.env.U1 || 'asesor1', contraseña: process.env.P1 || 'Asesor1@2024' },
  { nombreUsuario: process.env.U2 || 'asesor2', contraseña: process.env.P2 || 'Asesor2@2024' },
  { nombreUsuario: process.env.U3 || 'asesor3', contraseña: process.env.P3 || 'Asesor3@2024' },
  { nombreUsuario: process.env.U4 || 'asesor4', contraseña: process.env.P4 || 'Asesor4@2024' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function login({ nombreUsuario, contraseña }) {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, { nombreUsuario, contraseña });
  if (!data?.success) throw new Error('Login failed');
  return data.token;
}

function auth(token) { return { headers: { Authorization: `Bearer ${token}` } }; }

async function getActivities(token) {
  const { data } = await axios.get(`${BASE_URL}/activities/active`, auth(token));
  return data?.data || [];
}

function pickActivity(list) {
  const filtered = list.filter(a => !['Ingreso', 'Salida'].includes(a.nombreActividad));
  if (filtered.length === 0) return list[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

async function start(token, actividadId) {
  try {
    const { data } = await axios.post(`${BASE_URL}/activities/start`, { actividadId }, auth(token));
    return { ok: true, id: data?.data?.id };
  } catch (e) {
    return { ok: false, status: e.response?.status, msg: e.response?.data?.error || e.message };
  }
}

async function stop(token) {
  try {
    const { data } = await axios.post(`${BASE_URL}/activities/stop`, null, auth(token));
    return { ok: true, id: data?.data?.id };
  } catch (e) {
    // 404 is acceptable when no open activity
    if (e.response?.status === 404) return { ok: true, status: 404 };
    return { ok: false, status: e.response?.status, msg: e.response?.data?.error || e.message };
  }
}

async function summary(token) {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  await axios.get(`${BASE_URL}/activities/today/summary`, { ...auth(token), params: { date: ymd } });
}

async function logToday(token) {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  await axios.get(`${BASE_URL}/activities/today/log`, { ...auth(token), params: { date: ymd } });
}

async function agentLoop(token, activities) {
  const a = pickActivity(activities);
  const s1 = await start(token, a?.id);
  await sleep(Math.floor(Math.random()*200)+100);
  const st = await stop(token);
  await summary(token);
  await logToday(token);
  return { startOk: s1.ok, stopOk: st.ok, startStatus: s1.status, stopStatus: st.status };
}

async function main() {
  console.log('🚀 Smoke 80 starting:', BASE_URL);
  const tokens = await Promise.all(USERS.map(u => login(u)));
  const activities = await Promise.all(tokens.map(t => getActivities(t)));

  const parallelPerUser = parseInt(process.env.PER_USER || '20', 10);
  const tasks = [];
  const results = [];

  for (let i = 0; i < USERS.length; i++) {
    for (let j = 0; j < parallelPerUser; j++) {
      tasks.push(
        agentLoop(tokens[i], activities[i]).then(r => results.push(r)).catch(e => results.push({ err: e.message }))
      );
    }
  }

  await Promise.all(tasks);

  const total = results.length;
  const errors = results.filter(r => r?.err || r?.startOk === false || r?.stopOk === false);
  console.log(`✅ Done. Total ops: ${total}, Errors: ${errors.length}`);
  if (errors.length) {
    const top = errors.slice(0, 10);
    console.log('Some errors:', top);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
