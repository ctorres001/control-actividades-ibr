// =====================================================
// src/routes/auth.routes.js
// =====================================================

import express from 'express';
import { login, validateToken, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login - Iniciar sesión
router.post('/login', login);

// GET /api/auth/validate - Validar token
router.get('/validate', authenticate, validateToken);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticate, logout);

export default router;
