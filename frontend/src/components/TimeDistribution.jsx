import React from 'react';
import { formatDuration } from '../utils/timeCalculations';

/**
 * Componente de tabla con distribución de tiempo por actividad
 */
export default function TimeDistribution({ activities, totalTime }) {
  
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Distribución de Tiempo</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actividad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Veces
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Promedio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                % del Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Tipo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {activities.map((activity, index) => {
              const percentage = totalTime > 0 ? (activity.duration / totalTime) * 100 : 0;
              const avgDuration = activity.count > 0 ? activity.duration / activity.count : 0;
              
              return (
                <tr key={index} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${activity.isWork ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm font-medium text-neutral-900">
                        {activity.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {activity.count}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-900 font-medium">
                    {formatDuration(activity.duration)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {formatDuration(avgDuration)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-neutral-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className={`h-2 rounded-full ${activity.isWork ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-600 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.isWork 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.isWork ? 'Trabajo' : 'No trabajo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {activities.length === 0 && (
            <tbody>
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">
                  No hay actividades para mostrar
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
