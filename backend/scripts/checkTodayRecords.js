// Script para verificar registros del día
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecords() {
  try {
    console.log('🔍 Verificando registros del día...\n');

    // Contar todos los registros de hoy
    const count = await prisma.$queryRaw`
      SELECT COUNT(*)::integer as total
      FROM registro_actividades
      WHERE fecha = CURRENT_DATE
    `;
    console.log(`📊 Total de registros hoy: ${count[0].total}`);

    // Listar registros con detalles
    const registros = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.duracion_seg,
        r.estado,
        u.nombre_completo,
        a.nombre_actividad,
        s.nombre_subactividad
      FROM registro_actividades r
      JOIN usuarios u ON r.usuario_id = u.id
      JOIN actividades a ON r.actividad_id = a.id
      LEFT JOIN subactividades s ON r.subactividad_id = s.id
      WHERE r.fecha = CURRENT_DATE
      ORDER BY r.hora_inicio ASC
    `;

    console.log(`\n📋 Listado de ${registros.length} registros:\n`);
    registros.forEach((r, i) => {
      const inicio = new Date(r.hora_inicio).toLocaleTimeString('es-CO');
      const fin = r.hora_fin ? new Date(r.hora_fin).toLocaleTimeString('es-CO') : 'En curso';
      console.log(`${i + 1}. [${r.estado}] ${r.nombre_actividad} ${r.nombre_subactividad ? '→ ' + r.nombre_subactividad : ''}`);
      console.log(`   Usuario: ${r.nombre_completo}`);
      console.log(`   Inicio: ${inicio} | Fin: ${fin} | Duración: ${r.duracion_seg || 0}s`);
      console.log('');
    });

    // Contar actividades únicas
    const uniqueActivities = await prisma.$queryRaw`
      SELECT 
        a.nombre_actividad,
        COUNT(*)::integer as cantidad,
        SUM(COALESCE(r.duracion_seg, 0))::integer as total_seg
      FROM registro_actividades r
      JOIN actividades a ON r.actividad_id = a.id
      WHERE r.fecha = CURRENT_DATE
      GROUP BY a.id, a.nombre_actividad
      ORDER BY total_seg DESC
    `;

    console.log(`\n📈 Resumen por actividad (${uniqueActivities.length} actividades distintas):\n`);
    uniqueActivities.forEach(act => {
      const mins = Math.floor(act.total_seg / 60);
      console.log(`   ${act.nombre_actividad}: ${act.cantidad} veces, ${mins} minutos`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecords();
