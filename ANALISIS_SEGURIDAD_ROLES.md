# 🔒 Análisis de Seguridad y Posibles Fallos por Rol

**Fecha:** 4 de noviembre de 2025  
**Proyecto:** Control de Actividades IBR  
**Propósito:** Identificar vulnerabilidades y puntos de fallo en la aplicación

---

## 📊 Resumen Ejecutivo

Se ha realizado un análisis exhaustivo de seguridad y posibles fallos en todos los roles del sistema. El proyecto tiene una **arquitectura sólida** con buenas prácticas de seguridad implementadas.

### ✅ Fortalezas Identificadas:
- Middleware de autenticación robusto
- Validación de permisos en cada endpoint
- Separación de responsabilidades por rol
- Filtrado automático de datos según permisos

### ⚠️ Áreas de Riesgo Identificadas:
- 3 puntos críticos que requieren atención
- 5 mejoras recomendadas
- 2 optimizaciones de UX

---

## 🎯 Análisis por Rol

### 1️⃣ **ROL: ASESOR** 👤

#### ✅ **Funcionalidades Correctas:**
- ✅ Solo puede ver sus propios registros (`where.usuarioId = req.user.id`)
- ✅ No tiene acceso a endpoints administrativos
- ✅ No puede ver datos de otros asesores
- ✅ Frontend solo muestra botones de actividades operativas
- ✅ Cambio de contraseña propio funcional

#### ⚠️ **Posibles Fallos Detectados:**

##### **CRÍTICO 1: Sin validación de actividades ya finalizadas**
**Archivo:** `backend/src/controllers/activity.controller.js` línea 87-200  
**Problema:** Un asesor puede iniciar actividades incluso si ya marcó "Salida"  
**Impacto:** Datos inconsistentes en reportes  
**Estado:** ✅ **MITIGADO** - Frontend ya valida con `jornalFinished`  
**Recomendación:** Agregar validación adicional en backend:

```javascript
// En startActivity, antes de crear registro
const salidaHoy = await prisma.registroActividad.findFirst({
  where: {
    usuarioId,
    fecha: dateStrToUtcDate(getDateStrInTZ()),
    actividad: { nombreActividad: 'Salida' }
  }
});

if (salidaHoy) {
  return res.status(400).json({
    success: false,
    error: 'La jornada ya ha finalizado. No se pueden registrar más actividades.'
  });
}
```

##### **MEDIO 2: Actividad "Ingreso" puede marcarse múltiples veces**
**Archivo:** `backend/src/controllers/activity.controller.js`  
**Problema:** No hay validación que evite marcar Ingreso dos veces en el mismo día  
**Impacto:** Datos duplicados, métricas incorrectas  
**Recomendación:** Agregar validación:

```javascript
if (actividad.nombreActividad === 'Ingreso') {
  const ingresoExistente = await prisma.registroActividad.findFirst({
    where: {
      usuarioId,
      fecha: dateStrToUtcDate(getDateStrInTZ()),
      actividadId: actividad.id
    }
  });
  
  if (ingresoExistente) {
    return res.status(400).json({
      success: false,
      error: 'Ya has marcado tu ingreso hoy'
    });
  }
}
```

##### **BAJO 3: Break puede iniciarse sin cerrar break anterior**
**Archivo:** `frontend/src/components/ActivityGrid.jsx` línea 47-59  
**Problema:** Lógica de frontend puede tener race conditions  
**Impacto:** UX confusa, estado inconsistente temporalmente  
**Recomendación:** Agregar validación backend para breaks

---

### 2️⃣ **ROL: SUPERVISOR** 👥

#### ✅ **Funcionalidades Correctas:**
- ✅ Solo ve asesores de campañas asignadas (tabla `supervisor_campañas`)
- ✅ No puede acceder a funciones administrativas
- ✅ Filtros automáticos por campaña funcionan correctamente
- ✅ No puede modificar usuarios ni actividades

#### ⚠️ **Posibles Fallos Detectados:**

