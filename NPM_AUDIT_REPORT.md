# Reporte de Vulnerabilidades - npm audit

**Fecha**: 2025-11-03  
**Proyecto**: control-actividades-ibr

---

## ✅ Backend: SIN VULNERABILIDADES

```bash
found 0 vulnerabilities
```

Estado: **SEGURO** ✅

---

## ⚠️ Frontend: 3 VULNERABILIDADES

### 1. esbuild <=0.24.2 (Moderate)

**CVE**: GHSA-67mh-4wv8-2f99  
**Severidad**: Moderate  
**Afectado**: vite (dependencia de desarrollo)  
**Descripción**: esbuild permite que cualquier website envíe requests al dev server

**Impacto Real**: 
- ⚠️ Solo afecta en **desarrollo local**
- ✅ **NO afecta producción** (esbuild no se incluye en el build final)
- ⚠️ Riesgo: Si un desarrollador visita un sitio malicioso mientras corre `npm run dev`

**Fix disponible**: `npm audit fix --force`
- ⚠️ Instalaría Vite 7.x (breaking change)
- ⚠️ Puede romper la configuración actual

**Recomendación**: 
```
✅ NO aplicar fix con --force
✅ Actualizar manualmente cuando Vite 7 sea estable
✅ Por ahora: No visitar sitios no confiables mientras el dev server está corriendo
```

**Mitigación temporal**:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    host: '127.0.0.1', // Solo localhost, no 0.0.0.0
    strictPort: true
  }
})
```

---

### 2. xlsx - Prototype Pollution (High)

**CVE**: GHSA-4r6h-8v6p-xvw6  
**Severidad**: High  
**Afectado**: xlsx@0.18.5  
**Descripción**: Vulnerabilidad de Prototype Pollution en SheetJS

**Uso en el proyecto**:
```javascript
// frontend/src/services/statsService.js
import * as XLSX from 'xlsx';

// Usado solo para EXPORTAR datos (write)
// NO se usa para LEER archivos xlsx de usuarios
```

**Impacto Real**:
- ✅ **BAJO en nuestro caso** porque:
  - Solo EXPORTAMOS datos (no parseamos xlsx externos)
  - Datos vienen de nuestro backend autenticado
  - No hay input de usuario en el proceso
- ⚠️ La vulnerabilidad afecta principalmente al PARSEAR archivos xlsx maliciosos

**Fix disponible**: No disponible aún

**Recomendación**:
```
✅ MANTENER xlsx por ahora (riesgo bajo en nuestro uso)
✅ Monitorear actualizaciones: https://github.com/SheetJS/sheetjs/security/advisories
✅ Considerar alternativa a largo plazo: exceljs
```

**Alternativa (implementar si es crítico)**:
```bash
npm uninstall xlsx
npm install exceljs
```

Requiere reescribir `statsService.js` para usar exceljs.

---

### 3. xlsx - ReDoS (Moderate)

**CVE**: GHSA-5pgg-2g8v-p4x9  
**Severidad**: Moderate  
**Afectado**: xlsx@*  
**Descripción**: Regular Expression Denial of Service

**Impacto Real**:
- ✅ **MUY BAJO** porque:
  - Solo exportamos (no parseamos)
  - No hay regex user-controlled en nuestro uso

**Recomendación**: Igual que el punto 2 (mantener y monitorear)

---

## 📊 RESUMEN EJECUTIVO

| Componente | Vulnerabilidades | Riesgo Real | Acción |
|------------|------------------|-------------|---------|
| Backend | 0 | ✅ Ninguno | Ninguna |
| Frontend - esbuild | 1 moderate | ⚠️ Solo dev | Mitigar config |
| Frontend - xlsx | 2 (1 high, 1 mod) | ✅ Bajo | Monitorear |

---

## 🎯 PLAN DE ACCIÓN

### Acción Inmediata (HOY)
✅ **NADA CRÍTICO** - Las vulnerabilidades tienen bajo impacto en nuestro caso de uso

### Corto Plazo (1-2 semanas)
1. ⚠️ Configurar Vite para solo escuchar en 127.0.0.1 (mitigar esbuild)
2. 📋 Revisar alternativas a xlsx (exceljs, xlsx-populate)
3. 🔍 Monitorear actualizaciones de xlsx

### Medio Plazo (1 mes)
1. 🔄 Evaluar migración a exceljs si no hay fix de xlsx
2. 🔄 Actualizar Vite cuando v7 sea estable
3. 📊 Re-auditar dependencias

---

## 🛡️ MITIGACIÓN APLICABLE HOY

### 1. Configurar Vite para mayor seguridad

**Archivo**: `frontend/vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  
  server: {
    host: '127.0.0.1',  // ✅ Solo localhost (no 0.0.0.0)
    port: 3000,
    strictPort: true,    // ✅ Fallar si el puerto está ocupado
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // ... resto de config
})
```

### 2. Añadir validación de datos antes de exportar

**Archivo**: `frontend/src/services/statsService.js`

```javascript
export function exportToExcel(registros, filename = 'estadisticas', options = {}) {
  // ✅ Validar datos antes de exportar
  if (!Array.isArray(registros)) {
    throw new Error('registros debe ser un array');
  }
  
  // ✅ Sanitizar filename
  const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_');
  
  // ... resto del código
}
```

---

## 📋 MONITOREO CONTINUO

### Comandos para revisar periódicamente

```bash
# Auditoría completa
npm audit

