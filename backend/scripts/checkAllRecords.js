// Script para verificar TODOS los registros (sin filtro de fecha)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllRecords() {
  try {
    console.log('🔍 Verificando TODOS los registros...\n');

    // Contar todos los registros
    const count = await prisma.registroActividad.count();
    console.log(`📊 Total de registros en la BD: ${count}\n`);

    // Contar por fecha
    const byDate = await prisma.$queryRaw`
      SELECT 
        fecha::date,
        COUNT(*)::integer as total
      FROM registro_actividades
      GROUP BY fecha
      ORDER BY fecha DESC
    `;

    console.log('📅 Registros por fecha:');
    byDate.forEach(d => {
      console.log(`   ${d.fecha}: ${d.total} registros`);
    });

    // Contar por usuario
    const byUser = await prisma.$queryRaw`
      SELECT 
        u.nombre_completo,
        COUNT(*)::integer as total
      FROM registro_actividades r
      JOIN usuarios u ON r.usuario_id = u.id
      GROUP BY u.id, u.nombre_completo
      ORDER BY total DESC
    `;

    console.log('\n👥 Registros por usuario:');
    byUser.forEach(u => {
      console.log(`   ${u.nombre_completo}: ${u.total} registros`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRecords();
