import api from './api';
import * as XLSX from 'xlsx';
import {
  calculateWorkStats,
  groupByDate,
  groupByUser,
  groupByCampaign,
  formatDuration,
  formatTime
} from '../utils/timeCalculations';

/**
 * Servicio para obtener y procesar estadísticas
 */

/**
 * Obtiene estadísticas de registros con filtros
 * @param {Object} filters - Filtros { fechaInicio, fechaFin, usuarioId, campañaId }
 * @returns {Promise<Array>} Registros filtrados
 */
export async function getStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.usuarioId) params.append('usuarioId', filters.usuarioId);
    if (filters.campañaId) params.append('campañaId', filters.campañaId);
    if (filters.rolId) params.append('rolId', filters.rolId);
    if (filters.supervisorId) params.append('supervisorId', filters.supervisorId);
    
    const response = await api.get(`/stats/stats?${params.toString()}`);
    // Mapear campos del backend a los usados en cálculos/export (fechaInicio/fechaFin)
    const mapped = (response.data || []).map((r) => ({
      ...r,
      // Normalizar nombres de campos
      fechaInicio: r.horaInicio,
      fechaFin: r.horaFin,
      nombreActividad: r.actividad?.nombreActividad || r.nombreActividad,
    }));
    return mapped;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}

/**
 * Procesa registros y calcula estadísticas agrupadas
 * @param {Array} registros - Registros de actividad
 * @param {string} groupBy - 'user' | 'date' | 'campaign'
 * @returns {Object} Estadísticas procesadas
 */
export function processStats(registros, groupBy = 'user') {
  let grouped;
  
  switch (groupBy) {
    case 'date':
      grouped = groupByDate(registros);
      break;
    case 'campaign':
      grouped = groupByCampaign(registros);
      break;
    case 'user':
    default:
      grouped = groupByUser(registros);
      break;
  }
  
  const stats = {};
  
  for (const [key, data] of Object.entries(grouped)) {
    const registrosGrupo = data.registros || data;
    stats[key] = {
      ...data,
      stats: calculateWorkStats(registrosGrupo)
    };
  }
  
  return stats;
}

/**
 * Exporta estadísticas a Excel
 * @param {Array} registros - Registros de actividad
 * @param {string} filename - Nombre del archivo
 * @param {Object} options - Opciones de exportación
 */
