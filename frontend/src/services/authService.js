// =====================================================
// src/services/authService.js - Servicio de autenticación
// =====================================================

import api from './api';

export const authService = {
  // Login de usuario
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials);
    
    // Guardar token y usuario en localStorage
    if (data.success && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.usuario));
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Obtener usuario actual del localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar si hay sesión activa
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};