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
// Relieve: Cesium World Terrain (Cesium ion, asset 1) con el token de servicios/config.js. Si el globo
// ya lo tiene, se reutiliza; si ion falla (401/403, sin red), queda el elipsoide liso y un console.warn.
//
// También exporta REGIONES (las 11 definiciones con sus picos y parámetros de cámara)
// por si otra parte de la app necesita la lista.

import * as Cesium from 'cesium';
import { CESIUM_TOKEN } from '../servicios/config.js';
import { CAPAS, proveedor, haceDias, fechaBonita, fechaPorDefecto } from '../servicios/nasa-gibs.js';

// ─── Las 11 regiones ─────────────────────────────────────────────────────────
// heading: rumbo de la cámara en grados (0 = norte).
// pitch:   ángulo vertical en grados (negativo = mirando hacia abajo).
// altura:  distancia al suelo en metros desde donde se posiciona la cámara.
// picos:   puntos de interés [{ n, h, lat, lon }] para las etiquetas en 3D.
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
    picos: [
      { n: 'Illimani',      h: 6438, lat: -16.638, lon: -67.783 },
      { n: 'Huayna Potosí', h: 6088, lat: -16.267, lon: -68.153 },
      { n: 'Chearoco',      h: 6127, lat: -16.333, lon: -68.117 },
      { n: 'Chachacomani',  h: 6074, lat: -16.183, lon: -68.117 }
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
    id: 'antartida',
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

// "Relieve: Cesium World Terrain · Nieve: MODIS Terra (NASA) · <fecha>"
function escribirCreditoMontana() {
  if (!vista?.credito) return;
  const relieve = vista.relieve === 'sin' ? 'Relieve: no disponible (Cesium no respondió)' : 'Relieve: Cesium World Terrain';
  vista.credito.textContent = `${relieve} · Nieve: MODIS Terra (NASA) · ${fechaBonita(vista.fecha)}` +
    (vista.capaDia ? ' · Color real: MODIS Terra' : '');
}

// Cambia la fecha de la nieve (y de "Imagen del día" si está puesta) sin mover el orden de las capas
function ponerFechaNieve(viewer, fecha) {
  if (!vista || modo !== 'montana' || !fecha || fecha === vista.fecha) return;
  const capas = viewer.scene.imageryLayers;
  const cambiar = (vieja, info, alpha) => {
    const nueva = new Cesium.ImageryLayer(proveedor(info, fecha));
    nueva.alpha = alpha;
    capas.add(nueva, Math.max(0, capas.indexOf(vieja)));
    capas.remove(vieja, true);
    return nueva;
  };
  vista.fecha = fecha;
  vista.capaNieve = cambiar(vista.capaNieve, CAPAS.nieveDia, 0.65);
  if (vista.capaDia) vista.capaDia = cambiar(vista.capaDia, CAPAS.fotoTerra, 0.85);
  escribirCreditoMontana();
  viewer.scene.requestRender();
}

// Relieve: reutiliza el del globo si ya lo tiene; si no, lo pide a Cesium ion. Si falla → elipsoide liso.
function ponerRelieve(viewer) {
  const scene = viewer.scene;
  const yo = visita;
  const listo = (estado) => { if (vista) { vista.relieve = estado; escribirCreditoMontana(); } scene.requestRender(); };
  if (!(scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)) { listo('ok'); return; }
  listo('cargando');
  Cesium.CesiumTerrainProvider.fromIonAssetId(1)
    .then((p) => {
      if (yo !== visita || modo !== 'montana') return;
      scene.terrainProvider = p;
      listo('ok');
    })
    .catch((e) => {
      if (yo !== visita || modo !== 'montana') return;
      console.warn('APU: el relieve de Cesium ion no respondió; la montaña sigue sin relieve.', e?.message ?? e);
      scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      listo('sin');
    });
}

// Compat: Cesium ≥1.116 usa scene.verticalExaggeration; antes, globe.terrainExaggeration (deprecada)
const soportaExagVertical = (scene) => scene && 'verticalExaggeration' in scene;
const leerExageracion = (scene) => (soportaExagVertical(scene) ? scene.verticalExaggeration : (scene.globe.terrainExaggeration ?? 1));
function escribirExageracion(scene, valor) {
  if (soportaExagVertical(scene)) scene.verticalExaggeration = valor;
  else scene.globe.terrainExaggeration = valor;
}

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

  return {
    // Terreno y atmósfera
    terrain: scene.terrainProvider,
    exageracion: leerExageracion(scene),
    depthTest: globe.depthTestAgainstTerrain,
    showGroundAtmosphere: globe.showGroundAtmosphere,
    skyAtmosphereShow: scene.skyAtmosphere ? scene.skyAtmosphere.show : null,
    fogEnabled: scene.fog ? scene.fog.enabled : null,
    fogDensity: scene.fog ? scene.fog.density : null,
    requestRenderMode: scene.requestRenderMode,
    renderLoopActivo: viewer.useDefaultRenderLoop,

    // Cámara (clonamos la posición: Cartesian3 es mutable)
    camara: {
      position: camera.position.clone(),
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll
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
function aplicarModoMontana(viewer, region, fecha) {
  const EXAG = 2;
  const DURACION_VUELO = 3;

  Cesium.Ion.defaultAccessToken = CESIUM_TOKEN; // crearMontanas3d solo llega aquí con token

  const scene = viewer.scene;
  const globe = scene.globe;
  const capas = scene.imageryLayers;
  vista = { fecha, relieve: 'cargando', capaNieve: null, capaDia: null, credito: null };

  // Terreno Cesium World Terrain con exageración ×2 (o el elipsoide liso si ion falla)
  ponerRelieve(viewer);
  escribirExageracion(scene, EXAG);
  globe.depthTestAgainstTerrain = true;
  viewer.useDefaultRenderLoop = true;

  // Atmósfera visible y fog suave para dar profundidad al relieve lejano.
  // (El snapshot del prompt 1 guarda skyAtmosphere.show, fog.enabled y showGroundAtmosphere,
  //  así que al salir vuelven a lo que había puesto globo3d.)
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
  globe.showGroundAtmosphere = true;
  if (scene.fog) {
    scene.fog.enabled = true;
    scene.fog.density = 0.00015; // densidad suave: oculta el borde del terreno sin blanquearlo
  }

  // Capa base: Blue Marble
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

  // Capa de nieve MODIS de la fecha de la línea de tiempo (al entrar, la más reciente de GIBS)
  vista.capaNieve = capas.addImageryProvider(proveedor(CAPAS.nieveDia, fecha));
  vista.capaNieve.alpha = 0.65;

  // Etiquetas de picos en un DataSource propio (fácil de quitar al salir).
  // CLAMP_TO_GROUND: Cesium las coloca automáticamente sobre el terreno exagerado.
  // disableDepthTestDistance: siempre visibles aunque haya relieve delante.
  // scaleByDistance: se mantienen legibles de cerca y se reducen al alejarse.
  const fuenteDatos = new Cesium.CustomDataSource('montanas3d-picos');
  viewer.dataSources.add(fuenteDatos);
  region.picos?.forEach(({ n, h, lat, lon }) => {
    fuenteDatos.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      label: {
        text: `${n}\n${conMiles(h)} m`,
        font: '600 14px Inter, system-ui, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.fromCssColorString('rgba(11,25,46,0.95)'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(8,18,48,0.78)'),
        backgroundPadding: new Cesium.Cartesian2(10, 6),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -12),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance:       new Cesium.NearFarScalar(5_000, 1.0, 200_000, 0.55),
        translucencyByDistance: new Cesium.NearFarScalar(120_000, 1.0, 400_000, 0.15)
      },
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#F2F4F8'),
        outlineColor: Cesium.Color.fromCssColorString('#D12021'),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(5_000, 1.2, 200_000, 0.6)
      }
    });
  });

  // Vuelo a la región con ángulo inclinado (instantáneo si prefers-reduced-motion)
  const destino = Cesium.Cartesian3.fromDegrees(region.lon, region.lat, region.altura);
  const orient = {
    heading: Cesium.Math.toRadians(region.heading),
    pitch:   Cesium.Math.toRadians(region.pitch),
    roll:    0
  };
  if (sinMovimiento()) {
    viewer.camera.setView({ destination: destino, orientation: orient });
    viewer.scene.requestRender();
  } else {
    viewer.camera.flyTo({
      destination: destino,
      orientation: orient,
      duration: DURACION_VUELO,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
    });
  }

  // ── Límites de cámara (se restauran desde la instantánea al salir) ──────────
  const ctrl = scene.screenSpaceCameraController;
  ctrl.enableCollisionDetection = true;
  ctrl.minimumZoomDistance = 1_500;      // ≈ 1,5 km de distancia mínima al suelo
  ctrl.maximumZoomDistance = 250_000;    // ≈ 250 km máximo

  // ── Correa suave: si el centro de vista se aleja > 150 km, volver ──────────
  const centroRegion = Cesium.Cartesian3.fromDegrees(region.lon, region.lat);
  const LIMITE_LEASH_M = 150_000;
  let devolviendo = false;
  const quitarLeash = viewer.camera.moveEnd.addEventListener(() => {
    if (devolviendo || modo !== 'montana') return;
    const pc = viewer.camera.positionCartographic;
    const aquí = Cesium.Cartesian3.fromRadians(pc.longitude, pc.latitude);
    const d = Cesium.Cartesian3.distance(aquí, centroRegion);
    if (d <= LIMITE_LEASH_M) return;
    devolviendo = true;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(region.lon, region.lat, pc.height),
      orientation: { heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: 0 },
      duration: 1.2,
      complete: () => { devolviendo = false; },
      cancel:   () => { devolviendo = false; }
    });
  });

  // ── Botonera flotante + atajos + rotación de brújula ────────────────────────
  controles = instalarControles(viewer, region, destino, orient);
  const quitarControles = controles.quitar;
  controles.quitar = () => { quitarLeash(); quitarControles(); };
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
    <div class="hud-leyenda" role="img" aria-label="Escala de cobertura de nieve (MODIS)">
      <span class="hud-titulo">Cobertura de nieve</span>
      <span class="hud-escala" aria-hidden="true"></span>
      <span class="hud-rango"><span>0 %</span><span>100 %</span></span>
    </div>
    <button type="button" class="hud-toggle" aria-pressed="false"
            title="Mostrar la imagen MODIS de esa fecha (con nubes)"
            aria-label="Alternar imagen del día / sin nubes">
      Imagen del día
    </button>
    <p class="hud-credito" role="note"></p>
    <span class="hud-cesium">${Cesium.CreditDisplay.cesiumCredit.html}</span>`;
  viewer.container.appendChild(hud);
  const btnToggle = hud.querySelector('.hud-toggle');

  // Fuente: "Relieve: Cesium World Terrain · Nieve: MODIS Terra (NASA) · <fecha>" (+ color real si está)
  // y, debajo, el logo de Cesium ion (el crédito que pide Cesium por usar su relieve).
  vista.credito = hud.querySelector('.hud-credito');
  const actualizarCredito = escribirCreditoMontana;

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
    { id: 'reenc',    txt: '⟲',  aria: 'Reencuadrar la región', tip: 'Reencuadrar (R)' },
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

  // --- Acciones -------------------------------------------------------------
  const EASE = Cesium.EasingFunction.CUBIC_IN_OUT;
  function zoom(factor) {
    // paso proporcional a la altura actual (p. ej. factor = ±0.35)
    const pc = camera.positionCartographic;
    const paso = Math.max(200, pc.height * Math.abs(factor));
    if (factor > 0) camera.zoomIn(paso);
    else camera.zoomOut(paso);
    scene.requestRender();
  }
  function reencuadrar() {
    if (sinMovimiento()) {
      camera.setView({ destination: destinoInicial, orientation: orientInicial });
    } else {
      camera.flyTo({ destination: destinoInicial, orientation: orientInicial, duration: 1.2, easingFunction: EASE });
    }
  }
  function norte() {
    const pitch = camera.pitch;
    if (sinMovimiento()) camera.setView({ orientation: { heading: 0, pitch, roll: 0 } });
    else camera.flyTo({
      destination: camera.position.clone(),
      orientation: { heading: 0, pitch, roll: 0 },
      duration: 0.8, easingFunction: EASE
    });
  }
  function inclinar() {
    const cenital = camera.pitch < -1.0; // ya está casi vertical → volver a oblicuo
    const pitchNuevo = cenital ? Cesium.Math.toRadians(-30) : Cesium.Math.toRadians(-90);
    const orient = { heading: camera.heading, pitch: pitchNuevo, roll: 0 };
    if (sinMovimiento()) camera.setView({ orientation: orient });
    else camera.flyTo({ destination: camera.position.clone(), orientation: orient, duration: 0.8, easingFunction: EASE });
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

  // Atmósfera / fog / render
  if (scene.skyAtmosphere && snap.skyAtmosphereShow !== null) scene.skyAtmosphere.show = snap.skyAtmosphereShow;
  if (scene.fog && snap.fogEnabled !== null) scene.fog.enabled = snap.fogEnabled;
  if (scene.fog && snap.fogDensity !== null) scene.fog.density = snap.fogDensity;
  globe.showGroundAtmosphere = snap.showGroundAtmosphere;
  scene.requestRenderMode = snap.requestRenderMode;
  viewer.useDefaultRenderLoop = snap.renderLoopActivo;

  // Terreno y exageración
  scene.terrainProvider = snap.terrain;
  escribirExageracion(scene, snap.exageracion);
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
  modo = 'montana'; // antes de aplicar: ponerRelieve comprueba el modo al llegar la respuesta de ion
  aplicarModoMontana(viewer, region, fecha);
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
