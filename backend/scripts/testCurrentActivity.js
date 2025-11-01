// Script para probar el endpoint de actividad actual
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCurrentActivity() {
  try {
    console.log('🔍 Probando endpoint de actividad actual...\n');

    // Buscar asesor1
    const asesor = await prisma.usuario.findFirst({
      where: { nombreUsuario: 'asesor1' }
    });

    if (!asesor) {
      console.error('❌ No se encontró asesor1');
      return;
    }

    // Buscar actividad en curso
    const actividadActual = await prisma.registroActividad.findFirst({
      where: {
        usuarioId: asesor.id,
        horaFin: null
      },
      include: {
        actividad: true,
        subactividad: true
      },
      orderBy: {
        horaInicio: 'desc'
      }
    });

    if (!actividadActual) {
      console.log('✅ No hay actividad en curso (correcto si no hay ninguna iniciada)');
      return;
    }

    console.log('✅ Actividad actual encontrada:');
    console.log(JSON.stringify({
      id: actividadActual.id,
      usuarioId: actividadActual.usuarioId,
      actividadId: actividadActual.actividadId,
      actividad: {
        nombreActividad: actividadActual.actividad.nombreActividad
      },
      fecha: actividadActual.fecha,
      horaInicio: actividadActual.horaInicio,
      estado: actividadActual.estado
    }, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentActivity();
