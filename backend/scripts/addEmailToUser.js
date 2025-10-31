// Script para agregar correo electrónico a un usuario
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [, , nombreUsuario, correo] = process.argv;

  if (!nombreUsuario || !correo) {
    console.error('Uso: node scripts/addEmailToUser.js <nombreUsuario> <correo@ejemplo.com>');
    console.log('\nEjemplos:');
    console.log('  node scripts/addEmailToUser.js asesor1 carlos.torres@ibr.com.pe');
    console.log('  node scripts/addEmailToUser.js admin admin@ibr.com.pe');
    process.exit(1);
  }

  try {
    // Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { nombreUsuario }
    });

    if (!usuario) {
      console.error(`❌ Usuario no encontrado: ${nombreUsuario}`);
      console.log('\nUsuarios disponibles:');
      const usuarios = await prisma.usuario.findMany({
        select: { nombreUsuario: true, nombreCompleto: true }
      });
      usuarios.forEach(u => console.log(`  - ${u.nombreUsuario} (${u.nombreCompleto})`));
      process.exit(1);
    }

    // Verificar si el correo ya está en uso (solo informativo, ahora se permite)
    const correoExistente = await prisma.usuario.findMany({
      where: { correoElectronico: correo },
      select: { nombreUsuario: true, nombreCompleto: true }
    });

    if (correoExistente.length > 0) {
      console.log(`⚠️ El correo ${correo} ya está asociado a:`);
      correoExistente.forEach(u => console.log(`   - ${u.nombreUsuario} (${u.nombreCompleto})`));
      console.log('   Se agregará de todos modos (permitido desde la actualización).\n');
    }

    // Actualizar el correo
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { correoElectronico: correo }
    });

    console.log(`✅ Correo agregado exitosamente:`);
    console.log(`   Usuario: ${nombreUsuario}`);
    console.log(`   Correo: ${correo}`);
    console.log(`\n📧 Ahora puedes usar "Olvidaste tu contraseña" con este correo.`);
    
    const totalConEsteCorreo = await prisma.usuario.count({
      where: { correoElectronico: correo }
    });
    
    if (totalConEsteCorreo > 1) {
      console.log(`ℹ️ Este correo está asociado a ${totalConEsteCorreo} usuarios.`);
      console.log(`   Al usar "Olvidaste tu contraseña", se generarán contraseñas para todos.\n`);
    } else {
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
