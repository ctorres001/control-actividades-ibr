// =====================================================
// scripts/insertNewActivitiesPrisma.js
// Insertar nuevas actividades usando Prisma executeRaw
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Insertando nuevas actividades con Prisma...\n');

  try {
    // Insertar Revisión
    await prisma.$executeRaw`
      INSERT INTO actividades (nombre_actividad, descripcion, orden, activo)
      VALUES ('Revisión', 'Revisión de casos o documentos', 7, true)
      ON CONFLICT (nombre_actividad) 
      DO UPDATE SET 
        descripcion = EXCLUDED.descripcion,
        orden = EXCLUDED.orden,
        activo = EXCLUDED.activo
    `;

    console.log('✅ Actividad "Revisión" insertada/actualizada');

    // Insertar Gestión
    await prisma.$executeRaw`
      INSERT INTO actividades (nombre_actividad, descripcion, orden, activo)
      VALUES ('Gestión', 'Tareas de gestión administrativa', 8, true)
      ON CONFLICT (nombre_actividad) 
      DO UPDATE SET 
        descripcion = EXCLUDED.descripcion,
        orden = EXCLUDED.orden,
        activo = EXCLUDED.activo
    `;

    console.log('✅ Actividad "Gestión" insertada/actualizada');

    // Verificar que se insertaron correctamente
    const actividades = await prisma.actividad.findMany({
      where: {
        nombreActividad: {
          in: ['Revisión', 'Gestión']
        }
      },
      orderBy: { orden: 'asc' }
    });

    console.log('\n📋 Actividades verificadas:');
    actividades.forEach(act => {
      console.log(`   ${act.id}. ${act.nombreActividad} - Orden: ${act.orden} - Activo: ${act.activo}`);
    });

    console.log('\n🎉 ¡Actividades insertadas exitosamente!');
  } catch (error) {
    console.error('❌ Error al insertar actividades:', error.message);
    throw error;
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
