// scripts/previewSubactivityAssignments.js
// Lee el Excel "Subactividades actualizadas.xlsx" y genera una vista previa
// de asignaciones (Campaña -> Actividad -> Subactividades) y renombres sugeridos.
// No modifica la base de datos.

/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';

// Nota: este script requiere el paquete "xlsx" en tiempo de ejecución.
// Ejecuta con: npx -p xlsx node backend/scripts/previewSubactivityAssignments.js [ruta_excel]

const tryPaths = (argPath) => {
  const candidates = [];
  if (argPath) candidates.push(argPath);
  candidates.push(path.resolve(process.cwd(), 'Subactividades actualizadas.xlsx'));
  candidates.push(path.resolve(process.cwd(), '..', 'Subactividades actualizadas.xlsx'));
  candidates.push('D:/FNB/Proyectos/control-actividades/Subactividades actualizadas.xlsx');
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch (_) {}
  }
  return null;
};

const main = async () => {
  const arg = process.argv[2] || null;
  const excelPath = tryPaths(arg);
  if (!excelPath) {
    console.error('No se encontró el archivo Excel. Pasa la ruta como argumento.');
    process.exit(2);
    return;
  }

  // Cargar xlsx mediante import dinámico (compatible con ESM)
  const xlsxMod = await import('xlsx');
  const xlsx = xlsxMod.default || xlsxMod;
  const wb = xlsx.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '', raw: true });

  const getStr = (obj, key) => String(obj[key] ?? '').trim();
  const getInt = (obj, key) => {
    const v = obj[key];
    const n = parseInt(String(v).trim(), 10);
    return Number.isFinite(n) ? n : null;
  };

  const mapping = new Map(); // campaign -> activity -> [subactivity]
  const renames = []; // { current, updated }
  const stats = { total: rows.length, byCampaign: {}, byActivity: {} };

  for (const r of rows) {
    const campaign = getStr(r, 'Campaña') || 'General';
    const activity = getStr(r, 'Actividad');
    const subCurrent = getStr(r, 'Subactividad');
    const subUpdated = getStr(r, 'Nombre actualizado Subactividad') || subCurrent;
    const descripcion = getStr(r, 'Descripción');
    const orden = getInt(r, 'Orden');
    const estadoStr = getStr(r, 'Estado').toLowerCase();
    const activo = estadoStr.includes('activo');

    if (!mapping.has(campaign)) mapping.set(campaign, new Map());
    const actMap = mapping.get(campaign);
    if (!actMap.has(activity)) actMap.set(activity, []);
    actMap.get(activity).push({ nombre: subUpdated, nombreOriginal: subCurrent, descripcion, orden, activo });

    if (subUpdated && subCurrent && subUpdated !== subCurrent) {
      renames.push({ current: subCurrent, updated: subUpdated });
    }

    stats.byCampaign[campaign] = (stats.byCampaign[campaign] || 0) + 1;
    stats.byActivity[activity] = (stats.byActivity[activity] || 0) + 1;
  }

  // Armar salida legible
  const out = {
    file: excelPath,
    stats,
    campaigns: Array.from(mapping.entries()).map(([campaign, actMap]) => ({
      campaign,
      activities: Array.from(actMap.entries()).map(([activity, subs]) => ({
        activity,
        count: subs.length,
        subs: subs
      }))
    })),
    renames: renames,
    previewRenames: renames.slice(0, 20)
  };

  console.log(JSON.stringify(out, null, 2));
};

main().catch((e) => { console.error('Error:', e); process.exit(1); });
