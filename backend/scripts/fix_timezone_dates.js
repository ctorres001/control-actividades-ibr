// =====================================================
// scripts/fix_timezone_dates.js
// Recalcula la columna DATE `fecha` de registro_actividades a partir de hora_inicio
// usando la zona horaria APP_TZ (por defecto America/Lima)
//
// Uso:
//   DRY_RUN=true  node scripts/fix_timezone_dates.js  # sólo muestra conteo
//   DRY_RUN=false node scripts/fix_timezone_dates.js  # aplica UPDATE
//
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/utils/prisma.js';
import { APP_TZ } from '../src/utils/time.js';

const DRY_RUN = (process.env.DRY_RUN || 'true').toLowerCase() !== 'false' && process.env.DRY_RUN !== '0';

async function main() {
  console.log(`\n🔧 Fix timezone dates - APP_TZ=${APP_TZ} DRY_RUN=${DRY_RUN}`);

  const previewSql = `
    SELECT COUNT(*) AS desalineados
    FROM registro_actividades r
    WHERE r.hora_inicio IS NOT NULL
      AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE '${APP_TZ}') AS date);
  `;

  const [{ desalineados }] = await prisma.$queryRawUnsafe(previewSql);
  console.log(`➡️  Registros desalineados: ${desalineados}`);

  if (desalineados > 0 && !DRY_RUN) {
    console.log('⏳ Aplicando UPDATE...');
    const updateSql = `
      UPDATE registro_actividades r
      SET fecha = CAST((r.hora_inicio AT TIME ZONE '${APP_TZ}') AS date)
      WHERE r.hora_inicio IS NOT NULL
        AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE '${APP_TZ}') AS date);
    `;
    const result = await prisma.$executeRawUnsafe(updateSql);
    console.log(`✅ Filas actualizadas: ${result}`);
  } else if (DRY_RUN) {
    console.log('🧪 DRY_RUN activo. No se aplicaron cambios.');
    console.log('   Para aplicar, ejecuta con DRY_RUN=false');
  }
}

main()
  .catch((err) => {
    console.error('❌ Error ejecutando fix:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
