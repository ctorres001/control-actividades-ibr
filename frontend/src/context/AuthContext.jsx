// =====================================================
// src/context/AuthContext.jsx - Context de autenticación
// =====================================================

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validar token al cargar la app
  useEffect(() => {
    const validateSession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.validateToken();
          setUser(userData);
        } catch (error) {
          console.error('Error validando sesión:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  // Registrar handler para 401 del cliente API
  const navigate = useNavigate();
  useEffect(() => {
    setLogoutHandler(() => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      } catch {
        // fallback: recargar
        window.location.href = '/login';
      }
    });

    return () => setLogoutHandler(null);
  }, [navigate]);

  // Login
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        setUser(response.usuario);
        return response;
      } else {
        throw new Error(response.message || 'Error en el servidor');
      }
    } catch (error) {
      console.error('Error en login:', error);
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response) {
        // Error de la API
        errorMessage = error.response.data?.error || error.response.data?.message || 'Error del servidor';
      } else if (error.request) {
        // Error de red
        errorMessage = 'No se pudo conectar con el servidor';
      } else {
        // Otro error
        errorMessage = error.message || 'Error desconocido';
      }
      
      toast.error(errorMessage, { id: 'auth-error' });
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Sesión cerrada correctamente', { id: 'logout-success' });
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};