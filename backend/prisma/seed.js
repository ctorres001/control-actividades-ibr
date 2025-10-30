// =====================================================
// prisma/seed.js - Datos iniciales
// =====================================================

import { PrismaClient } from '@prisma/client';

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
  // 3. USUARIOS (contraseñas sin encriptar por ahora)
  // =====================================================
  console.log('👤 Creando usuarios...');

  const rolAsesor = await prisma.rol.findUnique({ where: { nombre: 'Asesor' } });
  const rolSupervisor = await prisma.rol.findUnique({ where: { nombre: 'Supervisor' } });
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'Administrador' } });

  const campañaPQRS = await prisma.campaña.findUnique({ where: { nombre: 'PQRS' } });
  const campañaVentas = await prisma.campaña.findUnique({ where: { nombre: 'Ventas' } });
  const campañaBO = await prisma.campaña.findUnique({ where: { nombre: 'BO_Calidda' } });

  const usuarios = await Promise.all([
    // Supervisores
    prisma.usuario.upsert({
      where: { nombreUsuario: 'super1' },
      update: {},
      create: {
        nombreUsuario: 'super1',
        contraseña: 'Super1@2024',
        nombreCompleto: 'Supervisor 1',
        rolId: rolSupervisor.id,
        campañaId: campañaPQRS.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'super2' },
      update: {},
      create: {
        nombreUsuario: 'super2',
        contraseña: 'Super2@2024',
        nombreCompleto: 'Supervisor 2',
        rolId: rolSupervisor.id,
        campañaId: campañaBO.id,
        estado: true
      }
    }),
    // Asesores
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor1' },
      update: {},
      create: {
        nombreUsuario: 'asesor1',
        contraseña: 'Asesor1@2024',
        nombreCompleto: 'Asesor 1',
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
        contraseña: 'Asesor2@2024',
        nombreCompleto: 'Asesor 2',
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
        contraseña: 'Asesor3@2024',
        nombreCompleto: 'Asesor 3',
        rolId: rolAsesor.id,
        campañaId: campañaBO.id,
        estado: true
      }
    }),
    prisma.usuario.upsert({
      where: { nombreUsuario: 'asesor4' },
      update: {},
      create: {
        nombreUsuario: 'asesor4',
        contraseña: 'Asesor4@2024',
        nombreCompleto: 'Asesor 4',
        rolId: rolAsesor.id,
        campañaId: campañaBO.id,
        estado: true
      }
    }),
    // Administrador
    prisma.usuario.upsert({
      where: { nombreUsuario: 'admin' },
      update: {},
      create: {
        nombreUsuario: 'admin',
        contraseña: 'Admin123!@#',
        nombreCompleto: 'Administrador',
        rolId: rolAdmin.id,
        campañaId: campañaPQRS.id,
        estado: true
      }
    })
  ]);

  console.log(`✅ ${usuarios.length} usuarios creados\n`);

  // =====================================================
  // 4. ACTIVIDADES
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
  // 5. SUBACTIVIDADES
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