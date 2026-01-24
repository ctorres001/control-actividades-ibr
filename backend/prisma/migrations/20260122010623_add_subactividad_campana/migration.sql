/*
  Warnings:

  - Made the column `tipo_horario` on table `horarios_laborales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."horarios_laborales_usuario_id_dia_semana_key";

-- AlterTable
ALTER TABLE "horarios_laborales" ALTER COLUMN "tipo_horario" SET NOT NULL;

-- AlterTable
ALTER TABLE "registro_actividades" ADD COLUMN     "id_cliente_referencia" VARCHAR(100),
ADD COLUMN     "resumen_breve" TEXT;

-- CreateTable
CREATE TABLE "subactividad_campañas" (
    "subactividad_id" INTEGER NOT NULL,
    "campaña_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subactividad_campañas_pkey" PRIMARY KEY ("subactividad_id","campaña_id")
);

-- CreateIndex
CREATE INDEX "subactividad_campañas_campaña_id_idx" ON "subactividad_campañas"("campaña_id");

-- AddForeignKey
ALTER TABLE "subactividad_campañas" ADD CONSTRAINT "subactividad_campañas_subactividad_id_fkey" FOREIGN KEY ("subactividad_id") REFERENCES "subactividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subactividad_campañas" ADD CONSTRAINT "subactividad_campañas_campaña_id_fkey" FOREIGN KEY ("campaña_id") REFERENCES "campañas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "horarios_laborales_unique_horario_config_key" RENAME TO "horarios_laborales_usuario_id_tipo_horario_dia_semana_fecha_key";
