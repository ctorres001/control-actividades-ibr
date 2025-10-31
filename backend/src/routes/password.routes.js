// =====================================================
// src/routes/password.routes.js
// Rutas para reset de contraseña
// =====================================================

import express from 'express';
import {
  forgotPassword,
  resetPassword,
  validateResetToken,
  changePassword
} from '../controllers/password.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/password/forgot - Solicitar reset de contraseña
router.post('/forgot', forgotPassword);

// POST /api/password/reset - Restablecer contraseña con token
router.post('/reset', resetPassword);

// GET /api/password/validate-token - Validar si un token es válido
router.get('/validate-token', validateResetToken);

// POST /api/password/change - Cambiar contraseña (requiere autenticación)
router.post('/change', authenticate, changePassword);

export default router;
