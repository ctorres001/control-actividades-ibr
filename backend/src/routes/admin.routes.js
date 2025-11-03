import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';
import * as exportController from '../controllers/export.controller.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas de admin
router.use(authenticate);
router.use(requireRole('Administrador'));

// ===== RUTAS DE USUARIOS =====
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/password', adminController.changePassword);

// ===== RUTAS DE ACTIVIDADES =====
router.get('/activities', adminController.getActivities);
router.post('/activities', adminController.createActivity);
router.put('/activities/:id', adminController.updateActivity);
router.delete('/activities/:id', adminController.deleteActivity);
router.patch('/activities/:id/status', adminController.toggleActivityStatus);

// ===== RUTAS DE CAMPAÑAS =====
router.get('/campaigns', adminController.getCampaigns);
router.post('/campaigns', adminController.createCampaign);
router.put('/campaigns/:id', adminController.updateCampaign);
router.delete('/campaigns/:id', adminController.deleteCampaign);

// ===== RUTAS DE SUBACTIVIDADES =====
router.get('/subactivities', adminController.getSubactivities);
router.post('/subactivities', adminController.createSubactivity);
router.put('/subactivities/:id', adminController.updateSubactivity);
router.delete('/subactivities/:id', adminController.deleteSubactivity);
router.patch('/subactivities/:id/status', adminController.toggleSubactivityStatus);

// ===== RUTAS DE ROLES (ADMIN MGMT) =====
router.get('/roles', adminController.getRolesAdmin);
router.post('/roles', adminController.createRole);
router.put('/roles/:id', adminController.updateRole);
router.delete('/roles/:id', adminController.deleteRole);

// ===== RUTAS DE ASIGNACIÓN CAMPAÑAS A SUPERVISORES =====
router.get('/supervisors/:id/campaigns', adminController.getSupervisorCampaigns);
router.put('/supervisors/:id/campaigns', adminController.setSupervisorCampaigns);

// ===== RUTAS DE MANTENIMIENTO (ADMIN) =====
// Vista previa:  POST /api/admin/maintenance/fix-fecha
// Aplicar:       POST /api/admin/maintenance/fix-fecha?apply=true
// Si existe env ADMIN_FIX_KEY, enviar header: X-Admin-Fix-Key: <valor>
router.post('/maintenance/fix-fecha', adminController.fixDailyDateFromStart);

// ===== RUTAS DE HORARIOS LABORALES =====
router.get('/horarios/:usuarioId', adminController.getHorariosUsuario);
router.put('/horarios/:usuarioId', adminController.upsertHorariosUsuario);
router.delete('/horarios/:usuarioId/:diaSemana', adminController.deleteHorarioUsuario);

// ===== RUTAS DE EXPORTACIÓN =====
router.get('/export/actividades-detalle', exportController.exportActividadesDetalle);

export default router;
