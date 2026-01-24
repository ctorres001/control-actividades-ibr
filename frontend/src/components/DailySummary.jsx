import React, { useState, useEffect } from 'react';

export default function DailySummary({ summary = [], totalRegistros = 0, currentStartEpoch = null }) {
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Actualizar tiempo en vivo solo dentro de este componente
  useEffect(() => {
    if (!currentStartEpoch) {
      setLiveSeconds(0);
      return;
    }
    const tick = () => {
      const secs = Math.max(0, Math.floor((Date.now() - currentStartEpoch) / 1000));
      setLiveSeconds(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentStartEpoch]);

  // Backend devuelve duracionSeg (puede ser string o number)
  const totalSeconds = summary.reduce((acc, item) => {
    const secs = parseInt(item.duracionSeg || item.totalSegundos || 0, 10);
    // Filtrar valores negativos o inválidos
    if (isNaN(secs) || secs < 0) return acc;
    return acc + secs;
  }, 0) + liveSeconds;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 bg-white rounded shadow text-center">
          <div className="text-xs text-neutral-500">Tiempo Total</div>
          <div className="text-xl font-bold text-blue-600">{formatTime(totalSeconds)}</div>
        </div>
        <div className="p-3 bg-white rounded shadow text-center">
          <div className="text-xs text-neutral-500">Total Registros</div>
          <div className="text-xl font-bold text-blue-600">{totalRegistros}</div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-3">
        <h4 className="font-semibold mb-3 text-sm">Consolidado por Actividad</h4>
        {summary.length > 0 ? (
          <>
            <div className="text-xs text-neutral-400 mb-2">{summary.length} actividades distintas</div>
            <ul className="space-y-2">
              {summary.map((item, idx) => {
                const secs = parseInt(item.duracionSeg || item.totalSegundos || 0, 10);
                // Mostrar advertencia si el valor es negativo
                const isNegative = !isNaN(secs) && secs < 0;
                return (
                  <li key={item.nombreActividad || idx} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-700">{item.nombreActividad}</span>
                    <span className={`font-mono font-semibold ${isNegative ? 'text-red-500' : 'text-blue-600'}`}>
                      {isNegative ? '⚠️ ' : ''}{formatTime(Math.abs(secs))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="text-xs text-neutral-400 text-center py-2">No hay actividades completadas aún</div>
        )}
      </div>
    </div>
  );
}
