// scripts/assignGeneralToUnassignedSubactivities.js
// Asigna la campaña "General" a todas las subactividades sin campañas.

import dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/utils/prisma.js';

(async () => {
  try {
    const general = await prisma.campaña.findFirst({ where: { nombre: 'General' }, select: { id: true, nombre: true } });
    if (!general?.id) {
      console.error('❌ No existe la campaña "General". Ejecuta scripts/createGeneralCampaign.js primero.');
      process.exitCode = 1;
      return;
    }

    const unassigned = await prisma.subactividad.findMany({
      where: { subactividadCampañas: { none: {} } },
      select: { id: true, nombreSubactividad: true }
    });

    if (unassigned.length === 0) {
      console.log('✅ No hay subactividades sin campaña. Nada por asignar.');
    } else {
      console.log(`Encontradas ${unassigned.length} subactividades sin campaña. Asignando a "${general.nombre}"...`);
      await prisma.subactividadCampaña.createMany({
        data: unassigned.map(s => ({ subactividadId: s.id, campañaId: general.id })),
        skipDuplicates: true
      });
      console.log('✅ Asignación completada.');
    }
  } catch (error) {
    console.error('Error asignando General a subactividades sin campaña:', error);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch (_) {}
  }
})();
