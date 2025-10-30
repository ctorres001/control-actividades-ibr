// =====================================================
// src/utils/hashPasswords.js
// Script para encriptar contraseñas existentes
// =====================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  try {
    console.log('🔐 Iniciando encriptación de contraseñas...\n');

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombreUsuario: true,
        contraseña: true
      }
    });

    console.log(`📊 Total de usuarios encontrados: ${usuarios.length}\n`);

    // Procesar cada usuario
    for (const usuario of usuarios) {
      // Verificar si la contraseña ya está hasheada
      // Las contraseñas hasheadas con bcrypt empiezan con $2b$
      if (usuario.contraseña.startsWith('$2b$')) {
        console.log(`⏭️  ${usuario.nombreUsuario}: Ya está encriptada`);
        continue;
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(usuario.contraseña, 10);

      // Actualizar en la base de datos
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { contraseña: hashedPassword }
      });

      console.log(`✅ ${usuario.nombreUsuario}: Contraseña encriptada`);
    }

    console.log('\n🎉 ¡Todas las contraseñas han sido encriptadas exitosamente!');

  } catch (error) {
    console.error('❌ Error encriptando contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
hashExistingPasswords();