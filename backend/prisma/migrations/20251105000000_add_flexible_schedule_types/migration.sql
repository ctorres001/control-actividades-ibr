-- AlterTable: Add flexible schedule support
-- Adds tipo_horario (schedule type) and fecha_especifica (specific date) columns
-- Makes dia_semana nullable for daily/monthly schedules

-- Step 1: Add new columns
ALTER TABLE "horarios_laborales" 
ADD COLUMN "tipo_horario" VARCHAR(20) DEFAULT 'semanal',
ADD COLUMN "fecha_especifica" DATE;

-- Step 2: Create indexes for new columns
CREATE INDEX "horarios_laborales_tipo_horario_idx" ON "horarios_laborales"("tipo_horario");
CREATE INDEX "horarios_laborales_fecha_especifica_idx" ON "horarios_laborales"("fecha_especifica");

-- Step 3: Drop old unique constraint
ALTER TABLE "horarios_laborales" DROP CONSTRAINT IF EXISTS "horarios_laborales_usuario_id_dia_semana_key";

-- Step 4: Make dia_semana nullable (for daily/monthly schedules)
ALTER TABLE "horarios_laborales" ALTER COLUMN "dia_semana" DROP NOT NULL;

-- Step 5: Add new composite unique constraint
-- This allows multiple entries per user with different schedule types
CREATE UNIQUE INDEX "horarios_laborales_unique_horario_config_key" 
ON "horarios_laborales"("usuario_id", "tipo_horario", "dia_semana", "fecha_especifica");

-- Step 6: Add check constraint to ensure data integrity
-- For 'semanal': dia_semana required, fecha_especifica NULL
-- For 'mensual' or 'diario': fecha_especifica required, dia_semana NULL
ALTER TABLE "horarios_laborales" 
ADD CONSTRAINT "horarios_laborales_tipo_check" CHECK (
  (tipo_horario = 'semanal' AND dia_semana IS NOT NULL AND fecha_especifica IS NULL) OR
  (tipo_horario = 'mensual' AND fecha_especifica IS NOT NULL AND dia_semana IS NULL) OR
  (tipo_horario = 'diario' AND fecha_especifica IS NOT NULL AND dia_semana IS NULL)
);
