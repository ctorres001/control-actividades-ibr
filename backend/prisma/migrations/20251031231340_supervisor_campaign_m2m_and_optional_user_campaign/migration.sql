-- DropForeignKey
ALTER TABLE "public"."usuarios" DROP CONSTRAINT "usuarios_campaña_id_fkey";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "correo_electronico" VARCHAR(100),
ALTER COLUMN "campaña_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMP(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_campañas" (
    "supervisor_id" INTEGER NOT NULL,
    "campaña_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisor_campañas_pkey" PRIMARY KEY ("supervisor_id","campaña_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_usuario_id_idx" ON "password_reset_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expira_en_idx" ON "password_reset_tokens"("expira_en");

-- CreateIndex
CREATE INDEX "supervisor_campañas_campaña_id_idx" ON "supervisor_campañas"("campaña_id");

-- CreateIndex
CREATE INDEX "usuarios_correo_electronico_idx" ON "usuarios"("correo_electronico");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_campaña_id_idx" ON "usuarios"("campaña_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_campaña_id_fkey" FOREIGN KEY ("campaña_id") REFERENCES "campañas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_campañas" ADD CONSTRAINT "supervisor_campañas_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_campañas" ADD CONSTRAINT "supervisor_campañas_campaña_id_fkey" FOREIGN KEY ("campaña_id") REFERENCES "campañas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
