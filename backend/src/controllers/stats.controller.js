import { prisma } from '../utils/prisma.js';

// Cache corto para asesores activos
const activeAsesoresCache = new Map(); // key: `${userId}:${campaignKey}` -> { ts, data }
const STATS_CACHE_TTL_MS = parseInt(process.env.STATS_ACTIVE_CACHE_TTL_MS || '2000', 10);

// Obtener estadísticas con filtros
export const getStats = async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      usuarioId, 
      campañaId, 
      rolId, 
      supervisorId 
    } = req.query;

    // Construir filtros dinámicamente
    const where = {};

    // Filtro de fechas
    if (fechaInicio && fechaFin) {
      // Interpretar fechas como horario LOCAL para evitar desfases por UTC
      const startDate = new Date(`${fechaInicio}T00:00:00`);
      const endDate = new Date(`${fechaFin}T23:59:59.999`);

      where.fecha = {
        gte: startDate,
        lte: endDate
      };
    }

    // Filtro de usuario
    if (usuarioId) {
      where.usuarioId = parseInt(usuarioId);
    }

    // Filtro de campaña
    if (campañaId) {
      where.usuario = {
        ...(where.usuario || {}),
        is: { campañaId: parseInt(campañaId) }
      };
    }

    // Filtro de rol (solo para admin)
    if (rolId && req.user.rol === 'Administrador') {
      where.usuario = {
        ...(where.usuario || {}),
        is: {
          ...(where.usuario?.is || {}),
          rolId: parseInt(rolId)
        }
      };
    }

    // Filtro de supervisor (solo para admin)
    if (supervisorId && req.user.rol === 'Administrador') {
      const supId = parseInt(supervisorId);
      try {
        // Buscar campañas asignadas a ese supervisor (si existe la tabla m:n)
        const asignaciones = await prisma.supervisorCampaña.findMany({
          where: { supervisorId: supId },
          select: { campañaId: true }
        });
        const campañaIds = asignaciones.map(a => a.campañaId);
        if (campañaIds.length > 0) {
          where.usuario = {
            ...(where.usuario || {}),
            is: {
              ...(where.usuario?.is || {}),
              campañaId: { in: campañaIds }
            }
          };
        } else {
          // Fallback: si no hay asignaciones, no devuelve registros
          where.usuario = { ...(where.usuario || {}), is: { id: -1 } };
        }
      } catch (_) {
        // Fallback si aún no existe la tabla: usar misma campaña del supervisor (modelo antiguo)
        const supervisor = await prisma.usuario.findUnique({ where: { id: supId } });
        if (supervisor?.campañaId) {
          where.usuario = { ...(where.usuario || {}), is: { campañaId: supervisor.campañaId } };
        }
      }
    }

    // Si es supervisor, solo puede ver usuarios de campañas asignadas
    if (req.user.rol === 'Supervisor') {
      try {
        const asignaciones = await prisma.supervisorCampaña.findMany({
          where: { supervisorId: req.user.id },
          select: { campañaId: true }
        });
        const campañaIds = asignaciones.map(a => a.campañaId);
        if (campañaIds.length > 0) {
          where.usuario = { ...(where.usuario || {}), is: { campañaId: { in: campañaIds } } };
        } else if (req.user.campañaId) {
          // Fallback: modelo antiguo, una sola campaña
          where.usuario = { ...(where.usuario || {}), is: { campañaId: req.user.campañaId } };
        } else {
          // Sin campañas asignadas → no ver nada
          where.usuario = { ...(where.usuario || {}), is: { id: -1 } };
        }
      } catch (_) {
        // Fallback si aún no existe la tabla m:n
        if (req.user.campañaId) {
          where.usuario = { ...(where.usuario || {}), is: { campañaId: req.user.campañaId } };
        }
      }
    }

    // Si es asesor, solo puede ver sus propios registros
    if (req.user.rol === 'Asesor') {
      where.usuarioId = req.user.id;
    }

    // Obtener registros con relaciones
    const registros = await prisma.registroActividad.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombreCompleto: true,
            nombreUsuario: true,
            rol: true,
            campaña: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        actividad: {
          select: {
            id: true,
            nombreActividad: true
          }
        }
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    res.json(registros);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
};

