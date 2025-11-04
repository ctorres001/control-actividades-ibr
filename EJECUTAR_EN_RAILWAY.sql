-- ================================================
-- MIGRACIÓN: Agregar Campos de Subactividades
-- Fecha: 2025-11-04
-- ================================================
-- INSTRUCCIONES:
-- 1. Ir a Railway → PostgreSQL Database → Query
-- 2. Copiar y pegar este script completo
-- 3. Click en "Run Query"
-- 4. Verificar resultado esperado abajo
-- ================================================

-- Agregar columna id_cliente_referencia (VARCHAR 100)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS id_cliente_referencia VARCHAR(100);

-- Agregar columna resumen_breve (TEXT)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS resumen_breve TEXT;

-- Comentarios de las columnas para documentación
COMMENT ON COLUMN registro_actividades.id_cliente_referencia IS 'ID del cliente o referencia ingresada por el asesor';
COMMENT ON COLUMN registro_actividades.resumen_breve IS 'Resumen breve de la actividad ingresado por el asesor';

-- ================================================
-- VERIFICACIÓN (copiar y ejecutar por separado)
-- ================================================

SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'registro_actividades'
  AND column_name IN ('id_cliente_referencia', 'resumen_breve')
ORDER BY column_name;

-- ================================================
-- RESULTADO ESPERADO:
-- ================================================
--        column_name        | data_type | character_maximum_length | is_nullable
-- ---------------------------+-----------+-------------------------+-------------
--  id_cliente_referencia     | varchar   |          100            |    YES
--  resumen_breve             | text      |         NULL            |    YES
-- ================================================
