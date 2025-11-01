/**
 * Utilidades para manejo de fechas locales (sin problemas de zona horaria)
 */

/**
 * Convierte una fecha a formato YYYY-MM-DD en zona horaria local
 * @param {Date} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (zona local)
 * @returns {string} Fecha de hoy
 */
export function getTodayLocal() {
  return toLocalDateString(new Date());
}

/**
 * Obtiene la fecha de hace N días en formato YYYY-MM-DD (zona local)
 * @param {number} days - Número de días hacia atrás
 * @returns {string} Fecha calculada
 */
export function getDaysAgoLocal(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toLocalDateString(date);
}

/**
 * Parsea una fecha en formato YYYY-MM-DD a objeto Date (medianoche local)
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha ISO a formato local legible
 * @param {string} isoString - Fecha en formato ISO
 * @param {boolean} includeTime - Si se incluye la hora
 * @returns {string} Fecha formateada
 */
export function formatLocalDateTime(isoString, includeTime = true) {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  const dateStr = toLocalDateString(date);
  
  if (!includeTime) return dateStr;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convierte fecha DD/MM/YYYY a YYYY-MM-DD
 * @param {string} dateString - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function convertDDMMYYYYtoISO(dateString) {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Convierte fecha YYYY-MM-DD a DD/MM/YYYY
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
export function convertISOtoDDMMYYYY(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}
