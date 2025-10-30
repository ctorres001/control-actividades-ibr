-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campañas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "campañas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre_usuario" VARCHAR(50) NOT NULL,
    "contraseña" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol_id" INTEGER NOT NULL,
    "campaña_id" INTEGER NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "nombre_actividad" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subactividades" (
    "id" SERIAL NOT NULL,
    "actividad_id" INTEGER NOT NULL,
    "nombre_subactividad" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subactividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_actividades" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "actividad_id" INTEGER NOT NULL,
    "subactividad_id" INTEGER,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora_inicio" TIMESTAMP(6),
    "hora_fin" TIMESTAMP(6),
    "duracion_seg" INTEGER,
    "duracion_hms" TEXT,
    "estado" VARCHAR(50),
    "observaciones" TEXT,

    CONSTRAINT "registro_actividades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "campañas_nombre_key" ON "campañas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_usuario_key" ON "usuarios"("nombre_usuario");

-- CreateIndex
CREATE INDEX "usuarios_nombre_usuario_idx" ON "usuarios"("nombre_usuario");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_campaña_id_idx" ON "usuarios"("rol_id", "campaña_id");

-- CreateIndex
CREATE INDEX "actividades_activo_orden_idx" ON "actividades"("activo", "orden");

-- CreateIndex
CREATE INDEX "subactividades_actividad_id_activo_idx" ON "subactividades"("actividad_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "subactividades_actividad_id_nombre_subactividad_key" ON "subactividades"("actividad_id", "nombre_subactividad");

-- CreateIndex
CREATE INDEX "registro_actividades_usuario_id_fecha_idx" ON "registro_actividades"("usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "registro_actividades_actividad_id_idx" ON "registro_actividades"("actividad_id");

-- CreateIndex
CREATE INDEX "registro_actividades_subactividad_id_idx" ON "registro_actividades"("subactividad_id");

-- CreateIndex
CREATE INDEX "registro_actividades_hora_fin_idx" ON "registro_actividades"("hora_fin");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_campaña_id_fkey" FOREIGN KEY ("campaña_id") REFERENCES "campañas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subactividades" ADD CONSTRAINT "subactividades_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_actividades" ADD CONSTRAINT "registro_actividades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_actividades" ADD CONSTRAINT "registro_actividades_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_actividades" ADD CONSTRAINT "registro_actividades_subactividad_id_fkey" FOREIGN KEY ("subactividad_id") REFERENCES "subactividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