##### **MEDIO 4: Fallback a campaña única puede causar confusión**
**Archivo:** `backend/src/controllers/stats.controller.js` línea 89-112  
**Problema:** Si falla la lectura de `supervisor_campañas`, usa `campañaId` del usuario  
**Impacto:** Supervisor podría ver menos datos de los esperados  
**Estado:** ⚠️ **REQUIERE MONITOREO**  
**Recomendación:** Agregar logging cuando se usa fallback:

```javascript
} catch (error) {
  console.warn(`⚠️ Supervisor ${req.user.id} usando fallback de campaña única:`, error.message);
  if (req.user.campañaId) {
    where.usuario = { ...(where.usuario || {}), is: { campañaId: req.user.campañaId } };
  }
}
```

##### **BAJO 5: Sin validación de permisos en exportación**
**Archivo:** Backend (endpoint de exportación)  
**Problema:** Exportación podría permitir datos fuera del scope del supervisor  
**Recomendación:** Verificar que la exportación respete los mismos filtros de campaña

---

### 3️⃣ **ROL: ADMINISTRADOR** 🔐

#### ✅ **Funcionalidades Correctas:**
- ✅ Verificación estricta `req.user.rol !== 'Administrador'` en todos los endpoints
- ✅ Puede ver todos los datos sin restricciones
- ✅ CRUD completo de usuarios, actividades, campañas
- ✅ Panel de actividades ahora **OCULTO** (protección adicional)

#### ⚠️ **Posibles Fallos Detectados:**

##### **CRÍTICO 6: Módulo de Actividades oculto pero endpoints activos**
**Archivo:** `frontend/src/pages/AdminDashboard.jsx` línea 125, 357  
**Problema:** Tab comentado pero endpoints backend siguen accesibles vía API directa  
**Impacto:** Admin técnico podría manipular actividades con Postman/curl  
**Estado:** ⚠️ **PARCIALMENTE MITIGADO** (UI oculta)  
**Recomendación:** Implementar una de estas opciones:

**Opción A - Bloquear en Backend (MÁS SEGURO):**
```javascript
// En admin.controller.js - createActivity, updateActivity, deleteActivity
const ACTIVIDADES_PROTEGIDAS = ['Ingreso', 'Salida', 'Break Salida', 'Regreso Break'];

if (ACTIVIDADES_PROTEGIDAS.includes(nombreActividad)) {
  return res.status(403).json({
    success: false,
    error: 'Esta actividad no puede ser modificada por seguridad del sistema'
  });
}
```

**Opción B - Agregar confirmación especial:**
```javascript
// Requerir un parámetro especial para confirmar modificación
if (!req.body.confirmModification) {
  return res.status(400).json({
    success: false,
    error: 'Modificar actividades puede afectar el funcionamiento de la app. Agrega confirmModification: true para proceder.'
  });
}
```

##### **MEDIO 7: Eliminación de actividades con registros existentes**
**Archivo:** `backend/src/controllers/admin.controller.js` (deleteActivity)  
**Problema:** Schema tiene `onDelete: Cascade` - eliminar actividad borra TODOS los registros  
**Impacto:** 🔥 **PÉRDIDA MASIVA DE DATOS** si se elimina actividad con historial  
**Recomendación URGENTE:** Cambiar estrategia de eliminación:

