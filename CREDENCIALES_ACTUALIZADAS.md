# 🔐 Credenciales de Desarrollo (ACTUALIZADAS)

⚠️ **ADVERTENCIA:** Este archivo contiene contraseñas en texto plano y NO debe subirse a producción.

## 🌐 URLs de Acceso
- **Frontend:** http://localhost:3000/
- **Backend API:** http://localhost:3001/api/
- **Health Check:** http://localhost:3001/api/health

---

## 👤 Usuarios del Sistema

### 🔴 Administrador
| Usuario | Contraseña | Rol | Campañas Asignadas |
|---------|-----------|-----|-------------------|
| admin | Admin123!@# | Administrador | **Ninguna (null)** |

**Características:**
- ✅ Acceso completo a todos los módulos de mantenimiento
- ✅ Ve todos los registros de todas las campañas
- ✅ No tiene campaña asignada (`campañaId = null`)

---

### 🟡 Supervisores

| Usuario | Contraseña | Rol | Campañas Asignadas |
|---------|-----------|-----|-------------------|
| super1 | Super1@2024 | Supervisor | **PQRS, Ventas** |
| super2 | Super2@2024 | Supervisor | **BO_Calidda** |

**Características:**
- ✅ Relación M:N con campañas (múltiples campañas permitidas)
- ✅ Ve registros de asesores en sus campañas asignadas
- ✅ No tiene `campañaId` único (usa tabla `supervisor_campañas`)

**Asesores bajo supervisión:**
- `super1` supervisa: asesor1, asesor2 (PQRS), asesor3 (Ventas)
- `super2` supervisa: asesor4, asesor5 (BO_Calidda)

---

### 🟢 Asesores

| Usuario | Contraseña | Rol | Campaña Única |
|---------|-----------|-----|--------------|
| asesor1 | Asesor1@2024 | Asesor | PQRS |
| asesor2 | Asesor2@2024 | Asesor | PQRS |
| asesor3 | Asesor3@2024 | Asesor | Ventas |
| asesor4 | Asesor4@2024 | Asesor | BO_Calidda |
| asesor5 | Asesor5@2024 | Asesor | BO_Calidda |

**Características:**
- ✅ Campaña única obligatoria (`campañaId` requerido)
- ✅ Solo ven sus propios registros
- ✅ Pueden ver registros del día actual o días pasados

---

## 🎯 Campañas Disponibles

1. **PQRS** - Peticiones, Quejas, Reclamos y Sugerencias
2. **Ventas** - Campaña de ventas
3. **BO_Calidda** - Back Office Calidda

---

## 📋 Actividades Pre-configuradas

1. **Ingreso** (orden 1) - Marcador de entrada a jornada
2. **Bandeja de Correo** (orden 5) - Procesamiento de correos
   - 📌 Subactividades: Respuesta a Cliente, Comunicación Interna
3. **Seguimiento** (orden 6) - Seguimiento a clientes
   - 📌 Subactividades: Redes Sociales, Reclamos, Cambio de Titularidad
4. **Break Salida** (orden 10) - Descanso
5. **Regreso Break** (orden 11) - Regreso de descanso
6. **Reportes** (orden 20) - Elaboración de reportes
   - 📌 Subactividades: Reporte Diario, Análisis de Datos
7. **Reunión** (orden 21) - Participación en reuniones
8. **Auxiliares** (orden 30) - Tareas auxiliares
   - 📌 Subactividades: Soporte Técnico, Capacitación
9. **Incidencia** (orden 31) - Atención de incidencias
10. **Salida** (orden 99) - Fin de jornada

---

## 🔧 Comandos Útiles

### Iniciar Servidores
```bash
# Backend (Terminal 1)
cd backend
npm run dev
# Servidor en http://localhost:3001

# Frontend (Terminal 2)
cd frontend
npm run dev
# Aplicación en http://localhost:3000
```

### Reset de Base de Datos
```bash
cd backend
npx prisma migrate reset
# Elimina datos, aplica migraciones y ejecuta seed
```

### Ejecutar Solo Seed (sin reset)
```bash
cd backend
node prisma/seed.js
```

### Ver Base de Datos
```bash
cd backend
npx prisma studio
# Abre interfaz visual en http://localhost:5555
```

---

## ✅ Casos de Prueba Recomendados

### 📝 Prueba 1: Admin crea usuarios con reglas de negocio
1. Login con `admin` / `Admin123!@#`
2. Ir a **Panel de Administración** → **Usuarios**
3. **Crear Asesor:**
   - Seleccionar rol "Asesor"
   - ✅ Campo campaña está habilitado y es **requerido**
   - ✅ Debe seleccionar UNA campaña del dropdown
