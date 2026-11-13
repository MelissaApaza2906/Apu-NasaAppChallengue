// Fecha de la nieve MODIS de cada año para la montaña 3D (línea de tiempo del panel).
//
//   const r = await fechaNieveDeAnio(glaciar, 2009);
//   // r = { anio, fecha: '2009-08-15' | null, estado: 'ok' | 'sin-limpia' | 'error', nubes: 0.12 | null }
//
// La nieve es la capa MODIS_Terra_NDSI_Snow_Cover de NASA GIBS del día diaComparar de cada glaciar
// (contenido/glaciares.js; Cordillera Real: 15 de agosto, fin de la época seca). Si ese día tiene
// muchas nubes sobre la caja del glaciar, se prueban los días cercanos (Cordillera Real: dentro de
// agosto y septiembre; los demás: ±30 días), el más cercano primero.
//
// Las nubes NO se pueden leer en la capa de nieve: en su paleta oficial la nube (valor 250) es
// transparente, igual que "sin nieve". Por eso se miden con MODIS_Terra_Cloud_Fraction_Day (mismo
// satélite, mismo día): se leen sus píxeles sobre glaciar.caja y se pasan a % con su paleta oficial.
// Un día sirve si NASA tiene imagen de nieve ese día, hay dato de nubes en al menos la mitad de la
// caja y la nubosidad media es como mucho MAX_NUBES. Nunca se inventa nieve: si ningún día sirve,
// estado 'sin-limpia' y la montaña se queda con la imagen anterior.
import { CAPAS } from './nasa-gibs.js';

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';
const NUBES = {
  layer: 'MODIS_Terra_Cloud_Fraction_Day', formato: 'image/png', matriz: 'GoogleMapsCompatible_Level6', nivel: 6,
  paleta: 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Cloud_Fraction.xml'
};
export const MAX_NUBES = 0.5;  // nubosidad media sobre la caja: más que esto, se prueba otro día
const MIN_COBERTURA = 0.5;     // parte de la caja con dato de nubes (las pasadas del satélite dejan franjas)
const MAX_INTENTOS = 16;       // días probados por año, como mucho

// Ventana de días por glaciar: [desde, hasta] como 'MM-DD'. Sin entrada: diaComparar ± 30 días.
const VENTANAS = { 'cordillera-real': ['08-01', '09-30'] };

const cache = new Map();   // `${id}:${anio}` → Promise<resultado>
let paleta = null;         // Promise<[[r, g, b, valor %]]> de la capa de nubes
let rangosNieve = null;    // Promise<[[desde, hasta]]> fechas con imagen de la capa de nieve

const iso = (d) => d.toISOString().slice(0, 10);

// Días candidatos de un año, del más cercano al día base al más lejano, dentro de la ventana
export function diasCandidatos(glaciar, anio) {
  const base = new Date(`${anio}-${glaciar?.diaComparar ?? '08-15'}T00:00:00Z`);
  const v = VENTANAS[glaciar?.id];
  const desde = v ? new Date(`${anio}-${v[0]}T00:00:00Z`) : new Date(base.getTime() - 30 * 864e5);
  const hasta = v ? new Date(`${anio}-${v[1]}T00:00:00Z`) : new Date(base.getTime() + 30 * 864e5);
  const dias = [iso(base)];
  for (let k = 1; dias.length < MAX_INTENTOS && k <= 60; k++) {
    for (const s of [k, -k]) {
      const d = new Date(base.getTime() + s * 864e5);
      if (d >= desde && d <= hasta && dias.length < MAX_INTENTOS) dias.push(iso(d));
    }
  }
  return dias;
}

// Una sola vez: si falla (NASA no responde), se vuelve a pedir la próxima vez
function unaVez(crear) {
  let p = null;
  return () => (p ??= crear().catch((e) => { p = null; throw e; }));
}

// Paleta oficial de la nubosidad: color → % de nubes (las entradas transparentes son "sin dato")
const leerPaleta = unaVez(async () => {
  const r = await fetch(NUBES.paleta);
  if (!r.ok) throw new Error(`paleta ${r.status}`);
  const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
  const lista = [...xml.getElementsByTagName('ColorMapEntry')]
    .filter((e) => e.getAttribute('transparent') !== 'true')
    .map((e) => [...(e.getAttribute('rgb') ?? '').split(',').map(Number), Number(String(e.getAttribute('value')).replace(/[[\]]/g, ''))])
    .filter((c) => c.length === 4 && c.every(Number.isFinite));
  if (!lista.length) throw new Error('paleta vacía');
  return lista;
});

