// =====================================================
// src/utils/jwt.js - Utilidades para JSON Web Tokens
// =====================================================

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Validar JWT_SECRET al inicializar el módulo
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET no está configurado en las variables de entorno');
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  console.error('❌ CRITICAL: JWT_SECRET debe tener al menos 32 caracteres');
  process.exit(1);
}

// Generar token
export const generateToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'control-actividades-api'
      }
    );
    return token;
  } catch (error) {
    console.error('❌ Error generando token:', error);
    throw new Error('Error al generar token de autenticación');
  }
};

// Verificar token
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
};

// Decodificar token (sin verificar)
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Error decodificando token:', error);
    return null;
  }
};
