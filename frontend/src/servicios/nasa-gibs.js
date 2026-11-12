import * as Cesium from 'cesium';
// Capas de NASA GIBS (Global Imagery Browse Services).
// Son públicas: no piden cuenta ni clave. Cada capa es un mosaico de imágenes
// que el globo pide por fecha, directo a los servidores de NASA.
//
// Si una capa sale en blanco, revisa su nombre exacto en
// https://worldview.earthdata.nasa.gov (botón "Add layers") y cámbialo aquí.

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';
const CREDITO = 'Imágenes: NASA GIBS / EOSDIS';

export const CAPAS = {
  // Tierra de día, sin nubes (mosaico Blue Marble)
  marmolAzul: { layer: 'BlueMarble_ShadedRelief_Bathymetry', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level8', nivelMax: 8, fecha: null },
  // Luces de las ciudades de noche (Black Marble)
  lucesNoche: { layer: 'VIIRS_Black_Marble', formato: 'image/png', matriz: 'GoogleMapsCompatible_Level8', nivelMax: 8, fecha: '2016-01-01' },
  // Foto real (color verdadero, con nubes) de un día concreto, de 4 satélites. Cada uno deja franjas
  // sin imagen entre sus pasadas; apiladas, se tapan entre sí. Nombres y matriz verificados en el
  // GetCapabilities de GIBS (epsg3857/best): GoogleMapsCompatible_Level9 · image/jpeg · P1D.
  fotoTerra: { layer: 'MODIS_Terra_CorrectedReflectance_TrueColor', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level9', nivelMax: 9 },
  fotoAqua: { layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level9', nivelMax: 9 },
  fotoSnpp: { layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level9', nivelMax: 9 },
  fotoNoaa20: { layer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level9', nivelMax: 9 },
  // Cobertura de nieve (MODIS, índice NDSI) de un día concreto
  nieveDia: { layer: 'MODIS_Terra_NDSI_Snow_Cover', formato: 'image/png', matriz: 'GoogleMapsCompatible_Level8', nivelMax: 8 },
  // Lluvia diaria de GPM IMERG. Nombre y matriz verificados en el GetCapabilities de GIBS
  // (epsg3857/best): IMERG_Precipitation_Rate · GoogleMapsCompatible_Level6 · image/png · P1D.
  // (La otra capa IMERG de GIBS es cada 30 minutos; no hay una mensual.)
  lluviaDia: { layer: 'IMERG_Precipitation_Rate', formato: 'image/png', matriz: 'GoogleMapsCompatible_Level6', nivelMax: 6 }
};

// Crea el proveedor de imágenes de una capa para una fecha (AAAA-MM-DD)
export function proveedor(capa, fecha) {
  const opciones = {
    url: GIBS,
    layer: capa.layer,
    style: 'default',
    format: capa.formato,
    tileMatrixSetID: capa.matriz,
    maximumLevel: capa.nivelMax,
    credit: new Cesium.Credit(CREDITO)
  };
  const f = fecha ?? capa.fecha;
  if (f) opciones.dimensions = { TIME: f };
  return new Cesium.WebMapTileServiceImageryProvider(opciones);
}

// Fecha de hace N días, en formato AAAA-MM-DD
export function haceDias(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// La fecha 'AAAA-MM-DD' de n días antes de otra: diasAntes('2026-03-01', 1) → '2026-02-28'
export function diasAntes(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// "2025-08-15" -> "15 de agosto de 2025"
export function fechaBonita(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${meses[m - 1]} de ${a}`;
}

// Fecha por defecto que anuncia GIBS para una capa (su GetCapabilities filtrado: ~27 KB, no los 5 MB
// del catálogo completo). Devuelve 'AAAA-MM-DD' o null si NASA no responde.
export async function fechaPorDefecto(capa) {
  try {
    const r = await fetch(`${GIBS}?SERVICE=WMTS&REQUEST=GetCapabilities&LAYER=${capa.layer}`);
    if (!r.ok) return null;
    const xml = new DOMParser().parseFromString(await r.text(), 'application/xml');
    const def = [...xml.getElementsByTagName('Default')].map((n) => n.textContent.trim()).find((t) => /^\d{4}-\d{2}-\d{2}/.test(t));
    return def ? def.slice(0, 10) : null;
  } catch {
    return null;
  }
}

// ¿Hay imagen de esa capa en esa fecha? Pide una tesela pequeña del cuadrante sudoeste
// (Sudamérica y la Antártida). 'si' · 'no' (tesela vacía o fecha fuera de rango) · 'error' (NASA no responde).
export async function hayImagen(capa, fecha) {
  const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${capa.layer}&STYLE=default` +
    `&TILEMATRIXSET=${capa.matriz}&TILEMATRIX=1&TILEROW=1&TILECOL=0&FORMAT=${encodeURIComponent(capa.formato)}&TIME=${fecha}`;
  try {
    const r = await fetch(url);
    if (r.status === 400 || r.status === 404) return 'no';
    if (!r.ok) return 'error';
    return (await r.blob()).size > 300 ? 'si' : 'no'; // una tesela sin datos pesa ~150 bytes
  } catch {
    return 'error';
  }
}

// Primera fecha de la lista que tiene imagen de esa capa (en orden).
// Devuelve 'AAAA-MM-DD', null si ninguna tiene imagen, o 'error' si NASA no respondió y no hubo ninguna.
export async function primeraFechaConImagen(capa, fechas) {
  let huboError = false;
  for (const f of fechas) {
    const hay = await hayImagen(capa, f);
    if (hay === 'si') return f;
    if (hay === 'error') huboError = true;
  }
  return huboError ? 'error' : null;
}

// Comprueba si NASA responde, pidiendo una sola imagen pequeña
export async function nasaResponde() {
  const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=BlueMarble_ShadedRelief_Bathymetry&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible_Level8&TILEMATRIX=0&TILEROW=0&TILECOL=0&FORMAT=image%2Fjpeg`;
  try {
    const r = await fetch(url, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}
