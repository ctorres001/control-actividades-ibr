// =====================================================
// src/services/api.js - Cliente Axios configurado
// =====================================================

import axios from 'axios';
import toast from 'react-hot-toast';

// Usar URL directa del backend en desarrollo (sin proxy)
// Para producción, usa la variable de entorno
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '/api')
  : 'http://localhost:3001/api';

console.log('🚀 Configuración API:', {
  baseURL: API_BASE_URL,
  modo: import.meta.env.PROD ? 'producción' : 'desarrollo',
  usandoProxy: !import.meta.env.PROD
});

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Logout handler que puede ser registrado por el AuthProvider
let logoutHandler = null;
export function setLogoutHandler(fn) {
  logoutHandler = typeof fn === 'function' ? fn : null;
}

// =====================================================
// INTERCEPTOR DE REQUEST - Agregar token automáticamente
// =====================================================
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log para debug (puedes removerlo después)
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// INTERCEPTOR DE RESPONSE - Manejo de errores global
// =====================================================
api.interceptors.response.use(
  (response) => {
    // Log para debug (puedes removerlo después)
    console.log('📥 Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ Error API:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    const config = error.config || {};
    // Reintento automático para errores de red hasta 2 veces
    const isNetworkError = error.code === 'ECONNABORTED' || error.message === 'Network Error';
    if (isNetworkError) {
      config.__retryCount = config.__retryCount || 0;
      const maxRetries = 2;
      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        // backoff exponencial simple
        const delay = 250 * Math.pow(2, config.__retryCount - 1);
        await new Promise((res) => setTimeout(res, delay));
        return api(config);
      }
    }
    
    // Token expirado o inválido
    if (error.response?.status === 401) {
      // Solo mostrar "sesión expirada" si había un token previamente
      const hadToken = !!sessionStorage.getItem('token');
      
      // Limpiar almacenamiento local
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Usar logout handler registrado por la UI (evita recargar la app)
      if (logoutHandler) {
        try {
          logoutHandler();
        } catch {
          window.location.href = '/login';
        }
      } else {
        // Solo redirigir si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Solo mostrar toast si realmente había una sesión activa
      if (hadToken) {
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
    }
    
    // Forbidden
    if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    }
    
    // Error del servidor
    if (error.response?.status >= 500) {
      toast.error('Error en el servidor. Intenta de nuevo más tarde.');
    }
    
    // Error de conexión (sin respuesta del servidor)
    if (isNetworkError) {
      toast.error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }
    
    return Promise.reject(error);
  }
);

export default api;