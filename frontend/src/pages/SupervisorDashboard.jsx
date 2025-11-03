import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import StatsCard from '../components/StatsCard';
import FilterPanel from '../components/FilterPanel';
import ActivityChart from '../components/ActivityChart';
import TimeDistribution from '../components/TimeDistribution';
import statsService from '../services/statsService';
import { calculateWorkStats, formatDuration } from '../utils/timeCalculations';
import { TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';
import { getTodayLocal } from '../utils/dateUtils';
import CampaignAsesorView from '../components/CampaignAsesorView';

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [viewMode, setViewMode] = useState('consolidated'); // 'consolidated' | 'detailed' | 'campaign'
  
  // Filtros
  const [filters, setFilters] = useState({
    fechaInicio: getTodayLocal(),
    fechaFin: getTodayLocal(),
    usuarioId: '',
    campañaId: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadFilterData();
  }, []);

  // Buscar automáticamente al cambiar filtros de fecha
  useEffect(() => {
    if (users.length > 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.fechaInicio, filters.fechaFin]);

  const loadFilterData = async () => {
    try {
      const [usersData, campaignsData] = await Promise.all([
        statsService.getUsers(),
        statsService.getCampaigns()
      ]);
      setUsers(usersData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error cargando datos de filtros:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await statsService.getStats(filters);
      setRegistros(data);
      
      // Calcular estadísticas
      const calculatedStats = calculateWorkStats(data);
      setStats(calculatedStats);
      
      if (data.length === 0) {
        toast('No se encontraron registros para los filtros seleccionados', {
          icon: 'ℹ️',
          id: 'no-data'
        });
      }
    } catch (error) {
      console.error('Error al buscar estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (registros.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      statsService.exportToExcel(registros, 'estadisticas_supervisor', {
        groupBy: filters.usuarioId ? 'date' : 'user',
        includeDetails: true,
        includeSummary: true
      });
      toast.success('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar datos');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img src="/ibr-logo.png" alt="IBR" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-primary-700">Control de Actividades</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  {user?.nombreCompleto} - {user?.campaña?.nombre || 'Sin campaña'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Filtros */}
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          users={users}
          campaigns={campaigns}
          onExport={handleExport}
          onSearch={handleSearch}
          showUserFilter={true}
          showCampaignFilter={true}
        />

        {/* Tabs de vista */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('consolidated')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'consolidated'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Vista Consolidada
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'detailed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Vista Detallada
          </button>
          <button
            onClick={() => setViewMode('campaign')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'campaign'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Campaña y Asesor
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Estadísticas */}
        {!loading && stats && viewMode !== 'campaign' && (
          <>
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Tiempo Total"
                value={formatDuration(stats.totalTime)}
                subtitle="Ingreso a Salida"
                icon={<Clock />}
                color="blue"
              />
              <StatsCard
                title="Tiempo Trabajado"
                value={formatDuration(stats.workTime)}
                subtitle="Actividades productivas"
                icon={<TrendingUp />}
                color="green"
              />
              <StatsCard
                title="Porcentaje Neto"
                value={`${stats.workPercentage.toFixed(1)}%`}
                subtitle="Eficiencia de trabajo"
                icon={<BarChart3 />}
                color={stats.workPercentage >= 70 ? 'green' : stats.workPercentage >= 50 ? 'orange' : 'red'}
              />
              <StatsCard
                title="Actividades"
                value={stats.activities.filter(a => a.isWork).length}
                subtitle="Distintas registradas"
                icon={<Users />}
                color="purple"
              />
            </div>

            {/* Vista Consolidada */}
            {viewMode === 'consolidated' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ActivityChart
                  data={stats.activities}
                  type="bar"
                  title="Tiempo por Actividad"
                />
                <ActivityChart
                  data={stats.activities.filter(a => a.isWork)}
                  type="pie"
                  title="Distribución Tiempo Trabajado"
                />
              </div>
            )}

            {/* Vista Detallada */}
            <TimeDistribution
              activities={stats.activities}
              totalTime={stats.totalTime}
            />

            {/* Información adicional */}
            {stats.firstEntry && stats.lastExit && (
              <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-600">Primera entrada:</span>
                    <span className="ml-2 font-medium text-neutral-900">
                      {new Date(stats.firstEntry).toLocaleTimeString('es-PE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Última salida:</span>
                    <span className="ml-2 font-medium text-neutral-900">
                      {new Date(stats.lastExit).toLocaleTimeString('es-PE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Total registros:</span>
                    <span className="ml-2 font-medium text-neutral-900">
                      {registros.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Vista por Campaña y Asesor */}
        {viewMode === 'campaign' && (
          <div className="mb-6">
            <CampaignAsesorView filters={{ campañaId: filters.campañaId }} />
          </div>
        )}

        {/* Empty State */}
        {!loading && !stats && viewMode !== 'campaign' && (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No hay datos para mostrar
            </h3>
            <p className="text-neutral-600">
              Selecciona filtros y haz clic en "Buscar" para ver las estadísticas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
