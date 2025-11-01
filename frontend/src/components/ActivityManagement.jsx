import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import * as adminService from '../services/adminService';

export default function ActivityManagement() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nombreActividad: '',
    descripcion: '',
    orden: 0,
    activo: true
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await adminService.getActividades();
      setActivities(data);
    } catch {
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedActivity(null);
    setFormData({
      nombreActividad: '',
      descripcion: '',
      orden: 0,
      activo: true
    });
    setShowActivityModal(true);
  };

  const handleOpenEdit = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      nombreActividad: activity.nombreActividad,
      descripcion: activity.descripcion || '',
      orden: activity.orden,
      activo: activity.activo
    });
    setShowActivityModal(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedActivity) {
        await adminService.updateActividad(selectedActivity.id, formData);
        toast.success('Actividad actualizada exitosamente');
      } else {
        await adminService.createActividad(formData);
        toast.success('Actividad creada exitosamente');
      }
      setShowActivityModal(false);
      loadActivities();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (activity) => {
    setLoading(true);
    try {
      await adminService.toggleActividadStatus(activity.id, !activity.activo);
      toast.success(`Actividad ${!activity.activo ? 'activada' : 'desactivada'}`);
      loadActivities();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (activity) => {
    setSelectedActivity(activity);
    setShowDeleteDialog(true);
  };

  const handleDeleteActivity = async () => {
    setLoading(true);
    try {
      await adminService.deleteActividad(selectedActivity.id);
      toast.success('Actividad eliminada exitosamente');
      loadActivities();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar actividad');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.nombreActividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.descripcion && activity.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Gestión de Actividades</h2>
          <p className="text-sm text-neutral-600 mt-1">Administra las actividades del sistema</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Actividad
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Actividad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron actividades
                  </td>
                </tr>
              ) : (
                filteredActivities.sort((a, b) => a.orden - b.orden).map((activity) => (
                  <tr key={activity.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{activity.nombreActividad}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {activity.descripcion || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {activity.orden}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(activity)}
                        className="flex items-center gap-2"
                        title="Click para cambiar estado"
                      >
                        {activity.activo ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-neutral-400" />
                            <span className="text-xs font-medium text-neutral-500">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(activity)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(activity)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title={selectedActivity ? 'Editar Actividad' : 'Nueva Actividad'}
        size="md"
      >
        <form onSubmit={handleSaveActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre Actividad *
            </label>
            <input
              type="text"
              required
              value={formData.nombreActividad}
              onChange={(e) => setFormData({ ...formData, nombreActividad: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción
            </label>
            <textarea
              rows="3"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Orden
            </label>
            <input
              type="number"
              min="0"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-neutral-700">
              Actividad activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteActivity}
        title="Eliminar Actividad"
        message={`¿Estás seguro de eliminar "${selectedActivity?.nombreActividad}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