# Ver solo vulnerabilidades de producción
npm audit --production

# Ver detalles de una vulnerabilidad específica
npm audit --json | grep -A 20 "xlsx"
```

### Suscribirse a notificaciones

- GitHub Security Advisories: https://github.com/SheetJS/sheetjs/security
- npm advisories: https://github.com/advisories

---

## 🔄 ALTERNATIVAS A xlsx

### Opción 1: exceljs (Recomendada)
```bash
npm install exceljs
```

**Pros**:
- ✅ Mantenido activamente
- ✅ Sin vulnerabilidades conocidas
- ✅ Mejor API
- ✅ Soporte de estilos mejorado

**Cons**:
- ⚠️ Requiere reescribir código
- ⚠️ API diferente

### Opción 2: xlsx-populate
```bash
npm install xlsx-populate
```

**Pros**:
- ✅ Enfocado en generación (no parsing)
- ✅ API más simple

**Cons**:
- ⚠️ Menos features que xlsx

### Opción 3: Mantener xlsx + sanitización
```javascript
// Sanitizar datos antes de exportar
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remover caracteres especiales que puedan ser peligrosos
    return value.replace(/[<>]/g, '');
  }
  return value;
};
```

---

## ✅ DECISIÓN RECOMENDADA

**Para este proyecto**:

1. ✅ **NO aplicar `npm audit fix --force`** (breaking changes innecesarios)
2. ✅ **Mantener xlsx por ahora** (riesgo bajo en nuestro caso de uso)
3. ✅ **Aplicar configuración de seguridad en Vite** (cambio menor)
4. ✅ **Monitorear actualizaciones de xlsx** (revisar en 2-4 semanas)
5. 📋 **Planear migración a exceljs** si no hay fix en 2 meses

**Justificación**:
- Las vulnerabilidades de xlsx afectan principalmente al PARSING
- Nosotros solo EXPORTAMOS datos controlados
- No hay input de usuario en el proceso
- El riesgo real es BAJO

---

## 📞 CONTACTO

Si detectas comportamiento anómalo relacionado con exportación de Excel:
1. Reportar inmediatamente
2. Suspender funcionalidad de exportación
3. Revisar logs de acceso

---

**Última actualización**: 2025-11-03  
**Próxima revisión**: 2025-11-17  
**Responsable**: Equipo de Desarrollo
