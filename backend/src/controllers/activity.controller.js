// =====================================================
// src/controllers/activity.controller.js
// Controlador de actividades
// =====================================================

import { prisma } from '../utils/prisma.js';
import { getDateStrInTZ, dateStrToUtcDate } from '../utils/time.js';
import { parseIdSafe, validateDateStr } from '../utils/validation.js';

// Cachés en memoria con TTL corto para aliviar carga bajo alto polling
const summaryCache = new Map(); // key: `${usuarioId}:${dateStr}` -> { ts, data }
const logCache = new Map();     // key: `${usuarioId}:${dateStr}` -> { ts, data }
const CACHE_TTL_MS = parseInt(process.env.SUMMARY_LOG_CACHE_TTL_MS || '2000', 10); // 2s por defecto

/**
 * Invalida el caché de summary y log para un usuario
 * @param {number} usuarioId - ID del usuario
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD (opcional, usa hoy por defecto)
 */
function invalidateUserCache(usuarioId, dateStr = null) {
  const date = dateStr || getDateStrInTZ();
  const cacheKey = `${usuarioId}:${date}`;
  summaryCache.delete(cacheKey);
  logCache.delete(cacheKey);
  console.log(`🗑️ Caché invalidado para usuario ${usuarioId}, fecha ${date}`);
}

// =====================================================
// GET ACTIVE ACTIVITIES - Obtener actividades activas
// =====================================================
export const getActiveActivities = async (req, res) => {
  try {
    const actividades = await prisma.actividad.findMany({
      where: { activo: true },
      orderBy: [
        { orden: 'asc' },
        { nombreActividad: 'asc' }
      ],
      select: {
        id: true,
        nombreActividad: true,
        descripcion: true,
        orden: true
      }
    });

    res.json({
      success: true,
      data: actividades
    });

  } catch (error) {
    console.error('❌ Error en getActiveActivities:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener actividades'
    });
  }
};

// =====================================================
// GET SUBACTIVITIES - Obtener subactividades
// =====================================================
export const getSubactivities = async (req, res) => {
  try {
    const { activityId } = req.params;
    const actividadId = parseIdSafe(activityId, 'activityId');

    const subactividades = await prisma.subactividad.findMany({
      where: {
        actividadId: actividadId
      },
      orderBy: [
        { orden: 'asc' },
        { nombreSubactividad: 'asc' }
      ],
      select: {
        id: true,
        nombreSubactividad: true,
        descripcion: true,
        orden: true
      }
    });

    res.json({
      success: true,
      data: subactividades
    });

  } catch (error) {
    console.error('❌ Error en getSubactivities:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener subactividades'
    });
  }
};

