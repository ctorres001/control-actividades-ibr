/*
  Warnings:

  - A unique constraint covering the columns `[nombre_actividad]` on the table `actividades` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "actividades_nombre_actividad_key" ON "actividades"("nombre_actividad");
