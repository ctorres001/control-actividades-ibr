// =====================================================
// src/index.js - Servidor Express con Autenticación
// =====================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './utils/prisma.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import activityRoutes from './routes/activity.routes.js';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// Helmet - Seguridad HTTP headers
app.use(helmet());

// CORS - Permitir requests desde frontend
// Configurar CORS de forma flexible: aceptar lista separada por comas en CORS_ORIGIN
// Ejemplo: CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
const allowedOrigins = corsOriginEnv.split(',').map((o) => o.trim()).filter(Boolean);

// En desarrollo, ser más permisivo con CORS
const corsOptions = process.env.NODE_ENV === 'development'
  ? {
      // Permitir todos los orígenes en desarrollo
      origin: true,
      credentials: true
    }
  : {
      // En producción, usar la lista de orígenes permitidos
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Origin not allowed'));
      },
      credentials: true
    };

app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// RUTAS PRINCIPALES
// =====================================================

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Control de Actividades',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      testDb: '/api/test-db',
      auth: {
        login: 'POST /api/auth/login',
        validate: 'GET /api/auth/validate',
        logout: 'POST /api/auth/logout'
      }
    }
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      success: true,
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Test de base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await prisma.usuario.count();
    const roles = await prisma.rol.findMany();
    const campañas = await prisma.campaña.findMany();

    res.json({
      success: true,
      message: '✅ Conexión a base de datos exitosa',
      data: {
        totalUsuarios: userCount,
        roles: roles,
        campañas: campañas
      }
    });
  } catch (error) {
    console.error('❌ Error en test-db:', error);
    res.status(500).json({
      success: false,
      error: 'Error al conectar con la base de datos',
      message: error.message
    });
  }
});

// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================
app.use('/api/auth', authRoutes);

// =====================================================
// RUTAS DE ACTIVIDADES
// =====================================================

app.use('/api/activities', activityRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error en servidor:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, async () => {
  console.log(`
  🚀 Servidor iniciado exitosamente
  📍 URL: http://localhost:${PORT}
  🌍 Entorno: ${process.env.NODE_ENV || 'development'}
  ⏰ Timestamp: ${new Date().toISOString()}
  
  📋 Endpoints disponibles:
  - GET  /api/health
  - GET  /api/test-db
  - POST /api/auth/login
  - GET  /api/auth/validate
  - POST /api/auth/logout
  `);

  // Verificar conexión a base de datos
  try {
    await prisma.$connect();
    console.log('  ✅ Conectado a la base de datos Neon');
  } catch (error) {
    console.error('  ❌ Error conectando a la base de datos:', error.message);
  }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

// Cerrar conexión Prisma al terminar
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});