// =====================================================
// START ACTIVITY - Iniciar actividad
// =====================================================
export const startActivity = async (req, res) => {
  try {
    const { actividadId, subactividadId, observaciones, idClienteReferencia, resumenBreve } = req.body;
    const usuarioId = req.user.id;

    // Validar que la actividad existe y está activa
    const actividad = await prisma.actividad.findFirst({
      where: { id: actividadId, activo: true }
    });

    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: 'Actividad no encontrada o inactiva'
      });
    }

    // 🔒 PROTECCIÓN CRÍTICA: Verificar si ya se marcó "Salida" hoy
    const dateStr = getDateStrInTZ(); // YYYY-MM-DD en APP_TZ
    const localDate = dateStrToUtcDate(dateStr);
    
    const salidaHoy = await prisma.registroActividad.findFirst({
      where: {
        usuarioId,
        fecha: localDate,
        actividad: { nombreActividad: 'Salida' }
      }
    });

    if (salidaHoy && actividad.nombreActividad !== 'Salida') {
      return res.status(400).json({
        success: false,
        error: 'La jornada ya ha finalizado. No se pueden registrar más actividades después de marcar Salida.',
        code: 'JORNADA_FINALIZADA'
      });
    }

    // 🔒 PROTECCIÓN: Evitar múltiples ingresos en el mismo día
    if (actividad.nombreActividad === 'Ingreso') {
      const ingresoExistente = await prisma.registroActividad.findFirst({
        where: {
          usuarioId,
          fecha: localDate,
          actividadId: actividad.id
        }
      });
      
      if (ingresoExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya has marcado tu ingreso hoy. Solo se permite un ingreso por día.',
          code: 'INGRESO_DUPLICADO'
        });
      }
    }

    // Validar subactividad si se proporciona
    if (subactividadId) {
      const subactividad = await prisma.subactividad.findFirst({
        where: {
          id: subactividadId,
          actividadId,
          activo: true
        }
      });

      if (!subactividad) {
        return res.status(404).json({
          success: false,
          error: 'Subactividad no válida'
        });
      }
    }

    // Cerrar actividad anterior si existe (evitar escaneo masivo y calcular duración en app)
    const registroAbierto = await prisma.registroActividad.findFirst({
      where: { usuarioId, horaFin: null },
      orderBy: { horaInicio: 'desc' }
    });

    if (registroAbierto) {
      const todayStr = getDateStrInTZ(); // YYYY-MM-DD en APP_TZ
      const registroDateStr = registroAbierto.fecha.toISOString().split('T')[0]; // YYYY-MM-DD

      let horaFin;
      let observacionesExtra = '';

      // Si el registro abierto es de un día anterior, cerrarlo a las 23:59:59 de ese día
      if (registroDateStr < todayStr) {
        const endOfDay = new Date(registroAbierto.fecha);
        endOfDay.setUTCHours(23, 59, 59, 999);
        horaFin = endOfDay;
        observacionesExtra = ' [Cerrado automáticamente al fin del día]';
        console.log(`⏰ Cerrando actividad del día anterior (${registroDateStr}) al iniciar nueva actividad: Usuario ${usuarioId}`);
      } else {
        // Si es del día actual, cerrarlo con la hora actual
        horaFin = new Date();
      }

      const duracionSeg = registroAbierto.horaInicio
        ? Math.max(0, Math.floor((horaFin - registroAbierto.horaInicio) / 1000))
        : null;

      // Actualizar sólo si sigue abierto (condición en DB) para evitar condiciones de carrera
      await prisma.registroActividad.updateMany({
        where: { id: registroAbierto.id, horaFin: null },
        data: { 
          horaFin, 
          duracionSeg, 
          estado: 'Finalizado',
          observaciones: registroAbierto.observaciones
            ? `${registroAbierto.observaciones}${observacionesExtra}`
            : (observacionesExtra ? observacionesExtra.trim() : null)
        }
      });
    }

  // Crear nuevo registro
  // Fecha ya calculada arriba para reutilizar en validaciones
    
    const nuevoRegistro = await prisma.registroActividad.create({
      data: {
        usuarioId,
        actividadId,
        subactividadId: subactividadId || null,
        observaciones: observaciones || null,
        idClienteReferencia: idClienteReferencia || null,
        resumenBreve: resumenBreve || null,
        fecha: localDate,
        horaInicio: new Date(),
        estado: 'Iniciado'
      },
      include: {
        actividad: true,
        subactividad: true,
        usuario: {
          select: {
            nombreCompleto: true
          }
        }
      }
    });

    console.log(`✅ Actividad iniciada: Usuario ${usuarioId} - ${actividad.nombreActividad}`);

    // 🔄 Invalidar caché después de iniciar actividad
    invalidateUserCache(usuarioId);

    res.status(201).json({
      success: true,
      message: 'Actividad iniciada correctamente',
      data: nuevoRegistro
    });

  } catch (error) {
    console.error('❌ Error en startActivity:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar actividad',
      details: error.message
    });
  }
};

// =====================================================
// STOP ACTIVITY - Detener actividad actual
// =====================================================
export const stopActivity = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Buscar actividad en curso
    const registroActual = await prisma.registroActividad.findFirst({
      where: {
        usuarioId,
        horaFin: null
      },
      include: {
        actividad: true
      }
    });

    if (!registroActual) {
      return res.status(404).json({
        success: false,
        error: 'No hay actividad en curso'
      });
    }

    // Actualizar con hora de fin y calcular duración
    const horaFin = new Date();
    
    // 🔒 VALIDACIÓN: Asegurar que horaFin > horaInicio
    if (horaFin <= registroActual.horaInicio) {
      return res.status(400).json({
        success: false,
        error: 'La hora de fin debe ser mayor que la hora de inicio. Verifique la hora del sistema.',
        code: 'INVALID_TIME_RANGE'
      });
    }
    
    const duracionSeg = Math.floor((horaFin - registroActual.horaInicio) / 1000);

    // Proteger contra condiciones de carrera: actualizar sólo si sigue abierto
    const updatedCount = await prisma.registroActividad.updateMany({
      where: { id: registroActual.id, horaFin: null },
      data: { horaFin, duracionSeg, estado: 'Finalizado' }
    });

    // Volver a leer el registro si se actualizó para incluir relaciones
    const registroActualizado = updatedCount.count > 0
      ? await prisma.registroActividad.findUnique({
          where: { id: registroActual.id },
          include: { actividad: true, subactividad: true }
        })
      : await prisma.registroActividad.findUnique({
          where: { id: registroActual.id },
          include: { actividad: true, subactividad: true }
        });

    console.log(`⏹️ Actividad detenida: Usuario ${usuarioId} - Duración: ${duracionSeg}s`);

    // 🔄 Invalidar caché después de detener actividad
    invalidateUserCache(usuarioId);

    res.json({
      success: true,
      message: 'Actividad detenida correctamente',
      data: registroActualizado
    });

  } catch (error) {
    console.error('❌ Error en stopActivity:', error);
    res.status(500).json({
      success: false,
      error: 'Error al detener actividad'
    });
  }
};

