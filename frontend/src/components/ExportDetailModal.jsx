import { useState, useEffect } from 'react';
import { Download, X, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../services/adminService';
import Modal from './Modal';

export default function ExportDetailModal({ isOpen, onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [campañas, setCampañas] = useState([]);
  const [filters, setFilters] = useState({
    usuarioId: '',
    campañaId: '',
    fechaInicio: '',
    fechaFin: ''
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Configurar fecha fin como hoy y fecha inicio como hace 30 días
      const today = new Date().toISOString().split('T')[0];
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      
      setFilters(prev => ({
        ...prev,
        fechaInicio: monthAgoStr,
        fechaFin: today
      }));
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [usuariosData, campañasData] = await Promise.all([
        adminService.getUsuarios(),
        adminService.getCampañas()
      ]);
      setUsuarios(usuariosData);
      setCampañas(campañasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Validar que haya al menos un filtro
      const hasFilters = Object.values(filters).some(v => v);
      if (!hasFilters) {
        toast.error('Selecciona al menos un filtro');
        return;
      }

      await adminService.exportActividadesDetalle(filters);
      toast.success('Exportación completada. Descargando archivo...');
      onClose();
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar actividades');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Detalle de Actividades">
      <div className="space-y-4">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm text-blue-800">
              <p className="font-semibold mb-1">Exportación Detallada</p>
              <p>
                Este reporte incluye cada registro individual de actividad con timestamps completos,
                ideal para análisis estadístico y cálculo de tiempos promedio por asesor.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Usuario (opcional)
            </label>
            <select
              value={filters.usuarioId}
              onChange={(e) => setFilters({ ...filters, usuarioId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombreCompleto} ({u.nombreUsuario})
                </option>
              ))}
            </select>
          </div>

          {/* Campaña */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Campaña (opcional)
            </label>
            <select
              value={filters.campañaId}
              onChange={(e) => setFilters({ ...filters, campañaId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas las campañas</option>
              {campañas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={filters.fechaInicio}
                onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={filters.fechaFin}
                onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando...' : 'Descargar Excel'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
