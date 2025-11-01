import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { getTodayLocal, getDaysAgoLocal } from '../utils/dateUtils';

/**
 * Panel de filtros reutilizable para estadísticas
 */
export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  users = [], 
  campaigns = [],
  roles = [],
  supervisors = [],
  onExport,
  onSearch,
  showUserFilter = true,
  showCampaignFilter = true,
  showRoleFilter = false,
  showSupervisorFilter = false
}) {
  
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-neutral-600" />
        <h3 className="text-lg font-semibold text-neutral-900">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.fechaInicio || ''}
            onChange={(e) => handleChange('fechaInicio', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Fecha Fin */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.fechaFin || ''}
            onChange={(e) => handleChange('fechaFin', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Usuario */}
        {showUserFilter && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Usuario
            </label>
            <select
              value={filters.usuarioId || ''}
              onChange={(e) => handleChange('usuarioId', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los usuarios</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombreCompleto}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campaña */}
        {showCampaignFilter && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Campaña
            </label>
            <select
              value={filters.campañaId || ''}
              onChange={(e) => handleChange('campañaId', e.target.value)}
              className="input-field"
            >
              <option value="">Todas las campañas</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Rol */}
        {showRoleFilter && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Rol
            </label>
            <select
              value={filters.rolId || ''}
              onChange={(e) => handleChange('rolId', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Supervisor */}
        {showSupervisorFilter && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Supervisor
            </label>
            <select
              value={filters.supervisorId || ''}
              onChange={(e) => handleChange('supervisorId', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los supervisores</option>
              {supervisors.map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.nombreCompleto}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4 pt-4 border-t border-neutral-200">
        {/* Rango rápido */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Rango rápido:</span>
          <button
            type="button"
            onClick={() => {
              const d = getTodayLocal();
              onFilterChange({ ...filters, fechaInicio: d, fechaFin: d });
            }}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => {
              const e = getTodayLocal();
              const s = getDaysAgoLocal(6);
              onFilterChange({ ...filters, fechaInicio: s, fechaFin: e });
            }}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Últimos 7 días
          </button>
        </div>

        <div className="flex gap-3 md:ml-auto">
        <button
          onClick={onSearch}
          className="btn-primary flex items-center gap-2"
        >
          <Search size={18} />
          <span>Buscar</span>
        </button>

        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            <span>Exportar a Excel</span>
          </button>
        )}

        <button
          onClick={() => onFilterChange({
            fechaInicio: '',
            fechaFin: '',
            usuarioId: '',
            campañaId: '',
            rolId: '',
            supervisorId: ''
          })}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
        >
          Limpiar Filtros
        </button>
        </div>
      </div>
    </div>
  );
}
