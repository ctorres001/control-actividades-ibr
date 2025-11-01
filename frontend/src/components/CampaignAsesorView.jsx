import React, { useState, useEffect, useCallback } from 'react';
import { Users, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDuration } from '../utils/timeCalculations';
import api from '../services/api';

/**
 * Vista por Campaña y Asesor - Muestra asesores conectados con sus estadísticas
 */
export default function CampaignAsesorView({ filters = {} }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [collapsed, setCollapsed] = useState({}); // { [campaignName]: boolean }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Llamar al backend con el cliente API (incluye token y baseURL)
      const response = await api.get('/stats/asesores-activos', { params: filters });
      const result = response.data || {};
      setData(result.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando asesores activos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [loadData]);

  const groupedByCampaign = data.reduce((acc, asesor) => {
    const campaign = asesor.campañaNombre || 'Sin campaña';
    if (!acc[campaign]) {
      acc[campaign] = [];
    }
    acc[campaign].push(asesor);
    return acc;
  }, {});

  // Asegurar que las campañas nuevas tengan estado por defecto (expandido)
  useEffect(() => {
    const updates = {};
    for (const campaign of Object.keys(groupedByCampaign)) {
      if (collapsed[campaign] === undefined) updates[campaign] = false;
    }
    if (Object.keys(updates).length) setCollapsed((prev) => ({ ...prev, ...updates }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Object.keys(groupedByCampaign))]);

  const toggleCampaign = (campaign) => {
    setCollapsed((prev) => ({ ...prev, [campaign]: !prev[campaign] }));
  };

  const expandAll = () => {
    const next = {};
    for (const c of Object.keys(groupedByCampaign)) next[c] = false;
    setCollapsed(next);
  };

  const collapseAll = () => {
    const next = {};
    for (const c of Object.keys(groupedByCampaign)) next[c] = true;
    setCollapsed(next);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Asesores por Campaña</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Última actualización: {lastUpdate ? lastUpdate.toLocaleTimeString('es-ES') : '-'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium"
            title="Expandir todo"
          >
            Expandir todo
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium"
            title="Contraer todo"
          >
            Contraer todo
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Activity size={18} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Indicador de carga */}
      {loading && data.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-neutral-600">Cargando asesores...</p>
        </div>
      )}

      {/* Tarjetas por campaña */}
      {Object.keys(groupedByCampaign).length === 0 && !loading ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
          <Users size={48} className="mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-600 font-medium">No hay asesores con actividad registrada</p>
          <p className="text-sm text-neutral-500 mt-2">
            Los asesores aparecerán aquí cuando inicien su jornada
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCampaign).map(([campaign, asesores]) => (
            <div key={campaign} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              {/* Header de campaña con compresor */}
              <button
                type="button"
                onClick={() => toggleCampaign(campaign)}
                className="w-full text-left bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 hover:from-primary-700 hover:to-primary-800 focus:outline-none"
                aria-expanded={!collapsed[campaign]}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    {collapsed[campaign] ? (
                      <ChevronRight size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                    <Users size={22} className="opacity-90" />
                    <span className="truncate">{campaign}</span>
                  </h3>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-semibold">
                    {asesores.length} {asesores.length === 1 ? 'asesor' : 'asesores'}
                  </span>
                </div>
              </button>

              {/* Lista de asesores */}
              {!collapsed[campaign] && (
                <div className="divide-y divide-neutral-200">
                  {asesores.map((asesor) => (
                    <div key={asesor.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between">
                        {/* Info del asesor */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-700 font-bold text-lg">
                                {asesor.nombreCompleto?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-neutral-800">{asesor.nombreCompleto}</h4>
                              <p className="text-sm text-neutral-500">@{asesor.nombreUsuario}</p>
                            </div>
                          </div>

                          {/* Actividad actual */}
                          {asesor.actividadActual && (
                            <div className="ml-13 mb-3">
                              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-green-800">
                                  {asesor.actividadActual.nombreActividad}
                                </span>
                                {asesor.actividadActual.duracionActual && (
                                  <span className="text-xs text-green-600">
                                    ({formatDuration(asesor.actividadActual.duracionActual)})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Estadísticas del día */}
                          <div className="ml-13 grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-neutral-500">Tiempo Total</p>
                              <p className="text-sm font-semibold text-neutral-800">
                                {formatDuration(asesor.tiempoTotal || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Productivo</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatDuration(asesor.tiempoProductivo || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Auxiliar</p>
                              <p className="text-sm font-semibold text-amber-600">
                                {formatDuration(asesor.tiempoAuxiliar || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Badge de estado */}
                        <div className="flex-shrink-0">
                          {asesor.actividadActual ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
