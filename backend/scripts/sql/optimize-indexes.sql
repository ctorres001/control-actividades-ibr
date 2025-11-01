-- Índices de optimización para consultas de actividad actual y registros del día
-- Ejecutar en la base de datos de producción/staging por un DBA o con supervisión.

-- Índice parcial para actividades abiertas por usuario
-- Acelera: getCurrentActivity, asesores-activos, cierres de actividad
CREATE INDEX IF NOT EXISTS idx_registro_actividades_usuario_open
ON registro_actividades (usuario_id)
WHERE hora_fin IS NULL;

-- Índice por fecha y usuario ya existe por Prisma (@@index([usuarioId, fecha]))
-- Opcionalmente, un índice por (fecha) solo puede ayudar a rangos de fechas grandes
-- CREATE INDEX IF NOT EXISTS idx_registro_actividades_fecha ON registro_actividades (fecha);
