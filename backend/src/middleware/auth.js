// =====================================================
// src/middleware/auth.js - Middleware de autenticación
// =====================================================

import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

// Middleware para verificar JWT
export const authenticate = async (req, res, next) => {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    // Remover "Bearer " del token
    const token = authHeader.substring(7);

    // Verificar y decodificar token
    const decoded = verifyToken(token);

    // Buscar usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: {
        rol: true,
        campaña: true
      }
    });

    // Validar que el usuario existe y está activo
    if (!usuario || !usuario.estado) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autorizado'
      });
    }

    // Agregar datos del usuario al request
    req.user = {
      id: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol.nombre,
      campañaId: usuario.campañaId ?? null,
      campañaNombre: usuario.campaña?.nombre ?? null
    };

    // Continuar con la siguiente función
    next();

  } catch (error) {
    console.error('❌ Error en autenticación:', error);

    if (error.message === 'Token expirado') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    if (error.message === 'Token inválido') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error en autenticación'
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción'
        // No exponer requiredRoles ni userRole en producción
      });
    }

    next();
  };
};
