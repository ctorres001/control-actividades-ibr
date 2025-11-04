import React from 'react';

export default function ActivityGrid({ activities = [], currentActivityId, onStart, jornalFinished = false, disabled = false, dayStarted = false, breakActive = false }) {
  // Debug: ver qué props recibe
  console.log('🎯 ActivityGrid props:', { disabled, jornalFinished, dayStarted, breakActive, currentActivityId });
  
  if (!activities || activities.length === 0) return null;

  const emojiMap = {
    Ingreso: '🟢',
    Seguimiento: '📞',
    'Bandeja de Correo': '📧',
    Reportes: '📊',
    'Break Salida': '☕',
    'Regreso Break': '🔙',
    Auxiliares: '🔧',
    Reunión: '👥',
    Incidencia: '⚠️',
    Salida: '🚪',
    Pausa: '⏸️',
    'Caso Nuevo': '📋',
    'Revisión': '🔍',
    'Gestión': '📁'
  };

  // Grupo 1: Botones de actividad (control de jornada)
  const activityButtons = ['Ingreso', 'Break Salida', 'Regreso Break', 'Salida'];
  
  // Grupo 2: Botones de jornada (trabajo operativo)
  const workButtons = ['Seguimiento', 'Bandeja de Correo', 'Reportes', 'Auxiliares', 'Reunión', 'Incidencia', 'Pausa', 'Caso Nuevo', 'Revisión', 'Gestión'];

  const grupo1 = activities.filter(a => activityButtons.includes(a.nombreActividad));
  const grupo2 = activities.filter(a => workButtons.includes(a.nombreActividad));

  const isControlButton = (name) => activityButtons.includes(name);
  const isWorkButton = (name) => workButtons.includes(name);

  const renderButton = (a) => {
    const isCurrentActivity = currentActivityId && currentActivityId === a.id;
    let isDisabled = jornalFinished || disabled;

    // Reglas de negocio de habilitación
    if (!isDisabled) {
      const name = a.nombreActividad;
      if (!dayStarted) {
        // Solo permitir Ingreso al inicio del día
        isDisabled = name !== 'Ingreso';
      } else {
        // Día iniciado
        if (name === 'Ingreso') {
          isDisabled = true; // Ingreso ya no debe estar disponible
        }
        if (breakActive) {
          // En break, solo permitir Regreso Break
          isDisabled = name !== 'Regreso Break';
        }
      }
      // Para botones de control, si es la actividad actual, deshabilitar
      if (isControlButton(name) && isCurrentActivity) {
        isDisabled = true;
      }
      // Para botones de jornada, permitir re-marcar la misma actividad (no deshabilitar por ser actual)
      if (isWorkButton(name)) {
        // no-op, se permite click aunque sea la actual
      }
    }
    const emoji = emojiMap[a.nombreActividad] || '📌';
    
    return (
      <button
        key={a.id}
        disabled={isDisabled}
        onClick={() => !isDisabled && onStart(a)}
        className={`p-3 rounded-lg shadow-sm font-semibold transition-all text-sm ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed bg-neutral-100' 
            : 'bg-white hover:shadow-md hover:scale-105 active:scale-95'
        } ${isCurrentActivity ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
        <div className="flex items-center justify-center gap-2">
          <span>{emoji}</span>
          <span>{a.nombreActividad}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {grupo1.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-600 mb-2">Botones de Actividad</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {grupo1.map(renderButton)}
          </div>
        </div>
      )}
      
      {grupo2.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-600 mb-2">Botones de Jornada</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {grupo2.map(renderButton)}
          </div>
        </div>
      )}
    </div>
  );
}
