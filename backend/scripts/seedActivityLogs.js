// scripts/seedActivityLogs.js - Create sample RegistroActividad for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hms(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function makeDateLocal(dateStr, hh, mm, ss) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, hh, mm, ss, 0); // local time
}

async function ensureActivityId(nombreActividad) {
  const act = await prisma.actividad.findUnique({ where: { nombreActividad } });
  if (!act) throw new Error(`Actividad no encontrada: ${nombreActividad}`);
  return act.id;
}

async function getUser(nombreUsuario) {
  const u = await prisma.usuario.findUnique({ where: { nombreUsuario } });
  if (!u) throw new Error(`Usuario no encontrado: ${nombreUsuario}`);
  return u;
}

async function createRegistro({ usuarioId, actividadId, start, end, observaciones }) {
  const horaInicio = start;
  const horaFin = end ?? null;
  const duracionSeg = horaFin ? Math.floor((horaFin - horaInicio) / 1000) : null;
  const duracionHms = horaFin ? hms(duracionSeg) : null;
  return prisma.registroActividad.create({
    data: {
      usuarioId,
      actividadId,
      subactividadId: null,
      fecha: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      horaInicio,
      horaFin,
      duracionSeg,
      duracionHms,
      estado: horaFin ? 'Finalizado' : 'Iniciado',
      observaciones: observaciones || null
    }
  });
}

async function seedForUser(nombreUsuario, dateStr) {
  const user = await getUser(nombreUsuario);
  const ingresoId = await ensureActivityId('Ingreso');
  const seguimientoId = await ensureActivityId('Seguimiento');
  const correoId = await ensureActivityId('Bandeja de Correo');
  const reportesId = await ensureActivityId('Reportes');
  const salidaId = await ensureActivityId('Salida');

  // Clean today's records for user
  await prisma.registroActividad.deleteMany({
    where: {
      usuarioId: user.id,
      fecha: {
        gte: makeDateLocal(dateStr, 0, 0, 0),
        lte: makeDateLocal(dateStr, 23, 59, 59)
      }
    }
  });

  const r = [];
  // 09:00 Ingreso
  r.push(await createRegistro({ usuarioId: user.id, actividadId: ingresoId, start: makeDateLocal(dateStr, 9, 0, 0), end: makeDateLocal(dateStr, 9, 0, 30), observaciones: 'Inicio de jornada' }));
  // 09:15 - 10:00 Seguimiento
  r.push(await createRegistro({ usuarioId: user.id, actividadId: seguimientoId, start: makeDateLocal(dateStr, 9, 15, 0), end: makeDateLocal(dateStr, 10, 0, 0), observaciones: 'Seguimiento a casos' }));
  // 10:10 - 10:40 Bandeja de Correo
  r.push(await createRegistro({ usuarioId: user.id, actividadId: correoId, start: makeDateLocal(dateStr, 10, 10, 0), end: makeDateLocal(dateStr, 10, 40, 0), observaciones: 'Correos PQRS' }));
  // 10:50 - 11:30 Reportes
  r.push(await createRegistro({ usuarioId: user.id, actividadId: reportesId, start: makeDateLocal(dateStr, 10, 50, 0), end: makeDateLocal(dateStr, 11, 30, 0), observaciones: 'Reporte diario' }));
  // 17:00 Salida
  r.push(await createRegistro({ usuarioId: user.id, actividadId: salidaId, start: makeDateLocal(dateStr, 17, 0, 0), end: makeDateLocal(dateStr, 17, 0, 20), observaciones: 'Fin de jornada' }));

  return r;
}

async function main() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  console.log('🌱 Seeding registros de actividad para', dateStr);

  // Crear registros para asesores en distintas campañas
  await seedForUser('asesor1', dateStr); // PQRS
  await seedForUser('asesor3', dateStr); // Ventas
  await seedForUser('asesor4', dateStr); // BO_Calidda

  console.log('✅ Registros creados');
}

main().catch((e) => {
  console.error('❌ Error seeding logs:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
