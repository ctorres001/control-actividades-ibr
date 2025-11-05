import { prisma } from '../utils/prisma.js';
import { APP_TZ } from '../utils/time.js';
import bcrypt from 'bcrypt';
import { validatePassword, getPasswordRequirements } from '../utils/passwordValidator.js';
import { parseIdSafe, parseIntOptional } from '../utils/validation.js';

// Normaliza valores de estado provenientes del frontend (checkbox/string)
function toBooleanEstado(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return v === 'activo' || v === 'true' || v === '1' || v === 'on' || v === 'si' || v === 'sí';
  }
  return false;
}

// ===== USUARIOS =====

const getUsers = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { rolId, campañaId, estado } = req.query;

    // Construir filtros con validación
    const where = {};
    if (rolId) where.rolId = parseIntOptional(rolId, 'rolId');
    if (campañaId) where.campañaId = parseIntOptional(campañaId, 'campañaId');
    if (estado !== undefined) where.estado = toBooleanEstado(estado);

    const usuarios = await prisma.usuario.findMany({
      where,
      include: {
        rol: {
          select: { nombre: true }
        },
        campaña: {
          select: { nombre: true }
        }
      },
      orderBy: { nombreCompleto: 'asc' }
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const createUser = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { nombreUsuario, nombreCompleto, correoElectronico, documentoIdentidad, contraseña, rolId, campañaId, estado } = req.body;

    // Validar campos requeridos
    if (!nombreUsuario || !nombreCompleto || !contraseña || !rolId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // 🔒 Validar complejidad de contraseña con validador robusto
    const passwordValidation = validatePassword(contraseña);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.error,
        requirements: getPasswordRequirements()
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { nombreUsuario }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Normalizar DNI: string o null si vacío
    const docIdent = (documentoIdentidad && String(documentoIdentidad).trim() !== '')
      ? String(documentoIdentidad).trim()
      : null;

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreUsuario,
        nombreCompleto,
        correoElectronico,
        documentoIdentidad: docIdent,
        contraseña: hashedPassword,
        rolId: parseIntOptional(rolId, 'rolId'),
        campañaId: campañaId ? parseInt(campañaId) : null,
        estado: toBooleanEstado(estado)
      },
      include: {
        rol: {
          select: { nombre: true }
        },
        campaña: {
          select: { nombre: true }
        }
      }
    });

    console.log(`✅ Usuario creado: ${nuevoUsuario.nombreUsuario} por admin ${req.user.id}`);

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const updateUser = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { nombreUsuario, nombreCompleto, correoElectronico, documentoIdentidad, contraseña, rolId, campañaId, estado } = req.body;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Preparar datos de actualización
    const updateData = {
      nombreUsuario,
      nombreCompleto,
      correoElectronico,
      documentoIdentidad: (documentoIdentidad && String(documentoIdentidad).trim() !== '')
        ? String(documentoIdentidad).trim()
        : null,
      rolId: parseIntOptional(rolId, 'rolId'),
      campañaId: campañaId ? parseInt(campañaId) : null,
      estado: toBooleanEstado(estado)
    };

    // Si se proporciona contraseña, validarla y hashearla
    if (contraseña && contraseña.trim() !== '') {
      // 🔒 Validar complejidad de contraseña
      const passwordValidation = validatePassword(contraseña);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.error,
          requirements: getPasswordRequirements()
        });
      }
      updateData.contraseña = await bcrypt.hash(contraseña, 10);
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: parseIdSafe(id, 'id') },
      data: updateData,
      include: {
        rol: {
          select: { nombre: true }
        },
        campaña: {
          select: { nombre: true }
        }
      }
    });

    res.json(usuarioActualizado);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si tiene registros asociados
    const registrosCount = await prisma.registroActividad.count({
      where: { usuarioId: parseInt(id) }
    });

    if (registrosCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el usuario porque tiene ${registrosCount} registros asociados` 
      });
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: parseIdSafe(id, 'id') }
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

const changePassword = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    }

    // Validar formato de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
      });
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: parseIdSafe(id, 'id') },
      data: { contraseña: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// ===== ACTIVIDADES =====

const getActivities = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const actividades = await prisma.actividad.findMany({
      include: {
        subactividades: {
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json(actividades);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
};

const createActivity = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { nombreActividad, descripcion, orden, activo } = req.body;

    // Validar campos requeridos
    if (!nombreActividad || orden === undefined) {
      return res.status(400).json({ error: 'Nombre y orden son requeridos' });
    }

    // Verificar si la actividad ya existe
    const existingActivity = await prisma.actividad.findUnique({
      where: { nombreActividad }
    });

    if (existingActivity) {
      return res.status(400).json({ error: 'Ya existe una actividad con ese nombre' });
    }

    // Crear actividad
    const nuevaActividad = await prisma.actividad.create({
      data: {
        nombreActividad,
        descripcion: descripcion || '',
        orden: parseIntOptional(orden, 'orden'),
        activo: activo !== false
      }
    });

    res.status(201).json(nuevaActividad);
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
};

const updateActivity = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { nombreActividad, descripcion, orden, activo } = req.body;

    // Verificar si la actividad existe
    const existingActivity = await prisma.actividad.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // 🔒 PROTECCIÓN: Actividades críticas solo pueden modificarse parcialmente
    const ACTIVIDADES_PROTEGIDAS = ['Ingreso', 'Salida', 'Break Salida', 'Regreso Break'];
    if (ACTIVIDADES_PROTEGIDAS.includes(existingActivity.nombreActividad)) {
      // Permitir solo modificar descripción y estado activo, NO el nombre ni orden
      if (nombreActividad && nombreActividad !== existingActivity.nombreActividad) {
        return res.status(403).json({
          success: false,
          error: `La actividad "${existingActivity.nombreActividad}" es crítica y no se puede renombrar.`,
          suggestion: 'Solo puedes modificar su descripción o estado activo.'
        });
      }
      
      if (orden !== undefined && orden !== existingActivity.orden) {
        return res.status(403).json({
          success: false,
          error: `El orden de "${existingActivity.nombreActividad}" no puede modificarse para mantener la consistencia del sistema.`,
          suggestion: 'Solo puedes modificar su descripción o estado activo.'
        });
      }
    }

    // Si se cambia el nombre, verificar que no exista otra con ese nombre
    if (nombreActividad && nombreActividad !== existingActivity.nombreActividad) {
      const duplicateActivity = await prisma.actividad.findUnique({
        where: { nombreActividad }
      });

      if (duplicateActivity) {
        return res.status(400).json({ error: 'Ya existe una actividad con ese nombre' });
      }
    }

    // Actualizar actividad
    const actividadActualizada = await prisma.actividad.update({
      where: { id: parseIdSafe(id, 'id') },
      data: {
        nombreActividad,
        descripcion,
        orden: parseIntOptional(orden, 'orden'),
        activo
      }
    });

    res.json(actividadActualizada);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    // Verificar si la actividad existe
    const existingActivity = await prisma.actividad.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // 🔒 PROTECCIÓN: Actividades críticas del sistema no pueden eliminarse
    const ACTIVIDADES_PROTEGIDAS = ['Ingreso', 'Salida', 'Break Salida', 'Regreso Break'];
    if (ACTIVIDADES_PROTEGIDAS.includes(existingActivity.nombreActividad)) {
      return res.status(403).json({
        success: false,
        error: `La actividad "${existingActivity.nombreActividad}" es crítica para el sistema y no puede ser eliminada.`,
        suggestion: 'Desactívala usando el toggle de estado si deseas ocultarla.'
      });
    }

    // 🔒 PROTECCIÓN: Verificar si tiene registros asociados (corregido nombre de tabla)
    const registrosCount = await prisma.registroActividad.count({
      where: { actividadId: parseInt(id) }
    });

    if (registrosCount > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar: la actividad tiene ${registrosCount} registros históricos asociados.`,
        suggestion: 'Desactívala usando el toggle de estado para ocultarla sin perder datos históricos.',
        registrosCount
      });
    }

    // Si no tiene registros y no es crítica, permitir eliminación
    await prisma.actividad.delete({
      where: { id: parseIdSafe(id, 'id') }
    });

    console.log(`✅ Actividad "${existingActivity.nombreActividad}" eliminada por admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Actividad eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar actividad:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar actividad'
    });
  }
};

const toggleActivityStatus = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { activo } = req.body;

    // Verificar si la actividad existe
    const existingActivity = await prisma.actividad.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Actualizar solo el campo activo
    const actividadActualizada = await prisma.actividad.update({
      where: { id: parseIdSafe(id, 'id') },
      data: { activo }
    });

    res.json(actividadActualizada);
  } catch (error) {
    console.error('Error al cambiar estado de actividad:', error);
    res.status(500).json({ error: 'Error al cambiar estado de actividad' });
  }
};

// ===== CAMPAÑAS =====

const getCampaigns = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const campañas = await prisma.campaña.findMany({
      orderBy: { nombre: 'asc' }
    });

    res.json(campañas);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
};

// ===== SUBACTIVIDADES =====

const getSubactivities = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { actividadId } = req.query;
    const where = actividadId ? { actividadId: parseInt(actividadId) } : {};

    const subactividades = await prisma.subactividad.findMany({
      where,
      include: {
        actividad: { select: { id: true, nombreActividad: true } }
      },
      orderBy: [{ actividadId: 'asc' }, { orden: 'asc' }]
    });

    res.json(subactividades);
  } catch (error) {
    console.error('Error al obtener subactividades:', error);
    res.status(500).json({ error: 'Error al obtener subactividades' });
  }
};

const createSubactivity = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { actividadId, nombreSubactividad, descripcion, orden, activo } = req.body;
    if (!actividadId || !nombreSubactividad) {
      return res.status(400).json({ error: 'actividadId y nombreSubactividad son requeridos' });
    }

    // Validar duplicado por actividad
    const dup = await prisma.subactividad.findFirst({
      where: { actividadId: parseInt(actividadId), nombreSubactividad }
    });
    if (dup) {
      return res.status(400).json({ error: 'Ya existe una subactividad con ese nombre en la actividad seleccionada' });
    }

    // 🔄 Si no se proporciona orden, calcularlo automáticamente
    let ordenFinal = orden !== undefined ? parseIntOptional(orden, 'orden') : null;
    
    if (ordenFinal === null || ordenFinal === 0) {
      // Obtener el máximo orden actual para esta actividad
      const maxOrden = await prisma.subactividad.aggregate({
        where: { actividadId: parseInt(actividadId) },
        _max: { orden: true }
      });
      
      ordenFinal = (maxOrden._max.orden || 0) + 1;
      console.log(`✨ Orden calculado automáticamente: ${ordenFinal} para actividad ${actividadId}`);
    }

    const nueva = await prisma.subactividad.create({
      data: {
        actividadId: parseInt(actividadId),
        nombreSubactividad,
        descripcion: descripcion || '',
        orden: ordenFinal,
        activo: activo !== false
      }
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear subactividad:', error);
    res.status(500).json({ error: 'Error al crear subactividad' });
  }
};

const updateSubactivity = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { actividadId, nombreSubactividad, descripcion, orden, activo } = req.body;

    const existing = await prisma.subactividad.findUnique({ where: { id: parseIdSafe(id, 'id') } });
    if (!existing) return res.status(404).json({ error: 'Subactividad no encontrada' });

    if (nombreSubactividad && nombreSubactividad !== existing.nombreSubactividad) {
      const dup = await prisma.subactividad.findFirst({
        where: { actividadId: actividadId ? parseInt(actividadId) : existing.actividadId, nombreSubactividad }
      });
      if (dup) return res.status(400).json({ error: 'Ya existe una subactividad con ese nombre en la actividad' });
    }

    const subAct = await prisma.subactividad.update({
      where: { id: parseIdSafe(id, 'id') },
      data: {
        actividadId: actividadId ? parseInt(actividadId) : undefined,
        nombreSubactividad: nombreSubactividad ?? undefined,
        descripcion: descripcion ?? undefined,
        orden: orden !== undefined ? parseIntOptional(orden, 'orden') : undefined,
        activo: activo ?? undefined
      }
    });

    res.json(subAct);
  } catch (error) {
    console.error('Error al actualizar subactividad:', error);
    res.status(500).json({ error: 'Error al actualizar subactividad' });
  }
};

const deleteSubactivity = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const existing = await prisma.subactividad.findUnique({ where: { id: parseIdSafe(id, 'id') } });
    if (!existing) return res.status(404).json({ error: 'Subactividad no encontrada' });

    const registrosCount = await prisma.registroActividad.count({ where: { subactividadId: parseInt(id) } });
    if (registrosCount > 0) {
      return res.status(400).json({ error: `No se puede eliminar: ${registrosCount} registros asociados` });
    }

    await prisma.subactividad.delete({ where: { id: parseIdSafe(id, 'id') } });
    res.json({ message: 'Subactividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar subactividad:', error);
    res.status(500).json({ error: 'Error al eliminar subactividad' });
  }
};

const toggleSubactivityStatus = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { id } = req.params;
    const { activo } = req.body;
    const existing = await prisma.subactividad.findUnique({ where: { id: parseIdSafe(id, 'id') } });
    if (!existing) return res.status(404).json({ error: 'Subactividad no encontrada' });
    const updated = await prisma.subactividad.update({ where: { id: parseIdSafe(id, 'id') }, data: { activo } });
    res.json(updated);
  } catch (error) {
    console.error('Error al cambiar estado de subactividad:', error);
    res.status(500).json({ error: 'Error al cambiar estado de subactividad' });
  }
};

// ===== ROLES =====

const CORE_ROLES = ['Asesor', 'Supervisor', 'Administrador'];

const getRolesAdmin = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const roles = await prisma.rol.findMany({ orderBy: { id: 'asc' } });
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

const createRole = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    if (CORE_ROLES.includes(nombre)) return res.status(400).json({ error: 'Ese rol ya es núcleo del sistema' });
    const exists = await prisma.rol.findUnique({ where: { nombre } });
    if (exists) return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    const rol = await prisma.rol.create({ data: { nombre } });
    res.status(201).json(rol);
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

const updateRole = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { id } = req.params;
    const { nombre } = req.body;
    const role = await prisma.rol.findUnique({ where: { id: parseIdSafe(id, 'id') } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
    if (CORE_ROLES.includes(role.nombre)) return res.status(400).json({ error: 'No se puede renombrar un rol núcleo' });
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    if (CORE_ROLES.includes(nombre)) return res.status(400).json({ error: 'Nombre reservado para rol núcleo' });
    const exists = await prisma.rol.findUnique({ where: { nombre } });
    if (exists && exists.id !== role.id) return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    const updated = await prisma.rol.update({ where: { id: role.id }, data: { nombre } });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

const deleteRole = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { id } = req.params;
    const role = await prisma.rol.findUnique({ where: { id: parseIdSafe(id, 'id') } });
    if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
    if (CORE_ROLES.includes(role.nombre)) return res.status(400).json({ error: 'No se puede eliminar un rol núcleo' });
    const usersCount = await prisma.usuario.count({ where: { rolId: role.id } });
    if (usersCount > 0) return res.status(400).json({ error: `No se puede eliminar, ${usersCount} usuarios asociados` });
    await prisma.rol.delete({ where: { id: role.id } });
    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
};

// ===== ASIGNACIÓN DE CAMPAÑAS A SUPERVISORES =====

const getSupervisorCampaigns = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { id } = req.params;
    
    // Verificar que el usuario existe y es supervisor
    const usuario = await prisma.usuario.findUnique({ 
      where: { id: parseIdSafe(id, 'id') },
      include: { rol: true }
    });
    
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.rol.nombre !== 'Supervisor') {
      return res.status(400).json({ error: 'El usuario no es supervisor' });
    }
    
    // Obtener campañas asignadas desde tabla M:N
    const asignaciones = await prisma.supervisorCampaña.findMany({
      where: { supervisorId: parseInt(id) },
      include: { campaña: true }
    });
    
    const campañas = asignaciones.map(a => a.campaña);
    res.json(campañas);
  } catch (error) {
    console.error('Error al obtener campañas del supervisor:', error);
    res.status(500).json({ error: 'Error al obtener campañas del supervisor' });
  }
};

const setSupervisorCampaigns = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { id } = req.params;
    const { campañaIds } = req.body;
    
    if (!Array.isArray(campañaIds)) {
      return res.status(400).json({ error: 'campañaIds debe ser un array' });
    }
    
    // Verificar que el usuario existe y es supervisor
    const usuario = await prisma.usuario.findUnique({ 
      where: { id: parseIdSafe(id, 'id') },
      include: { rol: true }
    });
    
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.rol.nombre !== 'Supervisor') {
      return res.status(400).json({ error: 'El usuario no es supervisor' });
    }
    
    // Eliminar asignaciones actuales
    await prisma.supervisorCampaña.deleteMany({
      where: { supervisorId: parseInt(id) }
    });
    
    // Crear nuevas asignaciones
    if (campañaIds.length > 0) {
      await prisma.supervisorCampaña.createMany({
        data: campañaIds.map(cId => ({
          supervisorId: parseInt(id),
          campañaId: parseInt(cId)
        }))
      });
    }
    
    // Devolver las campañas asignadas
    const asignaciones = await prisma.supervisorCampaña.findMany({
      where: { supervisorId: parseInt(id) },
      include: { campaña: true }
    });
    
    res.json({
      message: 'Campañas asignadas exitosamente',
      campañas: asignaciones.map(a => a.campaña)
    });
  } catch (error) {
    console.error('Error al asignar campañas al supervisor:', error);
    res.status(500).json({ error: 'Error al asignar campañas al supervisor' });
  }
};

const createCampaign = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { nombre } = req.body;

    // Validar campo requerido
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Verificar si la campaña ya existe
    const existingCampaign = await prisma.campaña.findFirst({
      where: { nombre }
    });

    if (existingCampaign) {
      return res.status(400).json({ error: 'Ya existe una campaña con ese nombre' });
    }

    // Crear campaña
    const nuevaCampaña = await prisma.campaña.create({
      data: { nombre }
    });

    res.status(201).json(nuevaCampaña);
  } catch (error) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

const updateCampaign = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { nombre } = req.body;

    // Verificar si la campaña existe
    const existingCampaign = await prisma.campaña.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Si se cambia el nombre, verificar que no exista otra con ese nombre
    if (nombre && nombre !== existingCampaign.nombre) {
      const duplicateCampaign = await prisma.campaña.findFirst({
        where: { nombre }
      });

      if (duplicateCampaign) {
        return res.status(400).json({ error: 'Ya existe una campaña con ese nombre' });
      }
    }

    // Actualizar campaña
    const campañaActualizada = await prisma.campaña.update({
      where: { id: parseIdSafe(id, 'id') },
      data: { nombre }
    });

    res.json(campañaActualizada);
  } catch (error) {
    console.error('Error al actualizar campaña:', error);
    res.status(500).json({ error: 'Error al actualizar campaña' });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    // Verificar si la campaña existe
    const existingCampaign = await prisma.campaña.findUnique({
      where: { id: parseIdSafe(id, 'id') }
    });

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    // Verificar si tiene usuarios asociados
    const usuariosCount = await prisma.usuario.count({
      where: { campañaId: parseInt(id) }
    });

    if (usuariosCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la campaña porque tiene ${usuariosCount} usuarios asociados` 
      });
    }

    // Eliminar campaña
    await prisma.campaña.delete({
      where: { id: parseIdSafe(id, 'id') }
    });

    res.json({ message: 'Campaña eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar campaña:', error);
    res.status(500).json({ error: 'Error al eliminar campaña' });
  }
};

