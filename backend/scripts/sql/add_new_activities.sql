-- =====================================================
-- Script SQL para agregar actividades "Revisión" y "Gestión"
-- Ejecutar directamente en la base de datos
-- =====================================================

-- Insertar Revisión (si no existe)
INSERT INTO actividades (nombre_actividad, descripcion, orden, activo)
VALUES ('Revisión', 'Revisión de casos o documentos', 7, true)
ON CONFLICT (nombre_actividad) 
DO UPDATE SET 
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  activo = EXCLUDED.activo;

-- Insertar Gestión (si no existe)
INSERT INTO actividades (nombre_actividad, descripcion, orden, activo)
VALUES ('Gestión', 'Tareas de gestión administrativa', 8, true)
ON CONFLICT (nombre_actividad) 
DO UPDATE SET 
  descripcion = EXCLUDED.descripcion,
  orden = EXCLUDED.orden,
  activo = EXCLUDED.activo;

-- Verificar que se insertaron correctamente
SELECT id, nombre_actividad, descripcion, orden, activo 
FROM actividades 
WHERE nombre_actividad IN ('Revisión', 'Gestión')
ORDER BY orden;
