// Script para verificar usuario por correo electrónico
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Uso: node scripts/checkUserByEmail.js <correo@ejemplo.com>');
    process.exit(1);
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        correoElectronico: email
      },
      include: {
        rol: true,
        campaña: true
      }
    });

    if (!usuario) {
      console.log(`❌ No se encontró usuario con correo: ${email}`);
    } else {
      console.log('\n✅ Usuario encontrado:');
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Usuario: ${usuario.nombreUsuario}`);
      console.log(`   Nombre: ${usuario.nombreCompleto}`);
      console.log(`   Correo: ${usuario.correoElectronico}`);
      console.log(`   Rol: ${usuario.rol?.nombre || 'N/A'}`);
      console.log(`   Campaña: ${usuario.campaña?.nombre || 'N/A'}`);
      console.log(`   Estado: ${usuario.estado ? 'Activo' : 'Inactivo'}`);
      console.log(`\n📝 Contraseña actual: [HASH BCRYPT - usa forgot password para generar temporal]\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
