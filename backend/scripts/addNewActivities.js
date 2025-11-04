// =====================================================
// scripts/addNewActivities.js
// Script para agregar las actividades "Revisión" y "Gestión"
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Agregando nuevas actividades...\n');

  try {
    // Actividad: Revisión
    const revision = await prisma.actividad.upsert({
      where: { nombreActividad: 'Revisión' },
      update: {
        descripcion: 'Revisión de casos o documentos',
        orden: 7,
        activo: true
      },
      create: {
        nombreActividad: 'Revisión',
        descripcion: 'Revisión de casos o documentos',
        orden: 7,
        activo: true
      }
    });

    console.log('✅ Actividad "Revisión" creada/actualizada:', revision);

    // Actividad: Gestión
    const gestion = await prisma.actividad.upsert({
      where: { nombreActividad: 'Gestión' },
      update: {
        descripcion: 'Tareas de gestión administrativa',
        orden: 8,
        activo: true
      },
      create: {
        nombreActividad: 'Gestión',
        descripcion: 'Tareas de gestión administrativa',
        orden: 8,
        activo: true
      }
    });

    console.log('✅ Actividad "Gestión" creada/actualizada:', gestion);

    console.log('\n🎉 ¡Actividades agregadas exitosamente!');
  } catch (error) {
    console.error('❌ Error al agregar actividades:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
