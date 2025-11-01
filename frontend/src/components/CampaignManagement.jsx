import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import * as adminService from '../services/adminService';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nombre: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCampañas();
      setCampaigns(data);
    } catch {
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedCampaign(null);
    setFormData({ nombre: '' });
    setShowCampaignModal(true);
  };

  const handleOpenEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({ nombre: campaign.nombre });
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedCampaign) {
        await adminService.updateCampaña(selectedCampaign.id, formData);
        toast.success('Campaña actualizada exitosamente');
      } else {
        await adminService.createCampaña(formData);
        toast.success('Campaña creada exitosamente');
      }
      setShowCampaignModal(false);
      loadCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar campaña');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteDialog(true);
  };

  const handleDeleteCampaign = async () => {
    setLoading(true);
    try {
      await adminService.deleteCampaña(selectedCampaign.id);
      toast.success('Campaña eliminada exitosamente');
      loadCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar campaña');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Gestión de Campañas</h2>
          <p className="text-sm text-neutral-600 mt-1">Administra las campañas del sistema</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Campaña
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar campaña..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron campañas
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {campaign.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{campaign.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(campaign)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(campaign)}
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

      {/* Campaign Modal */}
      <Modal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title={selectedCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
        size="sm"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre de la Campaña *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ej: PQRS, Ventas, BO_Calidda"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCampaignModal(false)}
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
        onConfirm={handleDeleteCampaign}
        title="Eliminar Campaña"
        message={`¿Estás seguro de eliminar "${selectedCampaign?.nombre}"? Esta acción no se puede deshacer y afectará a todos los usuarios asociados.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
