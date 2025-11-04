// =====================================================
// src/utils/validation.js - Utilidades de validación
// =====================================================

/**
 * Parsea un ID de forma segura, lanzando error si no es válido
 * @param {any} value - Valor a parsear
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {number} ID parseado
 * @throws {Error} Si el ID no es válido
 */
export function parseIdSafe(value, fieldName = 'id') {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new Error(`${fieldName} inválido: debe ser un número entero positivo`);
  }
  return parsed;
}

/**
 * Valida formato de fecha YYYY-MM-DD
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @param {string} fieldName - Nombre del campo para mensajes de error
 * @returns {string} Fecha validada
 * @throws {Error} Si el formato o fecha no es válido
 */
export function validateDateStr(dateStr, fieldName = 'fecha') {
  if (!dateStr) {
    throw new Error(`${fieldName} es requerida`);
  }
  
  // Validar formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }
  
  // Validar que sea una fecha válida
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} no es una fecha válida`);
  }
  
  return dateStr;
}

/**
 * Valida rango de fechas
 * @param {string} fechaInicio - Fecha de inicio YYYY-MM-DD
 * @param {string} fechaFin - Fecha de fin YYYY-MM-DD
 * @param {number} maxDays - Máximo de días permitidos en el rango (default: 365)
 * @throws {Error} Si el rango no es válido
 */
export function validateDateRange(fechaInicio, fechaFin, maxDays = 365) {
  if (!fechaInicio || !fechaFin) {
    return; // Rango opcional
  }
  
  const inicio = new Date(fechaInicio + 'T00:00:00Z');
  const fin = new Date(fechaFin + 'T00:00:00Z');
  
  // Validar que fechaFin >= fechaInicio
  if (fin < inicio) {
    throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
  }
  
  // Validar rango máximo
  const diffDays = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    throw new Error(`El rango máximo permitido es de ${maxDays} días`);
  }
}

/**
 * Parsea valor numérico opcional de forma segura
 * @param {any} value - Valor a parsear
 * @param {string} fieldName - Nombre del campo
 * @returns {number|null} Número parseado o null
 * @throws {Error} Si el valor no es un número válido
 */
export function parseIntOptional(value, fieldName = 'valor') {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} debe ser un número entero válido`);
  }
  
  return parsed;
}
