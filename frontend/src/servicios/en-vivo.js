// Datos EN VIVO del menú, siempre con respaldo (la app nunca queda vacía):
//
//   const tle = await leerTerra();     // { lineas: [l1, l2], fecha: Date, enVivo: bool }
//   const ev  = await leerEventos();   // { eventos: [{ id, titulo, tipo, lat, lon, fecha }], fecha, enVivo }
//   lugarAproximado(lat, lon)          // 'sobre Bolivia' · 'sobre el océano' (tabla simple, sin API)
//   fechaLarga(fecha)                  // '11 de noviembre de 2026'
//
// Orden de cada dato: 1) la API (CelesTrak / NASA EONET) → se guarda en localStorage;
// 2) si falla, lo último guardado en localStorage; 3) si no hay nada, el archivo de public/datos/
// (lo renueva cada día scripts/actualizar-tle.mjs con GitHub Actions). enVivo = false → la
// pantalla muestra "Actualizado el <fecha>".

const URL_TLE = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25994&FORMAT=TLE'; // Terra (NORAD 25994)
const URL_EONET = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=seaLakeIce,volcanoes&days=60';
const RESPALDO_TLE = '/datos/terra-tle.txt';
const RESPALDO_EONET = '/datos/eonet-respaldo.json';
const CLAVE_TLE = 'apu:terra-tle';
const CLAVE_EONET = 'apu:eonet';
// CelesTrak actualiza la órbita cada ~2 h y bloquea a quien pide más seguido: hasta entonces, la guardada
const ESPERA_TLE = 2 * 3600 * 1000;
const CLAVE_FALLO_TLE = 'apu:terra-tle-fallo';
const ESPERA_FALLO_TLE = 30 * 60 * 1000;

// localStorage puede no estar (modo privado, sitio bloqueado): nunca rompe
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}
function recuperar(clave) {
  try { return JSON.parse(localStorage.getItem(clave) ?? 'null'); } catch { return null; }
}

