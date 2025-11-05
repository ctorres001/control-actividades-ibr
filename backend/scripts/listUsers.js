// =====================================================
// scripts/listUsers.js - Listar usuarios con info
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 LISTADO DE USUARIOS EN BASE DE DATOS\n');
  console.log('═══════════════════════════════════════════════════════════════════════');

  const usuarios = await prisma.usuario.findMany({
    include: {
      rol: true,
      campaña: true
    },
    orderBy: [
      { rolId: 'desc' },
      { nombreCompleto: 'asc' }
    ]
  });

  if (usuarios.length === 0) {
    console.log('❌ No hay usuarios en la base de datos');
    return;
  }

  // Agrupar por rol
  const porRol = {
    'Administrador': [],
    'Supervisor': [],
    'Asesor': []
  };

  usuarios.forEach(u => {
    if (porRol[u.rol.nombre]) {
      porRol[u.rol.nombre].push(u);
    }
  });

  // Mostrar por rol
  Object.entries(porRol).forEach(([rol, users]) => {
    if (users.length > 0) {
      console.log(`\n🔹 ${rol}s (${users.length}):`);
      console.log('─────────────────────────────────────────────────────────────────────');
      
      users.forEach(u => {
        const estado = u.estado ? '✅ Activo' : '❌ Inactivo';
        const email = u.correoElectronico || '(sin email)';
        const dni = u.documentoIdentidad || '(sin DNI)';
        
        console.log(`
  👤 ${u.nombreCompleto}
     Usuario: ${u.nombreUsuario}
     DNI: ${dni}
     Email: ${email}
     Campaña: ${u.campaña.nombre}
     Estado: ${estado}
     ID: ${u.id}
        `);
      });
    }
  });

  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`\n📊 Total: ${usuarios.length} usuarios registrados\n`);
  
  console.log('💡 TIP: Para ver las contraseñas de desarrollo, consulta:');
  console.log('   📄 CREDENCIALES_DESARROLLO.md\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
