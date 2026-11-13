// Vista realista: UNA sola configuración para la lupa del globo (al tocar un glaciar) y la vista de montaña.
//   Imagen:    Sentinel-2 sin nubes (Cesium ion 3954) → si la cuenta no lo tiene, Bing Maps Aerial (ion 2)
//              → si tampoco, o en zonas polares (Bing tiene huecos), el Blue Marble de NASA que ya está debajo.
//   Relieve:   Cesium World Terrain, a escala real (sin exagerar). Sin relieve, el elipsoide liso.
//   Luz:       el sol de las 10:00 locales de la región en la fecha elegida, con sombras del relieve.
//   Atmósfera: niebla, cielo y atmósfera sobre el suelo. Más detalle del relieve (maximumScreenSpaceError 1,5).
//   Créditos:  los de Cesium (logo de ion y atribuciones de la imagen) a la vista, donde se diga.
//   FPS:       si al moverse la cámara baja de 30 FPS, primero se apagan las sombras y luego vuelve el detalle normal.
//
//   const vr = aplicarVistaRealista(viewer, { regionId, lon, fecha, creditos: elemento });
//   await vr.relieveListo;   // 'ok' | 'sin'      vr.imagen → { id, texto, corto } (null = Blue Marble)
//   vr.ponerFecha('2010-11-13');                  // mueve el sol (la línea de tiempo de la montaña)
//   vr.restaurar();          // deja el visor exactamente como estaba (luz, capas, relieve, reloj, créditos…)
import * as Cesium from 'cesium';
import { CESIUM_TOKEN } from '../servicios/config.js';

// Huso horario de cada región (ids de contenido/glaciares.js) para el sol de las 10:00
const ZONAS = {
  'cordillera-real': 'America/La_Paz', 'cordillera-blanca': 'America/Lima', 'campos-de-hielo': 'America/Argentina/Rio_Gallegos',
  alaska: 'America/Anchorage', groenlandia: 'America/Nuuk', vatnajokull: 'Atlantic/Reykjavik', alpes: 'Europe/Zurich',
  kilimanjaro: 'Africa/Dar_es_Salaam', karakoram: 'Asia/Karachi', himalaya: 'Asia/Kathmandu', 'peninsula-antartica': 'America/Punta_Arenas'
};
// Respaldo por región: aquí la imagen de Cesium ion tiene huecos (cuadros oscuros), así que va el Blue Marble
const SIN_IMAGEN_ION = new Set(['peninsula-antartica']);

const IMAGENES = [
  { asset: 3954, id: 'sentinel', texto: 'Sentinel-2 (ESA/Copernicus)', corto: 'Sentinel-2 · 10 m' },
  { asset: 2, id: 'bing', texto: 'Bing Maps Aerial (Microsoft)', corto: 'Bing Maps Aerial' }
];
export const TEXTO_BLUE_MARBLE = { id: 'bluemarble', texto: 'Blue Marble (NASA)', corto: 'NASA Blue Marble' };
const FPS_MINIMO = 30;

export const hoyIso = () => new Date().toISOString().slice(0, 10);

// Minutos de diferencia con UTC de una zona en un instante ('GMT-04:00' → -240). Sin zona: por la longitud.
function desfaseMin(zona, t, lon) {
  if (!zona) return Math.round((lon ?? 0) / 15) * 60;
  try {
    const nombre = new Intl.DateTimeFormat('en-US', { timeZone: zona, timeZoneName: 'longOffset' })
      .formatToParts(new Date(t)).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(nombre);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
  } catch { return Math.round((lon ?? 0) / 15) * 60; }
}
// El instante de las `hora`:00 locales de la región en la fecha 'AAAA-MM-DD'
export function instanteLocal(fecha, regionId, lon, hora = 10) {
  const [a, m, d] = fecha.split('-').map(Number);
  const local = Date.UTC(a, m - 1, d, hora);
  return Cesium.JulianDate.fromDate(new Date(local - desfaseMin(ZONAS[regionId], local, lon) * 60_000));
}

// Mide los FPS mientras la cámara se mueve (vuelos y arrastres de más de 1 s). Si bajan de 30:
// primero se apagan las sombras; si siguen bajos, el relieve vuelve al detalle normal (2).
function vigilarFps(viewer, alBajar) {
  const scene = viewer.scene;
  let marcas = null;
  const quitarIni = viewer.camera.moveStart.addEventListener(() => { marcas = []; });
  const quitarDib = scene.postRender.addEventListener(() => { if (marcas) marcas.push(performance.now()); });
  const quitarFin = viewer.camera.moveEnd.addEventListener(() => {
    const m = marcas; marcas = null;
    if (!m || m.length < 5) return;
    const seg = (m[m.length - 1] - m[0]) / 1000;
    if (seg < 1) return;
    const fps = Math.round((m.length - 1) / seg);
    if (fps >= FPS_MINIMO) return;
    if (viewer.shadows) {
      viewer.shadows = false;
      viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
      console.info(`vista realista: ${fps} FPS (< ${FPS_MINIMO}); se apagan las sombras.`);
    } else if (scene.globe.maximumScreenSpaceError < 2) {
      scene.globe.maximumScreenSpaceError = 2;
      console.info(`vista realista: ${fps} FPS sin sombras; el relieve vuelve al detalle normal.`);
    }
    alBajar?.(fps);
  });
  return () => { quitarIni(); quitarDib(); quitarFin(); };
}

