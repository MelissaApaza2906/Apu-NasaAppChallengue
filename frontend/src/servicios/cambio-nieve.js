// Mapa de cambio de la nieve: cada año frente a su promedio 2001–… del mismo día (datos reales de NASA).
//
//   const cambio = crearCambioNieve(glaciar, anios, { alAvanzar: (hechos, total) => … });
//   await cambio.listo;                       // todos los años leídos y el promedio calculado
//   const r = await cambio.imagen(2016);      // { lienzo, caja, fecha } | null (ese año no tiene imagen limpia)
//   cambio.destruir();
//
// Por cada año: la fecha despejada que elige servicios/nieve-anual.js (Cordillera Real: 15 de agosto o el
// día cercano con menos nubes), la capa MODIS_Terra_NDSI_Snow_Cover de GIBS (valor 0–100 por píxel, con su
// paleta oficial) y la nubosidad de MODIS_Terra_Cloud_Fraction_Day. En la capa de nieve la nube es
// transparente igual que "sin nieve": por eso, donde la nubosidad pasa de NUBE_MAX, el punto queda "sin dato"
// (nunca cuenta como nieve perdida). El promedio de cada punto usa los años con dato (al menos MIN_ANIOS).
//
// El lienzo pinta la diferencia (año − promedio): azul donde hay más nieve, rojo donde falta; gris
// translúcido = sin dato por nubes en la zona con nieve habitual; transparente = sin cambio (< UMBRAL) o
// zona sin nieve.
import { fechaNieveDeAnio } from './nieve-anual.js';
import { CAPAS } from './nasa-gibs.js';

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';
const PALETA_NIEVE = 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_NDSI_Snow_Cover.xml';
const PALETA_NUBES = 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/MODIS_Cloud_Fraction.xml';
const NUBES = { layer: 'MODIS_Terra_Cloud_Fraction_Day', matriz: 'GoogleMapsCompatible_Level6', nivel: 6 };
const ESPERA_MS = 20_000; // una tesela que NASA no manda en este tiempo cuenta como error (no se cuelga el cálculo)
const ANCHO = 240;     // píxeles del mapa a lo ancho (la capa de nieve tiene ~500 m por píxel)
const NUBE_MAX = 50;   // % de nubes en un punto: más que esto, ese punto no tiene dato ese día
const MIN_ANIOS = 5;   // años con dato que necesita un punto para tener promedio
const UMBRAL = 5;      // diferencia (puntos de índice) que no se pinta: ruido
const SATURA = 40;     // diferencia que se pinta con el color pleno
const NIEVE_HABITUAL = 5; // promedio desde el que un punto es "zona con nieve" (para pintar el gris de nubes)

// Paleta oficial de GIBS: color → valor
const paletas = new Map();
function paleta(url) {
  if (!paletas.has(url)) {
    paletas.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`paleta ${r.status}`); return r.text(); }).then((t) => {
      const xml = new DOMParser().parseFromString(t, 'application/xml');
      const exacto = new Map();
      const lista = [];
      for (const e of xml.getElementsByTagName('ColorMapEntry')) {
        if (e.getAttribute('transparent') === 'true') continue;
        const c = (e.getAttribute('rgb') ?? '').split(',').map(Number);
        const v = Number(String(e.getAttribute('value')).replace(/[[\]]/g, ''));
        if (c.length !== 3 || !Number.isFinite(v)) continue;
        exacto.set((c[0] << 16) | (c[1] << 8) | c[2], v);
        lista.push([...c, v]);
      }
      return { exacto, lista };
    }).catch((e) => { paletas.delete(url); throw e; }));
  }
  return paletas.get(url);
}
function valorDe(p, r, g, b) {
  const k = (r << 16) | (g << 8) | b;
  let v = p.exacto.get(k);
  if (v !== undefined) return v;
  let mejor = Infinity;
  for (const [R, G, B, val] of p.lista) { const d = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (d < mejor) { mejor = d; v = val; } }
  p.exacto.set(k, v); // el siguiente igual ya es directo
  return v;
}

const tx = (lon, n) => ((lon + 180) / 360) * n;
const ty = (lat, n) => { const r = (lat * Math.PI) / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n; };

