# Pruebas del Panel Supervisor

## ✅ Estado Actual

**Panel Supervisor completado y listo para pruebas**

- ✅ Backend: Controladores y rutas de estadísticas creados
- ✅ Frontend: SupervisorDashboard.jsx con todas las funciones
- ✅ Componentes: StatsCard, FilterPanel, ActivityChart, TimeDistribution
- ✅ Utilidades: timeCalculations.js, statsService.js
- ✅ Servidor backend corriendo en http://localhost:3001
- ✅ Servidor frontend corriendo en http://localhost:3000
- ✅ Sin errores de compilación

## 🚀 Cómo Probar el Panel

### 1. Iniciar Sesión con Usuario Supervisor

1. Abrir navegador en http://localhost:3000
2. Iniciar sesión con un usuario de rol "Supervisor"
   - Si no tienes un supervisor, usa el script para crear uno
3. La aplicación debería redirigirte automáticamente a `/supervisor`

### 2. Funciones a Probar

#### A. Filtros de Búsqueda
- **Fecha Inicio/Fin**: Seleccionar rango de fechas
- **Usuario**: Filtrar por asesor específico (solo asesores bajo tu supervisión)
- **Campaña**: Filtrar por campaña

**Comportamiento esperado:**
- Filtros se aplican al hacer clic en "🔍 Buscar"
- Si no hay datos, muestra mensaje "No hay datos para mostrar"

#### B. Vistas de Datos
- **Vista Consolidada**: Muestra gráficos de resumen
  - Gráfico de barras: Tiempo por actividad
  - Gráfico de pie: Distribución del tiempo trabajado
- **Vista Detallada**: Enfocada en tabla de distribución

**Cambiar vista:**
- Botones "Vista Consolidada" / "Vista Detallada"

#### C. Tarjetas de Resumen (KPIs)
1. **Tiempo Total**: Desde primera entrada hasta última salida
2. **Tiempo Trabajado**: Solo actividades productivas (excluye Ingreso/Salida/Breaks)
3. **Porcentaje Neto**: (Tiempo Trabajado / Tiempo Total) × 100
   - Verde: ≥ 70%
   - Naranja: 50-69%
   - Rojo: < 50%
4. **Actividades**: Cantidad de actividades de trabajo diferentes

#### D. Cálculo de Porcentaje Neto

**Fórmula:**
```
Porcentaje Neto = (Tiempo Trabajado / Tiempo Total) × 100

Donde:
- Tiempo Total = Hora de última "Salida" - Hora de primera "Ingreso"
- Tiempo Trabajado = Suma de duración de actividades de trabajo
- Actividades NO consideradas trabajo: Ingreso, Salida, Break Salida, Break Regreso
```

**Ejemplo:**
- Ingreso: 8:00 AM
- Salida: 5:00 PM
- Tiempo Total: 9 horas (540 minutos)
- Break almuerzo: 1 hora (60 minutos)
- Breaks cortos: 20 minutos
- Tiempo Trabajado: 9h - 1h20m = 7h40m (460 minutos)
- **Porcentaje Neto: 85.2%**

#### E. Tabla de Distribución de Tiempo

**Columnas:**
- Actividad: Nombre de la actividad
- Veces: Cuántas veces se registró
- Duración: Tiempo total en formato "Xh Ym"
- Promedio: Duración promedio por registro
- % del Total: Porcentaje del tiempo total
- Tipo: Badge verde "trabajo" o gris "no trabajo"

**Barra de progreso visual:** Muestra el % del total

#### F. Exportar a Excel

**Funcionalidad:**
1. Click en botón "📊 Exportar a Excel"
2. Se descarga archivo .xlsx con 3 hojas:
   - **Resumen**: Estadísticas agrupadas
   - **Detalle**: Todos los registros filtrados
   - **Por Actividad**: Distribución por actividad

**Nombre del archivo:**
`estadisticas_supervisor_YYYY-MM-DD.xlsx`

#### G. Información Adicional

En la parte inferior se muestra:
- Primera entrada del día
- Última salida del día
- Total de registros

## 🔒 Seguridad y Permisos

### Supervisor puede ver:
- ✅ Sus propios registros
- ✅ Registros de asesores bajo su supervisión
- ❌ NO puede ver otros supervisores ni sus equipos

### Filtros disponibles:
- ✅ Fecha inicio/fin
- ✅ Usuario (solo de su equipo)
- ✅ Campaña
- ❌ Rol (solo para Admin)
- ❌ Supervisor (solo para Admin)

