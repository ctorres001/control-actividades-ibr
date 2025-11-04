// =====================================================
// src/services/authService.js - Servicio de autenticación
// =====================================================

import api from './api';

export const authService = {
  // Login de usuario
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    
    // Guardar token y usuario en sessionStorage (se borra al cerrar navegador)
    if (data.success && data.token) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.usuario));
    }
    
    return data;
  },

  // Validar token actual
  async validateToken() {
    const { data } = await api.get('/auth/validate');
    return data.usuario;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  },

  // Obtener usuario actual del sessionStorage
  getCurrentUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar si hay sesión activa
  isAuthenticated() {
    return !!sessionStorage.getItem('token');
  }
};