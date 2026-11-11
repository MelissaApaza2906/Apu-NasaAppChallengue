// Renueva los RESPALDOS de los datos en vivo del menú (los usa la app si no hay internet o la
// API falla y todavía no guardó nada en el navegador):
//   public/datos/terra-tle.txt       órbita del satélite Terra (CelesTrak, NORAD 25994)
//   public/datos/eonet-respaldo.json eventos abiertos de NASA EONET (icebergs y volcanes)
// Uso: node scripts/actualizar-tle.mjs   (lo corre cada día .github/workflows/actualizar-respaldos.yml)
// Si una fuente falla, deja su archivo como estaba.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { lineasTLE, simplificarEonet } from '../src/servicios/en-vivo.js';

const DATOS = new URL('../public/datos/', import.meta.url);
const URL_TLE = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25994&FORMAT=TLE';
const URL_EONET = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=seaLakeIce,volcanoes&days=60';

async function pedir(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'apu-respaldos' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return r;
}

let fallos = 0;
try {
  const lineas = lineasTLE(await (await pedir(URL_TLE)).text());
  if (!lineas) throw new Error('la respuesta no tiene las dos líneas de Terra');
  await writeFile(new URL('terra-tle.txt', DATOS), `TERRA\n${lineas.join('\n')}\n`);
  console.log('Terra:', lineas[0]);
} catch (e) {
  fallos++;
  console.error('No se pudo renovar la órbita de Terra:', e.message);
}
try {
  const eventos = simplificarEonet(await (await pedir(URL_EONET)).json());
  await writeFile(new URL('eonet-respaldo.json', DATOS), `${JSON.stringify({ guardado: new Date().toISOString(), eventos }, null, 1)}\n`);
  console.log(`EONET: ${eventos.length} eventos`);
} catch (e) {
  fallos++;
  console.error('No se pudieron renovar los eventos de EONET:', e.message);
}
console.log('Respaldos en', fileURLToPath(DATOS));
process.exitCode = fallos === 2 ? 1 : 0;
