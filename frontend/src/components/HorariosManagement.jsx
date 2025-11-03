import { useState, useEffect } from 'react';
import { Clock, Save, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes', abrev: 'Lun' },
  { id: 2, nombre: 'Martes', abrev: 'Mar' },
  { id: 3, nombre: 'Miércoles', abrev: 'Mié' },
  { id: 4, nombre: 'Jueves', abrev: 'Jue' },
  { id: 5, nombre: 'Viernes', abrev: 'Vie' },
  { id: 6, nombre: 'Sábado', abrev: 'Sáb' },
  { id: 7, nombre: 'Domingo', abrev: 'Dom' }
];

export default function HorariosManagement() {
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (selectedUsuario) {
      loadHorarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUsuario]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadHorarios = async () => {
    try {
      setLoading(true);
      const response = await adminService.getHorariosUsuario(selectedUsuario);
      
      // Convertir array a objeto indexado por diaSemana
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
      
      // Inicializar días que no tienen horario con valores por defecto
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
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.error('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleHorarioChange = (diaSemana, field, value) => {
    setHorarios(prev => ({
      ...prev,
      [diaSemana]: {
        ...prev[diaSemana],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedUsuario) {
      toast.error('Selecciona un usuario');
      return;
    }

    try {
      setSaving(true);
      
      // Convertir objeto a array para el backend
      const horariosArray = Object.entries(horarios).map(([diaSemana, data]) => ({
        diaSemana: parseInt(diaSemana),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        horasObjetivo: parseFloat(data.horasObjetivo),
        activo: data.activo
      }));

      await adminService.upsertHorariosUsuario(selectedUsuario, horariosArray);
      toast.success('Horarios guardados correctamente');
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      toast.error('Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
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
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-blue-800">
                <p className="font-semibold mb-1">Configuración de Horarios</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Hora Inicio/Fin:</strong> Define el rango de horario laboral del día</li>
                  <li><strong>Horas Objetivo:</strong> Horas que debe trabajar ese día (ej: 8.00)</li>
                  <li><strong>Activo:</strong> Si está desactivado, ese día no se considerará para reportes</li>
                  <li><strong>Límite:</strong> Las actividades no contarán después de la hora fin configurada</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tabla de Horarios */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Día
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Hora Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Hora Fin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Horas Objetivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Activo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {DIAS_SEMANA.map(dia => {
                    const horarioDia = horarios[dia.id] || {};
                    return (
                      <tr key={dia.id} className={!horarioDia.activo ? 'bg-neutral-50 opacity-60' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-neutral-900">{dia.nombre}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="time"
                            value={horarioDia.horaInicio || '08:00'}
                            onChange={(e) => handleHorarioChange(dia.id, 'horaInicio', e.target.value)}
                            className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            disabled={!horarioDia.activo}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="time"
                            value={horarioDia.horaFin || '17:00'}
                            onChange={(e) => handleHorarioChange(dia.id, 'horaFin', e.target.value)}
                            className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            disabled={!horarioDia.activo}
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
                            className="w-20 px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            disabled={!horarioDia.activo}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={horarioDia.activo || false}
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