// Teselas de una capa y fecha: Map 'x/y' → ImageData | null (sin imagen)
async function teselas(caja, capa, matriz, nivel, fecha, senal) {
  const n = 2 ** nivel;
  const mapa = new Map();
  const pedidos = [];
  for (let x = Math.floor(tx(caja.oeste, n)); x <= Math.floor(tx(caja.este, n) - 1e-9); x++) {
    for (let y = Math.floor(ty(caja.norte, n)); y <= Math.floor(ty(caja.sur, n) - 1e-9); y++) {
      const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${capa}&STYLE=default&TILEMATRIXSET=${matriz}` +
        `&TILEMATRIX=${nivel}&TILEROW=${y}&TILECOL=${x}&FORMAT=image%2Fpng&TIME=${fecha}`;
      pedidos.push(fetch(url, { signal: AbortSignal.any([senal, AbortSignal.timeout(ESPERA_MS)]) }).then(async (r) => {
        if (r.status === 400 || r.status === 404) { mapa.set(`${x}/${y}`, null); return; }
        if (!r.ok) throw new Error(`GIBS ${r.status}`);
        const bmp = await createImageBitmap(await r.blob());
        const lienzo = new OffscreenCanvas(256, 256);
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0, 256, 256);
        mapa.set(`${x}/${y}`, ctx.getImageData(0, 0, 256, 256));
      }));
    }
  }
  await Promise.all(pedidos);
  return { mapa, n };
}
// Valor de un punto (lat, lon): [r, g, b, a] de su tesela, o null
function pixel(t, lat, lon) {
  const X = tx(lon, t.n), Y = ty(lat, t.n);
  const img = t.mapa.get(`${Math.floor(X)}/${Math.floor(Y)}`);
  if (!img) return null;
  const i = (Math.min(255, Math.floor((X % 1) * 256)) + Math.min(255, Math.floor((Y % 1) * 256)) * 256) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}

export function crearCambioNieve(glaciar, anios, { alAvanzar } = {}) {
  const caja = glaciar?.caja;
  const control = new AbortController();
  if (!caja || !anios?.length) return { listo: Promise.resolve(false), imagen: async () => null, destruir() {} };
  const W = ANCHO;
  const H = Math.max(1, Math.round(W * (caja.norte - caja.sur) / (caja.este - caja.oeste)));
  const porAnio = new Map(); // anio → { fecha, valores: Float32Array (NaN = sin dato) }
  let media = null;
  let hechos = 0;

  // Rejilla de un año: valor de nieve 0–100, o NaN donde hay nubes o no hay imagen
  async function leerAnio(anio) {
    const r = await fechaNieveDeAnio(glaciar, anio);
    if (!r.fecha) return;
    const [pn, pc] = await Promise.all([paleta(PALETA_NIEVE), paleta(PALETA_NUBES)]);
    const [tn, tc] = await Promise.all([
      teselas(caja, CAPAS.nieveDia.layer, CAPAS.nieveDia.matriz, CAPAS.nieveDia.nivelMax, r.fecha, control.signal),
      teselas(caja, NUBES.layer, NUBES.matriz, NUBES.nivel, r.fecha, control.signal)
    ]);
    const valores = new Float32Array(W * H);
    for (let j = 0; j < H; j++) {
      const lat = caja.norte - ((j + 0.5) / H) * (caja.norte - caja.sur);
      for (let i = 0; i < W; i++) {
        const lon = caja.oeste + ((i + 0.5) / W) * (caja.este - caja.oeste);
        const nube = pixel(tc, lat, lon);
        const nieve = pixel(tn, lat, lon);
        if (!nube || nube[3] < 128 || valorDe(pc, nube[0], nube[1], nube[2]) > NUBE_MAX || !nieve) { valores[j * W + i] = NaN; continue; }
        valores[j * W + i] = nieve[3] < 128 ? 0 : valorDe(pn, nieve[0], nieve[1], nieve[2]);
      }
    }
    porAnio.set(anio, { fecha: r.fecha, valores });
  }

  const listo = (async () => {
    const cola = [...anios];
    const obrero = async () => {
      while (cola.length && !control.signal.aborted) {
        const a = cola.shift();
        try { await leerAnio(a); } catch (e) { if (control.signal.aborted) return; console.warn(`APU: cambio de nieve de ${a} no disponible.`, e?.message ?? e); }
        hechos++;
        alAvanzar?.(hechos, anios.length);
      }
    };
    await Promise.all([obrero(), obrero(), obrero()]);
    if (control.signal.aborted) return false;
    media = new Float32Array(W * H);
    for (let k = 0; k < W * H; k++) {
      let s = 0, c = 0;
      for (const { valores } of porAnio.values()) { const v = valores[k]; if (!Number.isNaN(v)) { s += v; c++; } }
      media[k] = c >= MIN_ANIOS ? s / c : NaN;
    }
    return porAnio.size > 0;
  })();

  const lienzos = new Map();
  async function imagen(anio) {
    if (!(await listo)) return null;
    const d = porAnio.get(anio);
    if (!d) return null;
    if (!lienzos.has(anio)) {
      const lienzo = document.createElement('canvas');
      lienzo.width = W; lienzo.height = H;
      const ctx = lienzo.getContext('2d');
      const img = ctx.createImageData(W, H);
      for (let k = 0; k < W * H; k++) {
        const m = media[k], v = d.valores[k], o = k * 4;
        if (Number.isNaN(m)) continue;                       // sin promedio: no se pinta
        if (Number.isNaN(v)) {                               // nubes ese día
          if (m >= NIEVE_HABITUAL) { img.data[o] = 150; img.data[o + 1] = 158; img.data[o + 2] = 172; img.data[o + 3] = 70; }
          continue;
        }
        const dif = v - m;
        if (Math.abs(dif) < UMBRAL) continue;
        const t = Math.min(1, (Math.abs(dif) - UMBRAL) / (SATURA - UMBRAL));
        const [R, G, B] = dif > 0 ? [47, 116, 255] : [229, 57, 53]; // más nieve: azul · menos: rojo
        img.data[o] = R; img.data[o + 1] = G; img.data[o + 2] = B; img.data[o + 3] = Math.round(70 + 185 * t);
      }
      ctx.putImageData(img, 0, 0);
      lienzos.set(anio, lienzo);
    }
    return { lienzo: lienzos.get(anio), caja, fecha: d.fecha };
  }

  return {
    listo,
    imagen,
    aniosConDato: () => [...porAnio.keys()].sort((a, b) => a - b),
    destruir() { control.abort(); lienzos.clear(); porAnio.clear(); }
  };
}
