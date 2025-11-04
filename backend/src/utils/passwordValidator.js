// =====================================================
// src/utils/passwordValidator.js
// Validación de seguridad de contraseñas
// =====================================================

/**
 * Valida la complejidad de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      valid: false,
      error: 'La contraseña es requerida'
    };
  }

  // Longitud mínima
  const MIN_LENGTH = 8;
  if (password.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`
    };
  }

  // Verificar mayúsculas
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'La contraseña debe contener al menos una letra mayúscula'
    };
  }

  // Verificar minúsculas
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'La contraseña debe contener al menos una letra minúscula'
    };
  }

  // Verificar números
  if (!/\d/.test(password)) {
    return {
      valid: false,
      error: 'La contraseña debe contener al menos un número'
    };
  }

  // Verificar caracteres especiales (opcional pero recomendado)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      error: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)'
    };
  }

  // Verificar que no sea muy común
  const COMMON_PASSWORDS = [
    'password', 'Password123!', '12345678', 'qwerty123',
    'admin123', 'Admin123!', 'usuario123', 'Usuario123!'
  ];
  
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    return {
      valid: false,
      error: 'La contraseña es demasiado común. Por favor, elige una más segura'
    };
  }

  // Contraseña válida
  return {
    valid: true,
    error: null
  };
};

/**
 * Genera requisitos de contraseña en formato legible
 * @returns {string} - Descripción de requisitos
 */
export const getPasswordRequirements = () => {
  return 'La contraseña debe tener al menos 8 caracteres e incluir: mayúsculas, minúsculas, números y caracteres especiales.';
};