export {
  // Usuarios
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  // Actividades
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  toggleActivityStatus,
  // Campañas
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  // Subactividades
  getSubactivities,
  createSubactivity,
  updateSubactivity,
  deleteSubactivity,
  toggleSubactivityStatus,
  // Roles (admin mgmt)
  getRolesAdmin,
  createRole,
  updateRole,
  deleteRole,
  // Asignación campañas supervisor
  getSupervisorCampaigns,
  setSupervisorCampaigns
};

// ===== MANTENIMIENTO =====

export const fixDailyDateFromStart = async (req, res) => {
  try {
    // Autorización: ya pasa por authenticate + requireRole('Administrador') en rutas

    // Protección adicional opcional con cabecera secreta
    const adminFixKey = process.env.ADMIN_FIX_KEY;
    if (adminFixKey) {
      const hdr = req.headers['x-admin-fix-key'];
      if (!hdr || hdr !== adminFixKey) {
        return res.status(403).json({ success: false, error: 'Clave de mantenimiento inválida' });
      }
    }

    const tz = APP_TZ || 'America/Lima';
    const apply = (req.query.apply === 'true');

    const previewSql = `
      SELECT COUNT(*)::int AS desalineados
      FROM registro_actividades r
      WHERE r.hora_inicio IS NOT NULL
        AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE '${tz}') AS date);
    `;

    const preview = await prisma.$queryRawUnsafe(previewSql);
    const desalineados = Array.isArray(preview) && preview.length > 0 ? preview[0].desalineados : 0;

    if (!apply) {
      return res.json({ success: true, dryRun: true, appTz: tz, desalineados });
    }

    const updateSql = `
      UPDATE registro_actividades r
      SET fecha = CAST((r.hora_inicio AT TIME ZONE '${tz}') AS date)
      WHERE r.hora_inicio IS NOT NULL
        AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE '${tz}') AS date);
    `;
    const updated = await prisma.$executeRawUnsafe(updateSql);

    return res.json({ success: true, dryRun: false, appTz: tz, updated });
  } catch (error) {
    console.error('Error en fixDailyDateFromStart:', error);
    res.status(500).json({ success: false, error: 'Error ejecutando fix', details: error.message });
  }
};

