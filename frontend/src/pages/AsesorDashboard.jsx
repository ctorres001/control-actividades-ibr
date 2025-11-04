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
// import { getTodayLocal } from '../utils/dateUtils';

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
  // Día iniciado: considerar tanto el log como el estado local inmediato tras iniciar "Ingreso"
  const dayStartedFromLog = log?.some((r) => (r.nombreActividad || r.nombre_actividad) === 'Ingreso');
  const dayStarted = dayStartedFromLog || currentActivityName === 'Ingreso' || !!currentRegistroId;
  const breakActive = currentActivityName === 'Break Salida';
  // Verificar si ya se marcó salida (desde el log o estado local)
  const hasSalidaInLog = log?.some((r) => (r.nombreActividad || r.nombre_actividad) === 'Salida');
  const jornalFinished = currentActivityName === 'Jornada Finalizada' || hasSalidaInLog;

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
    // No enviamos fecha desde el cliente para evitar desfases de zona horaria.
    // El backend calculará la fecha local del servidor de forma consistente.
    try {
      const s = await activityService.getSummary();
      setSummary(s || []);
    } catch (err) {
      console.warn('summary error', err?.message);
    }
    try {
      const l = await activityService.getLog();
      setLog(l || []);
    } catch (err) {
      console.warn('log error', err?.message);
    }
  }, []);

  const restoreOpen = useCallback(async () => {
    try {
      const res = await activityService.getOpenActivity();
      console.log('🔍 restoreOpen response:', res);
      
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
          console.log('✅ Actividad restaurada:', res.actividad?.nombreActividad, 'Offset:', secondsElapsed);
        }
      } else {
        console.log('ℹ️ No hay actividad activa para restaurar');
      }
    } catch (err) {
      console.error('❌ Error en restoreOpen:', err);
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
    if (jornalFinished) {
      toast.error('La jornada ya ha finalizado', { id: 'jornada-finalizada' });
      return;
    }

    // Bloquear botones durante el inicio
    setIsStarting(true);

    // Feedback visual inmediato
    const toastId = toast.loading(`Iniciando ${activity.nombreActividad}...`, { id: 'starting-activity' });

    try {
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
            await loadSummaryAndLog();
          }
        } catch (err) {
          console.error('❌ Error en Salida:', err);
          toast.error('No se pudo registrar la salida', { id: toastId });
        }
        return;
      }

      // 🔄 NUEVO: Intentar cargar subactividades para TODOS los botones de jornada
      // Solo mostrar modal si hay subactividades disponibles
      const workButtons = ['Seguimiento', 'Bandeja de Correo', 'Reportes', 'Auxiliares', 'Revisión', 'Gestión', 'Reunión', 'Incidencia', 'Pausa', 'Caso Nuevo'];
      
      if (workButtons.includes(activity.nombreActividad)) {
        try {
          // Intentar cargar subactividades
          const subactividades = await activityService.getSubactivities(activity.id);
          const hasSubactivities = subactividades && subactividades.data && subactividades.data.length > 0;
          
          if (hasSubactivities) {
            // Hay subactividades, abrir modal
            toast.dismiss(toastId);
            setPendingActivity(activity);
            setShowModal(true);
            return; // No resetear isStarting aquí, se hace al cerrar/confirmar modal
          }
          
          // No hay subactividades, continuar con inicio normal (sin modal)
          console.log(`ℹ️ ${activity.nombreActividad} sin subactividades, iniciando directamente`);
        } catch (err) {
          console.warn(`⚠️ Error verificando subactividades para ${activity.nombreActividad}:`, err);
          // En caso de error, continuar sin modal
        }
      }

      // Iniciar actividad normal
      try {
        // Detener actividad actual si existe
        if (currentRegistroId) {
          await activityService.stopActivity();
        }

        const res = await activityService.startActivity({ actividadId: activity.id });
        console.log('🔍 Respuesta de startActivity:', res);
        
        if (res && res.id) {
          setCurrentRegistroId(res.id);
          setCurrentActivityId(activity.id);
          setCurrentActivityName(activity.nombreActividad);
          setCurrentStartOffset(0); // Reiniciar desde 0
          
          console.log('✅ Estado actualizado:', {
            currentRegistroId: res.id,
            currentActivityId: activity.id,
            currentActivityName: activity.nombreActividad,
            currentStartOffset: 0
          });
          
          toast.success(`✅ ${activity.nombreActividad} iniciada`, { id: toastId });
          await loadSummaryAndLog(); // Esperar a que termine la recarga
          // Protección contra caché de 2-3s en backend: si aún no refleja "Ingreso", forzar enable con estado local
          if (activity.nombreActividad === 'Ingreso' && !dayStartedFromLog) {
            console.log('ℹ️ dayStarted activado por estado local (caché en backend)');
          }
        } else {
          console.error('❌ Respuesta sin ID:', res);
          toast.error('Error: respuesta inválida del servidor', { id: toastId });
        }
      } catch (err) {
        console.error('❌ Error iniciando actividad:', err);
        toast.error('No se pudo iniciar la actividad', { id: toastId });
      }
    } catch (err) {
      console.error('❌ Error general:', err);
      toast.error('Error inesperado', { id: toastId });
    } finally {
      // IMPORTANTE: Siempre resetear isStarting
      console.log('🔓 Reseteando isStarting a false');
      setIsStarting(false);
    }
  };

  const handleConfirmModal = async ({ subactivityId, idClienteReferencia, resumenBreve }) => {
    setShowModal(false);
    if (!pendingActivity) return;
    
    setIsStarting(true);
    const toastId = toast.loading(`Iniciando ${pendingActivity.nombreActividad}...`, { id: 'starting-activity-details' });
    
    try {
      // Detener actividad actual si existe
      if (currentRegistroId) {
        await activityService.stopActivity();
      }
      
      const payload = { 
        actividadId: pendingActivity.id, 
        subactividadId: subactivityId, 
        idClienteReferencia: idClienteReferencia,
        resumenBreve: resumenBreve
      };
      
      console.log('🔍 Iniciando actividad con detalles:', payload);
      const res = await activityService.startActivity(payload);
      console.log('🔍 Respuesta de startActivity (con detalles):', res);
      
      if (res && res.id) {
        setCurrentRegistroId(res.id);
        setCurrentActivityId(pendingActivity.id);
        setCurrentActivityName(pendingActivity.nombreActividad);
        setCurrentStartOffset(0);
        
        console.log('✅ Estado actualizado (con detalles):', {
          currentRegistroId: res.id,
          currentActivityId: pendingActivity.id,
          currentActivityName: pendingActivity.nombreActividad
        });
        
        toast.success(`✅ ${pendingActivity.nombreActividad} iniciada`, { id: toastId });
        await loadSummaryAndLog();
      } else {
        console.error('❌ Respuesta sin ID (con detalles):', res);
        toast.error('Error: respuesta inválida del servidor', { id: toastId });
      }
    } catch (err) {
      console.error('❌ Error iniciando actividad con detalles:', err);
      console.error('❌ Detalles del error:', err.response?.data || err.message);
      toast.error('Error iniciando actividad con detalles', { id: toastId });
    } finally {
      setPendingActivity(null);
      console.log('🔓 Reseteando isStarting a false (modal)');
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

  // Debug: Log del estado actual en cada render
  console.log('🔍 AsesorDashboard render:', {
    isStarting,
    isLoading,
    currentActivityId,
    currentActivityName,
    dayStarted,
    breakActive
  });

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Spinner global de carga */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <div className="mt-4 text-lg font-semibold text-blue-600">Cargando dashboard...</div>
          </div>
        </div>
      )}

      {/* Header (mismo diseño que supervisor/admin) */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img src="/ibr-logo.png" alt="IBR" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-primary-700">Control de Actividades</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  {(user?.nombreCompleto || user?.nombre_completo) || 'Usuario'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
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
      </div>

      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Registrar Actividad</h3>
            <ActivityGrid 
              activities={activities} 
              currentActivityId={currentActivityId} 
              onStart={handleStartClick}
              jornalFinished={jornalFinished}
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
            {jornalFinished ? (
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
