/**
 * Utilidades para cálculos de tiempo trabajado
 * 
 * Reglas:
 * - Tiempo NO laborado: Ingreso, Salida, Break Salida, Break Regreso
 * - Tiempo laborado: Todas las demás actividades
 * - Porcentaje neto = (Tiempo laborado / Tiempo total entre ingreso y salida) * 100
 */

/**
 * Convierte duración en segundos a formato legible
 * @param {number} seconds - Duración en segundos
 * @returns {string} Formato "Xh Ym" o "Ym" o "Xs"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0 && secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

/**
 * Convierte duración a horas decimales
 * @param {number} seconds - Duración en segundos
 * @returns {number} Horas en decimal (ej: 1.5 = 1h 30m)
 */
export function secondsToHours(seconds) {
  return seconds / 3600;
}

/**
 * Actividades que NO cuentan como tiempo laborado
 */
const NON_WORK_ACTIVITIES = [
  'Ingreso',
  'Salida',
  'Break Salida',
  'Break Regreso'
];

/**
 * Determina si una actividad cuenta como tiempo laborado
 * @param {string} activityName - Nombre de la actividad
 * @returns {boolean}
 */
export function isWorkActivity(activityName) {
  return !NON_WORK_ACTIVITIES.includes(activityName);
}

/**
 * Calcula estadísticas de tiempo trabajado para un conjunto de registros
 * @param {Array} registros - Array de registros de actividad con fechaInicio, fechaFin, nombreActividad
 * @returns {Object} Estadísticas calculadas
 */
export function calculateWorkStats(registros) {
  if (!registros || registros.length === 0) {
    return {
      totalTime: 0,
      workTime: 0,
      nonWorkTime: 0,
      workPercentage: 0,
      activities: [],
      firstEntry: null,
      lastExit: null,
      totalHours: 0,
      workHours: 0
    };
  }

  // Ordenar registros por fecha
  const sorted = [...registros].sort((a, b) => 
    new Date(a.fechaInicio) - new Date(b.fechaInicio)
  );

  const firstEntry = sorted.find(r => r.nombreActividad === 'Ingreso');
  const lastExit = [...sorted].reverse().find(r => r.nombreActividad === 'Salida');

  let totalTime = 0;
  let workTime = 0;
  let nonWorkTime = 0;
  const activityStats = {};

  // Calcular tiempo por actividad
  for (const registro of sorted) {
    const start = new Date(registro.fechaInicio);
    const end = registro.fechaFin ? new Date(registro.fechaFin) : new Date();
    const duration = (end - start) / 1000; // en segundos

    const activityName = registro.nombreActividad || 'Sin nombre';
    const isWork = isWorkActivity(activityName);

    // Acumular por actividad
    if (!activityStats[activityName]) {
      activityStats[activityName] = {
        name: activityName,
        duration: 0,
        count: 0,
        isWork
      };
    }
    activityStats[activityName].duration += duration;
    activityStats[activityName].count += 1;

    // Acumular totales
    if (isWork) {
      workTime += duration;
    } else {
      nonWorkTime += duration;
    }
  }

  // Calcular tiempo total (de ingreso a salida)
  if (firstEntry && lastExit) {
    const entryTime = new Date(firstEntry.fechaInicio);
    const exitTime = lastExit.fechaFin 
      ? new Date(lastExit.fechaFin) 
      : new Date();
    totalTime = (exitTime - entryTime) / 1000;
  } else {
    totalTime = workTime + nonWorkTime;
  }

  const workPercentage = totalTime > 0 ? (workTime / totalTime) * 100 : 0;

  return {
    totalTime,
    workTime,
    nonWorkTime,
    workPercentage: Math.round(workPercentage * 100) / 100,
    activities: Object.values(activityStats).sort((a, b) => b.duration - a.duration),
    firstEntry: firstEntry?.fechaInicio || null,
    lastExit: lastExit?.fechaFin || null,
    totalHours: secondsToHours(totalTime),
    workHours: secondsToHours(workTime)
  };
}

/**
 * Agrupa registros por día
 * @param {Array} registros - Array de registros
 * @returns {Object} Objeto con fecha como key y registros como value
 */
export function groupByDate(registros) {
  const grouped = {};
  
  for (const registro of registros) {
    const date = new Date(registro.fechaInicio).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(registro);
  }
  
  return grouped;
}

/**
 * Agrupa registros por usuario
 * @param {Array} registros - Array de registros
 * @returns {Object} Objeto con userId como key y registros como value
 */
export function groupByUser(registros) {
  const grouped = {};
  
  for (const registro of registros) {
    const userId = registro.usuarioId;
    if (!grouped[userId]) {
      grouped[userId] = {
        user: registro.usuario || { nombreCompleto: 'Desconocido' },
        registros: []
      };
    }
    grouped[userId].registros.push(registro);
  }
  
  return grouped;
}

/**
 * Agrupa registros por campaña
 * @param {Array} registros - Array de registros
 * @returns {Object} Objeto con campaignId como key y registros como value
 */
export function groupByCampaign(registros) {
  const grouped = {};
  
  for (const registro of registros) {
    const campaignId = registro.usuario?.campañaId || 'sin-campaña';
    const campaignName = registro.usuario?.campaña?.nombre || 'Sin campaña';
    
    if (!grouped[campaignId]) {
      grouped[campaignId] = {
        name: campaignName,
        registros: []
      };
    }
    grouped[campaignId].registros.push(registro);
  }
  
  return grouped;
}

/**
 * Calcula promedio de una métrica
 * @param {Array} values - Array de valores numéricos
 * @returns {number} Promedio
 */
export function average(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Formatea fecha para display
 * @param {string|Date} date - Fecha
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Formatea hora para display
 * @param {string|Date} date - Fecha/hora
 * @returns {string} Hora formateada
 */
export function formatTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
