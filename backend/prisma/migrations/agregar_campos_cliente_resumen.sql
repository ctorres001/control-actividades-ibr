-- Migration: Agregar campos id_cliente_referencia y resumen_breve
-- Fecha: 2025-11-04
-- Descripción: Agregar campos separados para almacenar ID Cliente/Referencia y Resumen Breve

-- Agregar columna id_cliente_referencia (VARCHAR 100)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS id_cliente_referencia VARCHAR(100);

-- Agregar columna resumen_breve (TEXT)
ALTER TABLE registro_actividades
ADD COLUMN IF NOT EXISTS resumen_breve TEXT;

-- Comentarios de las columnas para documentación
COMMENT ON COLUMN registro_actividades.id_cliente_referencia IS 'ID del cliente o referencia ingresada por el asesor';
COMMENT ON COLUMN registro_actividades.resumen_breve IS 'Resumen breve de la actividad ingresado por el asesor';
