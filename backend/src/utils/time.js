// =====================================================
// src/utils/time.js - Utilidades de fecha con zona horaria fija
// =====================================================

// Zona horaria de la app (configurable por env); por defecto Lima/Bogotá (UTC-5 sin DST)
export const APP_TZ = process.env.APP_TZ || 'America/Lima';

// Devuelve la fecha como string YYYY-MM-DD en la zona horaria APP_TZ
export function getDateStrInTZ(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA produce formato ISO corto: YYYY-MM-DD
  return fmt.format(date);
}

// Convierte YYYY-MM-DD a un objeto Date en UTC (00:00:00Z)
// Útil para almacenar en columnas DATE (la parte de hora se ignora al persistir)
export function dateStrToUtcDate(dateStr) {
  // Se crea en UTC para evitar desplazamientos por TZ del servidor
  return new Date(`${dateStr}T00:00:00Z`);
}