async function pedir(url, ms = 9000) {
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), ms);
  try {
    const r = await fetch(url, { signal: control.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------
// Órbita de Terra (TLE: dos líneas de números que describen la órbita)
// ---------------------------------------------------------------
export function lineasTLE(texto) {
  const l = String(texto ?? '').split(/\r?\n/).map((s) => s.trim());
  const l1 = l.find((s) => s.startsWith('1 25994'));
  const l2 = l.find((s) => s.startsWith('2 25994'));
  return l1 && l2 ? [l1, l2] : null;
}
// Época del TLE (cuándo se midió la órbita): "26315.61106774" = año 2026, día 315,61
export function epocaTLE([l1]) {
  const yy = Number(l1.slice(18, 20));
  const dia = Number(l1.slice(20, 32));
  return new Date(Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (dia - 1) * 86_400_000);
}

export async function leerTerra() {
  const guardado = recuperar(CLAVE_TLE);
  const lineasGuardadas = guardado?.lineas?.length === 2 ? guardado.lineas : null;
  if (lineasGuardadas && Date.now() - Date.parse(guardado.guardado) < ESPERA_TLE) {
    return { lineas: lineasGuardadas, fecha: new Date(guardado.guardado), enVivo: true };
  }
  // Si CelesTrak falló hace poco (sin internet o límite de pedidos: 403), no se insiste
  const fallo = recuperar(CLAVE_FALLO_TLE);
  if (!(fallo && Date.now() - fallo < ESPERA_FALLO_TLE)) {
    try {
      const lineas = lineasTLE(await (await pedir(URL_TLE)).text());
      if (!lineas) throw new Error('TLE sin las dos líneas de Terra');
      const ahora = new Date();
      guardar(CLAVE_TLE, { lineas, guardado: ahora.toISOString() });
      return { lineas, fecha: ahora, enVivo: true };
    } catch (e) {
      guardar(CLAVE_FALLO_TLE, Date.now());
      console.info('APU: CelesTrak no respondió; se usa la órbita guardada de Terra.', e.message);
    }
  }
  if (lineasGuardadas) return { lineas: lineasGuardadas, fecha: new Date(guardado.guardado), enVivo: false };
  try {
    const lineas = lineasTLE(await (await pedir(RESPALDO_TLE, 5000)).text());
    if (lineas) return { lineas, fecha: epocaTLE(lineas), enVivo: false };
  } catch { /* sin archivo */ }
  return null;
}

// ---------------------------------------------------------------
// Eventos de la Tierra (NASA EONET): icebergs y volcanes
// ---------------------------------------------------------------
// Último punto de un evento: [lon, lat] (si es un polígono, su centro aproximado)
function ultimoPunto(geometrias) {
  const g = [...(geometrias ?? [])].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).at(-1);
  if (!g) return null;
  if (g.type === 'Point') return { lon: g.coordinates[0], lat: g.coordinates[1], fecha: g.date };
  const anillo = g.coordinates?.[0] ?? [];
  if (!anillo.length) return null;
  const s = anillo.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  return { lon: s[0] / anillo.length, lat: s[1] / anillo.length, fecha: g.date };
}

// Respuesta de EONET → lo que necesita el globo
export function simplificarEonet(json) {
  return (json?.events ?? []).flatMap((e) => {
    const cat = e.categories?.map((c) => c.id) ?? [];
    const tipo = cat.includes('volcanoes') ? 'volcan' : cat.includes('seaLakeIce') ? 'iceberg' : null;
    const p = ultimoPunto(e.geometry);
    if (!tipo || !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return [];
    return [{ id: e.id, titulo: tituloEs(e.title, tipo), tipo, lat: p.lat, lon: p.lon, fecha: p.fecha }];
  });
}

// "Sheveluch Volcano, Russia" → "Volcán Sheveluch, Rusia" (los icebergs ya dicen "Iceberg B22A")
const PAISES = {
  Russia: 'Rusia', Japan: 'Japón', 'United States': 'Estados Unidos', Mexico: 'México', Peru: 'Perú',
  Philippines: 'Filipinas', Italy: 'Italia', Iceland: 'Islandia', 'Papua New Guinea': 'Papúa Nueva Guinea',
  'New Zealand': 'Nueva Zelanda', Ethiopia: 'Etiopía', 'DR Congo': 'R. D. del Congo', France: 'Francia',
  Colombia: 'Colombia', Ecuador: 'Ecuador', Chile: 'Chile', Indonesia: 'Indonesia', Guatemala: 'Guatemala',
  Nicaragua: 'Nicaragua', 'Costa Rica': 'Costa Rica', 'El Salvador': 'El Salvador', Vanuatu: 'Vanuatu'
};
function tituloEs(titulo, tipo) {
  const t = String(titulo ?? '').trim();
  if (tipo !== 'volcan') return t;
  const [nombre, ...resto] = t.split(',');
  const pais = resto.join(',').trim();
  return `Volcán ${nombre.replace(/\s*Volcano\s*/i, ' ').trim()}${pais ? `, ${PAISES[pais] ?? pais}` : ''}`;
}

export async function leerEventos() {
  try {
    const eventos = simplificarEonet(await (await pedir(URL_EONET, 12000)).json());
    const ahora = new Date();
    guardar(CLAVE_EONET, { eventos, guardado: ahora.toISOString() });
    return { eventos, fecha: ahora, enVivo: true };
  } catch (e) {
    console.info('APU: NASA EONET no respondió; se usan los últimos eventos guardados.', e.message);
  }
  const guardado = recuperar(CLAVE_EONET);
  if (Array.isArray(guardado?.eventos)) return { eventos: guardado.eventos, fecha: new Date(guardado.guardado), enVivo: false };
  try {
    const archivo = await (await pedir(RESPALDO_EONET, 5000)).json();
    if (Array.isArray(archivo?.eventos)) return { eventos: archivo.eventos, fecha: new Date(archivo.guardado), enVivo: false };
  } catch { /* sin archivo */ }
  return { eventos: [], fecha: null, enVivo: false };
}

// ---------------------------------------------------------------
// ¿Sobre qué lugar está? Cajas aproximadas [frase, latMín, latMáx, lonMín, lonMáx], de la más
// chica a la más grande (la primera que contiene el punto gana). Fuera de todas: el océano.
// ---------------------------------------------------------------
const LUGARES = [
  ['sobre Bolivia', -22.9, -9.7, -69.6, -57.5],
  ['sobre Chile', -56, -17.5, -75.7, -69.8],
  ['sobre el Perú', -18.3, -0.1, -81.3, -68.7],
  ['sobre Ecuador', -5, 1.4, -81, -75.2],
  ['sobre Colombia', -4.2, 12.4, -79, -67],
  ['sobre Venezuela', 0.7, 12.2, -73.3, -59.8],
  ['sobre Paraguay', -27.6, -19.3, -62.6, -54.3],
  ['sobre Argentina', -55, -21.8, -73.5, -53.6],
  ['sobre Brasil', -33.7, 5.2, -73.9, -34.8],
  ['sobre México', 14.5, 32.7, -117, -86.7],
  ['sobre Estados Unidos', 25, 49, -124.7, -67],
  ['sobre Alaska', 54, 71.5, -168, -141],
  ['sobre Groenlandia', 59.8, 83.6, -73, -11],
  ['sobre Canadá', 41.7, 83, -141, -52.6],
  ['sobre Islandia', 63.3, 66.6, -24.5, -13.5],
  ['sobre la Antártida', -90, -63, -180, 180],
  ['sobre Australia', -39, -10.7, 113, 153.6],
  ['sobre Nueva Zelanda', -47.3, -34.4, 166.4, 178.6],
  ['sobre Japón', 30, 45.5, 129.5, 146],
  ['sobre Indonesia', -11, 6, 95, 141],
  ['sobre la India', 8, 35.5, 68, 89],
  ['sobre China', 18, 53.5, 73.5, 134.8],
  ['sobre Rusia', 50, 78, 27, 180],
  ['sobre Madagascar', -25.6, -12, 43.2, 50.5],
  ['sobre Europa', 36, 71, -10, 40],
  ['sobre África', 5, 37.5, -17.5, 51.5],
  ['sobre África', -35, 5, 9, 41],
  ['sobre Asia', 12, 30, 35, 60],
  ['sobre Asia', 20, 77, 40, 145],
  ['sobre Asia', 5, 20, 92, 110],
  ['sobre Centroamérica', 7, 18.5, -92, -77],
  ['sobre Norteamérica', 15, 72, -168, -52],
  ['sobre Sudamérica', -56, 12.5, -81.5, -34.8]
];
export function lugarAproximado(lat, lon) {
  const l = LUGARES.find(([, a, b, c, d]) => lat >= a && lat <= b && lon >= c && lon <= d);
  return l ? l[0] : 'sobre el océano';
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });
const FORMATO_FECHA_UTC = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
// utc: true para las fechas de EONET (son días UTC: '2026-11-05T00:00:00Z' es el 5, no el 4 en Bolivia)
export const fechaLarga = (f, { utc = false } = {}) =>
  (f && !Number.isNaN(+new Date(f)) ? (utc ? FORMATO_FECHA_UTC : FORMATO_FECHA).format(new Date(f)) : '');
