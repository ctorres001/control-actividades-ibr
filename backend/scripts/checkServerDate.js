// Script para verificar fecha del servidor PostgreSQL
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkServerDate() {
  try {
    console.log('🕐 Verificando fechas...\n');

    // Fecha del servidor PostgreSQL
    const serverDate = await prisma.$queryRaw`SELECT CURRENT_DATE, CURRENT_TIMESTAMP, NOW()`;
    console.log('📅 PostgreSQL Server:');
    console.log('   CURRENT_DATE:', serverDate[0].current_date);
    console.log('   CURRENT_TIMESTAMP:', serverDate[0].current_timestamp);
    console.log('   NOW():', serverDate[0].now);

    // Fecha del cliente Node.js
    const nodeDate = new Date();
    console.log('\n📅 Node.js Client:');
    console.log('   Date:', nodeDate);
    console.log('   ISO:', nodeDate.toISOString());
    console.log('   Local:', nodeDate.toLocaleString('es-CO'));

    // Registros de hoy según CURRENT_DATE
    const todayRecords = await prisma.$queryRaw`
      SELECT COUNT(*)::integer as total, MIN(fecha) as min_fecha, MAX(fecha) as max_fecha
      FROM registro_actividades
      WHERE fecha = CURRENT_DATE
    `;
    console.log('\n📊 Registros WHERE fecha = CURRENT_DATE:');
    console.log('   Total:', todayRecords[0].total);
    console.log('   Min fecha:', todayRecords[0].min_fecha);
    console.log('   Max fecha:', todayRecords[0].max_fecha);

    // Últimos 5 registros con sus fechas
    const recentRecords = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.fecha,
        r.hora_inicio,
        u.nombre_completo,
        a.nombre_actividad
      FROM registro_actividades r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN actividades a ON r.actividad_id = a.id
      ORDER BY r.hora_inicio DESC
      LIMIT 5
    `;
    console.log('\n📋 Últimos 5 registros:');
    recentRecords.forEach(r => {
      console.log(`   ${r.fecha} ${new Date(r.hora_inicio).toLocaleString('es-CO')} - ${r.nombre_completo}: ${r.nombre_actividad}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServerDate();
