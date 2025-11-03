import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, Key, Search, Eye, EyeOff } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import * as adminService from '../services/adminService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    nombreCompleto: '',
    correoElectronico: '',
    documentoIdentidad: '',
    contraseña: '',
    rolId: '',
    campañaId: '',
    campañasIds: [], // Para supervisores (multi-select)
    estado: true
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, campaignsData] = await Promise.all([
        adminService.getUsuarios(),
        adminService.getRoles(),
        adminService.getCampañas()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setCampaigns(campaignsData);
    } catch (error) {
        toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      nombreUsuario: '',
      nombreCompleto: '',
      correoElectronico: '',
      documentoIdentidad: '',
      contraseña: '',
      rolId: '',
      campañaId: '',
      campañasIds: [],
      estado: true
    });
    setShowUserModal(true);
  };

  const handleOpenEdit = async (user) => {
    setSelectedUser(user);
    
    // Si es supervisor, cargar campañas asignadas
    let campañasAsignadas = [];
    if (user.rol?.nombre === 'Supervisor') {
      try {
        campañasAsignadas = await adminService.getSupervisorCampaigns(user.id);
      } catch (error) {
        console.error('Error al cargar campañas del supervisor:', error);
      }
    }
    
    setFormData({
      nombreUsuario: user.nombreUsuario,
      nombreCompleto: user.nombreCompleto,
      correoElectronico: user.correoElectronico || '',
      documentoIdentidad: user.documentoIdentidad || '',
      contraseña: '', // No mostrar contraseña actual
      rolId: user.rolId,
      campañaId: user.campañaId,
      campañasIds: campañasAsignadas.map(c => c.id),
      estado: user.estado
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const selectedRole = roles.find(r => r.id === parseInt(formData.rolId));
      const isAdmin = selectedRole?.nombre === 'Administrador';
      const isSupervisor = selectedRole?.nombre === 'Supervisor';
      
      if (selectedUser) {
        // Editar - no enviar contraseña si está vacía
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.contraseña) {
          delete dataToUpdate.contraseña;
        }
        
        // Admin no necesita campaña
        if (isAdmin) {
          dataToUpdate.campañaId = null;
        }
        
        await adminService.updateUsuario(selectedUser.id, dataToUpdate);
        
        // Si es supervisor, actualizar campañas asignadas
        if (isSupervisor) {
          await adminService.setSupervisorCampaigns(selectedUser.id, formData.campañasIds);
        }
        
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear
        if (!formData.contraseña) {
          toast.error('La contraseña es requerida');
          setLoading(false);
          return;
        }
        
        const dataToCreate = { ...formData };
        
        // Admin no necesita campaña
        if (isAdmin) {
          dataToCreate.campañaId = null;
        }
        
        const nuevoUsuario = await adminService.createUsuario(dataToCreate);
        
        // Si es supervisor, asignar campañas
        if (isSupervisor && formData.campañasIds.length > 0) {
          await adminService.setSupervisorCampaigns(nuevoUsuario.id, formData.campañasIds);
        }
        
        toast.success('Usuario creado exitosamente');
      }
      setShowUserModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordChange = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    try {
      await adminService.changeUsuarioPassword(selectedUser.id, passwordData.newPassword);
      toast.success('Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewPassword = (user) => {
    setSelectedUser(user);
    setShowViewPasswordModal(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      await adminService.deleteUsuario(selectedUser.id);
      toast.success('Usuario eliminado exitosamente');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rol?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Gestión de Usuarios</h2>
          <p className="text-sm text-neutral-600 mt-1">Administra usuarios del sistema</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o rol..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Campaña</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-neutral-900">{user.nombreCompleto}</div>
                        <div className="text-sm text-neutral-500">{user.nombreUsuario}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.documentoIdentidad || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.rol?.nombre === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                        user.rol?.nombre === 'Supervisor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.rol?.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.campaña?.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {user.correoElectronico || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenViewPassword(user)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Ver información de contraseña"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPasswordChange(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(user)}
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

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre Usuario *
              </label>
              <input
                type="text"
                required
                value={formData.nombreUsuario}
                onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={!!selectedUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.correoElectronico}
                onChange={(e) => setFormData({ ...formData, correoElectronico: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Documento de Identidad
              </label>
              <input
                type="text"
                value={formData.documentoIdentidad}
                onChange={(e) => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength="20"
              />
            </div>
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!selectedUser}
                  value={formData.contraseña}
                  onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Rol *
              </label>
              <select
                required
                value={formData.rolId}
                onChange={(e) => setFormData({ ...formData, rolId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar...</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Campaña {roles.find(r => r.id === parseInt(formData.rolId))?.nombre === 'Administrador' ? '' : '*'}
              </label>
              <select
                required={roles.find(r => r.id === parseInt(formData.rolId))?.nombre !== 'Administrador'}
                value={formData.campañaId}
                onChange={(e) => setFormData({ ...formData, campañaId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={roles.find(r => r.id === parseInt(formData.rolId))?.nombre === 'Administrador' || roles.find(r => r.id === parseInt(formData.rolId))?.nombre === 'Supervisor'}
              >
                <option value="">Seleccionar...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-select de campañas para Supervisor */}
          {roles.find(r => r.id === parseInt(formData.rolId))?.nombre === 'Supervisor' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Campañas Asignadas * (Selecciona una o más)
              </label>
              <select
                multiple
                required
                value={formData.campañasIds.map(String)}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions).map(opt => parseInt(opt.value));
                  setFormData({ ...formData, campañasIds: selectedOptions });
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-32"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.nombre}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">Mantén Ctrl/Cmd presionado para seleccionar múltiples opciones</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="estado"
              checked={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="estado" className="text-sm font-medium text-neutral-700">
              Usuario activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
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

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Cambiar Contraseña"
        size="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={selectedUser?.nombreCompleto || ''}
              disabled
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Cambiando...' : 'Cambiar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver información de contraseña */}
      <Modal
        isOpen={showViewPasswordModal}
        onClose={() => setShowViewPasswordModal(false)}
        title="Información de Contraseña"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Eye className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Seguridad de Contraseñas
                </h4>
                <p className="text-sm text-blue-800">
                  Por razones de seguridad, las contraseñas están encriptadas 
                  con bcrypt y no pueden visualizarse en texto plano.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Usuario:</span> {selectedUser?.nombre}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowViewPasswordModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                setShowViewPasswordModal(false);
                handleOpenPasswordChange(selectedUser);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Cambiar Contraseña
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a ${selectedUser?.nombreCompleto}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}