// Obtener lista de usuarios (para filtros)
export const getUsers = async (req, res) => {
  try {
    let where = {};

    // Si es supervisor, mostrar usuarios de campañas asignadas (M:N)
    if (req.user.rol === 'Supervisor') {
      const asignaciones = await prisma.supervisorCampaña.findMany({
        where: { supervisorId: req.user.id },
        select: { campañaId: true }
      });
      const campañaIds = asignaciones.map(a => a.campañaId);
      if (campañaIds.length > 0) {
        where = { campañaId: { in: campañaIds } };
      } else if (req.user.campañaId) {
        // Fallback (modelo antiguo)
        where = { campañaId: req.user.campañaId };
      } else {
        where = { id: -1 }; // No mostrar usuarios
      }
    }

    // Si es asesor, solo mostrar su propio usuario
    if (req.user.rol === 'Asesor') {
      where = { id: req.user.id };
    }

    const users = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombreCompleto: true,
        nombreUsuario: true,
        rol: true,
        campaña: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuarios',
      details: error.message 
    });
  }
};

// Obtener lista de campañas (para filtros)
export const getCampaigns = async (req, res) => {
  try {
    // Si es supervisor, devolver solo campañas asignadas
    if (req.user.rol === 'Supervisor') {
      const asignaciones = await prisma.supervisorCampaña.findMany({
        where: { supervisorId: req.user.id },
        select: { campañaId: true }
      });
      const campañaIds = asignaciones.map(a => a.campañaId);
      const campaigns = await prisma.campaña.findMany({
        where: campañaIds.length > 0 ? { id: { in: campañaIds } } : undefined,
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' }
      });
      return res.json(campaigns);
    }

    const campaigns = await prisma.campaña.findMany({
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ 
      error: 'Error al obtener campañas',
      details: error.message 
    });
  }
};

