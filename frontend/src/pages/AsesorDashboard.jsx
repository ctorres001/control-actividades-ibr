import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import activityService from '../services/activityService';
import ActivityGrid from '../components/ActivityGrid';
import SubactivityModal from '../components/SubactivityModal';
import TimerSync from '../components/TimerSync';
import DailySummary from '../components/DailySummary';
import Timeline from '../components/Timeline';
import ChartBar from '../components/ChartBar';
import { toast } from 'react-hot-toast';

export default function AsesorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [currentRegistroId, setCurrentRegistroId] = useState(null);
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [currentActivityName, setCurrentActivityName] = useState(null);
  const [currentStartOffset, setCurrentStartOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState(null);
  const [summary, setSummary] = useState([]);
  const [log, setLog] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dayStarted = log?.some((r) => (r.nombreActividad || r.nombre_actividad) === 'Ingreso');
  const breakActive = currentActivityName === 'Break Salida';

  const loadActivities = useCallback(async () => {
    try {
      const res = await activityService.getActiveActivities();
      setActivities(res || []);
    } catch (err) {
      // Silencioso en carga inicial; el interceptor mostrará si es persistente
      console.warn('loadActivities error', err?.message);
    }
  }, []);

  const loadSummaryAndLog = useCallback(async () => {
    const date = new Date().toISOString().slice(0,10);
    try {
      const s = await activityService.getSummary(date);
      setSummary(s || []);
    } catch (err) {
      console.warn('summary error', err?.message);
    }
    try {
      const l = await activityService.getLog(date);
      setLog(l || []);
    } catch (err) {
      console.warn('log error', err?.message);
    }
  }, []);

  const restoreOpen = useCallback(async () => {
    const date = new Date().toISOString().slice(0,10);
    try {
      const res = await activityService.getOpenActivity(date);
      if (res && res.id) {
        setCurrentRegistroId(res.id);
        setCurrentActivityId(res.actividadId);
        setCurrentActivityName(res.actividad?.nombreActividad || 'Actividad');
        // Calcular segundos transcurridos
        // La hora viene en formato ISO (UTC), la convertimos a Date local
        if (res.horaInicio) {
          const start = new Date(res.horaInicio); // Automáticamente convierte UTC a local
          const now = new Date();
          const secondsElapsed = Math.floor((now - start) / 1000);
          setCurrentStartOffset(secondsElapsed);
        }
      }
    } catch (err) {
      console.debug('restoreOpen error', err);
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      setIsLoading(true);
      await Promise.all([
        loadActivities(),
        loadSummaryAndLog(),
        restoreOpen()
      ]);
      setIsLoading(false);
    };
    initDashboard();
  }, [loadActivities, loadSummaryAndLog, restoreOpen]);

  const handleStartClick = async (activity) => {
    // Si la jornada ya finalizó, no permitir iniciar más actividades
    if (currentActivityName === 'Jornada Finalizada') {
      toast.error('La jornada ya ha finalizado', { id: 'jornada-finalizada' });
      return;
    }

    // Bloquear botones durante el inicio
    setIsStarting(true);

    // Feedback visual inmediato
    const toastId = toast.loading(`Iniciando ${activity.nombreActividad}...`, { id: 'starting-activity' });

    // Si la actividad es "Salida", manejar caso especial
    if (activity.nombreActividad === 'Salida') {
      try {
        // Detener actividad actual si existe
        if (currentRegistroId) {
          await activityService.stopActivity();
        }
        
        // Iniciar y detener "Salida" inmediatamente
        const res = await activityService.startActivity({ actividadId: activity.id });
        if (res && res.id) {
          await activityService.stopActivity();
          setCurrentRegistroId(null);
          setCurrentActivityId(null);
          setCurrentActivityName('Jornada Finalizada');
          setCurrentStartOffset(0);
          toast.success('✅ Salida registrada. ¡Jornada finalizada!', { id: toastId });
          loadSummaryAndLog();
        }
      } catch (err) {
        console.error(err);
        toast.error('No se pudo registrar la salida', { id: toastId });
      } finally {
        setIsStarting(false);
      }
      return;
    }

    // Si necesita detalles (subactividad), abrir modal
    const activitiesWithDetails = ['Seguimiento','Bandeja de Correo','Reportes','Auxiliares'];
    if (activitiesWithDetails.includes(activity.nombreActividad)) {
      toast.dismiss(toastId);
      setPendingActivity(activity);
      setShowModal(true);
      setIsStarting(false); // Liberar bloqueo al abrir modal
      return;
    }

    // Iniciar actividad normal
    try {
      // Detener actividad actual si existe
      if (currentRegistroId) {
        await activityService.stopActivity();
      }

      const res = await activityService.startActivity({ actividadId: activity.id });
      if (res && res.id) {
        setCurrentRegistroId(res.id);
        setCurrentActivityId(activity.id);
        setCurrentActivityName(activity.nombreActividad);
        setCurrentStartOffset(0); // Reiniciar desde 0
        toast.success(`✅ ${activity.nombreActividad} iniciada`, { id: toastId });
        loadSummaryAndLog();
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudo iniciar la actividad', { id: toastId });
    } finally {
      setIsStarting(false);
    }
  };

  const handleConfirmModal = async ({ subactivityId, comment }) => {
    setShowModal(false);
    if (!pendingActivity) return;
    
    setIsStarting(true);
    try {
      // Detener actividad actual si existe
      if (currentRegistroId) {
        await activityService.stopActivity();
      }
      
      const payload = { 
        actividadId: pendingActivity.id, 
        subactividadId: subactivityId, 
        observaciones: comment 
      };
      
      const res = await activityService.startActivity(payload);
      if (res && res.id) {
        setCurrentRegistroId(res.id);
        setCurrentActivityId(pendingActivity.id);
        setCurrentActivityName(pendingActivity.nombreActividad);
        setCurrentStartOffset(0);
        toast.success(`✅ ${pendingActivity.nombreActividad} iniciada`, { id: 'start-with-details-success' });
        loadSummaryAndLog();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error iniciando actividad con detalles', { id: 'start-with-details-error' });
    } finally {
      setPendingActivity(null);
      setIsStarting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <div className="p-6 relative">
      {/* Spinner global de carga */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <div className="mt-4 text-lg font-semibold text-blue-600">Cargando dashboard...</div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-between items-start">
        <div className="flex items-start gap-3">
          <img src="/ibr-logo.png" alt="IBR" className="h-12 w-12 object-contain" />
          <div>
            <h2 className="text-2xl font-bold leading-tight">Control de Actividades</h2>
            <div className="text-sm text-neutral-600">
              {(user?.nombreCompleto || user?.nombre_completo) || 'Usuario'}
              {(() => {
                const r = (user?.role || user?.rol || '').toString().toLowerCase();
                const map = { asesor: 'Asesor', supervisor: 'Supervisor', admin: 'Administrador', administrador: 'Administrador' };
                const label = map[r] || (r ? r.charAt(0).toUpperCase() + r.slice(1) : '');
                return label ? ` • ${label}` : '';
              })()}
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Registrar Actividad</h3>
            <ActivityGrid 
              activities={activities} 
              currentActivityId={currentActivityId} 
              onStart={handleStartClick}
              jornalFinished={currentActivityName === 'Jornada Finalizada'}
              disabled={isStarting}
              dayStarted={!!dayStarted}
              breakActive={!!breakActive}
            />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Línea de tiempo (Historial)</h3>
            <div className="bg-white rounded shadow p-3 max-h-[48rem] overflow-y-auto">
              <Timeline log={log} currentRegistroId={currentRegistroId} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Estado actual</h3>
            {currentActivityName === 'Jornada Finalizada' ? (
              <div className="p-4 bg-neutral-100 rounded-lg text-center">
                <div className="text-lg font-semibold text-neutral-700">✅ Jornada Finalizada</div>
                <div className="text-sm text-neutral-500 mt-1">Has marcado tu salida</div>
              </div>
            ) : currentRegistroId ? (
              <>
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Actividad en curso:</div>
                  <div className="text-lg font-bold text-blue-900">{currentActivityName || 'Actividad'}</div>
                </div>
                <TimerSync key={currentRegistroId} initialOffsetSeconds={currentStartOffset} />
              </>
            ) : (
              <div className="p-3 bg-neutral-100 rounded text-center text-neutral-600">Sin actividad en curso</div>
            )}
          </div>

          <div className="mb-4">
            <DailySummary summary={summary} totalRegistros={log.length} />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Distribución de Tiempo</h3>
            <ChartBar data={summary} />
          </div>
        </div>
      </div>

      {showModal && pendingActivity ? (
        <SubactivityModal activity={pendingActivity} loadSubactivities={(id)=>activityService.getSubactivities(id).then(r=>r.data||r)} onCancel={()=>setShowModal(false)} onConfirm={handleConfirmModal} />
      ) : null}
    </div>
  );
}
