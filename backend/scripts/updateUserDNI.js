// =====================================================
// scripts/updateUserDNI.js - Actualizar DNI de un usuario
// Uso: node scripts/updateUserDNI.js <nombreUsuario> <DNI>
// Ejemplo: node scripts/updateUserDNI.js ctorres 12345678
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('\n❌ Uso incorrecto');
    console.log('\n💡 Uso: node scripts/updateUserDNI.js <nombreUsuario> <DNI>');
    console.log('   Ejemplo: node scripts/updateUserDNI.js ctorres 12345678\n');
    process.exit(1);
  }

  const [nombreUsuario, dni] = args;

  console.log('\n🔍 ACTUALIZACIÓN DE DNI\n');
  console.log('═══════════════════════════════════════════════════════════════════════');

  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { nombreUsuario },
    include: {
      rol: { select: { nombre: true } },
      campaña: { select: { nombre: true } }
    }
  });

  if (!usuario) {
    console.log(`\n❌ Usuario "${nombreUsuario}" no encontrado\n`);
    process.exit(1);
  }

  console.log(`\n📋 Usuario encontrado:`);
  console.log(`   Nombre: ${usuario.nombreCompleto}`);
  console.log(`   Usuario: ${usuario.nombreUsuario}`);
  console.log(`   DNI actual: ${usuario.documentoIdentidad || '(sin DNI)'}`);
  console.log(`   DNI nuevo: ${dni}`);

  // Confirmar actualización
  console.log('\n⚠️  ¿Deseas continuar con la actualización? (presiona Ctrl+C para cancelar)');
  console.log('   Actualizando en 3 segundos...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Actualizar DNI
  const actualizado = await prisma.usuario.update({
    where: { nombreUsuario },
    data: { documentoIdentidad: dni.trim() }
  });

  console.log('✅ DNI actualizado exitosamente');
  console.log(`   ${usuario.nombreCompleto}: ${actualizado.documentoIdentidad}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
