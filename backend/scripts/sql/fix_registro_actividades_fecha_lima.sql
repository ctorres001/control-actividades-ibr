-- Corrige la columna DATE `fecha` en `registro_actividades`
-- Recalcula `fecha` a partir de `hora_inicio` en la zona horaria America/Lima
-- Ejecuta primero el SELECT para ver cuántos registros se ajustarían.

-- Vista previa (conteo de registros desalineados)
SELECT COUNT(*) AS desalineados
FROM registro_actividades r
WHERE r.hora_inicio IS NOT NULL
  AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE 'America/Lima') AS date);

-- Actualización (quitar comentarios para aplicar)
-- UPDATE registro_actividades r
-- SET fecha = CAST((r.hora_inicio AT TIME ZONE 'America/Lima') AS date)
-- WHERE r.hora_inicio IS NOT NULL
--   AND r.fecha IS DISTINCT FROM CAST((r.hora_inicio AT TIME ZONE 'America/Lima') AS date);