export function aplicarVistaRealista(viewer, { regionId, lon, fecha = hoyIso(), creditos = null, indiceImagen = 1, alCambiar } = {}) {
  const scene = viewer.scene;
  const globe = scene.globe;
  const shadowMap = scene.shadowMap;
  const creditosCesium = viewer.creditDisplay.container;
  // Todo lo que se toca, para dejarlo igual al salir
  const previo = {
    luz: scene.light, iluminacion: globe.enableLighting,
    atmDinamica: globe.dynamicAtmosphereLighting, atmDelSol: globe.dynamicAtmosphereLightingFromSun,
    sombras: viewer.shadows, sombrasTerreno: viewer.terrainShadows,
    mapa: { suaves: shadowMap.softShadows, distancia: shadowMap.maximumDistance, oscuridad: shadowMap.darkness },
    niebla: scene.fog.enabled, densidad: scene.fog.density,
    cielo: scene.skyAtmosphere?.show, atmSuelo: globe.showGroundAtmosphere,
    detalle: globe.maximumScreenSpaceError, exageracion: scene.verticalExaggeration,
    relieve: scene.terrainProvider,
    tiempo: viewer.clock.currentTime.clone(), anima: viewer.clock.shouldAnimate,
    creditosPadre: creditosCesium.parentNode, creditosSiguiente: creditosCesium.nextSibling
  };
  let activa = true;
  const vr = { imagen: null, relieve: 'cargando', capa: null, fecha };

  // Luz, sombras, atmósfera y detalle
  scene.light = new Cesium.SunLight({ intensity: 2.0 });
  globe.enableLighting = true;
  globe.dynamicAtmosphereLighting = true;
  globe.dynamicAtmosphereLightingFromSun = true;
  viewer.shadows = true;
  viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
  shadowMap.softShadows = true;
  shadowMap.maximumDistance = 20_000;
  shadowMap.darkness = 0.35;
  scene.fog.enabled = true;
  scene.fog.density = 0.00015;
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
  globe.showGroundAtmosphere = true;
  globe.maximumScreenSpaceError = 1.5;
  scene.verticalExaggeration = 1;
  vr.ponerFecha = (f) => {
    if (!activa || !f) return;
    vr.fecha = f;
    viewer.clock.shouldAnimate = false;
    viewer.clock.currentTime = instanteLocal(f, regionId, lon);
    scene.requestRender();
  };
  vr.ponerFecha(fecha);

  // Créditos de Cesium a la vista (Bing pide su logo en pantalla)
  if (creditos) creditos.append(creditosCesium);

  // Relieve: el del globo si ya lo tiene; si no, Cesium World Terrain; si ion falla, el elipsoide liso
  if (!CESIUM_TOKEN) vr.relieveListo = Promise.resolve('sin');
  else if (!(scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)) vr.relieveListo = Promise.resolve('ok');
  else {
    Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;
    vr.relieveListo = Cesium.CesiumTerrainProvider.fromIonAssetId(1)
      .then((p) => { if (activa) scene.terrainProvider = p; return activa ? 'ok' : 'sin'; })
      .catch((e) => { console.warn('vista realista: el relieve de Cesium ion no respondió; sigue sin relieve.', e?.message ?? e); return 'sin'; });
  }
  vr.relieveListo.then((r) => { vr.relieve = r; alCambiar?.(vr); scene.requestRender(); });

  // Imagen de Cesium ion encima del Blue Marble (respaldo: Blue Marble)
  vr.imagenLista = (async () => {
    if (!CESIUM_TOKEN || SIN_IMAGEN_ION.has(regionId)) return null;
    Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;
    for (const op of IMAGENES) {
      try {
        const prov = await Cesium.IonImageryProvider.fromAssetId(op.asset);
        if (!activa || viewer.isDestroyed()) return null;
        vr.capa = new Cesium.ImageryLayer(prov);
        scene.imageryLayers.add(vr.capa, Math.min(indiceImagen, scene.imageryLayers.length));
        return op;
      } catch (e) {
        console.info(`vista realista: la imagen ${op.id} (Cesium ion ${op.asset}) no está disponible.`, e?.message ?? e);
      }
    }
    return null;
  })().then((op) => { vr.imagen = op ?? TEXTO_BLUE_MARBLE; alCambiar?.(vr); scene.requestRender(); return vr.imagen; });

  const quitarFps = vigilarFps(viewer);

  vr.restaurar = () => {
    if (!activa) return;
    activa = false;
    quitarFps();
    if (vr.capa) scene.imageryLayers.remove(vr.capa, true);
    scene.light = previo.luz;
    globe.enableLighting = previo.iluminacion;
    globe.dynamicAtmosphereLighting = previo.atmDinamica;
    globe.dynamicAtmosphereLightingFromSun = previo.atmDelSol;
    viewer.shadows = previo.sombras;
    viewer.terrainShadows = previo.sombrasTerreno;
    shadowMap.softShadows = previo.mapa.suaves;
    shadowMap.maximumDistance = previo.mapa.distancia;
    shadowMap.darkness = previo.mapa.oscuridad;
    scene.fog.enabled = previo.niebla;
    scene.fog.density = previo.densidad;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = previo.cielo;
    globe.showGroundAtmosphere = previo.atmSuelo;
    globe.maximumScreenSpaceError = previo.detalle;
    scene.verticalExaggeration = previo.exageracion;
    scene.terrainProvider = previo.relieve;
    viewer.clock.currentTime = previo.tiempo;
    viewer.clock.shouldAnimate = previo.anima;
    // Los créditos vuelven a donde estaban (fuera de la página, o la lupa si la montaña se abrió desde ella)
    if (previo.creditosPadre) previo.creditosPadre.insertBefore(creditosCesium, previo.creditosSiguiente?.parentNode === previo.creditosPadre ? previo.creditosSiguiente : null);
    else creditosCesium.remove();
    scene.requestRender();
  };
  return vr;
}