4. **Crear Supervisor:**
   - Seleccionar rol "Supervisor"
   - ✅ Campo campaña individual está **deshabilitado**
   - ✅ Aparece multi-select de campañas (requerido)
   - ✅ Puede seleccionar múltiples campañas con Ctrl/Cmd
5. **Crear Administrador:**
   - Seleccionar rol "Administrador"
   - ✅ Campo campaña está **deshabilitado**
   - ✅ Se guarda con `campañaId = null`

### 📝 Prueba 2: Editar Supervisor - Pre-carga de campañas
1. Login con `admin`
2. Ir a **Usuarios** → **Editar** `super1`
3. ✅ Verificar que el multi-select muestra campañas **pre-seleccionadas**: PQRS, Ventas
4. Cambiar selección (agregar/quitar campañas)
5. Guardar cambios
6. Re-editar `super1`
7. ✅ Confirmar que las nuevas campañas persisten correctamente

### 📝 Prueba 3: Vista de Supervisor Multi-campaña
1. Login con `super1` / `Super1@2024` (campañas: PQRS + Ventas)
2. Ir a **Dashboard** o **Estadísticas**
3. ✅ Debe ver registros de:
   - asesor1 (PQRS)
   - asesor2 (PQRS)
   - asesor3 (Ventas)
4. ❌ NO debe ver registros de:
   - asesor4 (BO_Calidda)
   - asesor5 (BO_Calidda)

### 📝 Prueba 4: Vista de Asesor - Restricción propia
1. Login con `asesor1` / `Asesor1@2024`
2. ✅ Solo debe ver sus propios registros
3. ❌ No debe ver registros de asesor2, asesor3, etc.
4. ✅ Puede ver registros del día actual o días pasados

### 📝 Prueba 5: Vista de Admin - Acceso completo
1. Login con `admin`
2. ✅ Debe ver TODOS los registros de TODAS las campañas
3. ✅ Tiene acceso a módulos de mantenimiento:
   - Usuarios
   - Roles
   - Campañas
   - Actividades
   - Subactividades

---

## 🔐 Formato de Contraseña Requerido

Las contraseñas deben cumplir:
- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 mayúscula
- ✅ Al menos 1 minúscula
- ✅ Al menos 1 número
- ✅ Al menos 1 carácter especial (@$!%*?&#)

**Regex de validación:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$
```

---

## 📝 Notas Importantes

### Seguridad
- ✅ Todas las contraseñas están encriptadas con **bcrypt** (10 rounds)
- ⚠️ **NUNCA** subir este archivo a repositorio público
- ⚠️ Cambiar todas las contraseñas antes de ir a **producción**
- ⚠️ Agregar `CREDENCIALES_*.md` al `.gitignore`

### Arquitectura de Campañas
- **Asesor:** Relación 1:1 con campaña (campo `campañaId` obligatorio)
- **Supervisor:** Relación M:N con campañas (tabla `supervisor_campañas`)
- **Administrador:** Sin campaña asignada (`campañaId = null`)

### Base de Datos
- Motor: **PostgreSQL** (Neon)
- ORM: **Prisma**
- Migraciones: `backend/prisma/migrations/`
- Última migración: `20251031231340_supervisor_campaign_m2m_and_optional_user_campaign`

### APIs Backend
- **GET** `/api/admin/supervisors/:id/campaigns` - Obtener campañas de supervisor
- **PUT** `/api/admin/supervisors/:id/campaigns` - Asignar campañas a supervisor
  - Body: `{ campañaIds: [1, 2, 3] }`

---

## 🚀 Para Crear Nuevos Usuarios (Manual)

### Opción 1: Desde Frontend
1. Login como `admin`
2. Panel de Administración → Usuarios → Crear Usuario
3. Llenar formulario según rol

### Opción 2: Desde Backend (Script)
```bash
cd backend
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('MiContraseña123!', 10).then(hash => console.log(hash));
"
```
Luego insertar manualmente en DB o usar Prisma Client

### Opción 3: Agregar al Seed
Editar `backend/prisma/seed.js` y ejecutar:
```bash
cd backend
node prisma/seed.js
```

---

**📅 Fecha de Actualización:** 31 de octubre de 2025  
**🎯 Propósito:** Referencia para pruebas locales con nuevas reglas de negocio  
**⚠️ SOLO DESARROLLO - NO COMPARTIR - NO PRODUCCIÓN**
