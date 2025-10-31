/**
 * Configuración PM2 para Control de Actividades
 * 
 * PM2 permite ejecutar múltiples instancias de Node.js en modo cluster
 * aprovechando todos los núcleos de CPU disponibles.
 * 
 * Para usar:
 * - Desarrollo: pm2 start ecosystem.config.cjs
 * - Producción: pm2 start ecosystem.config.cjs --env production
 * 
 * Comandos útiles:
 * - pm2 status        Ver estado de procesos
 * - pm2 logs          Ver logs en tiempo real
 * - pm2 monit         Monitor interactivo
 * - pm2 restart all   Reiniciar todos los procesos
 * - pm2 stop all      Detener todos los procesos
 * - pm2 delete all    Eliminar todos los procesos
 */

module.exports = {
  apps: [{
    name: 'control-actividades-api',
    script: './src/index.js',
    
    // Número de instancias (procesos)
    // - En desarrollo: 2 instancias (para simular carga)
    // - En producción: 'max' usa todos los CPUs disponibles
    instances: process.env.NODE_ENV === 'production' ? 'max' : 2,
    
    // Modo cluster para balancear carga entre instancias
    exec_mode: 'cluster',
    
    // Variables de entorno para desarrollo
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    
    // Variables de entorno para producción
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    
    // Reiniciar automáticamente si usa más de 500MB de RAM
    max_memory_restart: '500M',
    
    // Configuración de logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Reiniciar si crashea
    autorestart: true,
    
    // Máximo de reinicios en 1 minuto antes de considerar "unstable"
    max_restarts: 10,
    min_uptime: '10s',
    
    // Watch (opcional, útil en desarrollo)
    // watch: ['src'],
    // ignore_watch: ['node_modules', 'logs', '.git'],
    
    // Tiempo de gracia antes de forzar shutdown (ms)
    kill_timeout: 5000,
    
    // Esperar a que el puerto esté disponible antes de iniciar siguiente instancia
    wait_ready: true,
    listen_timeout: 10000,
  }]
};
