// =====================================================
// src/controllers/auth.controller.js
// =====================================================

import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import { generateToken } from '../utils/jwt.js';

// LOGIN - Iniciar sesión
export const login = async (req, res) => {
  try {
  // Normalize incoming fields: support spanish keys and common english aliases
    const nombreUsuario = req.body.nombreUsuario ?? req.body.username ?? req.body.user ?? req.body.email;
    const contraseña = req.body.contraseña ?? req.body.password ?? req.body.pass;
    // Minimal logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.info('👤 Intento de login para:', nombreUsuario);
    }

    // Validar que se enviaron los datos
    if (!nombreUsuario || !contraseña) {
      console.log('❌ Login fallido: Datos incompletos');
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    if (process.env.NODE_ENV === 'development') console.debug('🔍 Buscando usuario en la base de datos...');
    
    // Buscar usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { nombreUsuario },
      include: {
        rol: true,
        campaña: true
      }
    });
    
    if (process.env.NODE_ENV === 'development') console.debug('📊 Resultado de búsqueda:', usuario ? 'Usuario encontrado' : 'Usuario no encontrado');

    // Verificar que el usuario existe
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar que el usuario está activo
    if (!usuario.estado) {
      return res.status(403).json({
        success: false,
        error: 'Usuario inactivo. Contacta al administrador.'
      });
    }

    // Verificar contraseña con bcrypt
    const validPassword = await bcrypt.compare(contraseña, usuario.contraseña);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Normalize role to a small, predictable token/response field for frontend routing.
    const normalizeRole = (r) => {
      if (!r) return null;
      const s = String(r).toLowerCase();
      if (s.includes('admin')) return 'admin';
      if (s.includes('super')) return 'supervisor';
      if (s.includes('ases') || s.includes('aser') || s.includes('agent')) return 'asesor';
      // fallback: remove accents and whitespace
      try {
        return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '_');
      } catch (_) {
        return s.replace(/\s+/g, '_');
      }
    };

    const roleNormalized = normalizeRole(usuario.rol?.nombre || null);

    // Generar token JWT (incluye rol original y rol normalizada)
    const token = generateToken({
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol?.nombre || null,
      role: roleNormalized,
      campañaId: usuario.campañaId || null
    });

    // Responder con token y datos del usuario (incluye campo `role` normalizado)
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol?.nombre || null,
        role: roleNormalized,
        campaña: usuario.campaña?.nombre || null,
        campañaId: usuario.campañaId || null
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    // Log stack for debugging
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Error en el servidor',
      // expone message solo en development
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// VALIDATE - Validar token actual
export const validateToken = async (req, res) => {
  try {
    // El middleware auth ya validó el token y agregó req.user
    res.json({
      success: true,
      valid: true,
      usuario: req.user
    });
  } catch (error) {
    console.error('❌ Error en validateToken:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar token'
    });
  }
};

// LOGOUT - Cerrar sesión
export const logout = async (req, res) => {
  try {
    // En JWT stateless, el logout se maneja en el cliente
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión'
    });
  }
};
