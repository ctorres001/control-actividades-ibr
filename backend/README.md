# Control de Actividades - Backend API

Backend optimizado para soportar **80+ usuarios concurrentes** en modo gratuito.

## 🚀 Características

- ✅ **Node.js + Express** - API REST
- ✅ **PostgreSQL (Neon)** - Base de datos con 50 conexiones simultáneas
- ✅ **Prisma ORM** - Type-safe database queries
- ✅ **JWT Authentication** - Sesiones seguras
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Compression** - Reduce bandwidth ~70%
- ✅ **PM2 Clustering** - Aprovecha múltiples CPUs
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Cross-origin configurado

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

## 🔧 Configuración

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secret-key-min-32-chars"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

## 🏃 Ejecución

### Desarrollo (hot reload):
```bash
npm run dev
```

### Producción (single process):
```bash
npm start
```

### Producción (clustering con PM2):
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar en modo cluster (2 instancias)
npm run start:cluster

# Ver logs
npm run logs

# Ver estado
npm run status

# Reiniciar
npm run restart

# Detener
npm run stop
```

## 📊 Capacidad

| Configuración | Usuarios Concurrentes |
|---------------|----------------------|
| Single process (npm start) | 20-30 |
| PM2 Cluster 2 instancias | 50-60 |
| PM2 Cluster 4 instancias | 80-100 |

## 🔐 Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/validate` - Validar sesión
- `POST /api/auth/logout` - Logout

### Actividades
- `GET /api/activities` - Listar actividades activas
- `GET /api/activities/summary` - Resumen diario
- `GET /api/activities/log` - Log de actividades
- `POST /api/activities/start` - Iniciar actividad
- `POST /api/activities/end` - Finalizar actividad

### Password Reset
- `POST /api/password/forgot` - Solicitar reset
- `POST /api/password/change` - Cambiar contraseña

### Health
- `GET /api/health` - Health check
- `GET /api/test-db` - Test conexión BD

## 🛡️ Seguridad

- ✅ Rate limiting: 100 req/min general, 5 intentos login/15min
- ✅ Helmet headers activados
- ✅ CORS configurado
- ✅ JWT con expiración de 8 horas
- ✅ Passwords hasheados con bcrypt (10 rounds)

## 📈 Monitoreo

### Con PM2:
```bash
# Dashboard interactivo
pm2 monit

# Logs en tiempo real
pm2 logs

# Métricas
pm2 status
```

### Sin PM2:
- Logs en consola
- Health check: `GET /api/health`

## 🚀 Deploy

Ver `DEPLOYMENT_GRATUITO.md` para guía completa de deployment en:
- Railway.app (Backend)
- Vercel (Frontend)
- Neon (Base de datos)

## 🔧 Scripts Útiles

```bash
# Base de datos
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:seed      # Seed de datos iniciales
npm run prisma:deploy    # Deploy migrations (producción)

# Clustering
npm run start:cluster    # Iniciar con PM2
npm run start:prod       # Iniciar en modo producción
npm run stop             # Detener PM2
npm run restart          # Reiniciar PM2
npm run logs             # Ver logs PM2
npm run status           # Estado PM2
```

## 📝 Estructura

```
backend/
├── src/
│   ├── index.js              # Servidor Express
│   ├── controllers/          # Lógica de negocio
│   ├── routes/               # Definición de rutas
│   ├── middleware/           # Auth, validation
│   └── utils/                # Helpers, prisma client
├── prisma/
│   ├── schema.prisma         # Modelo de datos
│   ├── migrations/           # Historial de migraciones
│   └── seed.js               # Datos iniciales
├── logs/                     # Logs PM2
├── ecosystem.config.cjs      # Configuración PM2
└── package.json
```

## 🐛 Troubleshooting

### Error: "Too many connections"
- Verificar `connection_limit` en DATABASE_URL
- Debe ser al menos 50 para 80 usuarios

### Backend lento con PM2
- Verificar RAM disponible: `pm2 monit`
- Reducir instancias si RAM < 2GB

### CORS errors
- Verificar `CORS_ORIGIN` en .env
- Debe incluir dominio del frontend

## 📚 Tecnologías

- Node.js 18+
- Express 5.x
- Prisma 6.x
- PostgreSQL (Neon)
- JWT (jsonwebtoken)
- bcrypt
- PM2 (producción)
- Helmet (seguridad)
- express-rate-limit (protección)
- compression (optimización)

## 👥 Equipo

Desarrollado para IBR - Control de Actividades

## 📄 Licencia

ISC
