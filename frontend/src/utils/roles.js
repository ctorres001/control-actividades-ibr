// =====================================================
// src/utils/roles.js - Utilidades para roles de usuario
// =====================================================

/**
 * Normaliza un rol a una de las tres categorías principales:
 * 'admin', 'supervisor', o 'asesor'.
 * 
 * @param {string|null} r - Rol a normalizar (puede ser null)
 * @returns {string|null} - Rol normalizado o null si no se puede normalizar
 */
export const normalizeRole = (r) => {
  if (!r) return null;
  const s = String(r).toLowerCase();
  
  // Categorías principales
  if (s.includes('admin')) return 'admin';
  if (s.includes('super')) return 'supervisor';
  if (s.includes('ases') || s.includes('aser') || s.includes('agent')) return 'asesor';
  
  // Fallback: limpiar acentos y espacios
  try {
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '_');
  } catch {
    // Si falla la normalización (navegadores antiguos), solo limpiar espacios
    return s.replace(/\s+/g, '_');
  }
};

/**
 * Verifica si un usuario tiene acceso a una ruta basada en roles.
 * 
 * @param {Object} user - Usuario actual
 * @param {string[]} allowedRoles - Array de roles permitidos
 * @returns {boolean} - true si tiene acceso, false si no
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !allowedRoles?.length) return false;
  
  // Usar role normalizado si existe, si no normalizar el rol original
  const userRole = user.role || normalizeRole(user.rol);
  return allowedRoles.includes(userRole);
};

/**
 * Obtiene la ruta base para un usuario según su rol.
 * 
 * @param {Object} user - Usuario actual
 * @returns {string} - Ruta base (/admin, /supervisor, /asesor o /)
 */
export const getBaseRouteForUser = (user) => {
  if (!user) return '/';
  
  const role = user.role || normalizeRole(user.rol);
  switch (role) {
    case 'admin': return '/admin';
    case 'supervisor': return '/supervisor';
    case 'asesor': return '/asesor';
    default: return '/';
  }
};