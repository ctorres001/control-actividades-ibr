import React, { useState, useEffect } from 'react';

export default function Timeline({ log = [], currentRegistroId, currentActivityName = null, currentActivityDuration = 0, pendingActivityName = null }) {
  // Badge de modal se muestra cuando hay una actividad pendiente (modal abierto)
  const hasInProgressActivity = Boolean(pendingActivityName);
  const [liveTime, setLiveTime] = useState(currentActivityDuration);
  const [runningActivityTimes, setRunningActivityTimes] = useState({});
  const [frozenTime, setFrozenTime] = useState(null); // Tiempo congelado cuando se abre modal

  // Debug: Log para verificar props recibidas
  console.log('🕐 Timeline render:', {
    currentActivityName,
    currentRegistroId,
    pendingActivityName,
    hasInProgressActivity,
    currentActivityDuration,
    logLength: log?.length || 0
  });

  // Congelar el tiempo de la actividad actual cuando se abre un modal
  useEffect(() => {
    if (hasInProgressActivity && currentRegistroId) {
      // Buscar la actividad actual en el log
      const currentActivity = log.find(r => r.id === currentRegistroId);
      if (currentActivity) {
        const horaInicio = currentActivity.horaInicio || currentActivity.hora_inicio || currentActivity.inicio;
        if (horaInicio) {
          const start = new Date(horaInicio);
          const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
          setFrozenTime(elapsed);
        }
      }
    } else {
      setFrozenTime(null);
    }
  }, [hasInProgressActivity, currentRegistroId, log]);

  // Actualizar duración en tiempo real cada segundo para actividad en modal
  useEffect(() => {
    if (hasInProgressActivity) {
      setLiveTime(currentActivityDuration);
      const interval = setInterval(() => {
        setLiveTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasInProgressActivity, currentActivityDuration]);

  // Actualizar duración en tiempo real para actividades en curso del log
  useEffect(() => {
    const runningActivities = log.filter(r => {
      const hasEnded = Boolean(r.horaFin || r.hora_fin || r.fin);
      const estado = r.estado || '';
      const isStillRunning = !hasEnded || estado === 'Iniciado';
      
      // Excluir la actividad que se va a cerrar (cuando hay modal abierto)
      const willBeClosed = r.id === currentRegistroId && hasInProgressActivity;
      
      return isStillRunning && !willBeClosed;
    });

    if (runningActivities.length === 0) {
      setRunningActivityTimes({});
      return;
    }

    // Calcular tiempo inicial para cada actividad en curso
    const initialTimes = {};
    runningActivities.forEach(r => {
      const horaInicio = r.horaInicio || r.hora_inicio || r.inicio;
      if (horaInicio) {
        const start = new Date(horaInicio);
        const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
        initialTimes[r.id] = elapsed;
      }
    });
    setRunningActivityTimes(initialTimes);

    // Actualizar cada segundo
    const interval = setInterval(() => {
      setRunningActivityTimes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = updated[id] + 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [log, currentRegistroId, hasInProgressActivity]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      // La hora viene en UTC de la base de datos, la convertimos a hora local
      return d.toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-2">
      {/* Actividad en curso (modal abierto, no registrada aún) */}
      {hasInProgressActivity && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-400 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full animate-pulse">
                🔵 EN CURSO
              </span>
              <span className="font-semibold text-blue-900">{pendingActivityName}</span>
            </div>
            <div className="font-mono text-sm font-bold text-blue-700">
              {formatTime(liveTime)}
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-1 italic">
            Completando formulario...
          </div>
        </div>
      )}
      
      {/* Historial de registros confirmados */}
      {(!log || log.length === 0) ? (
        <div className="text-sm text-neutral-500 p-4 bg-white rounded shadow text-center">Sin registros hoy.</div>
      ) : (
        log.map((r, i) => {
        const duracionSeg = r.duracionSeg || r.duracion_seg || 0;
        const activityName = r.nombreActividad || r.nombre_actividad || 'Actividad';
        const subactivity = r.nombreSubactividad || r.nombre_subactividad || r.subactividad;
        const comment = r.observaciones || r.comentario;
        const inicio = formatDateTime(r.horaInicio || r.hora_inicio || r.inicio);
        const isCurrent = r.id === currentRegistroId;
        const hasEnded = Boolean(r.horaFin || r.hora_fin || r.fin);
        const estado = r.estado || '';
        
        // Si hay un modal abierto (pendingActivityName), la actividad actual (isCurrent) 
        // no debe mostrarse como "EN CURSO" porque se cerrará al confirmar el modal
        const willBeClosed = isCurrent && hasInProgressActivity;
        const isRunning = (isCurrent || !hasEnded || estado === 'Iniciado') && !willBeClosed;
        
        // Para actividades que van a cerrarse, usar el tiempo congelado
        let displayDuration = duracionSeg;
        
        if (willBeClosed && frozenTime !== null) {
          // Usar el tiempo que se congeló cuando se abrió el modal
          displayDuration = frozenTime;
        } else if (isRunning) {
          // Para actividades en curso, usar el tiempo en tiempo real
          displayDuration = runningActivityTimes[r.id] !== undefined 
            ? runningActivityTimes[r.id] 
            : duracionSeg;
        }
        
        const durationDisplay = formatTime(displayDuration || 0);
        
        return (
          <div 
            key={r.id || i} 
            className={`p-3 rounded-lg shadow-sm ${
              isRunning 
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400' 
                : 'bg-white border-l-4 border-neutral-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {isRunning && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-blue-600 rounded-full animate-pulse">
                      🔵 EN CURSO
                    </span>
                  )}
                  <span className={isRunning ? 'text-blue-900' : 'text-neutral-800'}>
                    {activityName}
                    {subactivity && <span className={isRunning ? 'text-blue-700' : 'text-neutral-600'} style={{fontWeight: 'normal'}}> • {subactivity}</span>}
                  </span>
                </div>
                {comment && (
                  <div className={`text-xs mt-1 p-1 rounded ${isRunning ? 'text-blue-600 bg-blue-50' : 'text-neutral-600 bg-neutral-50'}`}>
                    {comment}
                  </div>
                )}
                <div className={`text-xs mt-1 ${isRunning ? 'text-blue-500' : 'text-neutral-400'}`}>{inicio}</div>
              </div>
              <div className={`font-mono text-sm font-bold ml-3 ${isRunning ? 'text-blue-700' : 'text-blue-600'}`}>
                {durationDisplay}
              </div>
            </div>
          </div>
        );
      })
      )}
    </div>
  );
}
