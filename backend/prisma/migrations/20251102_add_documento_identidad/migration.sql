-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "documento_identidad" VARCHAR(20);

-- CreateIndex (opcional, para búsquedas rápidas)
CREATE INDEX "usuarios_documento_identidad_idx" ON "usuarios"("documento_identidad");
