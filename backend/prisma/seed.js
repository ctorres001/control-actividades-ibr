// =====================================================
// prisma/seed.js - Datos iniciales
// =====================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // =====================================================
  // 1. ROLES
  // =====================================================
  console.log('👥 Creando roles...');
  
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'Asesor' },
      update: {},
      create: { nombre: 'Asesor' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'Supervisor' },
      update: {},
      create: { nombre: 'Supervisor' }
    }),
    prisma.rol.upsert({
      where: { nombre: 'Administrador' },
      update: {},
      create: { nombre: 'Administrador' }
    })
  ]);

  console.log(`✅ ${roles.length} roles creados\n`);

  // =====================================================
  // 2. CAMPAÑAS
  // =====================================================
  console.log('🎯 Creando campañas...');

  const campañas = await Promise.all([
    prisma.campaña.upsert({
      where: { nombre: 'PQRS' },
      update: {},
      create: { nombre: 'PQRS' }
    }),
    prisma.campaña.upsert({
      where: { nombre: 'Ventas' },
      update: {},
      create: { nombre: 'Ventas' }
    }),
    prisma.campaña.upsert({
      where: { nombre: 'BO_Calidda' },
      update: {},
      create: { nombre: 'BO_Calidda' }
    })
  ]);

  console.log(`✅ ${campañas.length} campañas creadas\n`);

  // =====================================================
  // 3. USUARIOS (con contraseñas encriptadas)
  // =====================================================
  console.log('👤 Creando usuarios...');

  const rolAsesor = await prisma.rol.findUnique({ where: { nombre: 'Asesor' } });
  const rolSupervisor = await prisma.rol.findUnique({ where: { nombre: 'Supervisor' } });
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });

  const campañaPQRS = await prisma.campaña.findUnique({ where: { nombre: 'PQRS' } });
  const campañaVentas = await prisma.campaña.findUnique({ where: { nombre: 'Ventas' } });
  const campañaBO = await prisma.campaña.findUnique({ where: { nombre: 'BO_Calidda' } });

  // Encriptar contraseñas
  const hashSuper1 = await bcrypt.hash('Super1@2024', 10);
  const hashSuper2 = await bcrypt.hash('Super2@2024', 10);
  const hashAsesor1 = await bcrypt.hash('Asesor1@2024', 10);
  const hashAsesor2 = await bcrypt.hash('Asesor2@2024', 10);
  const hashAsesor3 = await bcrypt.hash('Asesor3@2024', 10);
  const hashAsesor4 = await bcrypt.hash('Asesor4@2024', 10);
  const hashAsesor5 = await bcrypt.hash('Asesor5@2024', 10);
  const hashAdmin = await bcrypt.hash('Admin123!@#', 10);

  const usuarios = await Promise.all([
    // Supervisores (sin campañaId, se asignarán vía M:N después)
    prisma.usuario.upsert({
      where: { nombreUsuario: 'super1' },
      update: {},
      create: {
        nombreUsuario: 'super1',
        contraseña: hashSuper1,
        nombreCompleto: 'Supervisor 1',
        rolId: rolSupervisor.id,
        campañaId: null,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'super2' },
      update: {},
      create: {
        nombreUsuario: 'super2',
        contraseña: hashSuper2,
        nombreCompleto: 'Supervisor 2',
        rolId: rolSupervisor.id,
        campañaId: null,
        estado: true
      }
    }),
    // Asesores (con campañaId única)
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor1' },
      update: {},
      create: {
        nombreUsuario: 'asesor1',
        contraseña: hashAsesor1,
        nombreCompleto: 'Asesor 1 PQRS',
        rolId: rolAsesor.id,
        campañaId: campañaPQRS.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor2' },
      update: {},
      create: {
        nombreUsuario: 'asesor2',
        contraseña: hashAsesor2,
        nombreCompleto: 'Asesor 2 PQRS',
        rolId: rolAsesor.id,
        campañaId: campañaPQRS.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor3' },
      update: {},
      create: {
        nombreUsuario: 'asesor3',
        contraseña: hashAsesor3,
        nombreCompleto: 'Asesor 3 Ventas',
        rolId: rolAsesor.id,
        campañaId: campañaVentas.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor4' },
      update: {},
      create: {
        nombreUsuario: 'asesor4',
        contraseña: hashAsesor4,
        nombreCompleto: 'Asesor 4 BO',
        rolId: rolAsesor.id,
        campañaId: campañaBO.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor5' },
      update: {},
      create: {
        nombreUsuario: 'asesor5',
        contraseña: hashAsesor5,
        nombreCompleto: 'Asesor 5 BO',
        rolId: rolAsesor.id,
        campañaId: campañaBO.id,
        estado: true
      }
    }),
    // Administrador (sin campañaId)
    prisma.usuario.upsert({
      where: { nombreUsuario: 'admin' },
      update: {},
      create: {
        nombreUsuario: 'admin',
        contraseña: hashAdmin,
        nombreCompleto: 'Administrador',
        rolId: rolAdmin.id,
        campañaId: null,
        estado: true
      }
    })
  ]);

  console.log(`✅ ${usuarios.length} usuarios creados`);

  // =====================================================
  // 4. ASIGNACIONES DE SUPERVISORES A CAMPAÑAS (M:N)
  // =====================================================
  console.log('🔗 Asignando campañas a supervisores...');

  const super1 = await prisma.usuario.findUnique({ where: { nombreUsuario: 'super1' } });
  const super2 = await prisma.usuario.findUnique({ where: { nombreUsuario: 'super2' } });

  // Supervisor 1: PQRS + Ventas
  await prisma.supervisorCampaña.upsert({
    where: {
      supervisorId_campañaId: {
        supervisorId: super1.id,
        campañaId: campañaPQRS.id
      }
    },
    update: {},
    create: {
      supervisorId: super1.id,
      campañaId: campañaPQRS.id
    }
  });

  await prisma.supervisorCampaña.upsert({
    where: {
      supervisorId_campañaId: {
        supervisorId: super1.id,
        campañaId: campañaVentas.id
      }
    },
    update: {},
    create: {
      supervisorId: super1.id,
      campañaId: campañaVentas.id
    }
  });

  // Supervisor 2: BO_Calidda
  await prisma.supervisorCampaña.upsert({
    where: {
      supervisorId_campañaId: {
        supervisorId: super2.id,
        campañaId: campañaBO.id
      }
    },
    update: {},
    create: {
      supervisorId: super2.id,
      campañaId: campañaBO.id
    }
  });

  console.log(`✅ Supervisores asignados a campañas\n`);

  // =====================================================
  // 5. ACTIVIDADES
  // =====================================================
  console.log('📋 Creando actividades...');

  const actividades = await Promise.all([
    prisma.actividad.upsert({
      where: { nombreActividad: 'Ingreso' },
      update: {},
      create: {
        nombreActividad: 'Ingreso',
        descripcion: 'Marcador de entrada a jornada',
        orden: 1,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Bandeja de Correo' },
      update: {},
      create: {
        nombreActividad: 'Bandeja de Correo',
        descripcion: 'Procesamiento de correos',
        orden: 5,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Seguimiento' },
      update: {},
      create: {
        nombreActividad: 'Seguimiento',
        descripcion: 'Seguimiento a clientes',
        orden: 6,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Break Salida' },
      update: {},
      create: {
        nombreActividad: 'Break Salida',
        descripcion: 'Descanso - Primera salida',
        orden: 10,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Regreso Break' },
      update: {},
      create: {
        nombreActividad: 'Regreso Break',
        descripcion: 'Regreso de descanso',
        orden: 11,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Reportes' },
      update: {},
      create: {
        nombreActividad: 'Reportes',
        descripcion: 'Elaboración de reportes',
        orden: 20,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Reunión' },
      update: {},
      create: {
        nombreActividad: 'Reunión',
        descripcion: 'Participación en reuniones',
        orden: 21,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Auxiliares' },
      update: {},
      create: {
        nombreActividad: 'Auxiliares',
        descripcion: 'Tareas auxiliares',
        orden: 30,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Incidencia' },
      update: {},
      create: {
        nombreActividad: 'Incidencia',
        descripcion: 'Atención de incidencias',
        orden: 31,
        activo: true
      }
    }),
    prisma.actividad.upsert({
      where: { nombreActividad: 'Salida' },
      update: {},
      create: {
        nombreActividad: 'Salida',
        descripcion: 'Fin de jornada',
        orden: 99,
        activo: true
      }
    })
  ]);

  console.log(`✅ ${actividades.length} actividades creadas\n`);

  // =====================================================
  // 6. SUBACTIVIDADES
  // =====================================================
  console.log('📌 Creando subactividades...');

  const actSeguimiento = await prisma.actividad.findUnique({ where: { nombreActividad: 'Seguimiento' } });
  const actCorreo = await prisma.actividad.findUnique({ where: { nombreActividad: 'Bandeja de Correo' } });
  const actReportes = await prisma.actividad.findUnique({ where: { nombreActividad: 'Reportes' } });
  const actAuxiliares = await prisma.actividad.findUnique({ where: { nombreActividad: 'Auxiliares' } });

  const subactividades = await Promise.all([
    // Seguimiento
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actSeguimiento.id, nombreSubactividad: 'Redes Sociales' } },
      update: {},
      create: { actividadId: actSeguimiento.id, nombreSubactividad: 'Redes Sociales', orden: 1 }
    }),
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actSeguimiento.id, nombreSubactividad: 'Reclamos' } },
      update: {},
      create: { actividadId: actSeguimiento.id, nombreSubactividad: 'Reclamos', orden: 2 }
    }),
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actSeguimiento.id, nombreSubactividad: 'Cambio de Titularidad' } },
      update: {},
      create: { actividadId: actSeguimiento.id, nombreSubactividad: 'Cambio de Titularidad', orden: 3 }
    }),
    // Bandeja de Correo
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actCorreo.id, nombreSubactividad: 'Respuesta a Cliente' } },
      update: {},
      create: { actividadId: actCorreo.id, nombreSubactividad: 'Respuesta a Cliente', orden: 1 }
    }),
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actCorreo.id, nombreSubactividad: 'Comunicación Interna' } },
      update: {},
      create: { actividadId: actCorreo.id, nombreSubactividad: 'Comunicación Interna', orden: 2 }
    }),
    // Reportes
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actReportes.id, nombreSubactividad: 'Reporte Diario' } },
      update: {},
      create: { actividadId: actReportes.id, nombreSubactividad: 'Reporte Diario', orden: 1 }
    }),
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actReportes.id, nombreSubactividad: 'Análisis de Datos' } },
      update: {},
      create: { actividadId: actReportes.id, nombreSubactividad: 'Análisis de Datos', orden: 2 }
    }),
    // Auxiliares
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actAuxiliares.id, nombreSubactividad: 'Soporte Técnico' } },
      update: {},
      create: { actividadId: actAuxiliares.id, nombreSubactividad: 'Soporte Técnico', orden: 1 }
    }),
    prisma.subactividad.upsert({
      where: { actividadId_nombreSubactividad: { actividadId: actAuxiliares.id, nombreSubactividad: 'Capacitación' } },
      update: {},
      create: { actividadId: actAuxiliares.id, nombreSubactividad: 'Capacitación', orden: 2 }
    })
  ]);

  console.log(`✅ ${subactividades.length} subactividades creadas\n`);

  console.log('🎉 ¡Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });