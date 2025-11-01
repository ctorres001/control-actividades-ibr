// =====================================================
// src/controllers/activity.controller.js
// Controlador de actividades
// =====================================================

import { prisma } from '../utils/prisma.js';

// Cachés en memoria con TTL corto para aliviar carga bajo alto polling
const summaryCache = new Map(); // key: `${usuarioId}:${dateStr}` -> { ts, data }
const logCache = new Map();     // key: `${usuarioId}:${dateStr}` -> { ts, data }
const CACHE_TTL_MS = parseInt(process.env.SUMMARY_LOG_CACHE_TTL_MS || '2000', 10); // 2s por defecto

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

    const subactividades = await prisma.subactividad.findMany({
      where: {
        actividadId: parseInt(activityId)
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
    const { actividadId, subactividadId, observaciones } = req.body;
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
      const horaFin = new Date();
      const duracionSeg = registroAbierto.horaInicio
        ? Math.max(0, Math.floor((horaFin - registroAbierto.horaInicio) / 1000))
        : null;

      // Actualizar sólo si sigue abierto (condición en DB) para evitar condiciones de carrera
      await prisma.registroActividad.updateMany({
        where: { id: registroAbierto.id, horaFin: null },
        data: { horaFin, duracionSeg, estado: 'Finalizado' }
      });
    }

    // Crear nuevo registro
    // Obtener fecha local (sin componente de hora para evitar problemas de zona horaria)
    const now = new Date();
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const nuevoRegistro = await prisma.registroActividad.create({
      data: {
        usuarioId,
        actividadId,
        subactividadId: subactividadId || null,
        observaciones: observaciones || null,
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

    // Determinar fecha local o la provista en query (YYYY-MM-DD)
    let dateStr = req.query?.date;
    if (!dateStr) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      dateStr = `${now.getFullYear()}-${mm}-${dd}`;
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

    // Determinar fecha local o la provista en query (YYYY-MM-DD)
    let dateStr = req.query?.date;
    if (!dateStr) {
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      dateStr = `${now.getFullYear()}-${mm}-${dd}`;
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