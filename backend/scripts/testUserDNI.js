// =====================================================
// scripts/testUserDNI.js - Verificar campo DNI en usuarios
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 VERIFICACIÓN DE CAMPO DOCUMENTO_IDENTIDAD\n');
  console.log('═══════════════════════════════════════════════════════════════════════');

  // Obtener un usuario de ejemplo
  const usuario = await prisma.usuario.findFirst({
    include: {
      rol: { select: { nombre: true } },
      campaña: { select: { nombre: true } }
    }
  });

  if (!usuario) {
    console.log('❌ No hay usuarios en la base de datos');
    return;
  }

  console.log('\n📊 Estructura del usuario:\n');
  console.log(JSON.stringify(usuario, null, 2));

  console.log('\n📋 Campos disponibles:');
  console.log('─────────────────────────────────────────────────────────────────────');
  Object.keys(usuario).forEach(key => {
    const value = usuario[key];
    const tipo = typeof value === 'object' && value !== null ? 'object' : typeof value;
    console.log(`  ${key}: ${tipo} = ${JSON.stringify(value)}`);
  });

  console.log('\n✅ Campo documentoIdentidad:', usuario.documentoIdentidad || '(null/undefined)');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