// =====================================================
// GET CURRENT ACTIVITY - Obtener actividad actual
// =====================================================
export const getCurrentActivity = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const actividadActual = await prisma.registroActividad.findFirst({
      where: {
        usuarioId,
        horaFin: null
      },
      include: {
        actividad: true,
        subactividad: true
      },
      orderBy: {
        horaInicio: 'desc'
      }
    });

    // Si hay una actividad abierta, verificar si es del día actual
    if (actividadActual) {
      const todayStr = getDateStrInTZ(); // YYYY-MM-DD en APP_TZ
      const actividadDateStr = actividadActual.fecha.toISOString().split('T')[0]; // YYYY-MM-DD

      // Si la actividad es de un día anterior, cerrarla automáticamente a las 23:59:59 de ese día
      if (actividadDateStr < todayStr) {
        // Calcular 23:59:59 del día de la actividad
        const endOfDay = new Date(actividadActual.fecha);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const duracionSeg = actividadActual.horaInicio
          ? Math.max(0, Math.floor((endOfDay - actividadActual.horaInicio) / 1000))
          : null;

        // Cerrar la actividad
        await prisma.registroActividad.updateMany({
          where: { id: actividadActual.id, horaFin: null },
          data: { 
            horaFin: endOfDay, 
            duracionSeg, 
            estado: 'Finalizado',
            observaciones: actividadActual.observaciones 
              ? `${actividadActual.observaciones} [Cerrado automáticamente al fin del día]`
              : '[Cerrado automáticamente al fin del día]'
          }
        });

        console.log(`⏰ Actividad del día anterior cerrada automáticamente: Usuario ${usuarioId} - ID ${actividadActual.id}`);

        // No devolver actividad (ya que está cerrada)
        return res.json({
          success: true,
          data: null
        });
      }
    }

    res.json({
      success: true,
      data: actividadActual
    });

  } catch (error) {
    console.error('❌ Error en getCurrentActivity:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener actividad actual'
    });
  }
};

// =====================================================
// GET TODAY SUMMARY - Resumen del día
// =====================================================
export const getTodaySummary = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Determinar fecha en APP_TZ o la provista en query (YYYY-MM-DD)
    let dateStr = req.query?.date;
    if (!dateStr) {
      dateStr = getDateStrInTZ();
    } else {
      // Validar formato si viene del query
      dateStr = validateDateStr(dateStr, 'date');
    }

    // Cache key
    const cacheKey = `${usuarioId}:${dateStr}`;
    const nowTs = Date.now();
    const cached = summaryCache.get(cacheKey);
    if (cached && (nowTs - cached.ts) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Agrupa por actividad y suma duraciones (incluyendo actividades en curso)
    const resumen = await prisma.$queryRaw`
      SELECT 
        a.nombre_actividad as "nombreActividad",
        SUM(
          CASE 
            WHEN r.hora_fin IS NULL THEN 
              EXTRACT(EPOCH FROM (NOW() - r.hora_inicio))::integer
            ELSE 
              COALESCE(r.duracion_seg, 0)
          END
        )::integer as "duracionSeg"
      FROM registro_actividades r
      JOIN actividades a ON r.actividad_id = a.id
      WHERE r.usuario_id = ${usuarioId}
        AND r.fecha = ${dateStr}::date
      GROUP BY a.id, a.nombre_actividad
      ORDER BY "duracionSeg" DESC
    `;

    // Guardar en caché
    summaryCache.set(cacheKey, { ts: nowTs, data: resumen });

    res.json({ success: true, data: resumen });

  } catch (error) {
    console.error('❌ Error en getTodaySummary:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen'
    });
  }
};

// =====================================================
// GET TODAY LOG - Log detallado del día
// =====================================================
export const getTodayLog = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // Determinar fecha en APP_TZ o la provista en query (YYYY-MM-DD)
    let dateStr = req.query?.date;
    if (!dateStr) {
      dateStr = getDateStrInTZ();
    } else {
      // Validar formato si viene del query
      dateStr = validateDateStr(dateStr, 'date');
    }

    // Cache key
    const cacheKey = `${usuarioId}:${dateStr}`;
    const nowTs = Date.now();
    const cached = logCache.get(cacheKey);
    if (cached && (nowTs - cached.ts) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const registros = await prisma.$queryRaw`
      SELECT 
        r.id,
        r.hora_inicio as "horaInicio",
        r.hora_fin as "horaFin",
        r.duracion_seg as "duracionSeg",
        r.observaciones,
        r.estado,
        a.nombre_actividad as "nombreActividad",
        s.nombre_subactividad as "nombreSubactividad"
      FROM registro_actividades r
      JOIN actividades a ON r.actividad_id = a.id
      LEFT JOIN subactividades s ON r.subactividad_id = s.id
      WHERE r.usuario_id = ${usuarioId}
        AND r.fecha = ${dateStr}::date
      ORDER BY r.hora_inicio DESC
    `;

    // Guardar en caché
    logCache.set(cacheKey, { ts: nowTs, data: registros });

    res.json({ success: true, data: registros });

  } catch (error) {
    console.error('❌ Error en getTodayLog:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener log del día'
    });
  }
};