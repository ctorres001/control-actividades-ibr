// =====================================================
// src/controllers/export.controller.js
// Controlador para exportación de reportes detallados
// =====================================================

import { prisma } from '../utils/prisma.js';

// ===== EXPORTAR DETALLE DE ACTIVIDADES =====
export const exportActividadesDetalle = async (req, res) => {
  try {
    // Solo administradores pueden exportar
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { usuarioId, campañaId, fechaInicio, fechaFin, formato } = req.query;

    // Construir filtros
    const where = {};
    if (usuarioId) where.usuarioId = parseInt(usuarioId);
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio);
      if (fechaFin) where.fecha.lte = new Date(fechaFin);
    }

    // Si se filtra por campaña, necesitamos hacer join con usuarios
    let registros;
    if (campañaId) {
      registros = await prisma.registroActividad.findMany({
        where: {
          ...where,
          usuario: {
            campañaId: parseInt(campañaId)
          }
        },
        include: {
          usuario: {
            select: {
              nombreUsuario: true,
              nombreCompleto: true,
              campaña: { select: { nombre: true } },
              rol: { select: { nombre: true } }
            }
          },
          actividad: {
            select: {
              nombreActividad: true
            }
          },
          subactividad: {
            select: {
              nombreSubactividad: true
            }
          }
        },
        orderBy: [
          { fecha: 'desc' },
          { horaInicio: 'desc' }
        ]
      });
    } else {
      registros = await prisma.registroActividad.findMany({
        where,
        include: {
          usuario: {
            select: {
              nombreUsuario: true,
              nombreCompleto: true,
              campaña: { select: { nombre: true } },
              rol: { select: { nombre: true } }
            }
          },
          actividad: {
            select: {
              nombreActividad: true
            }
          },
          subactividad: {
            select: {
              nombreSubactividad: true
            }
          }
        },
        orderBy: [
          { fecha: 'desc' },
          { horaInicio: 'desc' }
        ]
      });
    }

    // Formato CSV para Excel
    if (formato === 'csv' || !formato) {
      const csvHeader = [
        'ID Registro',
        'Fecha',
        'Usuario',
        'Nombre Completo',
        'Rol',
        'Campaña',
        'Actividad',
        'Subactividad',
        'Hora Inicio',
        'Hora Fin',
        'Duración (seg)',
        'Duración (HH:MM:SS)',
        'Estado',
        'Observaciones'
      ].join(',');

      const csvRows = registros.map(r => {
        const duracionHMS = r.duracionSeg 
          ? new Date(r.duracionSeg * 1000).toISOString().substr(11, 8)
          : '';
        
        return [
          r.id,
          r.fecha?.toISOString().split('T')[0] || '',
          r.usuario.nombreUsuario,
          `"${r.usuario.nombreCompleto}"`,
          r.usuario.rol?.nombre || '',
          r.usuario.campaña?.nombre || '',
          `"${r.actividad.nombreActividad}"`,
          r.subactividad ? `"${r.subactividad.nombreSubactividad}"` : '',
          r.horaInicio?.toISOString() || '',
          r.horaFin?.toISOString() || '',
          r.duracionSeg || '',
          duracionHMS,
          r.estado || '',
          r.observaciones ? `"${r.observaciones.replace(/"/g, '""')}"` : ''
        ].join(',');
      });

      const csv = [csvHeader, ...csvRows].join('\n');

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="actividades_detalle_${new Date().toISOString().split('T')[0]}.csv"`);
      
      // BOM para Excel UTF-8
      res.write('\uFEFF');
      res.end(csv);
    } else {
      // Formato JSON
      res.json({
        success: true,
        count: registros.length,
        data: registros
      });
    }

  } catch (error) {
    console.error('Error al exportar actividades:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar actividades',
      details: error.message
    });
  }
};
