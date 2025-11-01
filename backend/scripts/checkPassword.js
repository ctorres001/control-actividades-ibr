// =====================================================
// scripts/checkPassword.js - Verificar contraseña
// =====================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'super1';
  const passwordToTest = 'Super1@2024';

  console.log('\n🔐 Verificando contraseña para:', username);
  console.log('Contraseña a probar:', passwordToTest);

  const usuario = await prisma.usuario.findUnique({
    where: { nombreUsuario: username },
    include: {
      rol: true,
      campaña: true
    }
  });

  if (!usuario) {
    console.log('❌ Usuario no encontrado');
    return;
  }

  console.log('\n✅ Usuario encontrado:');
  console.log('   Nombre completo:', usuario.nombreCompleto);
  console.log('   Rol:', usuario.rol.nombre);
  console.log('   Campaña:', usuario.campaña.nombre);
  console.log('   Hash en DB:', usuario.contraseña.substring(0, 30) + '...');

  // Verificar si la contraseña está hasheada
  const isHashed = usuario.contraseña.startsWith('$2');
  console.log('   ¿Está hasheada?:', isHashed ? 'Sí' : 'No');

  if (isHashed) {
    // Comparar con bcrypt
    const match = await bcrypt.compare(passwordToTest, usuario.contraseña);
    console.log('\n🔍 Resultado de bcrypt.compare():', match ? '✅ COINCIDE' : '❌ NO COINCIDE');
    
    if (!match) {
      console.log('\n💡 La contraseña está hasheada pero no coincide.');
      console.log('   Puede que se haya cambiado después del seed.');
      console.log('\n   Para resetear la contraseña, ejecuta:');
      console.log(`   node scripts/resetPassword.js ${username} Super1@2024`);
    }
  } else {
    console.log('\n⚠️  La contraseña NO está hasheada (texto plano en DB)');
    console.log('   Ejecuta: node utils/hashPasswords.js');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
