// =====================================================
// src/services/mockAuthService.js - Servicio mock para desarrollo
// =====================================================

// Simulación de base de datos de usuarios
const users = {
  'asesor1': { 
    password: 'Asesor@2024', 
    role: 'asesor',
    nombreCompleto: 'Asesor Demo',
    email: 'asesor@demo.com'
  },
  'super1': { 
    password: 'Super1@2024', 
    role: 'supervisor',
    nombreCompleto: 'Supervisor Demo',
    email: 'supervisor@demo.com'
  },
  'admin': { 
    password: 'Admin123@4', 
    role: 'admin',
    nombreCompleto: 'Administrador',
    email: 'admin@demo.com'
  }
};

// Simular delay de red
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  // Login simulado
  async login(credentials) {
    await delay(1000); // Simular delay de red

    const { username, password } = credentials;
    const user = users[username];

    if (user && user.password === password) {
      // Simular token
      const token = btoa(JSON.stringify({ username, role: user.role }));
      const userData = {
        username,
        role: user.role,
        nombreCompleto: user.nombreCompleto,
        email: user.email
      };

      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return {
        success: true,
        usuario: userData,
        token
      };
    } else {
      throw new Error('Credenciales incorrectas');
    }
  },

  // Validar token (simulado)
  async validateToken() {
    await delay(500);

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const tokenData = JSON.parse(atob(token));
        const userData = JSON.parse(user);

        // Verificar que el usuario aún existe
        if (users[tokenData.username]) {
          return userData;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Si no es válido, limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Token inválido');
  },

  // Logout
  async logout() {
    await delay(300);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};