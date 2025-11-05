// =====================================================
// src/routes/activity.routes.js
// =====================================================

import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import {
  getActiveActivities,
  getSubactivities,
  startActivity,
  stopActivity,
  getCurrentActivity,
  getTodaySummary,
  getTodayLog
} from '../controllers/activity.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rate limit por usuario para proteger start/stop de abuso (configurable por env)
const ACTIVITY_RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_ACTIVITY_WINDOW_MS || `${60 * 1000}`, 10);
const ACTIVITY_RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_ACTIVITY_MAX || '20', 10);

const perUserLimiter = rateLimit({
  windowMs: ACTIVITY_RATE_LIMIT_WINDOW_MS, // por defecto 1 minuto
  max: ACTIVITY_RATE_LIMIT_MAX,            // por defecto 20 req/min por usuario
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (req.user?.id) return `u:${req.user.id}`;
    // Usa helper oficial para IPs (IPv4/IPv6 seguro)
    return ipKeyGenerator(req, res);
  }
});

// GET /api/activities/active - Listar actividades activas
router.get('/active', getActiveActivities);

// GET /api/activities/:activityId/subactivities - Subactividades
router.get('/:activityId/subactivities', getSubactivities);

// POST /api/activities/start - Iniciar actividad
router.post('/start', perUserLimiter, startActivity);

// POST /api/activities/stop - Detener actividad actual
router.post('/stop', perUserLimiter, stopActivity);

// GET /api/activities/current - Obtener actividad en curso
router.get('/current', getCurrentActivity);

// GET /api/activities/today/summary - Resumen del día
router.get('/today/summary', getTodaySummary);

// GET /api/activities/today/log - Log detallado del día
router.get('/today/log', getTodayLog);

export default router;