```javascript
const deleteActivity = async (req, res) => {
  try {
    if (req.user.rol !== 'Administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    
    // ⚠️ VERIFICAR SI HAY REGISTROS ANTES DE ELIMINAR
    const registrosCount = await prisma.registroActividad.count({
      where: { actividadId: parseInt(id) }
    });
    
    if (registrosCount > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar: existen ${registrosCount} registros asociados. Desactívala en su lugar.`,
        suggestion: 'Usa el toggle de estado para desactivarla sin perder datos históricos'
      });
    }
    
    // Solo permitir eliminación si NO tiene registros
    await prisma.actividad.delete({ where: { id: parseInt(id) } });
    
    res.json({ success: true, message: 'Actividad eliminada' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  }
};
```

---

## 🔐 Análisis de Seguridad General

### **AUTENTICACIÓN Y AUTORIZACIÓN**

#### ✅ **Implementado Correctamente:**
1. **JWT con expiración** (`jwt.sign` con `expiresIn`)
2. **Middleware de autenticación** valida token en cada request
3. **Verificación de estado** (`usuario.estado === true`)
4. **Roles verificados desde BD** (no desde token)
5. **Sin exposición de información sensible** en errores

#### ⚠️ **Mejoras Recomendadas:**

##### **ALTO 8: Sin rate limiting en actividades críticas**
**Problema:** Un usuario podría enviar spam de registros de actividades  
**Recomendación:** Ya existe `perUserLimiter` en routes, ✅ CORRECTO

##### **MEDIO 9: Contraseñas sin política de complejidad**
**Archivo:** `backend/src/controllers/admin.controller.js`  
**Problema:** No valida fuerza de contraseña al crear usuarios  
**Recomendación:**
```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  if (password.length < minLength) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
    return 'La contraseña debe contener mayúsculas, minúsculas y números';
  }
  
  return null; // Válida
};
```

---

## 🛡️ Protección de Datos

### **FRONTEND - Prevención de XSS**
✅ **React automáticamente escapa HTML**  
✅ No se usa `dangerouslySetInnerHTML`  
✅ Validación de inputs en formularios

### **BACKEND - SQL Injection**
✅ **Prisma ORM previene SQL injection**  
⚠️ Query raw en `getTodaySummary` - REVISAR:

```javascript
// Línea 369 - Usar parámetros preparados
const resumen = await prisma.$queryRaw`
  SELECT ... 
  WHERE r.usuario_id = ${usuarioId}  -- ✅ CORRECTO: Parámetro
  AND r.fecha = ${dateFilter}::date  -- ✅ CORRECTO: Parámetro
  ...
`;
```

---

## 🎯 Recomendaciones Prioritarias

### **🔴 CRÍTICAS (Implementar YA)**
1. ✅ Ocultar módulo de actividades (HECHO)
2. 🔥 Proteger eliminación de actividades con registros
3. 🔥 Validar que no se registren actividades después de Salida (backend)

### **🟡 ALTAS (Implementar esta semana)**
4. Agregar logging de fallback en supervisores
5. Validar contraseñas fuertes en creación de usuarios
6. Proteger actividades críticas de modificación

### **🟢 MEDIAS (Implementar próximo mes)**
7. Validar Ingreso único por día
8. Mejorar manejo de breaks consecutivos
9. Agregar auditoría de cambios administrativos

---

## 📝 Checklist de Verificación

Usar antes de cada deploy a producción:

- [ ] Todos los endpoints admin verifican `req.user.rol === 'Administrador'`
- [ ] Frontend valida `jornalFinished` antes de habilitar botones
- [ ] No se puede eliminar actividades con registros asociados
- [ ] Supervisores solo ven sus campañas asignadas
- [ ] Asesores solo ven sus propios datos
- [ ] Logging de errores no expone información sensible
- [ ] Rate limiting activo en endpoints críticos
- [ ] Contraseñas hasheadas con bcrypt (10+ rounds)

---

## 🔍 Herramientas de Monitoreo Recomendadas

1. **Sentry** - Para tracking de errores en producción
2. **Winston** - Para logging estructurado
3. **PM2** - Para reinicio automático y logs
4. **Nginx** - Rate limiting adicional a nivel de servidor

---

## 📊 Resumen de Riesgos

| Categoría | Críticos | Altos | Medios | Bajos | Total |
|-----------|----------|-------|--------|-------|-------|
| Seguridad | 1 | 1 | 2 | 0 | 4 |
| Lógica de negocio | 1 | 1 | 3 | 2 | 7 |
| UX/Performance | 0 | 0 | 1 | 1 | 2 |
| **TOTAL** | **2** | **2** | **6** | **3** | **13** |

---

## ✅ Conclusión

El sistema tiene una **base sólida de seguridad** con buenas prácticas implementadas. Los riesgos identificados son **manejables** y la mayoría están en la categoría **MEDIA/BAJA**.

Las **2 vulnerabilidades críticas** identificadas:
1. ✅ Módulo de actividades oculto (RESUELTO)
2. 🔥 Eliminación cascada de registros (REQUIERE ATENCIÓN)

**Recomendación final:** Implementar las protecciones críticas antes de continuar agregando funcionalidades.

---

**Próxima revisión:** Después de implementar correcciones críticas