// ===== HORARIOS LABORALES =====

export const getHorariosUsuario = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { usuarioId } = req.params;
    const { tipoHorario } = req.query; // Filtro opcional por tipo

    const where = { usuarioId: parseInt(usuarioId) };
    if (tipoHorario) where.tipoHorario = tipoHorario;

    const horarios = await prisma.horarioLaboral.findMany({
      where,
      orderBy: [
        { tipoHorario: 'asc' },
        { diaSemana: 'asc' },
        { fechaEspecifica: 'asc' }
      ]
    });

    res.json({ success: true, data: horarios });
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ success: false, error: 'Error al obtener horarios' });
  }
};

export const upsertHorariosUsuario = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { usuarioId } = req.params;
    const { horarios, tipoHorario } = req.body; 
    // horarios: Array de objetos con campos según tipoHorario
    // tipoHorario: 'semanal' | 'mensual' | 'diario'

    if (!Array.isArray(horarios)) {
      return res.status(400).json({ error: 'Se requiere un array de horarios' });
    }

    if (!tipoHorario || !['semanal', 'mensual', 'diario'].includes(tipoHorario)) {
      return res.status(400).json({ error: 'tipoHorario debe ser: semanal, mensual o diario' });
    }

    // Validar formato de horarios según tipo
    for (const h of horarios) {
      // Validaciones comunes
      if (!h.horaInicio || !/^\d{2}:\d{2}$/.test(h.horaInicio)) {
        return res.status(400).json({ error: 'horaInicio debe tener formato HH:MM' });
      }
      if (!h.horaFin || !/^\d{2}:\d{2}$/.test(h.horaFin)) {
        return res.status(400).json({ error: 'horaFin debe tener formato HH:MM' });
      }
      if (h.horasObjetivo === undefined || h.horasObjetivo < 0) {
        return res.status(400).json({ error: 'horasObjetivo debe ser >= 0' });
      }

      // Validaciones específicas por tipo
      if (tipoHorario === 'semanal') {
        if (!h.diaSemana || h.diaSemana < 1 || h.diaSemana > 7) {
          return res.status(400).json({ error: 'diaSemana debe estar entre 1 y 7 para horarios semanales' });
        }
      } else if (tipoHorario === 'mensual' || tipoHorario === 'diario') {
        if (!h.fechaEspecifica) {
          return res.status(400).json({ error: `fechaEspecifica es requerida para horarios ${tipoHorario}s` });
        }
      }
    }

    // Eliminar horarios existentes del usuario de este tipo específico
    await prisma.horarioLaboral.deleteMany({
      where: { 
        usuarioId: parseInt(usuarioId),
        tipoHorario
      }
    });

    // Crear nuevos horarios
    if (horarios.length > 0) {
      await prisma.horarioLaboral.createMany({
        data: horarios.map(h => ({
          usuarioId: parseInt(usuarioId),
          tipoHorario,
          diaSemana: tipoHorario === 'semanal' ? h.diaSemana : null,
          fechaEspecifica: (tipoHorario === 'mensual' || tipoHorario === 'diario') ? new Date(h.fechaEspecifica) : null,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          horasObjetivo: h.horasObjetivo,
          activo: h.activo !== false
        }))
      });
    }

    // Devolver horarios actualizados de este tipo
    const nuevosHorarios = await prisma.horarioLaboral.findMany({
      where: { 
        usuarioId: parseInt(usuarioId),
        tipoHorario
      },
      orderBy: [
        { diaSemana: 'asc' },
        { fechaEspecifica: 'asc' }
      ]
    });

    res.json({ success: true, message: 'Horarios actualizados correctamente', data: nuevosHorarios });
  } catch (error) {
    console.error('Error al actualizar horarios:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar horarios' });
  }
};

export const deleteHorarioUsuario = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { usuarioId, horarioId } = req.params;

    await prisma.horarioLaboral.delete({
      where: {
        id: parseInt(horarioId),
        usuarioId: parseInt(usuarioId)
      }
    });

    res.json({ success: true, message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar horario' });
  }
};

