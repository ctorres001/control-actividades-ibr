import React from 'react';

export default function Timeline({ log = [], currentRegistroId }) {
  if (!log || log.length === 0) {
    return <div className="text-sm text-neutral-500 p-4 bg-white rounded shadow text-center">Sin registros hoy.</div>;
  }

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
      {log.map((r, i) => {
        const duracionSeg = r.duracionSeg || r.duracion_seg || 0;
        const activityName = r.nombreActividad || r.nombre_actividad || 'Actividad';
        const subactivity = r.nombreSubactividad || r.nombre_subactividad || r.subactividad;
        const comment = r.observaciones || r.comentario;
        const inicio = formatDateTime(r.horaInicio || r.hora_inicio || r.inicio);
        const isCurrent = r.id === currentRegistroId;
        const hasEnded = Boolean(r.horaFin || r.hora_fin || r.fin);
        const estado = r.estado || '';
        const isRunning = isCurrent || !hasEnded || estado === 'Iniciado';
        const durationDisplay = isRunning ? 'En curso' : formatTime(duracionSeg || 0);
        
        return (
          <div 
            key={r.id || i} 
            className={`p-3 bg-white rounded shadow-sm border-l-4 ${
              isCurrent ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-sm text-neutral-800">
                  {activityName}
                  {subactivity && <span className="text-neutral-600 font-normal"> • {subactivity}</span>}
                </div>
                {comment && (
                  <div className="text-xs text-neutral-600 mt-1 bg-neutral-50 p-1 rounded">{comment}</div>
                )}
                <div className="text-xs text-neutral-400 mt-1">{inicio}</div>
              </div>
              <div className="font-mono text-sm font-semibold text-blue-600 ml-3">{durationDisplay}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
