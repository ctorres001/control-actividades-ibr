// Apply DB performance indexes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️ Applying performance indexes...');
  // Partial index for open activities by user
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_registro_actividades_usuario_open
    ON registro_actividades (usuario_id)
    WHERE hora_fin IS NULL;
  `);
  console.log('✅ Index idx_registro_actividades_usuario_open ensured');
}

main()
  .catch((e) => {
    console.error('❌ Error applying indexes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
