-- CreateTable
CREATE TABLE "horarios_laborales" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fin" VARCHAR(5) NOT NULL,
    "horas_objetivo" DECIMAL(4,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "horarios_laborales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_laborales_usuario_id_idx" ON "horarios_laborales"("usuario_id");

-- CreateIndex
CREATE INDEX "horarios_laborales_activo_idx" ON "horarios_laborales"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_laborales_usuario_id_dia_semana_key" ON "horarios_laborales"("usuario_id", "dia_semana");

-- AddForeignKey
ALTER TABLE "horarios_laborales" ADD CONSTRAINT "horarios_laborales_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