// Días con imagen de la capa de nieve (su GetCapabilities: '2000-08-18/2001-06-15/P1D', …)
const leerRangosNieve = unaVez(async () => {
  const r = await fetch(`${GIBS}?SERVICE=WMTS&REQUEST=GetCapabilities&LAYER=${CAPAS.nieveDia.layer}`);
  if (!r.ok) throw new Error(`capacidades ${r.status}`);
  const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
  return [...xml.getElementsByTagName('Value')].map((n) => n.textContent.trim().split('/'))
    .filter((v) => v.length >= 2 && /^\d{4}-\d{2}-\d{2}/.test(v[0])).map((v) => [v[0].slice(0, 10), v[1].slice(0, 10)]);
});
const hayNieve = (rangos, fecha) => rangos.some(([a, b]) => fecha >= a && fecha <= b);

// Teselas del nivel z y píxeles que cubren la caja del glaciar
const tx = (lon, n) => ((lon + 180) / 360) * n;
const ty = (lat, n) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n; };
function teselasDe(caja, z) {
  const n = 2 ** z;
  const x0 = tx(caja.oeste, n), x1 = tx(caja.este, n), y0 = ty(caja.norte, n), y1 = ty(caja.sur, n);
  const px = (v, a) => Math.max(0, Math.min(256, Math.round((v - a) * 256)));
  const lista = [];
  for (let x = Math.floor(x0); x <= Math.floor(x1 - 1e-9); x++) {
    for (let y = Math.floor(y0); y <= Math.floor(y1 - 1e-9); y++) lista.push({ x, y, p: [px(x0, x), px(y0, y), px(x1, x), px(y1, y)] });
  }
  return lista;
}

// Nubosidad media (0–1) sobre la caja ese día, o null si hay dato de nubes en menos de MIN_COBERTURA de la caja
async function medirNubes(caja, fecha, colores) {
  let suma = 0, conDato = 0, total = 0;
  const valorDe = new Map(); // color ya visto → %
  for (const t of teselasDe(caja, NUBES.nivel)) {
    const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${NUBES.layer}&STYLE=default` +
      `&TILEMATRIXSET=${NUBES.matriz}&TILEMATRIX=${NUBES.nivel}&TILEROW=${t.y}&TILECOL=${t.x}&FORMAT=${encodeURIComponent(NUBES.formato)}&TIME=${fecha}`;
    const r = await fetch(url);
    const [a, b, c, d] = t.p;
    if (c <= a || d <= b) continue;
    total += (c - a) * (d - b);
    if (r.status === 400 || r.status === 404) continue; // sin dato ese día
    if (!r.ok) throw new Error(`GIBS ${r.status}`);
    const bmp = await createImageBitmap(await r.blob());
    const k = bmp.width / 256;
    const lienzo = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(Math.round(a * k), Math.round(b * k), Math.max(1, Math.round((c - a) * k)), Math.max(1, Math.round((d - b) * k))).data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue; // transparente: sin dato
      const clave = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
      let v = valorDe.get(clave);
      if (v === undefined) { // el color más parecido de la paleta
        let mejor = Infinity;
        for (const [R, G, B, val] of colores) {
          const dd = (px[i] - R) ** 2 + (px[i + 1] - G) ** 2 + (px[i + 2] - B) ** 2;
          if (dd < mejor) { mejor = dd; v = val; }
        }
        valorDe.set(clave, v);
      }
      const w = 1 / (k * k); // cada píxel leído, en píxeles de una tesela de 256
      suma += (v / 100) * w;
      conDato += w;
    }
  }
  if (!total || conDato / total < MIN_COBERTURA) return null;
  return suma / conDato;
}

async function resolver(glaciar, anio) {
  const caja = glaciar?.caja;
  if (!caja) return { anio, fecha: null, estado: 'error', nubes: null };
  let colores, rangos;
  try { [colores, rangos] = await Promise.all([leerPaleta(), leerRangosNieve()]); } catch { return { anio, fecha: null, estado: 'error', nubes: null }; }
  let huboError = false;
  for (const fecha of diasCandidatos(glaciar, anio)) {
    if (!hayNieve(rangos, fecha)) continue; // NASA no tiene imagen de nieve ese día
    try {
      const f = await medirNubes(caja, fecha, colores);
      if (f !== null && f <= MAX_NUBES) return { anio, fecha, estado: 'ok', nubes: f };
    } catch { huboError = true; }
  }
  return { anio, fecha: null, estado: huboError ? 'error' : 'sin-limpia', nubes: null };
}

export function fechaNieveDeAnio(glaciar, anio) {
  const clave = `${glaciar?.id}:${anio}`;
  if (!cache.has(clave)) {
    const p = resolver(glaciar, anio);
    cache.set(clave, p);
    p.then((r) => { if (r.estado === 'error') cache.delete(clave); }); // NASA no respondió: se reintenta otra vez
  }
  return cache.get(clave);
}

// Pide por adelantado (de a 3) las fechas de todos los años, para que la reproducción no espere
export function precargarAnios(glaciar, anios) {
  const cola = [...anios];
  const obrero = async () => { while (cola.length) await fechaNieveDeAnio(glaciar, cola.shift()).catch(() => {}); };
  return Promise.all([obrero(), obrero(), obrero()]);
}
