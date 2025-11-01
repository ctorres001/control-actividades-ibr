// =====================================================
// scripts/resetPassword.js - Resetear contraseña de usuario
// =====================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log('❌ Uso: node scripts/resetPassword.js <username> <newPassword>');
    console.log('\nEjemplo:');
    console.log('   node scripts/resetPassword.js super1 Super1@2024');
    process.exit(1);
  }

  console.log('\n🔐 Reseteando contraseña...');
  console.log('   Usuario:', username);
  console.log('   Nueva contraseña:', newPassword);

  // Buscar usuario
  const usuario = await prisma.usuario.findUnique({
    where: { nombreUsuario: username }
  });

  if (!usuario) {
    console.log('❌ Usuario no encontrado');
    process.exit(1);
  }

  // Hash de la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { contraseña: hashedPassword }
  });

  console.log('✅ Contraseña actualizada exitosamente!');
  console.log('\n   Hash nuevo:', hashedPassword.substring(0, 30) + '...');
  
  // Verificar
  const match = await bcrypt.compare(newPassword, hashedPassword);
  console.log('   Verificación:', match ? '✅ OK' : '❌ ERROR');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
