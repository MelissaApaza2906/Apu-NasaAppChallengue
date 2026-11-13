// Vista de montañas en 3D de cerca · Responsable: Jhoel.
//
// Reutiliza el Cesium.Viewer ya creado por globo3d (no crea uno nuevo).
// Activa Cesium World Terrain con exageración ×2, vuela la cámara
// al glaciar elegido con ángulo inclinado y etiqueta sus picos principales.
//
// Contrato con montanas-puente.js:
//   const r = await crearMontanas3d(viewer, glaciar);
//   // viewer  → Cesium.Viewer de globo3d (puede ser null si el globo pasó a imagen)
//   // glaciar → { id, nombre, lat, lon, … } de contenido/glaciares.js
//   // retorna → { salir(): Promise<void>, verAnio(anio | null) }  ← el puente comprueba typeof r.salir === 'function'
//   //         → null  si viewer es null o destruido, ya estamos en modo montaña o no hay VITE_CESIUM_TOKEN
//   //                 (el puente muestra entonces "Vista 3D de la montaña · En proceso")
//   // verAnio(anio): la nieve MODIS pasa a la fecha de ese año de la línea de tiempo (null = la más reciente)
//
// Imagen, relieve, luz, sombras, atmósfera y créditos: aplicarVistaRealista (componentes/vista-realista.js),
// la misma configuración que la lupa del globo. Se restaura al salir.
//
// También exporta REGIONES (las 11 definiciones con sus picos y parámetros de cámara)
// por si otra parte de la app necesita la lista.

import * as Cesium from 'cesium';
import { CESIUM_TOKEN } from '../servicios/config.js';
import { CAPAS, proveedor, haceDias, fechaBonita, fechaPorDefecto } from '../servicios/nasa-gibs.js';
import { aplicarVistaRealista, TEXTO_BLUE_MARBLE } from './vista-realista.js';

