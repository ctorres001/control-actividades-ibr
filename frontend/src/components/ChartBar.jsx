import React from 'react';

export default function ChartBar({ data = [] }) {
  if (!data || data.length === 0) return null;

  // Calcular el máximo para escalar
  const maxValue = Math.max(...data.map(d => parseInt(d.duracionSeg || 0, 10)));
  
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Colores para las barras
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-4 text-sm">Distribución de Tiempo</h4>
      <div className="space-y-3">
        {data.map((item, idx) => {
          const secs = parseInt(item.duracionSeg || 0, 10);
          const percentage = maxValue > 0 ? (secs / maxValue) * 100 : 0;
          const color = colors[idx % colors.length];
          
          return (
            <div key={item.nombreActividad || idx}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-neutral-700 truncate">{item.nombreActividad}</span>
                <span className="text-xs font-mono font-semibold text-neutral-600">{formatTime(secs)}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${color} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