// Obtener lista de roles (para filtros - solo admin)
export const getRoles = async (req, res) => {
  try {
    // Solo admin puede ver todos los roles
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const roles = await prisma.rol.findMany({
      select: { id: true, nombre: true },
      orderBy: { id: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ 
      error: 'Error al obtener roles',
      details: error.message 
    });
  }
};

// Obtener lista de supervisores (para filtros - solo admin)
export const getSupervisors = async (req, res) => {
  try {
    // Solo admin puede ver todos los supervisores
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const supervisors = await prisma.usuario.findMany({
      where: {
        rol: { nombre: 'Supervisor' }
      },
      select: {
        id: true,
        nombreCompleto: true,
        nombreUsuario: true
      },
      orderBy: {
        nombreCompleto: 'asc'
      }
    });

    res.json(supervisors);
  } catch (error) {
    console.error('Error al obtener supervisores:', error);
    res.status(500).json({ 
      error: 'Error al obtener supervisores',
      details: error.message 
    });
  }
};

// =====================================================
// GET ACTIVE ASESORES - Obtener asesores con actividad actual
// =====================================================
export const getActiveAsesores = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, campañaId } = req.query;
    const userRole = req.user.rol;
    const userId = req.user.id;

    // Determinar qué campañas puede ver el usuario
    let allowedCampaignIds = [];
    
    if (userRole === 'Administrador') {
      // Admin ve todas las campañas
      const campaigns = await prisma.campaña.findMany({ select: { id: true } });
      allowedCampaignIds = campaigns.map(c => c.id);
    } else if (userRole === 'Supervisor') {
      // Supervisor solo ve sus campañas asignadas (M:N) o su campaña (modelo antiguo)
      try {
        const assignments = await prisma.supervisorCampaña.findMany({
          where: { supervisorId: userId },
          select: { campañaId: true }
        });
        allowedCampaignIds = assignments.map(a => a.campañaId);
      } catch (_) {
        // Fallback si la tabla m:n no existe aún
        const sup = await prisma.usuario.findUnique({ where: { id: userId } });
        if (sup?.campañaId) {
          allowedCampaignIds = [sup.campañaId];
        }
      }
    } else {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Filtrar por campaña específica si se proporciona
    if (campañaId) {
      const cid = parseInt(campañaId);
      if (allowedCampaignIds.includes(cid)) {
        allowedCampaignIds = [cid];
      } else {
        return res.status(403).json({ error: 'No tienes acceso a esta campaña' });
      }
    }

    // Intentar caché
    const campaignKey = allowedCampaignIds.sort().join(',') || 'none';
    const cacheKey = `${userId}:${campaignKey}`;
    const nowTs = Date.now();
    const cached = activeAsesoresCache.get(cacheKey);
    if (cached && (nowTs - cached.ts) < STATS_CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Obtener asesores de las campañas permitidas
    const asesores = await prisma.usuario.findMany({
      where: {
        rol: { nombre: 'Asesor' },
        campañaId: { in: allowedCampaignIds }
      },
      include: {
        campaña: {
          select: { nombre: true }
        }
      }
    });

    // Determinar ventana del día (local)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const asesorIds = asesores.map(a => a.id);

    // Batch 1: actividades actuales de todos los asesores (horaFin null)
    const actividadesAbiertas = await prisma.registroActividad.findMany({
      where: {
        usuarioId: { in: asesorIds },
        horaFin: null
      },
      include: { actividad: { select: { nombreActividad: true } } },
      orderBy: { horaInicio: 'desc' }
    });
    // Elegir la más reciente por usuario
    const actividadActualPorUsuario = new Map();
    for (const r of actividadesAbiertas) {
      if (!actividadActualPorUsuario.has(r.usuarioId)) {
        actividadActualPorUsuario.set(r.usuarioId, r);
      }
    }

    // Batch 2: registros de hoy para todos los asesores
    const registrosHoyTodos = await prisma.registroActividad.findMany({
      where: {
        usuarioId: { in: asesorIds },
        fecha: { gte: startOfDay, lte: endOfDay }
      },
      include: { actividad: { select: { nombreActividad: true, orden: true } } }
    });
    const registrosPorUsuario = new Map();
    for (const reg of registrosHoyTodos) {
      if (!registrosPorUsuario.has(reg.usuarioId)) registrosPorUsuario.set(reg.usuarioId, []);
      registrosPorUsuario.get(reg.usuarioId).push(reg);
    }

    const asesoresConEstadisticas = asesores.map((asesor) => {
      const actividadActual = actividadActualPorUsuario.get(asesor.id) || null;
      const registrosHoy = registrosPorUsuario.get(asesor.id) || [];

      let tiempoTotal = 0;
      let tiempoProductivo = 0;
      let tiempoAuxiliar = 0;
      const productivas = ['Seguimiento', 'Bandeja de Correo', 'Reportes', 'Caso Nuevo'];
      const auxiliares = ['Auxiliares', 'Reunión', 'Incidencia', 'Pausa'];

      for (const registro of registrosHoy) {
        let duration = 0;
        if (registro.horaFin) {
          duration = registro.duracionSeg || 0;
        } else if (registro.horaInicio) {
          duration = Math.floor((Date.now() - new Date(registro.horaInicio).getTime()) / 1000);
        }
        tiempoTotal += duration;
        const activityName = registro.actividad.nombreActividad;
        if (productivas.includes(activityName)) tiempoProductivo += duration;
        else if (auxiliares.includes(activityName)) tiempoAuxiliar += duration;
      }

      return {
        id: asesor.id,
        nombreCompleto: asesor.nombreCompleto,
        nombreUsuario: asesor.nombreUsuario,
        campañaNombre: asesor.campaña?.nombre || 'Sin campaña',
        actividadActual: actividadActual
          ? {
              nombreActividad: actividadActual.actividad.nombreActividad,
              duracionActual: actividadActual.horaInicio
                ? Math.floor((Date.now() - new Date(actividadActual.horaInicio).getTime()) / 1000)
                : 0
            }
          : null,
        tiempoTotal,
        tiempoProductivo,
        tiempoAuxiliar,
        cantidadRegistros: registrosHoy.length
      };
    });

    // Guardar en caché
    activeAsesoresCache.set(cacheKey, { ts: nowTs, data: asesoresConEstadisticas });

    res.json({ success: true, data: asesoresConEstadisticas });

  } catch (error) {
    console.error('Error al obtener asesores activos:', error);
    res.status(500).json({
      error: 'Error al obtener asesores activos',
      details: error.message
    });
  }
};
