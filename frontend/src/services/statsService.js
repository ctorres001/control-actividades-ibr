import api from './api';
import * as XLSX from 'xlsx';
import {
  calculateWorkStats,
  groupByDate,
  groupByUser,
  groupByCampaign,
  formatDuration,
  formatDate,
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
    includeSummary = true
  } = options;

  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen por grupo
  if (includeSummary) {
    const stats = processStats(registros, groupBy);
    const summaryData = [];

    for (const [key, data] of Object.entries(stats)) {
      const { stats: s, user, name } = data;
      const label = user?.nombreCompleto || name || key;

      summaryData.push({
        [groupBy === 'user' ? 'Usuario' : groupBy === 'campaign' ? 'Campaña' : 'Fecha']: label,
        'Tiempo Total (h)': Number(s.totalHours.toFixed(2)),
        'Tiempo Trabajado (h)': Number(s.workHours.toFixed(2)),
        'Porcentaje Trabajado (%)': Number(s.workPercentage.toFixed(2)),
        'Primera Entrada': s.firstEntry ? formatTime(s.firstEntry) : '-',
        'Última Salida': s.lastExit ? formatTime(s.lastExit) : '-'
      });
    }

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Ajustar ancho de columnas
    summarySheet['!cols'] = [
      { wch: 25 }, // Nombre
      { wch: 15 }, // Tiempo Total
      { wch: 18 }, // Tiempo Trabajado
      { wch: 20 }, // Porcentaje
      { wch: 15 }, // Primera Entrada
      { wch: 15 }  // Última Salida
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  }

  // Hoja 2: Detalle por actividad
  if (includeDetails) {
    const detailData = [];

    for (const registro of registros) {
      const start = new Date(registro.fechaInicio);
      const end = registro.fechaFin ? new Date(registro.fechaFin) : new Date();
      const duration = (end - start) / 1000;

      detailData.push({
        'Fecha': formatDate(registro.fechaInicio),
        'Usuario': registro.usuario?.nombreCompleto || '-',
        'Campaña': registro.usuario?.campaña?.nombre || '-',
        'Actividad': registro.nombreActividad || '-',
        'Hora Inicio': formatTime(registro.fechaInicio),
        'Hora Fin': registro.fechaFin ? formatTime(registro.fechaFin) : 'En curso',
        'Duración': formatDuration(duration),
        'Es Trabajo': registro.nombreActividad && !['Ingreso', 'Salida', 'Break Salida', 'Break Regreso'].includes(registro.nombreActividad) ? 'Sí' : 'No'
      });
    }

    const detailSheet = XLSX.utils.json_to_sheet(detailData);
    
    // Ajustar ancho de columnas
    detailSheet['!cols'] = [
      { wch: 12 }, // Fecha
      { wch: 25 }, // Usuario
      { wch: 20 }, // Campaña
      { wch: 20 }, // Actividad
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 12 }, // Duración
      { wch: 10 }  // Es Trabajo
    ];
    
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle');
  }

  // Hoja 3: Tiempo por actividad
  const activityStats = {};
  for (const registro of registros) {
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
