// =====================================================
// src/routes/activity.routes.js
// =====================================================

import express from 'express';
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

// GET /api/activities/active - Listar actividades activas
router.get('/active', getActiveActivities);

// GET /api/activities/:activityId/subactivities - Subactividades
router.get('/:activityId/subactivities', getSubactivities);

// POST /api/activities/start - Iniciar actividad
router.post('/start', startActivity);

// POST /api/activities/stop - Detener actividad actual
router.post('/stop', stopActivity);

// GET /api/activities/current - Obtener actividad en curso
router.get('/current', getCurrentActivity);

// GET /api/activities/today/summary - Resumen del día
router.get('/today/summary', getTodaySummary);

// GET /api/activities/today/log - Log detallado del día
router.get('/today/log', getTodayLog);

export default router;