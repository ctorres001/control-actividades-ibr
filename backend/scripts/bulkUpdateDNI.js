// =====================================================
// scripts/bulkUpdateDNI.js - Actualizar DNI de múltiples usuarios
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 📋 CONFIGURA AQUÍ LOS DNI DE TUS USUARIOS
// Formato: { nombreUsuario: 'DNI' }
const USUARIOS_DNI = {
  'ctorres': '12345678',      // Ejemplo: Carlos Torres
  'asesor1': '87654321',      // Ejemplo: Asesor 1
  // Agrega más usuarios aquí...
};

async function main() {
  console.log('\n🔄 ACTUALIZACIÓN MASIVA DE DNI\n');
  console.log('═══════════════════════════════════════════════════════════════════════');

  const usuarios = Object.entries(USUARIOS_DNI);

  if (usuarios.length === 0) {
    console.log('\n⚠️  No hay usuarios configurados para actualizar');
    console.log('   Edita el script y agrega los usuarios en la constante USUARIOS_DNI\n');
    process.exit(0);
  }

  console.log(`\n📊 Se actualizarán ${usuarios.length} usuarios:\n`);
  
  for (const [nombreUsuario, dni] of usuarios) {
    // Verificar que el usuario exista
    const usuario = await prisma.usuario.findUnique({
      where: { nombreUsuario }
    });

    if (!usuario) {
      console.log(`   ❌ ${nombreUsuario}: Usuario no encontrado`);
      continue;
    }

    console.log(`   📝 ${nombreUsuario} (${usuario.nombreCompleto}): ${usuario.documentoIdentidad || 'sin DNI'} → ${dni}`);
  }

  console.log('\n⚠️  ¿Deseas continuar? (presiona Ctrl+C para cancelar)');
  console.log('   Actualizando en 5 segundos...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  let actualizados = 0;
  let errores = 0;

  for (const [nombreUsuario, dni] of usuarios) {
    try {
      await prisma.usuario.update({
        where: { nombreUsuario },
        data: { documentoIdentidad: dni.trim() }
      });
      console.log(`   ✅ ${nombreUsuario}: DNI actualizado`);
      actualizados++;
    } catch (error) {
      console.log(`   ❌ ${nombreUsuario}: Error - ${error.message}`);
      errores++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Actualizados: ${actualizados}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📝 Total: ${usuarios.length}\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
