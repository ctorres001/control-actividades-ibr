import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { getActividades, getSubactividades, createSubactividad, updateSubactividad, deleteSubactividad, toggleSubactividadStatus, getCampañas } from '../services/adminService';

// 🔒 Actividades del sistema que NO deben tener subactividades
const ACTIVIDADES_SISTEMA = ['Ingreso', 'Salida', 'Break Salida', 'Regreso Break'];

export default function SubactivityManagement() {
  const [activities, setActivities] = useState([]);
  const [subs, setSubs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ actividadId: '', nombreSubactividad: '', descripcion: '', orden: 0, activo: true, campaignId: '' });

  // Filtrar actividades de jornada (excluir las del sistema)
  const actividadesJornada = useMemo(() => 
    activities.filter(a => !ACTIVIDADES_SISTEMA.includes(a.nombreActividad)),
    [activities]
  );

  const load = async () => {
    try {
      const [acts, s, camps] = await Promise.all([
        getActividades(),
        getSubactividades(filterActivity ? { actividadId: filterActivity } : {}),
        getCampañas()
      ]);
      setActivities(acts);
      setSubs(s);
      setCampaigns(camps);
    } catch {
      toast.error('Error al cargar subactividades');
    }
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActivity]);

  const onCreate = () => {
    setSelected(null);
    setForm({ actividadId: filterActivity || (actividadesJornada[0]?.id || ''), nombreSubactividad: '', descripcion: '', orden: 0, activo: true, campaignId: '' });
    setShowModal(true);
  };

  const onEdit = (s) => {
    setSelected(s);
    const currentCampaign = (s.subactividadCampañas || []).map((c) => c.campañaId || c.campaña?.id).find(Boolean) || '';
    setForm({ actividadId: s.actividadId, nombreSubactividad: s.nombreSubactividad, descripcion: s.descripcion || '', orden: s.orden || 0, activo: s.activo, campaignId: currentCampaign });
    setShowModal(true);
  };

  const onDelete = (s) => {
    setSelected(s);
    setShowDelete(true);
  };

  const toggle = async (s) => {
    try {
      const updated = await toggleSubactividadStatus(s.id, !s.activo);
      setSubs(prev => prev.map(x => x.id === s.id ? updated : x));
    } catch {
      toast.error('No se pudo cambiar estado');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (!form.actividadId || !form.nombreSubactividad.trim()) {
        toast.error('Actividad y nombre son requeridos');
        return;
      }
      const general = campaigns.find(c => c.nombre === 'General');
      const chosen = form.campaignId || (general ? general.id : '');
      if (!chosen) {
        toast.error('Selecciona una campaña o crea "General" primero');
        return;
      }
      const payloadCampaignIds = [Number(chosen)];

      if (selected) {
        await updateSubactividad(selected.id, {
          actividadId: form.actividadId,
          nombreSubactividad: form.nombreSubactividad.trim(),
          descripcion: form.descripcion,
          orden: Number(form.orden),
          activo: form.activo,
          campaignIds: payloadCampaignIds
        });
        toast.success('Subactividad actualizada');
      } else {
        await createSubactividad({
          actividadId: form.actividadId,
          nombreSubactividad: form.nombreSubactividad.trim(),
          descripcion: form.descripcion,
          orden: Number(form.orden),
          activo: form.activo,
          campaignIds: payloadCampaignIds
        });
        toast.success('Subactividad creada');
      }
      setShowModal(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al guardar');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteSubactividad(selected.id);
      toast.success('Subactividad eliminada');
      setShowDelete(false);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const filtered = useMemo(() => subs.filter(s => {
    const term = search.toLowerCase();
    const activityName = s.actividad?.nombreActividad?.toLowerCase() || '';
    const campaignNames = (s.subactividadCampañas || []).map(c => c.campaña?.nombre?.toLowerCase() || '').join(' ');
    return (
      activityName.includes(term) ||
      s.nombreSubactividad.toLowerCase().includes(term) ||
      (s.descripcion || '').toLowerCase().includes(term) ||
      campaignNames.includes(term)
    );
  }), [subs, search]);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Gestión de Subactividades</h2>
        <button onClick={onCreate} className="px-3 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Subactividad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 w-full border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"/>
        </div>
        <div className="md:col-span-2">
          <select value={filterActivity} onChange={(e)=>setFilterActivity(e.target.value)} className="w-full border border-neutral-300 rounded-lg px-3 py-2">
            <option value="">Todas las actividades de jornada</option>
            {actividadesJornada.sort((a,b)=>a.orden-b.orden).map(a => (
              <option key={a.id} value={a.id}>{a.nombreActividad}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-600">
              <th className="px-4 py-2">Actividad</th>
              <th className="px-4 py-2">Subactividad</th>
              <th className="px-4 py-2">Campañas</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Orden</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2">{s.actividad?.nombreActividad || '-'}</td>
                <td className="px-4 py-2">{s.nombreSubactividad}</td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {(s.subactividadCampañas?.length ? s.subactividadCampañas : [])
                    .map((c) => c.campaña?.nombre || '-').join(', ') || 'Transversal'}
                </td>
                <td className="px-4 py-2">{s.descripcion || '-'}</td>
                <td className="px-4 py-2">{s.orden}</td>
                <td className="px-4 py-2">
                  <button onClick={()=>toggle(s)} className={`inline-flex items-center gap-1 px-2 py-1 rounded ${s.activo ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                    {s.activo ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button onClick={()=>onEdit(s)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-1"><Edit className="w-4 h-4"/>Editar</button>
                    <button onClick={()=>onDelete(s)} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"><Trash2 className="w-4 h-4"/>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={7}>Sin subactividades</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={selected? 'Editar Subactividad' : 'Nueva Subactividad'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Actividad</label>
            <select value={form.actividadId} onChange={(e)=>setForm({...form, actividadId: e.target.value})} className="w-full border border-neutral-300 rounded-lg px-3 py-2">
              <option value="">Seleccionar...</option>
              {actividadesJornada.sort((a,b)=>a.orden-b.orden).map(a => (
                <option key={a.id} value={a.id}>{a.nombreActividad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Campaña asignada</label>
            <select
              value={form.campaignId}
              onChange={(e)=>setForm({...form, campaignId: e.target.value})}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2"
            >
              <option value="">Seleccionar...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">Debe haber una sola campaña asignada; si dejas vacío y existe "General", se usará General.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre de Subactividad</label>
            <input value={form.nombreSubactividad} onChange={(e)=>setForm({...form, nombreSubactividad: e.target.value})} className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Ej. Llamada Entrante"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e)=>setForm({...form, descripcion: e.target.value})} className="w-full border border-neutral-300 rounded-lg px-3 py-2 h-24 focus:ring-primary-500 focus:border-primary-500" placeholder="Opcional"/>
          </div>
          <div className="flex items-center gap-2">
            <input id="activo" type="checkbox" checked={form.activo} onChange={(e)=>setForm({...form, activo: e.target.checked})} className="rounded text-primary-600"/>
            <label htmlFor="activo" className="text-sm text-neutral-700">Activo</label>
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
        title="Eliminar Subactividad"
        message={`¿Eliminar "${selected?.nombreSubactividad}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
