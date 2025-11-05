import { useState, useEffect, useCallback } from 'react';
import { Clock, Save, X, AlertCircle, Calendar, CalendarDays, CalendarRange, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
  { id: 7, nombre: 'Domingo' }
];

const TIPOS_HORARIO = [
  {
    value: 'semanal',
    label: 'Horario Fijo Semanal',
    icon: CalendarRange,
    description: 'Mismo horario cada semana (Ej: Lun-Vie 8-5)'
  },
  {
    value: 'mensual',
    label: 'Horario Variable Mensual',
    icon: CalendarDays,
    description: 'Horarios que se repiten cada mes'
  },
  {
    value: 'diario',
    label: 'Horario Variable Diario',
    icon: Calendar,
    description: 'Horarios específicos por fecha'
  }
];

export default function HorariosManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [tipoHorario, setTipoHorario] = useState('semanal');
  const [horarios, setHorarios] = useState({});
  const [horariosVariables, setHorariosVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadHorarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getHorariosUsuario(selectedUsuario, tipoHorario);
      
      if (tipoHorario === 'semanal') {
        // Procesar horarios semanales
        const horariosObj = {};
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(h => {
            horariosObj[h.diaSemana] = {
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              horasObjetivo: parseFloat(h.horasObjetivo) || 0,
              activo: h.activo
            };
          });
        }
        
        // Completar días faltantes con valores por defecto
        DIAS_SEMANA.forEach(dia => {
          if (!horariosObj[dia.id]) {
            horariosObj[dia.id] = {
              horaInicio: '08:00',
              horaFin: '17:00',
              horasObjetivo: 8.0,
              activo: dia.id <= 5 // Lun-Vie activos por defecto
            };
          }
        });
        
        setHorarios(horariosObj);
      } else {
        // Procesar horarios variables (mensual/diario)
        const horariosArray = (response.data || []).map(h => ({
          id: h.id,
          fechaEspecifica: h.fechaEspecifica ? h.fechaEspecifica.split('T')[0] : '',
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          horasObjetivo: parseFloat(h.horasObjetivo) || 0,
          activo: h.activo
        }));
        setHorariosVariables(horariosArray);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  }, [selectedUsuario, tipoHorario]);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (selectedUsuario) {
      loadHorarios();
    }
  }, [selectedUsuario, loadHorarios]);

  const handleHorarioChange = (diaSemana, field, value) => {
    setHorarios(prev => ({
      ...prev,
      [diaSemana]: {
        ...prev[diaSemana],
        [field]: value
      }
    }));
  };

  const handleVariableChange = (index, field, value) => {
    setHorariosVariables(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addVariableHorario = () => {
    setHorariosVariables(prev => [
      ...prev,
      {
        id: null,
        fechaEspecifica: '',
        horaInicio: '08:00',
        horaFin: '17:00',
        horasObjetivo: 8.0,
        activo: true
      }
    ]);
  };

  const removeVariableHorario = (index) => {
    setHorariosVariables(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedUsuario) {
      toast.error('Selecciona un usuario');
      return;
    }

    try {
      setSaving(true);
      
      let horariosArray;
      
      if (tipoHorario === 'semanal') {
        horariosArray = Object.entries(horarios).map(([diaSemana, data]) => ({
          diaSemana: parseInt(diaSemana),
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          horasObjetivo: parseFloat(data.horasObjetivo),
          activo: data.activo
        }));
      } else {
        // Validar que todas las fechas estén completas
        for (const h of horariosVariables) {
          if (!h.fechaEspecifica) {
            toast.error('Todas las fechas deben estar completas');
            setSaving(false);
            return;
          }
        }
        
        horariosArray = horariosVariables.map(h => ({
          fechaEspecifica: h.fechaEspecifica,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          horasObjetivo: parseFloat(h.horasObjetivo),
          activo: h.activo
        }));
      }

      await adminService.upsertHorariosUsuario(selectedUsuario, {
        tipoHorario,
        horarios: horariosArray
      });
      
      toast.success('Horarios guardados correctamente');
      await loadHorarios();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-800">
            Gestión de Horarios Laborales
          </h2>
        </div>
      </div>

      {/* Selector de Usuario */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Seleccionar Usuario
        </label>
        <select
          value={selectedUsuario || ''}
          onChange={(e) => setSelectedUsuario(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={loading}
        >
          <option value="">-- Seleccionar usuario --</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>
              {u.nombreCompleto} ({u.nombreUsuario}) - {u.rol?.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedUsuario && (
        <>
          {/* Selector de Tipo de Horario */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Tipo de Horario
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIPOS_HORARIO.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tipoHorario === tipo.value;
                
                return (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoHorario(tipo.value)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        isSelected ? 'text-primary-600' : 'text-neutral-600'
                      }`} />
                      <div className="flex-1">
                        <div className={`font-semibold text-sm mb-1 ${
                          isSelected ? 'text-primary-900' : 'text-neutral-900'
                        }`}>
                          {tipo.label}
                        </div>
                        <div className="text-xs text-neutral-600">
                          {tipo.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-semibold mb-1">Configuración de Horarios</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Semanal:</strong> Horario fijo que se repite cada semana</li>
                  <li><strong>Mensual:</strong> Horarios variables que se repiten cada mes (ej: día 15 de cada mes)</li>
                  <li><strong>Diario:</strong> Horarios específicos para fechas puntuales (ej: 25/12/2025)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contenido según tipo */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Tabla para horarios semanales */}
              {tipoHorario === 'semanal' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Día</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hora Inicio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hora Fin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Horas Objetivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Activo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {DIAS_SEMANA.map(dia => {
                        const horarioDia = horarios[dia.id] || {};
                        const isActive = horarioDia.activo !== false;
                        
                        return (
                          <tr
                            key={dia.id}
                            className={!isActive ? 'bg-neutral-50 opacity-60' : ''}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-neutral-900">{dia.nombre}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="time"
                                value={horarioDia.horaInicio || '08:00'}
                                onChange={(e) => handleHorarioChange(dia.id, 'horaInicio', e.target.value)}
                                className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={!isActive}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="time"
                                value={horarioDia.horaFin || '17:00'}
                                onChange={(e) => handleHorarioChange(dia.id, 'horaFin', e.target.value)}
                                className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={!isActive}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={horarioDia.horasObjetivo || 8}
                                onChange={(e) => handleHorarioChange(dia.id, 'horasObjetivo', parseFloat(e.target.value))}
                                className="w-20 px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={!isActive}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => handleHorarioChange(dia.id, 'activo', e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tabla para horarios variables (mensual/diario) */}
              {(tipoHorario === 'mensual' || tipoHorario === 'diario') && (
                <div className="space-y-4">
                  {horariosVariables.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      No hay horarios configurados. Haz clic en "Agregar Horario".
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                              {tipoHorario === 'mensual' ? 'Día del Mes' : 'Fecha'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hora Inicio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hora Fin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Horas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Activo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {horariosVariables.map((h, index) => {
                            const isActive = h.activo !== false;
                            
                            return (
                              <tr
                                key={index}
                                className={!isActive ? 'bg-neutral-50 opacity-60' : ''}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="date"
                                    value={h.fechaEspecifica}
                                    onChange={(e) => handleVariableChange(index, 'fechaEspecifica', e.target.value)}
                                    className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="time"
                                    value={h.horaInicio}
                                    onChange={(e) => handleVariableChange(index, 'horaInicio', e.target.value)}
                                    className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    disabled={!isActive}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="time"
                                    value={h.horaFin}
                                    onChange={(e) => handleVariableChange(index, 'horaFin', e.target.value)}
                                    className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    disabled={!isActive}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    value={h.horasObjetivo}
                                    onChange={(e) => handleVariableChange(index, 'horasObjetivo', parseFloat(e.target.value))}
                                    className="w-20 px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    disabled={!isActive}
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => handleVariableChange(index, 'activo', e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button
                                    onClick={() => removeVariableHorario(index)}
                                    className="text-red-600 hover:text-red-800 p-2"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <button
                    onClick={addVariableHorario}
                    className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Horario
                  </button>
                </div>
              )}
            </>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setSelectedUsuario(null)}
              className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Horarios'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}