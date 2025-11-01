// Script para corregir fechas en registros existentes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDates() {
  try {
    console.log('🔧 Corrigiendo fechas de registros...\n');

    // Obtener todos los registros
    const registros = await prisma.registroActividad.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`📊 Total de registros: ${registros.length}\n`);

    let updated = 0;
    for (const registro of registros) {
      // Convertir horaInicio a fecha local (sin hora)
      if (registro.horaInicio) {
        const horaInicio = new Date(registro.horaInicio);
        const localDate = new Date(horaInicio.getFullYear(), horaInicio.getMonth(), horaInicio.getDate());
        
        // Solo actualizar si la fecha calculada es diferente
        if (registro.fecha.toISOString().split('T')[0] !== localDate.toISOString().split('T')[0]) {
          await prisma.registroActividad.update({
            where: { id: registro.id },
            data: { fecha: localDate }
          });
          
          console.log(`✅ ID ${registro.id}: ${registro.fecha.toISOString().split('T')[0]} → ${localDate.toISOString().split('T')[0]}`);
          updated++;
        }
      }
    }

    console.log(`\n✅ Registros actualizados: ${updated}`);
    console.log(`✅ Registros sin cambios: ${registros.length - updated}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDates();
