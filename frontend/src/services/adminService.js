import api from './api';

// =====================================================
// USUARIOS
// =====================================================

export const getUsuarios = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

export const createUsuario = async (data) => {
  try {
    const response = await api.post('/admin/users', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

export const updateUsuario = async (id, data) => {
  try {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

export const deleteUsuario = async (id) => {
  try {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

export const changeUsuarioPassword = async (id, newPassword) => {
  try {
    const response = await api.put(`/admin/users/${id}/password`, { newPassword });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throw error;
  }
};

// =====================================================
// ROLES
// =====================================================

export const getRoles = async () => {
  try {
    // Los roles se obtienen desde el endpoint de stats (protegido y solo admin)
    const response = await api.get('/stats/roles');
    return response.data;
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw error;
  }
};

// Gestión de roles (admin)
export const getRolesAdmin = async () => {
  try {
    const response = await api.get('/admin/roles');
    return response.data;
  } catch (error) {
    console.error('Error al obtener roles (admin):', error);
    throw error;
  }
};

export const createRol = async (data) => {
  try {
    const response = await api.post('/admin/roles', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear rol:', error);
    throw error;
  }
};

export const updateRol = async (id, data) => {
  try {
    const response = await api.put(`/admin/roles/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    throw error;
  }
};

export const deleteRol = async (id) => {
  try {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    throw error;
  }
};

// =====================================================
// ACTIVIDADES
// =====================================================

export const getActividades = async () => {
  try {
    const response = await api.get('/admin/activities');
    return response.data;
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    throw error;
  }
};

export const createActividad = async (data) => {
  try {
    const response = await api.post('/admin/activities', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear actividad:', error);
    throw error;
  }
};

export const updateActividad = async (id, data) => {
  try {
    const response = await api.put(`/admin/activities/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    throw error;
  }
};

export const deleteActividad = async (id) => {
  try {
    const response = await api.delete(`/admin/activities/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    throw error;
  }
};

export const toggleActividadStatus = async (id, activo) => {
  try {
    const response = await api.patch(`/admin/activities/${id}/status`, { activo });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de actividad:', error);
    throw error;
  }
};

// =====================================================
// CAMPAÑAS
// =====================================================

export const getCampañas = async () => {
  try {
    const response = await api.get('/admin/campaigns');
    return response.data;
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    throw error;
  }
};

// =====================================================
// SUBACTIVIDADES
// =====================================================

export const getSubactividades = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    const response = await api.get(`/admin/subactivities?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener subactividades:', error);
    throw error;
  }
};

export const createSubactividad = async (data) => {
  try {
    const response = await api.post('/admin/subactivities', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear subactividad:', error);
    throw error;
  }
};

export const updateSubactividad = async (id, data) => {
  try {
    const response = await api.put(`/admin/subactivities/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar subactividad:', error);
    throw error;
  }
};

export const deleteSubactividad = async (id) => {
  try {
    const response = await api.delete(`/admin/subactivities/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar subactividad:', error);
    throw error;
  }
};

export const toggleSubactividadStatus = async (id, activo) => {
  try {
    const response = await api.patch(`/admin/subactivities/${id}/status`, { activo });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado de subactividad:', error);
    throw error;
  }
};

export const createCampaña = async (data) => {
  try {
    const response = await api.post('/admin/campaigns', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear campaña:', error);
    throw error;
  }
};

export const updateCampaña = async (id, data) => {
  try {
    const response = await api.put(`/admin/campaigns/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar campaña:', error);
    throw error;
  }
};

export const deleteCampaña = async (id) => {
  try {
    const response = await api.delete(`/admin/campaigns/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar campaña:', error);
    throw error;
  }
};

// =====================================================
// ASIGNACIÓN CAMPAÑAS A SUPERVISORES
// =====================================================

export const getSupervisorCampaigns = async (supervisorId) => {
  try {
    const response = await api.get(`/admin/supervisors/${supervisorId}/campaigns`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener campañas del supervisor:', error);
    throw error;
  }
};

export const setSupervisorCampaigns = async (supervisorId, campañaIds) => {
  try {
    const response = await api.put(`/admin/supervisors/${supervisorId}/campaigns`, { campañaIds });
    return response.data;
  } catch (error) {
    console.error('Error al asignar campañas al supervisor:', error);
    throw error;
  }
};

export default {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  changeUsuarioPassword,
  getRoles,
  getRolesAdmin,
  createRol,
  updateRol,
  deleteRol,
  getActividades,
  createActividad,
  updateActividad,
  deleteActividad,
  toggleActividadStatus,
  getCampañas,
  createCampaña,
  updateCampaña,
  deleteCampaña,
  getSubactividades,
  createSubactividad,
  updateSubactividad,
  deleteSubactividad,
  toggleSubactividadStatus,
  getSupervisorCampaigns,
  setSupervisorCampaigns
};