export function exportToExcel(registros, filename = 'estadisticas', options = {}) {
  const {
    groupBy = 'user',
    includeDetails = true,
    includeSummary = true,
    includeActivitySheet = true,
    excludeActivities = []
  } = options;

  // Filtrar actividades excluidas
  const filtered = Array.isArray(registros)
    ? registros.filter(r => !excludeActivities.includes(r.nombreActividad))
    : [];

  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen por grupo
  if (includeSummary) {
    const stats = processStats(filtered, groupBy);
    const summaryData = [];

    for (const [key, data] of Object.entries(stats)) {
      const { stats: s, user, name } = data;
      const label = user?.nombreCompleto || name || key;
      
      // Obtener horario laboral del usuario para el día correspondiente
      let horarioIngreso = '-';
      let horarioSalida = '-';
      
      if (s.firstEntry && user?.horariosLaborales) {
        const fecha = new Date(s.firstEntry);
        // JavaScript: 0=Domingo, 1=Lunes... convertir a formato DB (1=Lunes, 7=Domingo)
        const diaSemanaJS = fecha.getDay(); // 0-6
        const diaSemanaDB = diaSemanaJS === 0 ? 7 : diaSemanaJS; // 1-7
        
        const horarioDelDia = user.horariosLaborales.find(h => h.diaSemana === diaSemanaDB && h.activo);
        if (horarioDelDia) {
          horarioIngreso = horarioDelDia.horaInicio;
          horarioSalida = horarioDelDia.horaFin;
        }
      }
      
      // Obtener fecha de inicio (del primer registro)
      let fechaInicio = '-';
      if (s.firstEntry) {
        const fecha = new Date(s.firstEntry);
        fechaInicio = fecha; // Mantener como Date para formato Excel
      }

      summaryData.push({
        [groupBy === 'user' ? 'Usuario' : groupBy === 'campaign' ? 'Campaña' : 'Fecha']: label,
        'Fecha Inicio': fechaInicio,
        'Tiempo Total (h)': Number(s.totalHours.toFixed(2)),
        'Tiempo Trabajado (h)': Number(s.workHours.toFixed(2)),
        'Porcentaje Trabajado (%)': Number(s.workPercentage.toFixed(2)),
        'Primera Entrada': s.firstEntry ? formatTime(s.firstEntry) : '-',
        'Última Salida': s.lastExit ? formatTime(s.lastExit) : '-',
        'Horario Ingreso': horarioIngreso,
        'Horario Salida': horarioSalida
      });
    }

    const summarySheet = XLSX.utils.json_to_sheet(summaryData, { cellDates: true });
    
    // Aplicar formatos a las columnas
    const range = XLSX.utils.decode_range(summarySheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      // Columna B (Fecha Inicio) - formato de fecha
      const cellRefFecha = XLSX.utils.encode_cell({ r: R, c: 1 });
      if (summarySheet[cellRefFecha] && typeof summarySheet[cellRefFecha].v !== 'string') {
        summarySheet[cellRefFecha].z = 'dd/mm/yyyy';
      }
      
      // Columna F (Primera Entrada) ya es string formateado, no necesita cambio
      
      // Columna G (Última Salida) ya es string formateado, no necesita cambio
      
      // Columna H (Horario Ingreso) - formato HH:MM:SS si es time
      const cellRefHorarioIng = XLSX.utils.encode_cell({ r: R, c: 7 });
      if (summarySheet[cellRefHorarioIng] && summarySheet[cellRefHorarioIng].v !== '-') {
        // Convertir HH:MM a fracción de día para Excel
        const timeStr = summarySheet[cellRefHorarioIng].v;
        if (timeStr.match(/^\d{2}:\d{2}$/)) {
          const [hh, mm] = timeStr.split(':').map(Number);
          summarySheet[cellRefHorarioIng].v = (hh + mm/60) / 24; // Fracción de día
          summarySheet[cellRefHorarioIng].t = 'n'; // Tipo número
          summarySheet[cellRefHorarioIng].z = 'hh:mm:ss';
        }
      }
      
      // Columna I (Horario Salida) - formato HH:MM:SS
      const cellRefHorarioSal = XLSX.utils.encode_cell({ r: R, c: 8 });
      if (summarySheet[cellRefHorarioSal] && summarySheet[cellRefHorarioSal].v !== '-') {
        const timeStr = summarySheet[cellRefHorarioSal].v;
        if (timeStr.match(/^\d{2}:\d{2}$/)) {
          const [hh, mm] = timeStr.split(':').map(Number);
          summarySheet[cellRefHorarioSal].v = (hh + mm/60) / 24;
          summarySheet[cellRefHorarioSal].t = 'n';
          summarySheet[cellRefHorarioSal].z = 'hh:mm:ss';
        }
      }
    }
    
    // Ajustar ancho de columnas
    summarySheet['!cols'] = [
      { wch: 25 }, // Nombre/Usuario
      { wch: 12 }, // Fecha Inicio
      { wch: 15 }, // Tiempo Total
      { wch: 18 }, // Tiempo Trabajado
      { wch: 20 }, // Porcentaje
      { wch: 15 }, // Primera Entrada
      { wch: 15 }, // Última Salida
      { wch: 15 }, // Horario Ingreso
      { wch: 15 }  // Horario Salida
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  }

  // Hoja 2: Detalle por actividad
  if (includeDetails) {
    const detailData = [];

    for (const registro of filtered) {
      const start = new Date(registro.fechaInicio);
      const end = registro.fechaFin ? new Date(registro.fechaFin) : new Date();
      const duration = (end - start) / 1000;

      // Convertir duración a formato Excel (días decimales)
      const durationDays = duration / 86400; // Excel usa días como unidad base

      detailData.push({
        'Fecha': start, // Mantener como objeto Date para aplicar formato
        'Usuario': registro.usuario?.nombreCompleto || '-',
        'Campaña': registro.usuario?.campaña?.nombre || '-',
        'Actividad': registro.nombreActividad || '-',
        'Subactividad': registro.subactividad?.nombreSubactividad || '-',
        'ID Cliente/Referencia': registro.idClienteReferencia || '-',
        'Resumen Breve': registro.resumenBreve || '-',
        'Hora Inicio': start, // Mantener como Date
        'Hora Fin': registro.fechaFin ? end : 'En curso',
        'Duración': durationDays, // En días para Excel
        'Es Trabajo': registro.nombreActividad && !['Ingreso', 'Salida', 'Break Salida', 'Break Regreso'].includes(registro.nombreActividad) ? 'Sí' : 'No'
      });
    }

    const detailSheet = XLSX.utils.json_to_sheet(detailData, { cellDates: true });
    
    // Aplicar formatos a las columnas
    const range = XLSX.utils.decode_range(detailSheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      // Columna A (Fecha) - formato de fecha
      const cellRefFecha = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (detailSheet[cellRefFecha]) {
        detailSheet[cellRefFecha].z = 'dd/mm/yyyy';
      }

      // Columna E (Hora Inicio) - formato de hora (ahora columna H por las nuevas columnas)
      const cellRefInicio = XLSX.utils.encode_cell({ r: R, c: 7 });
      if (detailSheet[cellRefInicio] && typeof detailSheet[cellRefInicio].v !== 'string') {
        detailSheet[cellRefInicio].z = 'hh:mm:ss AM/PM';
      }

      // Columna F (Hora Fin) - formato de hora (ahora columna I)
      const cellRefFin = XLSX.utils.encode_cell({ r: R, c: 8 });
      if (detailSheet[cellRefFin] && typeof detailSheet[cellRefFin].v !== 'string') {
        detailSheet[cellRefFin].z = 'hh:mm:ss AM/PM';
      }

      // Columna G (Duración) - formato de tiempo HH:MM:SS (ahora columna J)
      const cellRefDur = XLSX.utils.encode_cell({ r: R, c: 9 });
      if (detailSheet[cellRefDur] && typeof detailSheet[cellRefDur].v === 'number') {
        detailSheet[cellRefDur].z = '[hh]:mm:ss'; // [hh] permite horas > 24
      }
    }
    
    // Ajustar ancho de columnas
    detailSheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 25 }, // Usuario
      { wch: 20 }, // Campaña
      { wch: 20 }, // Actividad
      { wch: 20 }, // Subactividad
      { wch: 20 }, // ID Cliente/Referencia
      { wch: 35 }, // Resumen Breve
      { wch: 15 }, // Hora Inicio
      { wch: 15 }, // Hora Fin
      { wch: 12 }, // Duración
      { wch: 10 }  // Es Trabajo
    ];
    
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle');
  }

  // Hoja 3: Tiempo por actividad (opcional)
  if (includeActivitySheet) {
    const activityStats = {};
    for (const registro of filtered) {
      const start = new Date(registro.fechaInicio);
      const end = registro.fechaFin ? new Date(registro.fechaFin) : new Date();
      const duration = (end - start) / 1000;
      const activity = registro.nombreActividad || 'Sin nombre';

      if (!activityStats[activity]) {
        activityStats[activity] = {
          count: 0,
          totalDuration: 0
        };
      }

      activityStats[activity].count += 1;
      activityStats[activity].totalDuration += duration;
    }

    const activityData = Object.entries(activityStats)
      .map(([activity, data]) => ({
        'Actividad': activity,
        'Veces Realizada': data.count,
        'Tiempo Total': formatDuration(data.totalDuration),
        'Tiempo Promedio': formatDuration(data.totalDuration / data.count),
        'Es Trabajo': !['Ingreso', 'Salida', 'Break Salida', 'Break Regreso'].includes(activity) ? 'Sí' : 'No'
      }))
      .sort((a, b) => b['Veces Realizada'] - a['Veces Realizada']);

    const activitySheet = XLSX.utils.json_to_sheet(activityData);
    activitySheet['!cols'] = [
      { wch: 20 }, // Actividad
      { wch: 15 }, // Veces Realizada
      { wch: 15 }, // Tiempo Total
      { wch: 15 }, // Tiempo Promedio
      { wch: 10 }  // Es Trabajo
    ];

    XLSX.utils.book_append_sheet(workbook, activitySheet, 'Por Actividad');
  }

  // Generar y descargar archivo
  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Obtiene lista de usuarios (para filtros)
 */
export async function getUsers() {
  try {
    const response = await api.get('/stats/users');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

/**
 * Obtiene lista de campañas (para filtros)
 */
export async function getCampaigns() {
  try {
    const response = await api.get('/stats/campaigns');
    return response.data;
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    return [];
  }
}

/**
 * Obtiene lista de roles (para filtros)
 */
export async function getRoles() {
  try {
    const response = await api.get('/stats/roles');
    return response.data;
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return [];
  }
}

/**
 * Obtiene lista de supervisores (para filtros - solo admin)
 */
export async function getSupervisors() {
  try {
    const response = await api.get('/stats/supervisors');
    return response.data;
  } catch (error) {
    console.error('Error al obtener supervisores:', error);
    return [];
  }
}

/**
 * Obtiene asesores activos por campaña con estadísticas del día
 */
export async function getActiveAsesores(filters = {}) {
  try {
    const response = await api.get('/stats/asesores-activos', { params: filters });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error al obtener asesores activos:', error);
    return [];
  }
}

export default {
  getStats,
  processStats,
  exportToExcel,
  getUsers,
  getCampaigns,
  getRoles,
  getSupervisors,
  getActiveAsesores
};
