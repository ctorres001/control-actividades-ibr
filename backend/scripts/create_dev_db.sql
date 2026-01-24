-- Crear base de datos de desarrollo
CREATE DATABASE control_actividades_dev
  WITH
  ENCODING 'UTF8'
  LC_COLLATE 'C'
  LC_CTYPE 'C'
  TEMPLATE = template0;

-- Mensaje de confirmación
GRANT ALL PRIVILEGES ON DATABASE control_actividades_dev TO postgres;