## 🧪 Casos de Prueba Específicos

### Caso 1: Búsqueda Simple
1. Seleccionar fecha de hoy
2. Click "Buscar"
3. **Resultado esperado**: Mostrar todos los registros de hoy de tu equipo

### Caso 2: Filtro por Usuario
1. Seleccionar fecha
2. Seleccionar un asesor de tu equipo
3. Click "Buscar"
4. **Resultado esperado**: Solo registros del asesor seleccionado

### Caso 3: Filtro por Campaña
1. Seleccionar fecha
2. Seleccionar una campaña
3. Click "Buscar"
4. **Resultado esperado**: Solo registros de usuarios en esa campaña

### Caso 4: Sin Datos
1. Seleccionar fecha futura (sin registros)
2. Click "Buscar"
3. **Resultado esperado**: 
   - Mensaje "No se encontraron registros"
   - Icono 📊
   - Texto: "Selecciona filtros y haz clic en 'Buscar' para ver las estadísticas"

### Caso 5: Exportar Excel
1. Buscar con filtros que tengan datos
2. Click "Exportar a Excel"
3. **Resultado esperado**:
   - Archivo .xlsx descargado
   - 3 hojas de Excel
   - Datos formateados correctamente

### Caso 6: Cambio de Vista
1. Buscar registros
2. Vista consolidada: Ver gráficos
3. Click "Vista Detallada"
4. **Resultado esperado**: Solo tabla visible, gráficos ocultos
5. Click "Vista Consolidada"
6. **Resultado esperado**: Gráficos + tabla visible

## 🐛 Problemas Conocidos a Verificar

1. **Validar cálculo correcto del porcentaje neto**
   - Revisar que excluye correctamente: Ingreso, Salida, Break Salida, Break Regreso
   - Verificar que suma correctamente el tiempo de trabajo

2. **Verificar filtros de seguridad**
   - Supervisor no debe ver usuarios fuera de su equipo
   - Probar acceso con diferentes supervisores

3. **Formato de exportación Excel**
   - Verificar que las fechas se muestren correctamente
   - Verificar formato de duración (Xh Ym)
   - Verificar que los porcentajes sean correctos

## 📝 Script para Crear Usuario Supervisor de Prueba

Si necesitas crear un supervisor para pruebas:

```javascript
// backend/scripts/createSupervisor.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('supervisor123', 10);
  
  const supervisor = await prisma.usuario.create({
    data: {
      nombreUsuario: 'supervisor1',
      nombreCompleto: 'Supervisor Prueba',
      contraseña: password,
      correoElectronico: 'supervisor@test.com',
      rolId: 2, // Supervisor
      campañaId: 1, // Ajustar según tu DB
      estado: true
    }
  });
  
  console.log('Supervisor creado:', supervisor);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Ejecutar: `node backend/scripts/createSupervisor.js`

## 📋 Checklist de Pruebas

- [ ] Login con supervisor exitoso
- [ ] Redirección automática a /supervisor
- [ ] Filtros de fecha funcionan
- [ ] Filtro de usuario muestra solo equipo del supervisor
- [ ] Filtro de campaña funciona
- [ ] KPIs muestran valores correctos
- [ ] Porcentaje neto calculado correctamente
- [ ] Gráfico de barras muestra datos
- [ ] Gráfico de pie muestra datos
- [ ] Tabla de distribución muestra todos los datos
- [ ] Tipo de actividad (trabajo/no trabajo) correcto
- [ ] Cambio entre vistas funciona
- [ ] Exportar a Excel descarga archivo
- [ ] Excel contiene 3 hojas
- [ ] Datos en Excel son correctos
- [ ] Formato de duración es legible
- [ ] Primera entrada/última salida correctas
- [ ] Total de registros correcto
- [ ] Botón "Cerrar Sesión" funciona
- [ ] Sin errores en consola del navegador
- [ ] Sin errores en terminal backend

## 🎯 Próximos Pasos

Una vez validado el Panel Supervisor, continuar con:

1. **Panel Administrador**
   - Incluir todas las funciones del supervisor
   - Agregar filtros de Rol y Supervisor
   - Agregar navegación a módulos CRUD

2. **Módulos CRUD**
   - UserManagement
   - RoleManagement
   - ActivityManagement
   - CampaignManagement

3. **Despliegue**
   - Railway (backend)
   - Vercel (frontend)
   - Configurar variables de entorno

---

**Fecha de creación:** 31 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para pruebas
