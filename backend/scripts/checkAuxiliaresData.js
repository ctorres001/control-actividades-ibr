import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAuxiliaresData() {
  try {
    // 1. Buscar actividad Auxiliares
    const actividad = await prisma.actividad.findFirst({
      where: { nombreActividad: 'Auxiliares' }
    });
    console.log('📋 Actividad Auxiliares:', actividad);

    if (!actividad) {
      console.log('❌ No se encontró la actividad Auxiliares');
      return;
    }

    // 2. Buscar campaña General
    const general = await prisma.campaña.findFirst({
      where: { nombre: 'General' }
    });
    console.log('📋 Campaña General:', general);

    // 3. Buscar subactividades de Auxiliares
    const subs = await prisma.subactividad.findMany({
      where: {
        actividadId: actividad.id,
        activo: true
      },
      include: {
        subactividadCampañas: {
          include: {
            campaña: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: { orden: 'asc' }
    });

    console.log(`\n📊 Total subactividades activas para Auxiliares: ${subs.length}`);
    subs.forEach(sub => {
      console.log(`\n  🔹 ${sub.nombreSubactividad} (ID: ${sub.id})`);
      console.log(`     Campañas asociadas: ${sub.subactividadCampañas.length}`);
      sub.subactividadCampañas.forEach(sc => {
        console.log(`       - ${sc.campaña.nombre} (ID: ${sc.campaña.id})`);
      });
    });

    // 4. Verificar si hay subactividades vinculadas a General
    if (general) {
      const generalSubs = await prisma.subactividad.findMany({
        where: {
          actividadId: actividad.id,
          activo: true,
          subactividadCampañas: {
            some: { campañaId: general.id }
          }
        }
      });
      console.log(`\n✅ Subactividades vinculadas a General: ${generalSubs.length}`);
      generalSubs.forEach(s => console.log(`   - ${s.nombreSubactividad}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuxiliaresData();