// ─── Las 11 regiones ─────────────────────────────────────────────────────────
// heading: rumbo de la cámara en grados (0 = norte).
// pitch:   ángulo vertical en grados (negativo = mirando hacia abajo).
// altura:  distancia al suelo en metros desde donde se posiciona la cámara.
// picos:   puntos de interés [{ n, h, lat, lon }] para las etiquetas en 3D. El primero es el pico
//          principal: al entrar, la cámara se pone "de frente" a él.
// ─────────────────────────────────────────────────────────────────────────────
export const REGIONES = [
  {
    id: 'cordillera-real',
    nombre: 'Cordillera Real',
    pais: 'Bolivia',
    lat: -16.2, lon: -68.2,
    altura: 55_000,
    heading: 10,
    pitch: -28,
    // Vista "de frente": cámara a 8 km del pico, del lado del Altiplano (suroeste), a la altura del
    // Altiplano, mirando casi horizontal. (Las demás regiones usan FRENTE_DEFECTO.)
    frente: { distancia: 8_000, lado: 225, alturaCamara: 4_800, pitch: -5 },
    // Coordenadas y alturas: Wikipedia (verificadas). Condoriri sin altura.
    picos: [
      { n: 'Illimani',      h: 6438, lat: -16.6333, lon: -67.7908 },
      { n: 'Mururata',      h: 5871, lat: -16.5306, lon: -67.8275 },
      { n: 'Huayna Potosí', h: 6088, lat: -16.2624, lon: -68.1541 },
      { n: 'Condoriri',     h: null, lat: -16.1698, lon: -68.2435 },
      { n: 'Chachacomani',  h: 6074, lat: -15.9872, lon: -68.3831 },
      { n: 'Chearoco',      h: 6127, lat: -15.9500, lon: -68.4156 },
      { n: 'Ancohuma',      h: 6427, lat: -15.8533, lon: -68.5408 },
      { n: 'Illampu',       h: 6368, lat: -15.8167, lon: -68.5433 }
    ]
  },
  {
    id: 'cordillera-blanca',
    nombre: 'Cordillera Blanca',
    pais: 'Perú',
    lat: -9.3, lon: -77.5,
    altura: 60_000,
    heading: 0,
    pitch: -30,
    picos: [
      { n: 'Huascarán',   h: 6768, lat: -9.122, lon: -77.604 },
      { n: 'Chopicalqui', h: 6354, lat: -9.067, lon: -77.583 }
    ]
  },
  {
    id: 'campos-de-hielo',
    nombre: 'Campos de Hielo Patagónicos',
    pais: 'Chile y Argentina',
    lat: -49.0, lon: -73.5,
    altura: 120_000,
    heading: 355,
    pitch: -25,
    picos: [
      { n: 'Monte Fitz Roy', h: 3405, lat: -49.272, lon: -73.044 },
      { n: 'Cerro Torre',    h: 3128, lat: -49.299, lon: -73.098 }
    ]
  },
  {
    id: 'alaska',
    nombre: 'Alaska (Montes Chugach)',
    pais: 'EE. UU.',
    lat: 61.0, lon: -147.0,
    altura: 90_000,
    heading: 5,
    pitch: -30,
    picos: [
      { n: 'Denali',              h: 6190, lat: 63.069, lon: -151.007 },
      { n: 'Monte Marcus Baker',  h: 4016, lat: 61.433, lon: -147.75 }
    ]
  },
  {
    id: 'groenlandia',
    nombre: 'Groenlandia',
    pais: 'Dinamarca',
    lat: 72.0, lon: -40.0,
    altura: 400_000,
    heading: 180,
    pitch: -35,
    picos: [
      { n: 'Gunnbjørn Fjeld', h: 3694, lat: 68.917, lon: -29.9 }
    ]
  },
  {
    id: 'vatnajokull',
    nombre: 'Vatnajökull',
    pais: 'Islandia',
    lat: 64.4, lon: -16.8,
    altura: 70_000,
    heading: 0,
    pitch: -28,
    picos: [
      { n: 'Hvannadalshnjúkur', h: 2110, lat: 64.017, lon: -16.683 },
      { n: 'Bárðarbunga',       h: 2009, lat: 64.633, lon: -17.533 }
    ]
  },
  {
    id: 'alpes',
    nombre: 'Alpes (Aletsch)',
    pais: 'Suiza',
    lat: 46.5, lon: 8.0,
    altura: 65_000,
    heading: 355,
    pitch: -30,
    picos: [
      { n: 'Mont Blanc',      h: 4808, lat: 45.833, lon: 6.865 },
      { n: 'Glaciar Aletsch', h: 4193, lat: 46.5,   lon: 8.033 }
    ]
  },
  {
    id: 'kilimanjaro',
    nombre: 'Kilimanjaro',
    pais: 'Tanzania',
    lat: -3.07, lon: 37.35,
    altura: 30_000,
    heading: 350,
    pitch: -22,
    picos: [
      { n: 'Uhuru Peak (Kibo)', h: 5895, lat: -3.075, lon: 37.353 },
      { n: 'Mawenzi',          h: 5149, lat: -3.1,   lon: 37.457 }
    ]
  },
  {
    id: 'karakoram',
    nombre: 'Karakórum',
    pais: 'Pakistán',
    lat: 35.8, lon: 76.5,
    altura: 80_000,
    heading: 5,
    pitch: -28,
    picos: [
      { n: 'K2',           h: 8611, lat: 35.881, lon: 76.513 },
      { n: 'Broad Peak',   h: 8051, lat: 35.812, lon: 76.567 },
      { n: 'Gasherbrum I', h: 8080, lat: 35.724, lon: 76.697 }
    ]
  },
  {
    id: 'himalaya',
    nombre: 'Himalaya (Everest)',
    pais: 'Nepal y China',
    lat: 28.0, lon: 86.9,
    altura: 75_000,
    heading: 355,
    pitch: -25,
    picos: [
      { n: 'Everest',  h: 8848, lat: 27.988,  lon: 86.925 },
      { n: 'Lhotse',   h: 8516, lat: 27.962,  lon: 86.933 },
      { n: 'Makalu',   h: 8485, lat: 27.889,  lon: 87.089 },
      { n: 'Cho Oyu',  h: 8201, lat: 28.0944, lon: 86.6608 }
    ]
  },
  {
    id: 'peninsula-antartica', // el mismo id que el glaciar de contenido/glaciares.js
    nombre: 'Península Antártica',
    pais: 'Antártida',
    lat: -65.0, lon: -62.0,
    altura: 200_000,
    heading: 180,
    pitch: -30,
    picos: [
      { n: 'Monte Francés', h: 2825, lat: -64.967, lon: -62.9 }
    ]
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const regionPorId = (id) => REGIONES.find((r) => r.id === id) ?? null;
const conMiles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// rAF dentro de rAF: deja que el navegador aplique el cambio de clases y arranque la transición
const dosFrames = () => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
const esperar = (ms) => new Promise((res) => setTimeout(res, ms));
// Espera a que terminen las animaciones/transiciones activas del elemento (o al timeout)
async function esperarAnimaciones(el, timeoutMs = 900) {
  if (!el || typeof el.getAnimations !== 'function') { await esperar(timeoutMs); return; }
  const anims = el.getAnimations();
  if (!anims.length) return;
  await Promise.race([
    Promise.allSettled(anims.map((a) => a.finished)),
    esperar(timeoutMs)
  ]);
}
// flyTo con promesa: resuelve si completa o si lo cancelan (p. ej. el usuario arrastra el globo)
const volar = (camera, opts) => new Promise((res) => camera.flyTo({ ...opts, complete: res, cancel: res }));

// ─── Estado del módulo ────────────────────────────────────────────────────────
// 'globo'   → el viewer está como lo dejó globo3d (no hay vista de montaña activa)
// 'montana' → la vista de montaña está montada; volverAlGlobo() debe restaurar
let modo = 'globo';
let instantanea = null;   // snapshot del viewer tomado al entrar
let apiActiva = null;     // { salir } de la montaña en curso (para __modoVisor)
let controles = null;     // { quitar() } botonera + atajos + correa en curso
let vista = null;         // { fecha, relieve: 'cargando'|'ok'|'sin', capaNieve, capaDia, credito } de la montaña en curso
let visita = 0;           // sube en cada entrada: una respuesta tardía de ion de una visita anterior se ignora
let entrando = false;

// ─── Fecha de la nieve MODIS ─────────────────────────────────────────────────
// "Más reciente": la fecha por defecto que anuncia GIBS para la capa (se pide una vez).
// Un año de la línea de tiempo: el mismo día y mes de ese año (misma estación que la más reciente).
let pedidoReciente = null;
const fechaNieveReciente = () => (pedidoReciente ??= fechaPorDefecto(CAPAS.nieveDia).then((f) => f ?? haceDias(3)));
function fechaDeAnio(anio, reciente) {
  if (anio == null) return reciente;
  const mesDia = reciente.slice(5) === '02-29' ? '02-28' : reciente.slice(5);
  const f = `${anio}-${mesDia}`;
  return f > reciente ? reciente : f;
}

// "Imagen: Bing Maps Aerial (Microsoft) · Relieve: Cesium World Terrain · Nieve: MODIS (NASA)"
// (la imagen y el relieve los pone aplicarVistaRealista, en componentes/vista-realista.js)
const NIEVE_ALPHA = 0.5;      // "Cobertura de nieve" encendida: al 50 % (NASA ya deja transparente lo que no es nieve)
function escribirCreditoMontana() {
  if (!vista?.credito) return;
  const vr = vista.vr;
  const imagen = vr?.imagen?.texto ?? TEXTO_BLUE_MARBLE.texto;
  const relieve = vr?.relieve === 'sin' ? 'Relieve: no disponible (Cesium no respondió)' : 'Relieve: Cesium World Terrain';
  vista.credito.textContent = `Imagen: ${imagen} · ${relieve} · Nieve: MODIS (NASA)` + (vista.capaDia ? ' · Color real: MODIS Terra' : '');
  if (vista.fechaNieve) vista.fechaNieve.textContent = fechaBonita(vista.fecha);
}

// Cambia la fecha de la nieve (y de "Imagen del día" si está puesta) sin mover el orden de las capas; el sol también
function ponerFechaNieve(viewer, fecha) {
  if (!vista || modo !== 'montana' || !fecha || fecha === vista.fecha) return;
  const capas = viewer.scene.imageryLayers;
  const cambiar = (vieja, info, alpha) => {
    const nueva = new Cesium.ImageryLayer(proveedor(info, fecha));
    nueva.alpha = alpha;
    nueva.show = vieja.show;
    capas.add(nueva, Math.max(0, capas.indexOf(vieja)));
    capas.remove(vieja, true);
    return nueva;
  };
  vista.fecha = fecha;
  vista.capaNieve = cambiar(vista.capaNieve, CAPAS.nieveDia, NIEVE_ALPHA);
  if (vista.capaDia) vista.capaDia = cambiar(vista.capaDia, CAPAS.fotoTerra, 0.85);
  vista.vr?.ponerFecha(fecha);
  escribirCreditoMontana();
  viewer.scene.requestRender();
}

// ─── Cámara "de frente" a un pico ────────────────────────────────────────────
// La cámara se pone a `distancia` m del pico, en el rumbo `lado` (225 = suroeste: desde el pico hacia
// el Altiplano), a `alturaCamara` m sobre el mar (o un poco sobre el suelo si ahí es más alto), mirando
// hacia el pico con `pitch` grados. Queda "atada" al eje del pico con camera.lookAt: al arrastrar, gira
// alrededor de ESE pico. Sin `frente` en la región, se calcula una vista parecida a partir de su altura.
const FRENTE_DEFECTO = { distancia: 8_000, lado: 225, alturaCamara: null, pitch: -5 };
const R_TIERRA = 6_371_000;
function puntoDesde(lat, lon, distancia, rumboGrados) {
  const r = Cesium.Math.toRadians(rumboGrados);
  const dLat = (distancia * Math.cos(r)) / R_TIERRA;
  const dLon = (distancia * Math.sin(r)) / (R_TIERRA * Math.cos(Cesium.Math.toRadians(lat)));
  return { lat: lat + Cesium.Math.toDegrees(dLat), lon: lon + Cesium.Math.toDegrees(dLon) };
}
// Alturas del terreno en varios puntos [{ lat, lon }] (null donde no hay dato o sin relieve)
async function alturasSuelo(scene, puntos) {
  if (!(scene.terrainProvider instanceof Cesium.CesiumTerrainProvider)) return puntos.map(() => null);
  try {
    const cs = await Cesium.sampleTerrainMostDetailed(scene.terrainProvider, puntos.map((q) => Cesium.Cartographic.fromDegrees(q.lon, q.lat)));
    return cs.map((c) => (Number.isFinite(c?.height) ? c.height : null));
  } catch { return puntos.map(() => null); }
}
const HOLGURA_SUELO = 300; // metros libres entre la línea de vista y el terreno (si no, Cesium empuja la cámara hacia arriba)

// Vuela (o salta, con reduced-motion) a la órbita { target, hpr } y al llegar ata la cámara al pico
function irAOrbita(viewer, orbita, duracion) {
  const camera = viewer.camera;
  const yo = vista ? ++vista.vuelo : 0;
  const atar = () => {
    if (!vista || yo !== vista.vuelo || modo !== 'montana') return;
    camera.lookAt(orbita.target, orbita.hpr);
    viewer.scene.requestRender();
  };
  camera.cancelFlight();
  camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  if (sinMovimiento() || !duracion) { atar(); return; }
  camera.flyToBoundingSphere(new Cesium.BoundingSphere(orbita.target, 1), {
    offset: orbita.hpr, duration: duracion, easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    complete: atar, cancel: () => {}
  });
}

// Lleva la cámara al pico i de la región ("de frente"). Marca el pico en el carrusel.
async function irAPico(viewer, region, i, duracion = 2.5) {
  const p = region.picos?.[i];
  if (!p || !vista) return;
  vista.pico = i;
  vista.alElegirPico?.(i);
  const scene = viewer.scene;
  const f = { ...FRENTE_DEFECTO, ...region.frente };
  const pedido = ++vista.pedidoPico;
  await vista.relieveListo; // para medir el suelo hace falta saber si hay relieve
  if (!vista || pedido !== vista.pedidoPico || modo !== 'montana') return;
  // Suelo bajo la cámara y a 1 y 2 km hacia el pico (en mesetas o glaciares que suben rápido, la línea de vista chocaría)
  const tramos = [0, 1_000, 2_000];
  const suelos = await alturasSuelo(scene, tramos.map((x) => puntoDesde(p.lat, p.lon, f.distancia - x, f.lado)));
  if (!vista || pedido !== vista.pedidoPico || modo !== 'montana') return;
  const pitch = Cesium.Math.toRadians(f.pitch);
  // Altura de la cámara (metros reales): la del Altiplano o, sin dato, 1 500 m bajo la cima; y siempre con
  // HOLGURA_SUELO entre la línea de vista (que baja con el pitch) y el terreno de esos primeros 2 km
  const suelo = suelos[0];
  const base = f.alturaCamara ?? (p.h ? p.h - 1_500 : (suelo ?? 0) + 1_000);
  const minima = Math.max(...suelos.map((s, i) => (s == null ? -Infinity : s + tramos[i] * Math.tan(-pitch) + HOLGURA_SUELO)));
  const altura = Math.max(base, minima);
  const ex = leerExageracion(scene) || 1; // el relieve se dibuja × ex: la cámara también
  // Centro de la órbita: sobre el eje del pico, a la altura que deja la línea de vista con ese pitch
  const target = Cesium.Cartesian3.fromDegrees(p.lon, p.lat, (altura + f.distancia * Math.tan(pitch)) * ex);
  const hpr = new Cesium.HeadingPitchRange(Cesium.Math.toRadians((f.lado + 180) % 360), pitch, f.distancia / Math.cos(pitch));
  vista.orbita = { target, hpr };
  irAOrbita(viewer, vista.orbita, duracion);
}

// Compat: Cesium ≥1.116 usa scene.verticalExaggeration; antes, globe.terrainExaggeration (deprecada)
const soportaExagVertical = (scene) => scene && 'verticalExaggeration' in scene;
const leerExageracion = (scene) => (soportaExagVertical(scene) ? scene.verticalExaggeration : (scene.globe.terrainExaggeration ?? 1));

// ─── Snapshot ────────────────────────────────────────────────────────────────
// Guarda TODO lo que el modo montaña modifica, para poder restaurarlo tal cual.
function tomarInstantanea(viewer) {
  const scene = viewer.scene;
  const globe = scene.globe;
  const camera = viewer.camera;
  const ctrl = scene.screenSpaceCameraController;

  // Listas por referencia: al salir, quitamos lo que NO estaba aquí.
  const capas = [];
  for (let i = 0; i < scene.imageryLayers.length; i++) capas.push(scene.imageryLayers.get(i));
  const fuentes = [];
  for (let i = 0; i < viewer.dataSources.length; i++) fuentes.push(viewer.dataSources.get(i));
  const entidades = viewer.entities.values.slice();

  // (Imagen, relieve, luz, sombras, atmósfera, reloj y créditos los guarda y restaura aplicarVistaRealista.)
  return {
    depthTest: globe.depthTestAgainstTerrain,
    requestRenderMode: scene.requestRenderMode,
    renderLoopActivo: viewer.useDefaultRenderLoop,

    // Cámara en coordenadas del mundo (clonadas: Cartesian3 es mutable). Si venía atada a un punto
    // (la lupa inclinada usa lookAt), se guarda su marco para volver a atarla al llegar.
    camara: {
      position: camera.positionWC.clone(),
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
      marco: Cesium.Matrix4.equals(camera.transform, Cesium.Matrix4.IDENTITY) ? null : Cesium.Matrix4.clone(camera.transform)
    },

    // Entidades / marcadores / capas (por referencia, para diff al salir)
    capas,
    fuentes,
    entidades,

    // Controlador
    ctrl: {
      enableRotate: ctrl.enableRotate,
      enableTilt: ctrl.enableTilt,
      enableZoom: ctrl.enableZoom,
      enableCollisionDetection: ctrl.enableCollisionDetection,
      minimumZoomDistance: ctrl.minimumZoomDistance,
      maximumZoomDistance: ctrl.maximumZoomDistance
    }
  };
}

// ─── Aplicar modo montaña ────────────────────────────────────────────────────
function aplicarModoMontana(viewer, region, fecha, glaciar) {
  const DURACION_VUELO = 3;

  const scene = viewer.scene;
  const globe = scene.globe;
  const capas = scene.imageryLayers;
  vista = {
    fecha, capaNieve: null, capaDia: null, credito: null, fechaNieve: null, vr: null, cajaCreditos: null,
    pico: null, orbita: null, vuelo: 0, pedidoPico: 0, relieveListo: null, alElegirPico: null
  };
  globe.depthTestAgainstTerrain = true;
  viewer.useDefaultRenderLoop = true;

  // Capa base: Blue Marble (respaldo); encima, la imagen de Cesium ion que pone aplicarVistaRealista
  while (capas.length > 0) capas.remove(capas.get(0), false);
  capas.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
      url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi',
      layer: CAPAS.marmolAzul.layer,
      style: 'default',
      format: CAPAS.marmolAzul.formato,
      tileMatrixSetID: CAPAS.marmolAzul.matriz,
      maximumLevel: CAPAS.marmolAzul.nivelMax,
      credit: new Cesium.Credit('Imágenes: NASA GIBS / Blue Marble')
    })
  );

  // La configuración visual común con la lupa: imagen, relieve a escala real, sol de las 10:00 locales,
  // sombras, niebla, atmósfera, detalle y créditos (que van al HUD). Se restaura al salir.
  vista.cajaCreditos = document.createElement('div');
  vista.cajaCreditos.className = 'hud-creditos-cesium';
  vista.vr = aplicarVistaRealista(viewer, {
    regionId: glaciar?.id ?? region.id, lon: region.lon, fecha, creditos: vista.cajaCreditos, indiceImagen: 1,
    alCambiar: () => escribirCreditoMontana()
  });
  vista.relieveListo = vista.vr.relieveListo;

  // Capa de nieve MODIS de la fecha de la línea de tiempo (al entrar, la más reciente de GIBS).
  // Apagada al entrar: la enciende el botón "Cobertura de nieve" (al 50 %; lo que no es nieve ya viene transparente).
  vista.capaNieve = capas.addImageryProvider(proveedor(CAPAS.nieveDia, fecha));
  vista.capaNieve.alpha = NIEVE_ALPHA;
  vista.capaNieve.show = false;

  // Pines de los picos en un DataSource propio (fácil de quitar al salir).
  // RELATIVE_TO_GROUND con altura 0: el pin queda pegado al terreno (también al exagerado).
  // disableDepthTestDistance: el relieve de delante nunca los tapa.
  // Letra grande y poca reducción con la distancia: se leen de cerca y de lejos.
  const fuenteDatos = new Cesium.CustomDataSource('montanas3d-picos');
  viewer.dataSources.add(fuenteDatos);
  region.picos?.forEach(({ n, h, lat, lon }, i) => {
    fuenteDatos.entities.add({
      id: `montanas3d-pico-${i}`,
      name: n,
      properties: { picoIndice: i },
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      label: {
        text: h ? `${n}\n${conMiles(h)} m` : n,
        font: '700 18px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('rgba(11,25,46,0.95)'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(8,18,48,0.82)'),
        backgroundPadding: new Cesium.Cartesian2(12, 7),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(3_000, 1.0, 300_000, 0.75)
      },
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#F2F4F8'),
        outlineColor: Cesium.Color.fromCssColorString('#D12021'),
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(3_000, 1.2, 300_000, 0.8)
      }
    });
  });

  // Vuelo de entrada: "de frente" al pico principal de la región (el primero); sin picos, la vista de la región
  const destino = Cesium.Cartesian3.fromDegrees(region.lon, region.lat, region.altura);
  const orient = {
    heading: Cesium.Math.toRadians(region.heading),
    pitch:   Cesium.Math.toRadians(region.pitch),
    roll:    0
  };
  const picoInicial = region.picos?.length ? 0 : null;
  if (picoInicial == null) {
    if (sinMovimiento()) {
      viewer.camera.setView({ destination: destino, orientation: orient });
      viewer.scene.requestRender();
    } else {
      viewer.camera.flyTo({ destination: destino, orientation: orient, duration: DURACION_VUELO, easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT });
    }
  }

  // ── Límites de cámara (se restauran desde la instantánea al salir) ──────────
  const ctrl = scene.screenSpaceCameraController;
  ctrl.enableCollisionDetection = true;
  // El globo normal apaga el zoom de Cesium (usa uno propio, hacia el centro): aquí se usa el de Cesium
  ctrl.enableRotate = true;
  ctrl.enableZoom = true;
  // Distancia mínima al suelo: con picos, 150 m (la vista "de frente" va a la altura del Altiplano, a
  // pocos cientos de metros del suelo; con 1,5 km Cesium subía la cámara y el pico quedaba abajo)
  ctrl.minimumZoomDistance = region.picos?.length ? 150 : 1_500;
  ctrl.maximumZoomDistance = 250_000;    // ≈ 250 km máximo

  // ── Correa suave: si la cámara se aleja > 150 km de la región, vuelve (al pico actual si lo hay) ──
  // (Atada a un pico con lookAt casi no puede pasar; queda para las regiones sin picos.)
  const centroRegion = Cesium.Cartesian3.fromDegrees(region.lon, region.lat);
  const LIMITE_LEASH_M = 150_000;
  let devolviendo = false;
  const quitarLeash = viewer.camera.moveEnd.addEventListener(() => {
    if (devolviendo || modo !== 'montana') return;
    const pc = viewer.camera.positionCartographic;
    const aquí = Cesium.Cartesian3.fromRadians(pc.longitude, pc.latitude);
    // Desde el pico actual (el principal puede estar lejos del centro de la región: Denali, Mont Blanc)
    const p = vista?.pico != null ? region.picos[vista.pico] : null;
    const centro = p ? Cesium.Cartesian3.fromDegrees(p.lon, p.lat) : centroRegion;
    if (Cesium.Cartesian3.distance(aquí, centro) <= LIMITE_LEASH_M) return;
    if (vista?.pico != null) { irAPico(viewer, region, vista.pico, 1.2); return; }
    devolviendo = true;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(region.lon, region.lat, pc.height),
      orientation: { heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: 0 },
      duration: 1.2,
      complete: () => { devolviendo = false; },
      cancel:   () => { devolviendo = false; }
    });
  });

  // ── Botonera flotante + carrusel de picos + atajos + rotación de brújula ─────
  controles = instalarControles(viewer, region, destino, orient);
  const quitarControles = controles.quitar;
  controles.quitar = () => { quitarLeash(); quitarControles(); };

  if (picoInicial != null) irAPico(viewer, region, picoInicial, DURACION_VUELO);
}


