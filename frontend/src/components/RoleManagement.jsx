import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { getRolesAdmin, createRol, updateRol, deleteRol } from '../services/adminService';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ nombre: '' });

  const load = async () => {
    try {
      const data = await getRolesAdmin();
      setRoles(data);
    } catch {
      toast.error('Error al cargar roles');
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = () => {
    setSelected(null);
    setForm({ nombre: '' });
    setShowModal(true);
  };

  const onEdit = (r) => {
    setSelected(r);
    setForm({ nombre: r.nombre });
    setShowModal(true);
  };

  const onDelete = (r) => {
    setSelected(r);
    setShowDelete(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (!form.nombre.trim()) {
        toast.error('El nombre es requerido');
        return;
      }
      if (selected) {
        await updateRol(selected.id, { nombre: form.nombre.trim() });
        toast.success('Rol actualizado');
      } else {
        await createRol({ nombre: form.nombre.trim() });
        toast.success('Rol creado');
      }
      setShowModal(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar rol');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRol(selected.id);
      toast.success('Rol eliminado');
      setShowDelete(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const filtered = roles.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Gestión de Roles</h2>
        <button onClick={onCreate} className="px-3 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Rol
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar rol" className="pl-9 pr-3 py-2 w-full border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"/>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-600">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.id}</td>
                <td className="px-4 py-2">{r.nombre}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>onEdit(r)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-1"><Edit className="w-4 h-4"/>Editar</button>
                    <button onClick={()=>onDelete(r)} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"><Trash2 className="w-4 h-4"/>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={3}>Sin roles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={selected? 'Editar Rol' : 'Nuevo Rol'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label>
            <input value={form.nombre} onChange={(e)=>setForm({...form, nombre: e.target.value})} className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Ej. Auditor"/>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Guardar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={()=>setShowDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar Rol"
        message={`¿Seguro que deseas eliminar el rol "${selected?.nombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
