// =====================================================
// scripts/resetUserPassword.js - Resetear contraseña de un usuario por nombreUsuario
// Uso:
//   node scripts/resetUserPassword.js <nombreUsuario> <nuevaContraseña>
// =====================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [, , nombreUsuario, nuevaContraseña] = process.argv;

  if (!nombreUsuario || !nuevaContraseña) {
    console.error('Uso: node scripts/resetUserPassword.js <nombreUsuario> <nuevaContraseña>');
    process.exit(1);
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { nombreUsuario } });
    if (!user) {
      console.error(`Usuario no encontrado: ${nombreUsuario}`);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(nuevaContraseña, 10);
    await prisma.usuario.update({ where: { id: user.id }, data: { contraseña: hashed } });
    console.log(`✅ Contraseña actualizada para ${nombreUsuario}`);
  } catch (err) {
    console.error('❌ Error actualizando contraseña:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
