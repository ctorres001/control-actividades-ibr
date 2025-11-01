// Script para probar el inicio de actividad
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStartActivity() {
  try {
    console.log('🔍 Probando inicio de actividad...\n');

    // 1. Buscar asesor1
    const asesor = await prisma.usuario.findFirst({
      where: { nombreUsuario: 'asesor1' },
      include: { rol: true, campaña: true }
    });

    if (!asesor) {
      console.error('❌ No se encontró asesor1');
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: asesor.id,
      nombre: asesor.nombreCompleto,
      rol: asesor.rol.nombre,
      campaña: asesor.campaña?.nombre
    });

    // 2. Buscar actividad "Ingreso"
    const actividad = await prisma.actividad.findFirst({
      where: { nombreActividad: 'Ingreso', activo: true }
    });

    if (!actividad) {
      console.error('❌ No se encontró la actividad Ingreso');
      return;
    }

    console.log('\n✅ Actividad encontrada:', {
      id: actividad.id,
      nombre: actividad.nombreActividad
    });

    // 3. Cerrar actividades anteriores
    const cerradas = await prisma.registroActividad.updateMany({
      where: {
        usuarioId: asesor.id,
        horaFin: null
      },
      data: {
        horaFin: new Date(),
        estado: 'Finalizado'
      }
    });

    console.log(`\n⏹️ Actividades cerradas: ${cerradas.count}`);

    // 4. Intentar crear nuevo registro
    console.log('\n🚀 Intentando crear registro...');
    const nuevoRegistro = await prisma.registroActividad.create({
      data: {
        usuarioId: asesor.id,
        actividadId: actividad.id,
        subactividadId: null,
        observaciones: null,
        horaInicio: new Date(),
        estado: 'Iniciado'
      },
      include: {
        actividad: true,
        subactividad: true,
        usuario: {
          select: {
            nombreCompleto: true
          }
        }
      }
    });

    console.log('\n✅ Registro creado exitosamente:', {
      id: nuevoRegistro.id,
      usuario: nuevoRegistro.usuario.nombreCompleto,
      actividad: nuevoRegistro.actividad.nombreActividad,
      fecha: nuevoRegistro.fecha,
      horaInicio: nuevoRegistro.horaInicio,
      estado: nuevoRegistro.estado
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStartActivity();