// ─── Botonera dentro del visor ───────────────────────────────────────────────
// ＋ Acercar, － Alejar, ⟲ Reencuadrar, Brújula/Norte, Inclinación oblicua/cenital,
// (opcional) rotación automática. Atajos +/-, R, N, I solo en modo montaña.
// Además instala el HUD (leyenda MODIS + toggle "Imagen del día" + atribución).
function instalarControles(viewer, region, destinoInicial, orientInicial) {
  const scene = viewer.scene;
  const camera = viewer.camera;
  const capas = scene.imageryLayers;

  // --- HUD inferior izquierdo: leyenda + toggle + atribución ---------------
  const hud = document.createElement('div');
  hud.className = 'montanas3d-hud';
  hud.innerHTML = `
    <button type="button" class="hud-nieve" aria-pressed="false" title="Mostrar dónde hay nieve según MODIS (NASA)">
      <span class="hud-titulo">Cobertura de nieve</span>
      <span class="hud-escala" aria-hidden="true"></span>
      <span class="hud-rango"><span>1 %</span><span class="hud-fecha"></span><span>100 %</span></span>
    </button>
    <button type="button" class="hud-toggle" aria-pressed="false"
            title="Mostrar la imagen MODIS de esa fecha (con nubes)"
            aria-label="Alternar imagen del día / sin nubes">
      Imagen del día
    </button>
    <p class="hud-credito" role="note"></p>
    <div class="hud-creditos-cesium"></div>`;
  viewer.container.appendChild(hud);
  const btnToggle = hud.querySelector('.hud-toggle');
  const btnNieve = hud.querySelector('.hud-nieve');

  // Fuente: "Imagen: … · Relieve: Cesium World Terrain · Nieve: MODIS (NASA)" (+ color real si está).
  // Debajo, los créditos que escribe Cesium (logo de Cesium ion y atribuciones de la imagen: Bing/Sentinel):
  // aplicarVistaRealista ya los puso en vista.cajaCreditos y al salir los devuelve a donde estaban.
  vista.credito = hud.querySelector('.hud-credito');
  vista.fechaNieve = hud.querySelector('.hud-fecha');
  hud.querySelector('.hud-creditos-cesium').replaceWith(vista.cajaCreditos);
  const actualizarCredito = escribirCreditoMontana;

  // --- "Cobertura de nieve": enciende/apaga la capa MODIS (al 50 %) ------------
  btnNieve.addEventListener('click', () => {
    const si = !vista.capaNieve.show;
    vista.capaNieve.show = si;
    btnNieve.setAttribute('aria-pressed', String(si));
    btnNieve.classList.toggle('activo', si);
    scene.requestRender();
  });

  // --- Capa "Imagen del día" (MODIS color real, misma fecha que la nieve) ----
  // vista.capaDia (no una variable local): ponerFechaNieve la cambia cuando se mueve la línea de tiempo
  function toggleImagenDia(forzar) {
    const activar = forzar ?? !vista.capaDia;
    if (activar && !vista.capaDia) {
      const capaDia = capas.addImageryProvider(proveedor(CAPAS.fotoTerra, vista.fecha));
      capaDia.alpha = 0.85;
      // Orden: base (índice 0) · MODIS color real · nieve (al tope): la recién añadida baja bajo la nieve
      const nIdx = capas.indexOf(vista.capaNieve);
      if (nIdx >= 0 && capas.indexOf(capaDia) > nIdx) capas.lower(capaDia);
      vista.capaDia = capaDia;
      btnToggle.setAttribute('aria-pressed', 'true');
      btnToggle.classList.add('activo');
    } else if (!activar && vista.capaDia) {
      capas.remove(vista.capaDia, true);
      vista.capaDia = null;
      btnToggle.setAttribute('aria-pressed', 'false');
      btnToggle.classList.remove('activo');
    }
    actualizarCredito();
    scene.requestRender();
  }
  btnToggle.addEventListener('click', () => toggleImagenDia());
  actualizarCredito();

  // --- DOM ------------------------------------------------------------------
  const barra = document.createElement('div');
  barra.className = 'montanas3d-controles';
  barra.setAttribute('role', 'toolbar');
  barra.setAttribute('aria-label', 'Controles de la vista 3D');

  const botones = [
    { id: 'acercar',  txt: '+',  aria: 'Acercar',    tip: 'Acercar (+)' },
    { id: 'alejar',   txt: '−',  aria: 'Alejar',     tip: 'Alejar (−)' },
    { id: 'reenc',    txt: '⌖',  aria: region.picos?.length ? 'Centrar en el pico' : 'Reencuadrar la región', tip: 'Centrar (R)' },
    { id: 'norte',    txt: '▲',  aria: 'Girar al norte',        tip: 'Norte arriba (N)' },
    { id: 'tilt',     txt: '◢',  aria: 'Alternar vista cenital/oblicua', tip: 'Inclinación (I)' },
    { id: 'rotar',    txt: '↻',  aria: 'Rotar automáticamente', tip: 'Rotación lenta' }
  ];
  const refs = {};
  botones.forEach(({ id, txt, aria, tip }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'montanas3d-boton';
    b.dataset.ctrl = id;
    b.textContent = txt;
    b.setAttribute('aria-label', aria);
    b.title = tip;
    barra.append(b);
    refs[id] = b;
  });
  viewer.container.appendChild(barra);

  // --- Carrusel de picos (arriba a la derecha): tocar uno lleva la cámara a ESE pico ----
  let carrusel = null;
  if (region.picos?.length) {
    carrusel = document.createElement('div');
    carrusel.className = 'montanas3d-picos';
    carrusel.setAttribute('role', 'toolbar');
    carrusel.setAttribute('aria-label', 'Picos de la cordillera');
    carrusel.innerHTML = region.picos.map((p, i) =>
      `<button type="button" class="montanas3d-pico" data-pico="${i}" aria-pressed="false">${p.n}</button>`).join('');
    viewer.container.appendChild(carrusel);
    carrusel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pico]');
      if (b) irAPico(viewer, region, Number(b.dataset.pico));
    });
    vista.alElegirPico = (i) => {
      carrusel.querySelectorAll('[data-pico]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pico) === i)));
      const b = carrusel.querySelector(`[data-pico="${i}"]`);
      b?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: sinMovimiento() ? 'auto' : 'smooth' });
      refs.reenc.setAttribute('aria-label', `Centrar en ${region.picos[i].n}`);
    };
  }

  // --- Acciones -------------------------------------------------------------
  const EASE = Cesium.EasingFunction.CUBIC_IN_OUT;
  // Gira la órbita alrededor del pico actual (misma distancia), sin soltarlo
  function girarOrbita(heading, pitch) {
    const o = vista?.orbita;
    if (!o) return false;
    const range = Cesium.Cartesian3.distance(camera.positionWC, o.target);
    irAOrbita(viewer, { target: o.target, hpr: new Cesium.HeadingPitchRange(heading, pitch, range) }, 0.8);
    return true;
  }
  function zoom(factor) {
    // paso proporcional a la altura actual (p. ej. factor = ±0.35)
    const pc = camera.positionCartographic;
    const paso = Math.max(200, pc.height * Math.abs(factor));
    if (factor > 0) camera.zoomIn(paso);
    else camera.zoomOut(paso);
    scene.requestRender();
  }
  // Centrar: vuelve "de frente" al pico actual (sin picos, a la vista inicial de la región)
  function reencuadrar() {
    if (vista?.pico != null) { irAPico(viewer, region, vista.pico, 1.2); return; }
    camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    if (sinMovimiento()) {
      camera.setView({ destination: destinoInicial, orientation: orientInicial });
    } else {
      camera.flyTo({ destination: destinoInicial, orientation: orientInicial, duration: 1.2, easingFunction: EASE });
    }
  }
  function norte() {
    const pitch = camera.pitch;
    if (girarOrbita(0, pitch)) return;
    if (sinMovimiento()) camera.setView({ orientation: { heading: 0, pitch, roll: 0 } });
    else camera.flyTo({
      destination: camera.positionWC.clone(),
      orientation: { heading: 0, pitch, roll: 0 },
      duration: 0.8, easingFunction: EASE
    });
  }
  function inclinar() {
    const cenital = camera.pitch < -1.0; // ya está casi vertical → volver a oblicuo
    const oblicuo = Cesium.Math.toRadians(region.frente?.pitch ?? -30);
    const pitchNuevo = cenital ? oblicuo : Cesium.Math.toRadians(-89);
    if (girarOrbita(camera.heading, pitchNuevo)) return;
    const orient = { heading: camera.heading, pitch: pitchNuevo, roll: 0 };
    if (sinMovimiento()) camera.setView({ orientation: orient });
    else camera.flyTo({ destination: camera.positionWC.clone(), orientation: orient, duration: 0.8, easingFunction: EASE });
  }

  // Rotación automática: 1 vuelta en ~120 s, se detiene al tocar el mapa
  let rotando = false;
  let tRot = 0;
  const velocidadRot = Cesium.Math.toRadians(360 / 120); // rad/s
  function tickRot(scene) {
    const ahora = performance.now();
    const dt = tRot ? (ahora - tRot) / 1000 : 0;
    tRot = ahora;
    if (!rotando) return;
    camera.rotateRight(velocidadRot * dt);
    scene.requestRender();
  }
  const quitarRot = scene.postRender.addEventListener(tickRot);
  function alternarRotacion() {
    rotando = !rotando;
    tRot = 0;
    refs.rotar.setAttribute('aria-pressed', String(rotando));
    refs.rotar.classList.toggle('activo', rotando);
    if (rotando) scene.requestRender();
  }
  // Tocar el mapa → parar rotación
  const parador = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  parador.setInputAction(() => { if (rotando) alternarRotacion(); }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  parador.setInputAction(() => { if (rotando) alternarRotacion(); }, Cesium.ScreenSpaceEventType.PINCH_START);
  // Tocar un pin (punto o etiqueta) → la cámara va "de frente" a ESE pico
  parador.setInputAction((clic) => {
    const e = scene.pick(clic.position)?.id;
    const i = e?.properties?.picoIndice?.getValue?.();
    if (Number.isInteger(i)) irAPico(viewer, region, i);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // --- Rotación de la flecha de brújula según heading ----------------------
  const quitarBrujula = scene.postRender.addEventListener(() => {
    const deg = -Cesium.Math.toDegrees(camera.heading); // flecha apunta al norte real
    refs.norte.style.setProperty('--rot', `${deg.toFixed(1)}deg`);
  });

  // --- Clicks ---------------------------------------------------------------
  refs.acercar.addEventListener('click', () => zoom(+0.35));
  refs.alejar .addEventListener('click', () => zoom(-0.35));
  refs.reenc  .addEventListener('click', reencuadrar);
  refs.norte  .addEventListener('click', norte);
  refs.tilt   .addEventListener('click', inclinar);
  refs.rotar  .addEventListener('click', alternarRotacion);

  // --- Atajos de teclado (solo mientras modo === 'montana') ----------------
  function onTecla(ev) {
    if (modo !== 'montana') return;
    // No interceptar si el foco está en un campo de texto
    const t = ev.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    switch (ev.key) {
      case '+': case '=': zoom(+0.35); ev.preventDefault(); break;
      case '-': case '_': zoom(-0.35); ev.preventDefault(); break;
      case 'r': case 'R': reencuadrar(); ev.preventDefault(); break;
      case 'n': case 'N': norte();      ev.preventDefault(); break;
      case 'i': case 'I': inclinar();   ev.preventDefault(); break;
    }
  }
  window.addEventListener('keydown', onTecla);

  return {
    quitar() {
      window.removeEventListener('keydown', onTecla);
      parador.destroy();
      quitarRot();
      quitarBrujula();
      // La capa "Imagen del día" la retira restaurarInstantanea por diff de referencia
      // (se añadió después del snapshot). Solo ocultamos el HUD.
      barra.remove();
      hud.remove();
      carrusel?.remove();
      // Soltar el pico: sin esto la cámara del globo seguiría girando alrededor de él
      camera.cancelFlight();
      camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
  };
}

// ─── Restaurar desde el snapshot ─────────────────────────────────────────────
// Diff por referencia: quitamos lo que añadimos y dejamos el viewer como estaba.
function restaurarInstantanea(viewer, snap) {
  const scene = viewer.scene;
  const globe = scene.globe;
  const ctrl = scene.screenSpaceCameraController;

  // DataSources añadidos durante la montaña → fuera
  const fuentesAhora = [];
  for (let i = 0; i < viewer.dataSources.length; i++) fuentesAhora.push(viewer.dataSources.get(i));
  fuentesAhora.forEach((f) => {
    if (!snap.fuentes.includes(f)) viewer.dataSources.remove(f, true);
  });

  // Entidades directas en viewer.entities añadidas durante la montaña → fuera
  const entidadesAhora = viewer.entities.values.slice();
  entidadesAhora.forEach((e) => {
    if (!snap.entidades.includes(e)) viewer.entities.remove(e);
  });

  // ImageryLayers: nos quedamos solo con las del snapshot
  const capas = scene.imageryLayers;
  while (capas.length > 0) capas.remove(capas.get(0), false);
  snap.capas.forEach((l) => capas.add(l));

  // Render (imagen, relieve, luz, sombras, atmósfera y reloj los restaura aplicarVistaRealista)
  scene.requestRenderMode = snap.requestRenderMode;
  viewer.useDefaultRenderLoop = snap.renderLoopActivo;
  globe.depthTestAgainstTerrain = snap.depthTest;

  // Controlador
  ctrl.enableRotate = snap.ctrl.enableRotate;
  ctrl.enableTilt = snap.ctrl.enableTilt;
  ctrl.enableZoom = snap.ctrl.enableZoom;
  ctrl.enableCollisionDetection = snap.ctrl.enableCollisionDetection;
  ctrl.minimumZoomDistance = snap.ctrl.minimumZoomDistance;
  ctrl.maximumZoomDistance = snap.ctrl.maximumZoomDistance;
  // La cámara se restaura fuera, después del resize, con flyTo (o setView si reduced-motion).
}

// ─── Volver al globo ─────────────────────────────────────────────────────────
// Orden: restaurar snapshot (sin cámara) → quitar body.modo-montana → dosFrames
//        → esperar animaciones del contenedor → forzarResize → flyTo cámara → limpieza.
async function volverAlGlobo(viewer) {
  if (modo === 'globo') return; // guard: ya estamos fuera

  const snap = instantanea;

  // 0) Quitar botonera, atajos y correa antes de restaurar nada.
  if (controles) { try { controles.quitar(); } catch (e) { console.error(e); } controles = null; }
  // Vista realista fuera: imagen, relieve, luz, sombras, atmósfera, reloj y créditos como estaban
  if (viewer && !viewer.isDestroyed()) { try { vista?.vr?.restaurar(); } catch (e) { console.error(e); } }
  vista = null;
  visita += 1; // si ion responde tarde, ya no toca el terreno del globo

  if (!viewer || viewer.isDestroyed()) {
    document.body.classList.remove('modo-montana');
    modo = 'globo';
    instantanea = null;
    apiActiva = null;
    return;
  }

  // 1) Restaurar snapshot (todo menos la cámara)
  restaurarInstantanea(viewer, snap);

  // 2) Quitar la clase de modo para que el CSS devuelva el contenedor a su geometría normal
  document.body.classList.remove('modo-montana');

  // 3) Esperar a que el navegador aplique el cambio de clases y arranque la transición,
  //    luego esperar a que esas transiciones terminen (todas, sin contarlas).
  //    El contenedor que el CSS transiciona es .menu-planeta, no viewer.container.
  await dosFrames();
  const contenedorLayout = document.querySelector('.menu-planeta') ?? viewer.container;
  await esperarAnimaciones(contenedorLayout, 900);

  // 4) Resize ya con el contenedor en su tamaño final.
  //    Preferimos api.forzarResize (rAF-batched); si no está, caemos a resize directo.
  if (typeof window.__globo?.forzarResize === 'function') window.__globo.forzarResize();
  else { viewer.resize(); viewer.scene.requestRender(); }

  // 5) Devolver la cámara a su posición original. flyTo, salvo que reduced-motion.
  const destino = snap.camara.position;
  const orient = { heading: snap.camara.heading, pitch: snap.camara.pitch, roll: snap.camara.roll };
  if (sinMovimiento()) {
    viewer.camera.setView({ destination: destino, orientation: orient });
  } else {
    await volar(viewer.camera, { destination: destino, orientation: orient, duration: 1.2 });
  }
  // Si venía de la lupa (cámara atada al glaciar), se vuelve a atar sin moverla
  if (snap.camara.marco && modo === 'montana') viewer.camera.lookAtTransform(snap.camara.marco);
  viewer.scene.requestRender();

  // 6) Limpieza
  modo = 'globo';
  instantanea = null;
  apiActiva = null;
}

// ─── Función principal ────────────────────────────────────────────────────────
//   crearMontanas3d(viewer, glaciar) → { salir(): Promise<void> } ó null
export async function crearMontanas3d(viewer, glaciar) {
  // Guard: no entrar dos veces seguidas
  if (modo === 'montana' || entrando) {
    console.warn('montanas3d: ya hay una vista de montaña activa; se ignora la segunda entrada.');
    return null;
  }

  // Validar viewer
  if (!viewer || viewer.isDestroyed()) {
    console.warn('montanas3d: se necesita un Cesium.Viewer activo (globo.viewer).');
    return null;
  }

  // Sin token de Cesium ion no se pide el relieve: el puente muestra "en proceso"
  if (!CESIUM_TOKEN) {
    console.info('montanas3d: falta VITE_CESIUM_TOKEN en frontend/.env.local; la vista 3D queda "en proceso".');
    return null;
  }

  // Fecha de la nieve al entrar: la más reciente que anuncia GIBS
  entrando = true;
  let fecha;
  try { fecha = await fechaNieveReciente(); } finally { entrando = false; }
  if (modo === 'montana' || viewer.isDestroyed()) return null;

  // Resolver región (por id del glaciar; si no, usar lat/lon del glaciar)
  const regionBase = regionPorId(glaciar?.id) ?? {
    id: glaciar?.id ?? 'desconocido',
    nombre: glaciar?.nombre ?? '',
    lat: glaciar?.lat ?? 0,
    lon: glaciar?.lon ?? 0,
    altura: 60_000,
    heading: 0,
    pitch: -28,
    picos: []
  };
  const region = {
    ...regionBase,
    lat: glaciar?.lat ?? regionBase.lat,
    lon: glaciar?.lon ?? regionBase.lon,
    nombre: glaciar?.nombre ?? regionBase.nombre
  };

  // Snapshot → aplicar modo → marcar body → publicar API
  instantanea = tomarInstantanea(viewer);
  visita += 1;
  modo = 'montana'; // antes de aplicar: irAPico comprueba el modo al llegar la respuesta de ion
  aplicarModoMontana(viewer, region, fecha, glaciar);
  document.body.classList.add('modo-montana');

  apiActiva = {
    async salir() { await volverAlGlobo(viewer); },
    // Línea de tiempo del puente: un año (2001…) o null = la más reciente
    async verAnio(anio) {
      const reciente = await fechaNieveReciente();
      ponerFechaNieve(viewer, fechaDeAnio(anio, reciente));
    }
  };
  return apiActiva;
}

// ─── Debug: estado y salida forzada (sin gate de DEV, igual que __globo) ─────
window.__modoVisor = {
  get modo() { return modo; },
  salir: () => apiActiva?.salir()
};
