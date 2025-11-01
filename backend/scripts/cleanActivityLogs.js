// Script para limpiar todos los registros de actividad
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanActivityLogs() {
  try {
    console.log('🧹 Limpiando registros de actividad...\n');

    // Obtener conteo antes de eliminar
    const count = await prisma.registroActividad.count();
    console.log(`📊 Registros actuales: ${count}`);

    if (count === 0) {
      console.log('\n✅ No hay registros para eliminar');
      return;
    }

    // Eliminar todos los registros
    const deleted = await prisma.registroActividad.deleteMany({});
    
    console.log(`\n✅ Se eliminaron ${deleted.count} registros exitosamente`);
    console.log('✅ Base de datos limpia - lista para empezar de cero\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanActivityLogs();
