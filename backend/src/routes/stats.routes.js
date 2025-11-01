import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getStats,
  getUsers,
  getCampaigns,
  getRoles,
  getSupervisors,
  getActiveAsesores
} from '../controllers/stats.controller.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Rutas de estadísticas
router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/campaigns', getCampaigns);
router.get('/roles', getRoles);
router.get('/supervisors', getSupervisors);
router.get('/asesores-activos', getActiveAsesores);

export default router;
