# Prueba de carga con k6 (80 usuarios)

Este escenario valida que la API soporte ~80 usuarios concurrentes con operaciones típicas: iniciar/detener actividad, leer resumen/log, y consultar "asesores activos".

## Requisitos
- k6 instalado (Windows): descarga MSI desde https://k6.io/
- Backend en ejecución (p.ej. http://localhost:3001)

## Variables de entorno
- `BASE_URL` (default: http://localhost:3001/api)
- `K6_USERNAME` (default: asesor1)
- `K6_PASSWORD` (default: Asesor1@2024)

## Cómo ejecutar (PowerShell)
```powershell
$env:BASE_URL="http://localhost:3001/api";
$env:K6_USERNAME="asesor1";
$env:K6_PASSWORD="Asesor1@2024";
k6 run tests/load/k6/ibr-load-test.js
```

## Escenario
- Ramp-up a 80 VUs y mantener ~8 minutos.
- Mezcla de:
  - GET /activities/active
  - POST /activities/start (actividad aleatoria, evitando Ingreso/Salida)
  - POST /activities/stop
  - GET /activities/today/summary?date=YYYY-MM-DD
  - GET /activities/today/log?date=YYYY-MM-DD
  - GET /stats/asesores-activos (30% de las iteraciones)

## Umbrales de aceptación
- Errores < 1% (http_req_failed < 0.01)
- p95 < 600 ms (http_req_duration p(95) < 600)

## Notas
- Si observas 429 (rate limit) en /activities/start/stop, incrementa el `max` por usuario o ajusta el mix de operaciones.
- Para entornos productivos, monitorea CPU/Mem del servidor y métricas de la base de datos.
