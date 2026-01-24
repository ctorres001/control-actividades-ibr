import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Users, Activity, Target, BarChart3, LogOut, ListTree, Shield, Clock, FileSpreadsheet } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import FilterPanel from '../components/FilterPanel';
import ActivityChart from '../components/ActivityChart';
import TimeDistribution from '../components/TimeDistribution';
import UserManagement from '../components/UserManagement';
import ActivityManagement from '../components/ActivityManagement';
import CampaignManagement from '../components/CampaignManagement';
import SubactivityManagement from '../components/SubactivityManagement';
import RoleManagement from '../components/RoleManagement';
import HorariosManagement from '../components/HorariosManagement';
import ExportDetailModal from '../components/ExportDetailModal';
import statsService from '../services/statsService';
import { calculateWorkStats, formatDuration } from '../utils/timeCalculations';
import { getTodayLocal } from '../utils/dateUtils';
import CampaignAsesorView from '../components/CampaignAsesorView';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Tab activo
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'users' | 'activities' | 'campaigns' | 'subactivities' | 'roles' | 'horarios' | 'export'
  
  // Estados para exportación
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados para estadísticas
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [roles, setRoles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [viewMode, setViewMode] = useState('consolidated'); // 'consolidated' | 'detailed' | 'campaign'
  
  // Filtros (admin tiene más opciones)
  const [filters, setFilters] = useState({
    fechaInicio: getTodayLocal(),
    fechaFin: getTodayLocal(),
    usuarioId: '',
    campañaId: '',
    rolId: '',
    supervisorId: ''
  });

  useEffect(() => {
    if (activeTab === 'stats') {
      loadFilterData();
    }
  }, [activeTab]);

  const loadFilterData = async () => {
    try {
      const [usersData, campaignsData, rolesData, supervisorsData] = await Promise.all([
        statsService.getUsers(),
        statsService.getCampaigns(),
        statsService.getRoles(),
        statsService.getSupervisors()
      ]);
      setUsers(usersData);
      setCampaigns(campaignsData);
      setRoles(rolesData);
      setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error cargando datos de filtros:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await statsService.getStats(filters);
      setRegistros(data);
      
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
      statsService.exportToExcel(registros, 'estadisticas_admin', {
        groupBy: filters.usuarioId ? 'date' : 'user',
        includeDetails: true,
        includeSummary: true, // Incluir hoja Resumen
        includeActivitySheet: true, // Incluir hoja Por Actividad
        excludeActivities: ['Ingreso', 'Regreso Break']
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

  const tabs = [
    { id: 'stats', label: 'Estadísticas', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    // { id: 'activities', label: 'Actividades', icon: <Activity className="w-5 h-5" /> }, // ⚠️ OCULTO: No modificar para evitar afectar la app
    { id: 'campaigns', label: 'Campañas', icon: <Target className="w-5 h-5" /> },
    { id: 'subactivities', label: 'Subactividades', icon: <ListTree className="w-5 h-5" /> },
    // { id: 'roles', label: 'Roles', icon: <Shield className="w-5 h-5" /> }, // ⚠️ OCULTO: Los roles son núcleo del sistema (Asesor, Supervisor, Administrador) y no deben modificarse
    { id: 'horarios', label: 'Horarios', icon: <Clock className="w-5 h-5" /> }
    // { id: 'export', label: 'Exportar', icon: <FileSpreadsheet className="w-5 h-5" /> } // ⚠️ OCULTO: Exportación disponible desde botón en vista de estadísticas
  ];

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
                  {user?.nombreCompleto} - {user?.rol}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab de Estadísticas */}
        {activeTab === 'stats' && (
          <>
            {/* Filtros con todas las opciones de admin */}
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              users={users}
              campaigns={campaigns}
              roles={roles}
              supervisors={supervisors}
              onExport={handleExport}
              onSearch={handleSearch}
              showUserFilter={true}
              showCampaignFilter={true}
              showRoleFilter={true}
              showSupervisorFilter={true}
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
                    icon={<BarChart3 />}
                    color="blue"
                  />
                  <StatsCard
                    title="Tiempo Trabajado"
                    value={formatDuration(stats.workTime)}
                    subtitle="Actividades productivas"
                    icon={<Activity />}
                    color="green"
                  />
                  <StatsCard
                    title="Porcentaje Neto"
                    value={`${stats.workPercentage.toFixed(1)}%`}
                    subtitle="Eficiencia de trabajo"
                    icon={<Target />}
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
          </>
        )}

        {/* Tab de Gestión de Usuarios */}
        {activeTab === 'users' && <UserManagement />}

        {/* Tab de Gestión de Actividades */}
        {/* ⚠️ OCULTO: No modificar actividades para evitar afectar la aplicación */}
        {/* {activeTab === 'activities' && <ActivityManagement />} */}

        {/* Tab de Gestión de Campañas */}
        {activeTab === 'campaigns' && <CampaignManagement />}

  {/* Tab de Gestión de Subactividades */}
  {activeTab === 'subactivities' && <SubactivityManagement />}

  {/* Tab de Gestión de Roles - OCULTO: Los roles núcleo (Asesor, Supervisor, Administrador) no deben modificarse */}
  {/* {activeTab === 'roles' && <RoleManagement />} */}

  {/* Tab de Gestión de Horarios */}
  {activeTab === 'horarios' && <HorariosManagement />}

  {/* Tab de Exportación - OCULTO: Exportación disponible desde botón en vista de estadísticas */}
  {/* {activeTab === 'export' && (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-800">
            Exportar Reportes Detallados
          </h2>
        </div>
      </div>
      <div className="max-w-2xl">
        <p className="text-neutral-600 mb-6">
          Descarga reportes detallados con cada registro individual de actividad. 
          Ideal para análisis estadístico, cálculo de tiempos promedio y comparación entre asesores.
        </p>
        <button
          onClick={() => setShowExportModal(true)}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Abrir Exportador
        </button>
      </div>
    </div>
  )} */}

  {/* Modal de Exportación */}
  <ExportDetailModal 
    isOpen={showExportModal} 
    onClose={() => setShowExportModal(false)} 
  />
      </div>
    </div>
  );
}
