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
  const [currentStartEpoch, setCurrentStartEpoch] = useState(null); // epoch de inicio del reloj visible
  const [uiTimerKey, setUiTimerKey] = useState(null); // key para forzar render del cronómetro aunque no haya registro
  const [showModal, setShowModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState(null);
  const [summary, setSummary] = useState([]);
  const [log, setLog] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false); // 🔒 Nuevo: Bandera de inicialización
  
  // Día iniciado: considerar tanto el log como el estado local inmediato tras iniciar "Ingreso"
  const dayStartedFromLog = log?.some((r) => (r.nombreActividad || r.nombre_actividad) === 'Ingreso');
  const dayStarted = dayStartedFromLog || currentActivityName === 'Ingreso' || !!currentRegistroId;
  const breakActive = currentActivityName === 'Break Salida';
  // Verificar si ya se marcó salida (desde el log o estado local)
  const hasSalidaInLog = log?.some((r) => (r.nombreActividad || r.nombre_actividad) === 'Salida');
  const jornalFinished = currentActivityName === 'Jornada Finalizada' || hasSalidaInLog;
  const timerKey = uiTimerKey ?? currentRegistroId; // prefiera el key forzado para reinicios inmediatos

  const loadActivities = useCallback(async () => {
    try {
      const res = await activityService.getActiveActivities();
      setActivities(res || []);
    } catch (err) {
      // Solo mostrar error si no es un error de autenticación (401)
      if (err?.response?.status !== 401) {
        console.error('loadActivities error', err?.message);
        // No mostrar toast en carga inicial para evitar alertas molestas
      }
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
          setCurrentStartEpoch(Date.now() - secondsElapsed * 1000);
          setUiTimerKey(null);
          console.log('✅ Actividad restaurada:', {
            nombreActividad: res.actividad?.nombreActividad,
            horaInicio: res.horaInicio,
            horaInicioDate: start.toISOString(),
            now: now.toISOString(),
            offset: secondsElapsed
          });
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
      setHasInitialized(true); // 🔒 Marcar como inicializado
    };
    initDashboard();

    // 🔒 CLEANUP: Resetear estados al desmontar componente
    return () => {
      setIsStarting(false);
      setPendingActivity(null);
      setShowModal(false);
      setUiTimerKey(null);
      setCurrentStartEpoch(null);
    };
  }, [loadActivities, loadSummaryAndLog, restoreOpen]);

  const handleStartClick = async (activity) => {
    let started = false; // banderín local para no resetear el reloj si iniciamos bien
    let modalOpened = false; // banderín para saber si abrimos modal (evita cleanup en finally)
    
    // Si la jornada ya finalizó, no permitir iniciar más actividades
    if (jornalFinished) {
      toast.error('La jornada ya ha finalizado', { id: 'jornada-finalizada' });
      return;
    }

    // Bloquear botones durante el inicio
    setIsStarting(true);

    // Feedback visual inmediato + arrancar cronómetro al clic
    setUiTimerKey(Date.now());
    setCurrentActivityName(activity.nombreActividad);
    setCurrentActivityId(activity.id);
    setCurrentStartEpoch(Date.now());
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
            setCurrentStartEpoch(null);
            setUiTimerKey(null);
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
          console.log(`🔍 Subactividades para ${activity.nombreActividad}:`, subactividades);
          
          // El servicio ya retorna data.data, así que subactividades es el array directamente
          const hasSubactivities = Array.isArray(subactividades) && subactividades.length > 0;
          
          if (hasSubactivities) {
            // Hay subactividades, abrir modal
            toast.dismiss(toastId);
            
            // Si hay una actividad en curso, cerrarla al abrir el modal
            if (currentRegistroId) {
              try {
                await activityService.stopActivity();
                await loadSummaryAndLog();
              } catch (err) {
                console.warn('⚠️ No se pudo cerrar la actividad anterior al abrir modal:', err?.message);
              }
              setCurrentRegistroId(null);
            }
            
            setPendingActivity(activity);
            setShowModal(true);
            setIsStarting(false); // Desbloquear UI para permitir interacción con el modal
            modalOpened = true; // Marcar que abrimos modal para evitar cleanup en finally
            return;
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
          setCurrentStartEpoch(Date.now());
          setUiTimerKey(null);
          started = true;
          
          console.log('✅ Estado actualizado:', {
            currentRegistroId: res.id,
            currentActivityId: activity.id,
            currentActivityName: activity.nombreActividad,
            currentStartOffset: 0
          });
          
          toast.success(`✅ ${activity.nombreActividad} iniciada`, { id: toastId });
          // Ingreso y Regreso Break: auto-finalizar tras 1 segundo
          if (activity.nombreActividad === 'Ingreso' || activity.nombreActividad === 'Regreso Break') {
            setTimeout(async () => {
              try {
                await activityService.stopActivity();
              } catch (err) {
                console.warn('⚠️ No se pudo auto-finalizar:', err?.message);
              } finally {
                setCurrentRegistroId(null);
                setCurrentActivityId(null);
                setCurrentActivityName(null);
                setCurrentStartEpoch(null);
                setUiTimerKey(null);
                await loadSummaryAndLog();
              }
            }, 1000);
          } else {
            await loadSummaryAndLog(); // Esperar a que termine la recarga
          }
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
      // IMPORTANTE: Solo resetear isStarting si NO abrimos modal
      if (!modalOpened) {
        console.log('🔓 Reseteando isStarting a false');
        setIsStarting(false);
        
        // Solo limpiar el reloj si NO se inició exitosamente y NO abrimos modal
        if (!started && !currentRegistroId) {
          setUiTimerKey(null);
          setCurrentStartEpoch(null);
          setCurrentActivityName(null);
          setCurrentActivityId(null);
        }
      }
    }
  };

  const handleConfirmModal = async ({ subactivityId, idClienteReferencia, resumenBreve }) => {
    setShowModal(false);
    if (!pendingActivity) return;
    
    setIsStarting(true);
    const toastId = toast.loading(`Registrando ${pendingActivity.nombreActividad}...`, { id: 'starting-activity-details' });
    
    try {
      // 🎯 NO detener la actividad anterior aquí - el backend la cierra automáticamente
      // al iniciar la nueva, preservando el tiempo transcurrido correcto
      
      // Enviar horaInicio real (timestamp del clic en el botón)
      const horaInicioReal = currentStartEpoch ? new Date(currentStartEpoch).toISOString() : null;
      
      const payload = { 
        actividadId: pendingActivity.id, 
        subactividadId: subactivityId, 
        idClienteReferencia: idClienteReferencia,
        resumenBreve: resumenBreve,
        horaInicio: horaInicioReal  // ← Timestamp del clic, no del confirmar
      };
      
      console.log('🔍 Iniciando actividad con detalles:', payload);
      const res = await activityService.startActivity(payload);
      console.log('🔍 Respuesta de startActivity (con detalles):', res);
      
      if (res && res.id) {
        // El backend cerró automáticamente la actividad anterior (si existía)
        // con el tiempo correcto desde el clic hasta ahora
        
        // 🎯 Detener inmediatamente la nueva actividad (tarea puntual completada)
        console.log('⏹️ Deteniendo actividad automáticamente (tarea puntual con subactividad)');
        await activityService.stopActivity();
        
        // Limpiar estados (sin actividad activa)
        setCurrentRegistroId(null);
        setCurrentActivityId(null);
        setCurrentActivityName(null);
        setCurrentStartEpoch(null);
        setUiTimerKey(null);
        
        console.log('✅ Actividad completada:', {
          actividad: pendingActivity.nombreActividad,
          subactividad: subactivityId,
          autoDetenida: true
        });
        
        toast.success(`✅ ${pendingActivity.nombreActividad} registrada`, { id: toastId });
        await loadSummaryAndLog();
      } else {
        console.error('❌ Respuesta sin ID (con detalles):', res);
        toast.error('Error: respuesta inválida del servidor', { id: toastId });
        // Limpiar timer en caso de error
        setUiTimerKey(null);
        setCurrentStartEpoch(null);
      }
    } catch (err) {
      console.error('❌ Error registrando actividad con detalles:', err);
      console.error('❌ Detalles del error:', err.response?.data || err.message);
      toast.error('Error al registrar actividad', { id: toastId });
      // Limpiar timer en caso de error
      setUiTimerKey(null);
      setCurrentStartEpoch(null);
    } finally {
      setPendingActivity(null);
      console.log('🔓 Reseteando isStarting a false (modal)');
      setIsStarting(false);
    }
  };

  const handleCancelModal = () => {
    console.log('❌ Modal cancelado - limpiando estados del timer');
    console.log('🔍 Estados antes de limpiar:', {
      currentActivityName,
      currentActivityId,
      currentStartEpoch,
      uiTimerKey,
      currentRegistroId
    });
    
    setShowModal(false);
    setPendingActivity(null);
    setIsStarting(false); // 🔓 Desbloquear UI
    
    // Limpiar todos los estados del timer en orden (el tiempo se descarta)
    setCurrentRegistroId(null);
    setCurrentActivityName(null);
    setCurrentActivityId(null);
    setCurrentStartEpoch(null);
    setUiTimerKey(null);
    
    console.log('✅ Estados limpiados - debería mostrar "Sin actividad"');
    toast.success('Registro cancelado', { id: 'modal-cancelled' });
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
    hasInitialized,
    currentActivityId,
    currentActivityName,
    currentRegistroId,
    dayStartedFromLog,
    dayStarted,
    breakActive,
    jornalFinished,
    logLength: log?.length || 0
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
              disabled={isStarting || !hasInitialized}
              dayStarted={!!dayStarted}
              breakActive={!!breakActive}
            />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Línea de tiempo (Historial)</h3>
            <div className="bg-white rounded shadow p-3 max-h-[48rem] overflow-y-auto">
              <Timeline 
                log={log} 
                currentRegistroId={currentRegistroId}
                currentActivityName={currentActivityName}
                currentActivityDuration={currentStartEpoch ? Math.floor((Date.now() - currentStartEpoch) / 1000) : 0}
                pendingActivityName={pendingActivity?.nombreActividad || null}
              />
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
            ) : (
              <>
                {timerKey ? (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Actividad en curso:</div>
                    <div className="text-lg font-bold text-blue-900">{currentActivityName || 'Actividad'}</div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-neutral-100 rounded-lg text-center">
                    <div className="text-sm text-neutral-600">Sin actividad en curso</div>
                  </div>
                )}
                <TimerSync
                  key={timerKey || 'idle'}
                  initialOffsetSeconds={timerKey && currentStartEpoch ? Math.max(0, Math.floor((Date.now() - currentStartEpoch) / 1000)) : 0}
                  isRunning={!!timerKey}
                />
              </>
            )}
          </div>

          <div className="mb-4">
            <DailySummary
              summary={summary}
              totalRegistros={log.length}
              currentStartEpoch={currentStartEpoch}
              log={log}
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Distribución de Tiempo</h3>
            <ChartBar data={summary} />
          </div>
        </div>
      </div>

      {showModal && pendingActivity ? (
        <SubactivityModal 
          activity={pendingActivity} 
          loadSubactivities={(id) => activityService.getSubactivities(id)} 
          onCancel={handleCancelModal}
          onConfirm={handleConfirmModal} 
        />
      ) : null}
    </div>
  );
}
