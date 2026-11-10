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
  // Foto real del satélite Terra, un día concreto
  fotoDia: { layer: 'MODIS_Terra_CorrectedReflectance_TrueColor', formato: 'image/jpeg', matriz: 'GoogleMapsCompatible_Level9', nivelMax: 9 },
  // Cobertura de nieve (MODIS, índice NDSI) de un día concreto
  nieveDia: { layer: 'MODIS_Terra_NDSI_Snow_Cover', formato: 'image/png', matriz: 'GoogleMapsCompatible_Level8', nivelMax: 8 }
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

// "2025-08-15" -> "15 de agosto de 2025"
export function fechaBonita(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${meses[m - 1]} de ${a}`;
}

// Día COMPLETO más reciente en que la capa diaria de nieve ya tiene datos.
// GIBS anuncia "hoy" aunque todavía no haya imágenes (la tesela sale vacía, ~150 bytes), y mientras
// NASA publica el día, algunas teselas fallan (error 500). Por eso empezamos por ayer y vamos hacia
// atrás hasta encontrar una tesela con datos.
export async function fechaNieveReciente(diasMax = 8) {
  const capa = CAPAS.nieveDia;
  for (let n = 1; n <= diasMax; n++) {
    const fecha = haceDias(n);
    const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${capa.layer}&STYLE=default` +
      `&TILEMATRIXSET=${capa.matriz}&TILEMATRIX=1&TILEROW=0&TILECOL=0&FORMAT=image%2Fpng&TIME=${fecha}`;
    try {
      const r = await fetch(url);
      if (r.ok && (await r.blob()).size > 1000) return fecha;
    } catch {
      return null; // sin red: no insistimos
    }
  }
  return null;
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
