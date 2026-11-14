// Globo 3D de APU (CesiumJS) con imágenes reales de NASA GIBS.
//
//   const globo = crearGlobo(contenedor, {
//     glaciares: GLACIARES,              // los 11 pines (contenido/glaciares.js)
//     picos: [{ n, h, lat, lon }, …],    // picos de la Cordillera Real
//     alElegir: (glaciar) => { … }       // aviso cuando se elige un glaciar (toque o elegirGlaciar)
//   });
//   globo.elegirGlaciar('kilimanjaro');  // zoom máximo (2 s): ~350 km encima, mirando abajo, dentro de una
//                                        // lente circular, con la foto MODIS de 250 m de su diaDespejado (ver CERCA)
//   globo.elegirPico(0);                 // gira (1,6 s) hasta dejar el pico al frente; el planeta llena su caja
//   globo.verPlaneta();                  // vuelve al tamaño del diseño y sigue girando
//   await globo.mostrarCapa('hoy');      // 'hoy' (foto de ayer con nubes reales y el sol real) o null
//   globo.destruir();                    // al salir de la pantalla
//   globo.viewer                         // el Cesium.Viewer (reutilízalo; null si se ve la imagen)
//
// El planeta es para explorar: siempre se ve entero (el zoom no lo deja pasar del 100 % de su caja).
// Capas de NASA: Blue Marble (base) + luces de las ciudades (VIIRS) en la parte de noche, con un
// terminador en diagonal y la atmósfera azul en el borde. Sin nubes (ver CAPAS_DATOS).
// Encima del canvas (HTML/SVG): un pin por glaciar (se oculta detrás del planeta; la Cordillera Real
// en rojo con dos anillos), la etiqueta de lo elegido y el satélite, que da vueltas solo por la
// órbita punteada del menú (por detrás del planeta en la mitad de atrás) con su haz hacia el planeta.
//
// El globo llena su contenedor con fondo TRANSPARENTE (se ve el cielo de la pantalla).
// Si no hay WebGL o NASA no responde, muestra /img/planeta.webp en su lugar.
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './globo3d.css';
import { CESIUM_TOKEN, EXAGERACION } from '../servicios/config.js';
import { aplicarVistaRealista } from './vista-realista.js';
import { CAPAS, proveedor, nasaResponde, primeraFechaConImagen, haceDias, diasAntes, fechaBonita } from '../servicios/nasa-gibs.js';

// Capas que se pueden poner encima del Blue Marble con mostrarCapa(nombre, fecha).
// El planeta es para explorar: los datos por año (nieve, lluvia) van en la vista de la montaña.
// (Nubes encima del planeta: GIBS no tiene una capa de nubes blancas sobre transparente
// —las de nubes son mapas de colores—, así que el planeta va sin nubes.)
const CAPAS_DATOS = {
  // La Tierra de hoy: fotos en color real de ayer (con sus nubes), con el sol en su posición real.
  // De abajo hacia arriba: MODIS Terra, MODIS Aqua y VIIRS NOAA-20; cada una tapa las
  // franjas sin imagen de las otras y donde no hay ninguna se ve el Blue Marble.
  // (Sin VIIRS SNPP: GIBS dejó de publicarla el 2 nov 2026; CAPAS.fotoSnpp sigue en nasa-gibs.js.)
  hoy: {
    capas: [CAPAS.fotoTerra, CAPAS.fotoAqua, CAPAS.fotoNoaa20],
    titulo: 'Nubes: MODIS Terra/Aqua y VIIRS NOAA-20', fechaDefecto: async () => haceDias(1), alpha: 1, sol: true
  }
};
const CREDITO_BASE = 'Imágenes: NASA GIBS / Blue Marble';

// ---------------------------------------------------------------
// Lupa al elegir un glaciar: la cámara se inclina (LUPA.pitch) a LUPA.rango del glaciar, atada a él
// (al arrastrar gira a su alrededor), con la vista realista de componentes/vista-realista.js.
// Mientras la pestaña está abierta, el zoom queda entre 5 y 6 000 km.
// ---------------------------------------------------------------
const CERCA = {
  zoomMin: 5_000,
  zoomMax: 6_000_000,
  duracion: 2,                  // segundos del vuelo
  arrastreMax: 2.5,             // grados (~280 km)
  alturaFoto: 2_000_000,        // debajo de esto, la foto MODIS del día (si está encendida en el botón de capas)
  fundido: 0.6                  // segundos que tarda la foto en aparecer o irse
};
const LUPA = { rango: 60_000, pitch: -45 };
// De cerca, sin pixelado: MODIS Terra en color real (GoogleMapsCompatible_Level9 → nivel máximo 9)
// del día despejado de cada glaciar (diaDespejado en contenido/glaciares.js). Si no tiene, este:
const FOTO_CERCA_DEFECTO = '2026-08-15';

// Lente circular: al acercarse, el globo se ve dentro de un círculo (su diámetro, --lente-diam, lo pone
// menu.css) con viñeta y un anillo de visor. El contorno del planeta se transforma en la lente animando
// el clip-path circle() en 0,8 s; al volver, la lente se cierra al tamaño del planeta.
const TRANSICION_LENTE = 'clip-path .8s cubic-bezier(.4, 0, .2, 1)';
const CLIP_LENTE = 'circle(calc(var(--lente-diam, calc(100cqmin - 4cqh)) / 2) at 50% 50%)';
const CLIP_PLANETA = 'circle(calc(var(--globo-fraccion) * 50cqmin + 2px) at 50% 50%)';
// '2026-07-29' → '29 jul 2026' (corta: el texto de la lente no choca con los botones de arriba)
const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fechaCorta = (iso) => FECHA_CORTA.format(new Date(`${iso}T00:00:00Z`)).replace(/\./g, '').replace(/ de /g, ' ');
// Anillo del visor (viewBox −50…50): círculo, 36 marquitas cada 10° y 4 marcas en cruz
const ANILLO_LENTE = (() => {
  const linea = (a, r1, r2, clase) => {
    const c = Math.cos(a), s = Math.sin(a);
    return `<line class="${clase}" x1="${(c * r1).toFixed(2)}" y1="${(s * r1).toFixed(2)}" x2="${(c * r2).toFixed(2)}" y2="${(s * r2).toFixed(2)}"/>`;
  };
  let marcas = '';
  for (let i = 0; i < 36; i++) if (i % 9) marcas += linea((i * Math.PI) / 18, 48.2, 50, 'marquita');
  for (let i = 0; i < 4; i++) marcas += linea((i * Math.PI) / 2, 45, 50, 'cruz');
  return `<circle r="50"/>${marcas}`;
})();

const POR_DEFECTO = {
  lat: -15,                 // centrado en Sudamérica
  lon: -65,
  altura: null,             // metros; null = se calcula para que el planeta mida `tamano`
  tamano: 0.95,             // diámetro del planeta / lado menor del contenedor (maqueta: lo llena)
  rotar: true,
  velocidad: 0.04,          // radianes por segundo (≈ una vuelta cada 2,6 min)
  tamanoMaximo: 1,          // el zoom nunca deja que el planeta pase del 100 % de su caja
  esperaTrasArrastre: 4000, // ms hasta que vuelve a girar
  glaciares: [],            // [{ id, nombre, pais, lat, lon, principal?, texto, datos }]
  picos: [],                // [{ n: nombre, h: altura en m (6438 o '6 438'), lat, lon }]
  alElegir: null,           // (glaciar) => void
  alCargarCapa: null,       // (cargando) => void: true mientras cargan las teselas de la capa "hoy"
  credito: null,            // elemento donde escribir el crédito de NASA (si no, va debajo del globo)
  capa: null,               // capa al empezar: 'hoy' o null (imagen normal)
  duracionVuelo: 1.6,       // segundos: girar hasta dejar lo elegido al frente (y "ver planeta")
  // Órbita punteada del menú (SVG viewBox 100, elipse rx 48 ry 44 girada −24°), medida
  // en "cajas del globo": su caja es 108cqh × 80cqh y la del globo 80cqh × 80cqh, mismo centro.
  orbita: { rx: 48, ry: 44, giro: -24, ancho: 108 / 80, alto: 1 },
  vueltaSatelite: 40        // segundos por vuelta
};

// La altura puede venir como número (6438) o como texto ya formateado ('6 438')
const alturaNumero = (h) => (typeof h === 'number' ? h : Number(String(h ?? '').replace(/\D/g, '')) || 0);
// 6438 → "6 438" (espacio fino que no se corta)
const conMiles = (h) => String(Math.round(alturaNumero(h))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const SATELITE_SVG = `
  <rect x="0" y="9" width="22" height="14" fill="#2F6FD6" stroke="#CFE3FF"/>
  <path d="M7 9v14M14 9v14M0 16h22" stroke="#CFE3FF" stroke-width=".6"/>
  <rect x="42" y="9" width="22" height="14" fill="#2F6FD6" stroke="#CFE3FF"/>
  <path d="M49 9v14M56 9v14M42 16h22" stroke="#CFE3FF" stroke-width=".6"/>
  <rect x="24" y="8" width="16" height="16" rx="2" fill="#E8EEF8" stroke="#9FB3D9"/>
  <circle cx="32" cy="26" r="3" fill="#B8C6E0"/>`;

const RADIO_TIERRA = 6_378_137;

// Luz "pegada" a la cámara: viene de arriba a la izquierda, un poco por delante. El terminador
// (día/noche) cruza el planeta en diagonal por abajo a la derecha, donde se ven las luces de las
// ciudades (VIIRS); el centro, donde está lo elegido, queda de día.
const LUZ = { derecha: 0.78, abajo: 0.55, adelante: 0.42 };

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Copo de nieve del pin (12 px, blanco)
const COPO = '<svg class="copo" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 3 3-3M9 20l3-3 3 3M4 10.5l4 1.5-1 4M20 13.5l-4-1.5 1-4M4 13.5 8 12 7 8M20 10.5 16 12l1 4"/></svg>';

// "16,2° S · 68,2° O"
const coordenadas = (lat, lon) =>
  `${Math.abs(lat).toFixed(1).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'} · ${Math.abs(lon).toFixed(1).replace('.', ',')}° ${lon < 0 ? 'O' : 'E'}`;

export function crearGlobo(contenedor, opciones = {}) {
  const op = { ...POR_DEFECTO, ...opciones };
  const glaciares = op.glaciares ?? [];
  const picos = op.picos ?? [];
  const principal = glaciares.find((g) => g.principal) ?? null;

  const raiz = document.createElement('div');
  raiz.className = 'globo3d';
  raiz.style.setProperty('--globo-fraccion', String(op.tamano)); // el CSS (halo, imagen) usa el mismo tamaño
  contenedor.append(raiz);

  let viewer = null;
  let destruido = false;
  let acercado = null;    // { lat, lon } del glaciar mientras se ve de cerca (pestaña abierta)
  let lupa = null;        // la lupa en curso: { lugar, orbita, vr (aplicarVistaRealista), hoyOcultas }
  let fotoDelDia = false; // botón de capas: "Imagen MODIS del día" (la foto de 250 m del día despejado, en la lupa)
  let solActivo = false;  // la capa "hoy" usa el sol real
  let cerca = null;       // { capa, fecha }: la foto MODIS de cerca que se ve (o está entrando)
  const limpiezas = [];   // funciones que deshacen listeners

  // ---------------------------------------------------------------
  // Plan B: imagen fija del planeta en la misma posición
  // ---------------------------------------------------------------
  function mostrarImagen(motivo) {
    if (destruido || raiz.classList.contains('sin-3d')) return;
    if (motivo) console.info('APU: globo 3D reemplazado por imagen —', motivo);
    apagarViewer();
    raiz.replaceChildren();
    raiz.classList.add('sin-3d');
    const img = document.createElement('img');
    img.className = 'globo3d-imagen';
    img.src = '/img/planeta.webp';
    img.alt = 'El planeta Tierra visto desde el espacio';
    const flotante = document.createElement('div');
    flotante.className = 'globo3d-flotante';
    flotante.append(img, crearHalo());
    raiz.append(flotante);
  }

  function crearHalo() {
    const halo = document.createElement('div');
    halo.className = 'globo3d-halo';
    halo.setAttribute('aria-hidden', 'true');
    return halo;
  }

  function apagarViewer() {
    limpiezas.splice(0).forEach((fn) => fn());
    if (viewer && !viewer.isDestroyed()) viewer.destroy();
    viewer = null;
  }

  // API cuando no hay globo 3D (imagen de respaldo): elegir un glaciar igual avisa al menú
  const apiSinGlobo = () => ({
    viewer: null, // sin globo 3D no hay visor de Cesium
    irA() {}, elegirPico() {}, verPlaneta() {}, ponerFotoDelDia() {}, estado: () => ({ modo: 'imagen' }),
    mostrarCapa: async () => ({ ok: false, motivo: 'sin-globo' }),
    elegirGlaciar(id) { const g = glaciares.find((x) => x.id === id); if (g) op.alElegir?.(g); },
    destruir: () => { destruido = true; raiz.remove(); }
  });

  if (!hayWebGL()) {
    mostrarImagen('este navegador no tiene WebGL');
    return apiSinGlobo();
  }

  // ---------------------------------------------------------------
  // El globo
  // ---------------------------------------------------------------
  if (CESIUM_TOKEN) Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

  // Encima del canvas (mix-blend-mode: screen): el anillo del borde y el halo.
  // Todo flota junto; el crédito queda quieto.
  const flotante = document.createElement('div');
  flotante.className = 'globo3d-flotante';
  const lienzo = document.createElement('div');
  lienzo.className = 'globo3d-lienzo';
  const anillo = document.createElement('div');
  anillo.className = 'globo3d-anillo';
  anillo.setAttribute('aria-hidden', 'true');
  anillo.hidden = true;

  // Capa de la maqueta: haz, satélite, pines y etiqueta de lo elegido
  const idDegradado = `globo3d-haz-${Math.random().toString(36).slice(2, 8)}`;
  const capa = document.createElement('div');
  capa.className = 'globo3d-capa objetivo-oculto';
  capa.innerHTML = `
    <svg class="globo3d-haz" aria-hidden="true">
      <defs>
        <linearGradient id="${idDegradado}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#9FD4FF" stop-opacity=".75"/>
          <stop offset="1" stop-color="#9FD4FF" stop-opacity=".05"/>
        </linearGradient>
      </defs>
      <polygon fill="url(#${idDegradado})"/>
    </svg>
    <div class="globo3d-satelite" aria-hidden="true">
      <svg viewBox="0 0 64 32">${SATELITE_SVG}</svg>
    </div>
    <div class="globo3d-pines"></div>
    <div class="globo3d-seleccion">
      <span class="linea" aria-hidden="true"></span>
      <div class="globo3d-etiqueta" role="status"></div>
    </div>`;
  const seleccion = capa.querySelector('.globo3d-seleccion');
  const etiqueta = capa.querySelector('.globo3d-etiqueta');
  const satelite = capa.querySelector('.globo3d-satelite');
  const hazSvg = capa.querySelector('.globo3d-haz');
  const haz = hazSvg.querySelector('polygon');
  const degradado = capa.querySelector('linearGradient');

  flotante.append(lienzo, anillo, crearHalo(), capa);
  const creditosOcultos = document.createElement('div'); // Cesium escribe aquí; no se muestra
  // Crédito propio de NASA: en el elemento que nos den (el menú lo ubica) o debajo del globo
  const credito = op.credito ?? document.createElement('p');
  if (!op.credito) credito.className = 'globo3d-credito';
  credito.textContent = CREDITO_BASE;
  // Lente (encima del globo, fuera del recorte): viñeta, anillo de visor y sus dos textos
  const lente = document.createElement('div');
  lente.className = 'globo3d-lente';
  lente.setAttribute('aria-hidden', 'true');
  lente.innerHTML = `
    <div class="lente-vineta"></div>
    <svg class="lente-anillo" viewBox="-50 -50 100 100">${ANILLO_LENTE}</svg>
    <p class="lente-arriba"></p>
    <p class="lente-abajo"></p>`;
  raiz.append(flotante, lente);
  // Créditos de Cesium en la lupa (logo de ion y atribuciones de la imagen, p. ej. Bing): abajo a la derecha
  const cajaCreditos = document.createElement('div');
  cajaCreditos.className = 'globo3d-creditos';
  cajaCreditos.hidden = true;
  raiz.append(cajaCreditos);
  if (!op.credito) raiz.append(credito);

  // Imagen base algo más viva, como en el diseño
  const capaBase = new Cesium.ImageryLayer(proveedor(CAPAS.marmolAzul), {
    brightness: 1.1,
    contrast: 1.15,
    saturation: 1.2
  });
  // En esa capa los lagos grandes sin batimetría (el Titicaca) vienen en negro puro: esos píxeles
  // se vuelven transparentes y debajo se ve el color de lago del globo (baseColor)
  capaBase.colorToAlpha = Cesium.Color.BLACK;
  capaBase.colorToAlphaThreshold = 0.06; // también algunas sombras del relieve y las fosas más hondas: quedan azul marino

  // Relieve: Cesium World Terrain (Cesium ion) si hay token. Si ion falla (401/403, sin red), el globo
  // se queda con el elipsoide liso (EllipsoidTerrainProvider): sin relieve, pero nunca negro.
  const relieve = CESIUM_TOKEN ? Cesium.Terrain.fromWorldTerrain() : undefined;
  relieve?.errorEvent.addEventListener((e) => {
    console.warn('APU: el relieve de Cesium ion no respondió; el globo sigue sin relieve.', e?.message ?? e);
    if (!viewer || viewer.isDestroyed()) return;
    if (document.body.classList.contains('modo-montana')) return; // la montaña maneja su propio relieve
    viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    viewer.scene.verticalExaggeration = 1;
    viewer.scene.requestRender();
  });

  try {
    viewer = new Cesium.Viewer(lienzo, {
      baseLayer: capaBase,
      terrain: relieve,
      animation: false, timeline: false, geocoder: false, baseLayerPicker: false,
      homeButton: false, sceneModePicker: false, navigationHelpButton: false,
      fullscreenButton: false, infoBox: false, selectionIndicator: false,
      vrButton: false,
      skyBox: false,                 // sin estrellas, sol ni luna de Cesium
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      creditContainer: creditosOcultos,
      contextOptions: { webgl: { alpha: true } },
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      showRenderLoopErrors: false
    });
  } catch (e) {
    console.error(e);
    mostrarImagen('Cesium no pudo iniciar WebGL');
    return apiSinGlobo();
  }

  const escena = viewer.scene;
  const globo = escena.globe;
  // Sin el clic por defecto del Viewer: pedía "GetFeatureInfo" a NASA GIBS (no lo admite: error 501)
  // y el doble clic hacía zoom a entidades. Los toques los maneja nuestro ScreenSpaceEventHandler.
  viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  escena.backgroundColor = Cesium.Color.TRANSPARENT;
  if (escena.sun) escena.sun.show = false;
  if (escena.moon) escena.moon.show = false;
  // Atmósfera visible, con el borde azul más brillante; sigue a la luz de la escena
  escena.skyAtmosphere.show = true;
  globo.showGroundAtmosphere = true;
  globo.atmosphereLightIntensity = 12;
  globo.dynamicAtmosphereLighting = true;
  globo.dynamicAtmosphereLightingFromSun = false;
  globo.baseColor = Cesium.Color.fromCssColorString('#0F2D52'); // azul de lago y de fosa (y mientras llegan las imágenes)
  escena.verticalExaggeration = CESIUM_TOKEN ? EXAGERACION : 1;

  // Día y noche con un sol fijo respecto a la vista
  globo.enableLighting = true;
  // Cesium apaga la luz cuando la cámara está a menos de ~πR (20 000 km); con el planeta
  // grande en un contenedor chico estamos a ~7 000 km, así que la dejamos siempre encendida.
  globo.lightingFadeOutDistance = 1;
  globo.lightingFadeInDistance = 2;
  const luz = new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(1, 0, 0), intensity: 2.2 });
  escena.light = luz;
  const auxLuz = new Cesium.Cartesian3();
  // Con la capa "hoy", el sol de verdad (posición real a esta hora); si no, la luz del diseño
  const sol = new Cesium.SunLight({ intensity: 2.2 });
  function usarSol(si) {
    solActivo = si;
    if (si) viewer.clock.currentTime = Cesium.JulianDate.now();
    escena.light = si && !acercado ? sol : luz;
    escena.requestRender();
  }
  const orientarLuz = () => {
    if (lupa) return; // en la lupa manda el sol de las 10:00 locales (vista realista)
    const c = viewer.camera;
    const d = luz.direction;
    // De cerca: luz de frente (desde la cámara), para que la foto del glaciar se vea pareja
    if (acercado) {
      escena.light = luz;
      Cesium.Cartesian3.clone(c.directionWC, d);
      return;
    }
    if (escena.light !== luz) return;
    Cesium.Cartesian3.multiplyByScalar(c.directionWC, LUZ.adelante, d);
    Cesium.Cartesian3.add(d, Cesium.Cartesian3.multiplyByScalar(c.rightWC, LUZ.derecha, auxLuz), d);
    Cesium.Cartesian3.add(d, Cesium.Cartesian3.multiplyByScalar(c.upWC, -LUZ.abajo, auxLuz), d);
    Cesium.Cartesian3.normalize(d, d);
  };

  // Luces de las ciudades: solo en la parte oscura
  const luces = viewer.imageryLayers.addImageryProvider(proveedor(CAPAS.lucesNoche));
  luces.dayAlpha = 0;
  luces.nightAlpha = 0.95;
  luces.brightness = 1.4;

  // ---------------------------------------------------------------
  // Capa "Hoy" encima del Blue Marble: las fotos de ayer de 4 satélites apiladas (las nubes reales)
  // ---------------------------------------------------------------
  let capasDatos = [];    // ImageryLayer de Cesium (de abajo hacia arriba)
  let infoCapa = null;    // { nombre, fecha (la más reciente usada), fechas (todas las usadas), pedida, sinImagen }
  const DIAS_ATRAS = 3;   // si un satélite no tiene imagen en la fecha pedida, prueba hasta 3 días antes
  let pedidoCapa = 0;     // si llega otro pedido mientras esperamos a NASA, el anterior se descarta
  let cargandoCapa = false;

  function escribirCredito() {
    // Lupa: "Imagen: Bing Maps Aerial (Microsoft) · Relieve: Cesium World Terrain" (+ la foto MODIS si está)
    if (lupa) {
      const vr = lupa.vr;
      credito.textContent = `Imagen: ${vr?.imagen?.texto ?? 'Blue Marble (NASA)'} · Relieve: ${vr?.relieve === 'sin' ? 'no disponible' : 'Cesium World Terrain'}` +
        (cerca ? ` · Foto: MODIS Terra · ${fechaBonita(cerca.fecha)}` : '');
      return;
    }
    if (cerca) { credito.textContent = `Imagen: MODIS Terra · ${fechaBonita(cerca.fecha)}`; return; }
    const d = infoCapa && CAPAS_DATOS[infoCapa.nombre];
    if (!d) { credito.textContent = CREDITO_BASE; return; }
    // La fecha real de las fotos que se ven; si los satélites quedaron en días distintos, todas
    const cuando = infoCapa.sinImagen
      ? `sin imagen de NASA del ${fechaBonita(diasAntes(infoCapa.pedida, DIAS_ATRAS))} al ${fechaBonita(infoCapa.pedida)}`
      : infoCapa.fechas.length > 1
        ? infoCapa.fechas.map(fechaCorta).join(' y ')
        : fechaBonita(infoCapa.fecha);
    credito.textContent = `${CREDITO_BASE} · ${d.titulo} · ${cuando}`;
  }

  // "Cargando nubes de NASA…": avisa al menú (op.alCargarCapa) mientras faltan teselas
  function avisarCarga(si) {
    if (cargandoCapa === si) return;
    cargandoCapa = si;
    op.alCargarCapa?.(si);
  }
  let cargaDesde = 0; // las capas recién puestas tardan un cuadro en pedir sus teselas
  limpiezas.push(globo.tileLoadProgressEvent.addEventListener((pendientes) => {
    if (cargandoCapa && pendientes === 0 && performance.now() > cargaDesde) avisarCarga(false);
  }));
  // Si las teselas ya estaban en caché, no hay evento de progreso: se mira después de cada cuadro
  limpiezas.push(escena.postRender.addEventListener(() => {
    if (cargandoCapa && performance.now() > cargaDesde && globo.tilesLoaded) avisarCarga(false);
  }));

  function quitarCapaDatos() {
    if (viewer) capasDatos.forEach((c) => viewer.imageryLayers.remove(c, true));
    capasDatos = [];
    avisarCarga(false);
  }

  // Una capa de NASA debajo de las luces de las ciudades
  function ponerCapa(capa, f, alpha) {
    const c = viewer.imageryLayers.addImageryProvider(proveedor(capa, f));
    c.alpha = alpha;
    // Los huecos entre las pasadas del satélite vienen en negro: transparentes (se ve lo de abajo)
    c.colorToAlpha = Cesium.Color.BLACK;
    c.colorToAlphaThreshold = 0.06;
    ordenarCapas();
    return c;
  }

  // Nada pixelado: nivel de teselas que pide el planeta a su tamaño en pantalla (su ecuador mide
  // π × diámetro px; cada nivel duplica las teselas de 256 px). Una capa con menos detalle no se muestra.
  const nivelNecesario = () => Math.max(0, Math.ceil(Math.log2((Math.PI * estado().diametroPx) / 256)));

  // nombre: 'hoy' | null. fecha: 'AAAA-MM-DD' (por defecto, ayer).
  // Cada satélite usa la fecha pedida o, si NASA aún no la tiene (404 o tesela vacía), el día anterior,
  // hasta DIAS_ATRAS días antes; los que no tienen ninguna se saltan. Devuelve
  // { ok, nombre, fecha (la más reciente usada), fechas, pedida, capas, sinImagen }
  // o { ok: false, motivo: 'sin-respuesta' | 'sin-detalle' }.
  // Si NASA no responde, el globo queda como estaba.
  async function mostrarCapa(nombre, fecha) {
    const yo = ++pedidoCapa;
    if (!viewer) return { ok: false, motivo: 'sin-globo' };
    if (!nombre) {
      usarSol(false);
      quitarCapaDatos();
      infoCapa = null;
      escribirCredito();
      escena.requestRender();
      return { ok: true, nombre: null };
    }
    const d = CAPAS_DATOS[nombre];
    if (!d) return { ok: false, motivo: 'capa-desconocida' };
    if (Math.min(...d.capas.map((c) => c.nivelMax)) < nivelNecesario()) return { ok: false, motivo: 'sin-detalle' };
    const f = fecha ?? await d.fechaDefecto();
    if (yo !== pedidoCapa || !viewer) return { ok: false, motivo: 'reemplazado' };
    if (!f) return { ok: false, motivo: 'sin-respuesta' };
    avisarCarga(true);
    const candidatas = Array.from({ length: DIAS_ATRAS + 1 }, (_, n) => diasAntes(f, n)); // f, f-1, f-2, f-3
    const usadas = await Promise.all(d.capas.map((c) => primeraFechaConImagen(c, candidatas)));
    if (yo !== pedidoCapa || !viewer) return { ok: false, motivo: 'reemplazado' };
    if (usadas.every((u) => u === 'error')) { avisarCarga(false); return { ok: false, motivo: 'sin-respuesta' }; }

    quitarCapaDatos();
    // Las de días anteriores van debajo: donde se tapan, gana la foto más reciente
    const conImagen = d.capas
      .map((c, i) => ({ c, fecha: usadas[i] }))
      .filter((x) => x.fecha && x.fecha !== 'error')
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    capasDatos = conImagen.map((x) => ponerCapa(x.c, x.fecha, d.alpha ?? 0.85));
    const fechas = [...new Set(conImagen.map((x) => x.fecha))].sort().reverse(); // de la más reciente a la más vieja
    const fechaReal = fechas[0] ?? f;
    infoCapa = { nombre, fecha: fechaReal, fechas, pedida: f, sinImagen: !conImagen.length };
    if (conImagen.length) { cargaDesde = performance.now() + 300; avisarCarga(true); }
    usarSol(Boolean(d.sol));
    escribirCredito();
    escena.requestRender();
    return {
      ok: true, nombre, fecha: fechaReal, fechas, pedida: f,
      capas: conImagen.map((x) => ({ capa: x.c.layer, fecha: x.fecha })), sinImagen: !conImagen.length
    };
  }
  if (op.capa) mostrarCapa(op.capa);

  // Distancia de cámara para que el planeta mida `tamano` del lado menor del contenedor.
  // Cesium usa el campo de visión (fov) sobre el lado mayor del canvas.
  function alturaEncuadre(tamano = op.tamano) {
    const { clientWidth: w, clientHeight: h } = escena.canvas;
    if (!w || !h) return 20_000_000;
    const tanMitad = Math.tan(viewer.camera.frustum.fov / 2);
    const tanMitadLadoMenor = tanMitad * Math.min(w, h) / Math.max(w, h);
    const angulo = Math.atan(tamano * tanMitadLadoMenor); // radio angular del planeta
    return RADIO_TIERRA / Math.sin(angulo) - RADIO_TIERRA;
  }

  let encuadreAuto = op.altura == null;
  const encuadrar = (lon, lat) => {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromRadians(lon, lat, encuadreAuto ? alturaEncuadre() : op.altura)
    });
  };
  encuadrar(Cesium.Math.toRadians(op.lon), Cesium.Math.toRadians(op.lat));

  // Gestos: solo girar el planeta y acercar/alejar, siempre mirando a su centro.
  // Sin inclinar (botón del medio, Ctrl o dos dedos) ni mover la cámara de lado: el planeta,
  // el anillo y la órbita del satélite quedan siempre centrados. El zoom tiene topes según el
  // tamaño del canvas: de cerca, el planeta llena su caja (100 %, nunca más: siempre se ve entero);
  // de lejos, el tamaño del diseño.
  const control = escena.screenSpaceCameraController;
  control.enableTilt = false;
  control.enableLook = false;
  control.enableTranslate = false;
  // En la vista de montaña (montanas3d.js, body.modo-montana) la cámara, sus topes, las capas y la
  // niebla son de la montaña: el globo no gira, no encuadra, no limita el arrastre ni pone la foto de cerca.
  const enMontana = () => document.body.classList.contains('modo-montana');
  const topeAlejar = () => {
    if (enMontana()) return;
    if (acercado) { // de cerca: entre 150 y 6 000 km
      control.minimumZoomDistance = CERCA.zoomMin;
      control.maximumZoomDistance = CERCA.zoomMax;
      return;
    }
    control.minimumZoomDistance = alturaEncuadre(op.tamanoMaximo);
    control.maximumZoomDistance = Math.max(alturaEncuadre(), control.minimumZoomDistance + 1);
  };
  topeAlejar();

  // Si algo falla al dibujar, pasamos a la imagen
  limpiezas.push(escena.renderError.addEventListener((_, err) => {
    console.error(err);
    setTimeout(() => mostrarImagen('error de render')); // fuera del ciclo de dibujo de Cesium
  }));

  // Resolución: la que recomienda el navegador (bordes nítidos sin dibujar de más)
  viewer.useBrowserRecommendedResolution = true;
  viewer.resolutionScale = 1;

  // Cada vez que el canvas cambia de tamaño, el planeta vuelve a medir op.tamano
  // (salvo que el usuario ya haya elegido su distancia con zoom o eligiendo un lugar).
  // Batching por rAF: aunque haya muchos ticks del observer (transición CSS de 0.6 s,
  // arrastre de ventana…) solo hacemos un viewer.resize() + requestRender() por frame.
  let resizePendiente = 0;
  function aplicarResize() {
    resizePendiente = 0;
    if (!viewer || viewer.isDestroyed()) return;
    viewer.resize();
    topeAlejar();
    // en pleno vuelo, el ajuste se hace al llegar (verPlaneta); en la montaña, nunca
    if (encuadreAuto && !volando && !enMontana()) {
      const p = viewer.camera.positionCartographic;
      encuadrar(p.longitude, p.latitude);
    }
    escena.requestRender();
  }
  function forzarResize() {
    if (resizePendiente) cancelAnimationFrame(resizePendiente);
    resizePendiente = requestAnimationFrame(aplicarResize);
  }
  const observador = new ResizeObserver(forzarResize);
  observador.observe(lienzo);
  limpiezas.push(() => { if (resizePendiente) cancelAnimationFrame(resizePendiente); observador.disconnect(); });

  // Cambios de devicePixelRatio: zoom del navegador o mover la ventana a otro monitor.
  // El ResizeObserver no se entera porque el tamaño CSS del contenedor no cambia.
  // matchMedia solo dispara una vez por su umbral, así que re-registramos con el nuevo dpr.
  let mqDpr = null;
  function engancharDpr() {
    if (mqDpr) mqDpr.removeEventListener('change', alCambiarDpr);
    mqDpr = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mqDpr.addEventListener('change', alCambiarDpr);
  }
  function alCambiarDpr() {
    forzarResize();
    engancharDpr();
  }
  engancharDpr();
  limpiezas.push(() => { if (mqDpr) mqDpr.removeEventListener('change', alCambiarDpr); });

  // ---------------------------------------------------------------
  // Rotación, vuelos y modo de dibujo
  // ---------------------------------------------------------------
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let arrastrando = false;
  let temporizadorGiro = 0;
  let enfocado = false;   // con un glaciar o pico al frente: no gira
  let volando = false;    // la cámara está en un flyTo
  let ultimo = performance.now();

  const debeGirar = () => op.rotar && !sinMovimiento.matches && !arrastrando && !temporizadorGiro
    && !enfocado && !volando;
  // Dibujo continuo mientras gira o vuela; si no, solo cuando algo cambia
  const actualizarModo = () => {
    if (enMontana()) return; // en la montaña el modo de dibujo es de montanas3d.js
    const continuo = debeGirar() || volando;
    escena.requestRenderMode = !continuo;
    if (!continuo) escena.requestRender();
    ultimo = performance.now();
  };

  // ---------------------------------------------------------------
  // Pines de los glaciares (HTML encima del canvas): círculo de 22 px con un copo; área táctil de
  // 44 px. Se ocultan detrás del planeta. La Cordillera Real va en rojo con dos anillos finos.
  // ---------------------------------------------------------------
  const ocultador = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, Cesium.Cartesian3.ZERO);
  const cajaPines = capa.querySelector('.globo3d-pines');
  const pines = glaciares.map((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `globo3d-pin${g.principal ? ' principal' : ''} oculto`;
    b.dataset.id = g.id;
    b.setAttribute('aria-label', `${g.nombre}, ${g.pais}`);
    b.tabIndex = -1;
    b.innerHTML = `${g.principal ? '<span class="anillo"></span><span class="anillo"></span>' : ''}<span class="disco">${COPO}</span>`;
    b.addEventListener('click', () => elegirGlaciar(g.id));
    cajaPines.append(b);
    return { g, b, pos: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 0), visible: false };
  });
  const auxPin = new Cesium.Cartesian2();
  const actualizarPines = () => {
    for (const p of pines) {
      const ve = aPantalla(p.pos, auxPin);
      if (ve !== p.visible) {
        p.visible = ve;
        p.b.classList.toggle('oculto', !ve);
        p.b.tabIndex = ve ? 0 : -1;
      }
      if (ve) p.b.style.transform = `translate(${auxPin.x.toFixed(1)}px, ${auxPin.y.toFixed(1)}px)`;
      p.b.classList.toggle('elegido', enfocado && objetivo?.ref === p.g);
    }
  };

  limpiezas.push(escena.preRender.addEventListener(() => {
    const ahora = performance.now();
    const dt = Math.min((ahora - ultimo) / 1000, 0.1); // evita saltos al volver a la pestaña
    ultimo = ahora;
    if (enMontana()) return; // la montaña maneja la cámara, las capas y la luz (su sol)
    if (debeGirar()) {
      // Ángulo positivo: la cámara va al oeste y la Tierra se ve girar hacia el este
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, op.velocidad * dt);
    }
    if (acercado && !volando && !lupa) limitarArrastre(); // en la lupa la cámara gira atada al glaciar
    // Vista normal: el zoom de Cesium va hacia el cursor (corre la Tierra), así que el zoom es nuestro.
    // En la lupa y de cerca vuelve el de Cesium (la montaña pone el suyo en montanas3d.js).
    control.enableZoom = !vistaNormal();
    if (vistaNormal()) {
      // Solo girar: sin inclinar, sin mover de lado, sin mirar alrededor (por si algo los dejó puestos)
      control.enableRotate = true;
      control.enableTilt = control.enableTranslate = control.enableLook = false;
      if (!enVuelo()) centrarCamara();
    }
    revisarFotoCerca(dt);
    orientarLuz();
  }));

  // De cerca se puede arrastrar un poco: la cámara no se aleja más de CERCA.arrastreMax grados del glaciar
  function limitarArrastre() {
    const c = viewer.camera;
    const p = c.positionCartographic;
    const dLat = Cesium.Math.toDegrees(p.latitude) - acercado.lat;
    const dLon = ((Cesium.Math.toDegrees(p.longitude) - acercado.lon + 540) % 360) - 180;
    const k = Math.cos(Cesium.Math.toRadians(acercado.lat));
    const d = Math.hypot(dLat, dLon * k);
    if (d <= CERCA.arrastreMax) return;
    const f = CERCA.arrastreMax / d;
    c.setView({
      destination: Cesium.Cartesian3.fromDegrees(acercado.lon + dLon * f, acercado.lat + dLat * f, p.height),
      orientation: { heading: c.heading, pitch: c.pitch, roll: c.roll }
    });
  }

  // ---------------------------------------------------------------
  // Vista normal del globo: solo gira en su lugar. La cámara siempre mira al centro de la Tierra y su
  // altura queda entre los topes de topeAlejar (la Tierra llena el anillo, nunca más). Así el planeta,
  // el anillo y la órbita punteada (CSS, centrados en la caja) coinciden siempre.
  // ---------------------------------------------------------------
  const vistaNormal = () => !lupa && !acercado && !enMontana();
  // Cualquier vuelo de la cámara (los nuestros o el regreso de la montaña): no se toca
  const enVuelo = () => volando || escena.tweens.length > 0;
  const auxDir = new Cesium.Cartesian3(), auxUp = new Cesium.Cartesian3(), auxRight = new Cesium.Cartesian3();
  const altura = () => Cesium.Cartesian3.magnitude(viewer.camera.positionWC) - RADIO_TIERRA;
  const limitarAltura = (h) => Math.min(control.maximumZoomDistance, Math.max(control.minimumZoomDistance, h));
  function ponerAltura(h) {
    const c = viewer.camera;
    Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.normalize(c.position, auxDir), RADIO_TIERRA + h, c.position);
  }
  // Seguro: si la cámara no apunta al centro (o se salió de los topes), se corrige en el mismo cuadro,
  // conservando el giro de la pantalla (sin saltos)
  function centrarCamara() {
    const c = viewer.camera;
    if (!Cesium.Matrix4.equals(c.transform, Cesium.Matrix4.IDENTITY)) c.lookAtTransform(Cesium.Matrix4.IDENTITY);
    const h = altura();
    if (Math.abs(limitarAltura(h) - h) > 1) ponerAltura(limitarAltura(h));
    const dir = Cesium.Cartesian3.negate(Cesium.Cartesian3.normalize(c.position, auxDir), auxDir);
    if (Cesium.Cartesian3.dot(dir, c.direction) > 1 - 1e-9) return; // ya mira al centro
    // "Arriba" = el de ahora, sin la parte que va hacia el centro (si es casi paralelo, el norte)
    let up = Cesium.Cartesian3.subtract(c.up, Cesium.Cartesian3.multiplyByScalar(dir, Cesium.Cartesian3.dot(c.up, dir), auxUp), auxUp);
    if (Cesium.Cartesian3.magnitude(up) < 1e-6) {
      up = Cesium.Cartesian3.subtract(Cesium.Cartesian3.UNIT_Z, Cesium.Cartesian3.multiplyByScalar(dir, dir.z, auxUp), auxUp);
    }
    Cesium.Cartesian3.normalize(up, up);
    Cesium.Cartesian3.clone(dir, c.direction);
    Cesium.Cartesian3.clone(up, c.up);
    Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(dir, up, auxRight), c.right);
  }

  // Zoom hacia el centro: rueda (suave) y pellizco con dos dedos (directo)
  let alturaMeta = null;
  let animZoom = 0;
  function pasoZoom() {
    animZoom = 0;
    if (alturaMeta === null || viewer.isDestroyed() || !vistaNormal() || enVuelo()) { alturaMeta = null; return; }
    const h = altura();
    const sig = Math.abs(alturaMeta - h) < 200 || sinMovimiento.matches ? alturaMeta : h + (alturaMeta - h) * 0.25;
    ponerAltura(sig);
    centrarCamara();
    escena.requestRender();
    if (sig === alturaMeta) alturaMeta = null; else animZoom = requestAnimationFrame(pasoZoom);
  }
  function zoomCentro(factor, suave) {
    if (!vistaNormal() || enVuelo()) return;
    encuadreAuto = false; // el usuario eligió su distancia
    const base = alturaMeta ?? altura();
    const meta = limitarAltura(base * factor);
    if (!suave) { alturaMeta = null; ponerAltura(meta); centrarCamara(); escena.requestRender(); return; }
    alturaMeta = meta;
    if (!animZoom) animZoom = requestAnimationFrame(pasoZoom);
  }
  limpiezas.push(() => cancelAnimationFrame(animZoom));

  // ---------------------------------------------------------------
  // De cerca, sin pixelado: con la cámara a menos de 2 000 km, encima del Blue Marble (hasta 8 niveles)
  // va la foto MODIS Terra de 250 m (9 niveles) del día despejado del glaciar. Entra y sale con un
  // fundido de 0,6 s; el crédito dice "Imagen: MODIS Terra · <fecha>".
  // ---------------------------------------------------------------
  const fotosSaliendo = [];
  const fechaCerca = () =>
    (objetivo?.tipo === 'glaciar' ? objetivo.ref : principal)?.diaDespejado ?? FOTO_CERCA_DEFECTO;
  // Orden de abajo hacia arriba: Blue Marble, capa "hoy", foto de cerca y luces de las ciudades
  function ordenarCapas() {
    if (cerca) viewer.imageryLayers.raiseToTop(cerca.capa);
    viewer.imageryLayers.raiseToTop(luces);
  }
  function revisarFotoCerca(dt) {
    const bajo = viewer.camera.positionCartographic.height < CERCA.alturaFoto;
    // De cerca, la atmósfera sobre el suelo y la niebla de Cesium dejan un velo blanco sobre la foto
    // (en la lupa, la vista realista deja puestas la niebla y la atmósfera)
    if (!lupa && globo.showGroundAtmosphere === bajo) {
      globo.showGroundAtmosphere = !bajo;
      escena.fog.enabled = !bajo;
    }
    const quiere = bajo && fotoDelDia ? fechaCerca() : null; // solo si está encendida en el botón de capas
    if ((cerca?.fecha ?? null) !== quiere) {
      if (cerca) fotosSaliendo.push(cerca.capa);
      cerca = null;
      if (quiere) {
        const c = viewer.imageryLayers.addImageryProvider(proveedor(CAPAS.fotoTerra, quiere));
        c.alpha = 0;
        c.colorToAlpha = Cesium.Color.BLACK; // franjas sin pasada del satélite: se ve el Blue Marble
        c.colorToAlphaThreshold = 0.06;
        cerca = { capa: c, fecha: quiere };
        ordenarCapas();
      }
      escribirCredito();
      escribirLente();
    }
    const paso = sinMovimiento.matches ? 1 : dt / CERCA.fundido;
    let falta = false;
    if (cerca && cerca.capa.alpha < 1) {
      cerca.capa.alpha = Math.min(1, cerca.capa.alpha + paso);
      falta = true;
    }
    for (let i = fotosSaliendo.length - 1; i >= 0; i--) {
      const c = fotosSaliendo[i];
      c.alpha = Math.max(0, c.alpha - paso);
      falta = true;
      if (c.alpha === 0) {
        viewer.imageryLayers.remove(c, true);
        fotosSaliendo.splice(i, 1);
      }
    }
    if (falta) escena.requestRender(); // el fundido sigue aunque la escena esté quieta
  }

  // Anillo de luz: mismo diámetro que el planeta, centrado (la cámara mira al centro de la Tierra).
  // El planeta siempre cabe entero en su caja (el zoom no lo deja pasar del 100 %): sin recorte.
  let diametroAnillo = 0;
  const actualizarAnillo = () => {
    if (acercado) return; // de cerca el anillo se desvanece (CSS) con el tamaño que tenía
    const e = estado();
    anillo.hidden = false;
    if (Math.abs(e.diametroPx - diametroAnillo) >= 1) {
      diametroAnillo = e.diametroPx;
      anillo.style.width = anillo.style.height = `${diametroAnillo}px`;
    }
  };
  limpiezas.push(escena.postRender.addEventListener(actualizarAnillo));

  // ---------------------------------------------------------------
  // Satélite sobre la órbita punteada
  // ---------------------------------------------------------------
  const o = op.orbita;
  const cosG = Math.cos(Cesium.Math.toRadians(o.giro));
  const sinG = Math.sin(Cesium.Math.toRadians(o.giro));
  // Punto de la órbita para el ángulo t, en fracciones de la caja del globo (0..1)
  function puntoOrbita(t) {
    const a = o.rx * Math.cos(t);
    const b = o.ry * Math.sin(t);
    const x = a * cosG - b * sinG;   // rotate(giro) del SVG, en unidades del viewBox
    const y = a * sinG + b * cosG;
    return { x: 0.5 + (x / 100) * o.ancho, y: 0.5 + (y / 100) * o.alto };
  }
  // Da vueltas solo, sin parar (una vuelta cada op.vueltaSatelite s), siempre sobre la línea y
  // centrado en el planeta. En la mitad de atrás de la órbita (la de arriba) pasa DETRÁS del planeta:
  // más chico (.8) y más tenue (.6). El haz apunta siempre al centro del planeta y pulsa (CSS).
  // Con menos movimiento: quieto arriba a la derecha.
  const T_QUIETO = -0.6; // arriba a la derecha, fuera del disco del planeta
  let tSatelite = T_QUIETO;
  let animSatelite = 0;
  let antesSat = performance.now();
  function colocarSatelite() {
    const p = puntoOrbita(tSatelite);
    const w = lienzo.clientWidth;
    const h = lienzo.clientHeight;
    satelite.style.left = `${(p.x * 100).toFixed(2)}%`;
    satelite.style.top = `${(p.y * 100).toFixed(2)}%`;
    // Delante (1) o detrás (0), con un paso suave cerca de los extremos (fuera del disco)
    const s = Math.sin(tSatelite);
    const f = Math.min(1, Math.max(0, (s + 0.25) / 0.5));
    const detras = s < 0;
    satelite.style.transform = `scale(${(0.8 + 0.2 * f).toFixed(3)})`;
    satelite.style.opacity = (0.6 + 0.4 * f).toFixed(3);
    satelite.classList.toggle('detras', detras);
    hazSvg.classList.toggle('detras', detras);
    // Haz: triángulo con la punta en la antena del satélite y la base, perpendicular, en el centro del planeta
    const sx = p.x * w;
    const sy = p.y * h + satelite.offsetHeight * 0.31;
    const mx = w / 2;
    const my = h / 2;
    const dx = mx - sx;
    const dy = my - sy;
    const largo = Math.hypot(dx, dy) || 1;
    const medioAncho = satelite.offsetWidth * 0.3;
    const nx = (-dy / largo) * medioAncho;
    const ny = (dx / largo) * medioAncho;
    haz.setAttribute('points',
      `${sx.toFixed(1)},${sy.toFixed(1)} ${(mx + nx).toFixed(1)},${(my + ny).toFixed(1)} ${(mx - nx).toFixed(1)},${(my - ny).toFixed(1)}`);
    degradado.setAttribute('x1', sx.toFixed(1));
    degradado.setAttribute('y1', sy.toFixed(1));
    degradado.setAttribute('x2', mx.toFixed(1));
    degradado.setAttribute('y2', my.toFixed(1));
  }
  function pasoSatelite(ahora) {
    const dt = Math.min((ahora - antesSat) / 1000, 0.1);
    antesSat = ahora;
    if (sinMovimiento.matches) tSatelite = T_QUIETO;
    else tSatelite = (tSatelite + (2 * Math.PI * dt) / op.vueltaSatelite) % (2 * Math.PI);
    colocarSatelite();
    animSatelite = requestAnimationFrame(pasoSatelite);
  }
  animSatelite = requestAnimationFrame(pasoSatelite);
  limpiezas.push(() => cancelAnimationFrame(animSatelite));

  // ---------------------------------------------------------------
  // Etiqueta de lo elegido: una línea, "Cordillera Real · 16,2° S · 68,2° O"
  // ---------------------------------------------------------------
  let objetivo = null;     // { tipo: 'glaciar' | 'pico', ref, texto, lat, lon, h }
  let posObjetivo = null;
  const enPantallaObj = new Cesium.Cartesian2();

  function ponerObjetivo(nuevo) {
    objetivo = nuevo;
    posObjetivo = nuevo ? Cesium.Cartesian3.fromDegrees(nuevo.lon, nuevo.lat, alturaNumero(nuevo.h)) : null;
    if (nuevo) {
      etiqueta.textContent = nuevo.texto;
      etiqueta.classList.remove('aparece');
      void etiqueta.offsetWidth; // reinicia la animación de entrada
      etiqueta.classList.add('aparece');
    }
    escena.requestRender();
  }
  const objetivoGlaciar = (g) => ({ tipo: 'glaciar', ref: g, texto: `${g.nombre} · ${coordenadas(g.lat, g.lon)}`, lat: g.lat, lon: g.lon, h: 0 });
  const objetivoPico = (p) => ({ tipo: 'pico', ref: p, texto: `${p.n} · ${conMiles(p.h)} m`, lat: p.lat, lon: p.lon, h: p.h });

  // Posición en pantalla de un punto si se ve: no está detrás del planeta y cae dentro de la caja,
  // con un margen de 4 px
  function aPantalla(pos, resultado) {
    ocultador.cameraPosition = viewer.camera.positionWC;
    if (!ocultador.isPointVisible(pos) || !Cesium.defined(escena.cartesianToCanvasCoordinates(pos, resultado))) return false;
    const w = lienzo.clientWidth;
    const h = lienzo.clientHeight;
    return resultado.x >= 4 && resultado.x <= w - 4 && resultado.y >= 4 && resultado.y <= h - 4;
  }

  const actualizarCapa = () => {
    actualizarPines();
    const veObjetivo = Boolean(posObjetivo) && aPantalla(posObjetivo, enPantallaObj);
    capa.classList.toggle('objetivo-oculto', !veObjetivo);
    if (!veObjetivo) return;
    const mx = enPantallaObj.x;
    const my = enPantallaObj.y;
    seleccion.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;
    // La etiqueta va a la derecha; si ahí no cabe en la caja del globo, al lado con más espacio
    const ancho = etiqueta.offsetWidth + lienzo.clientWidth * 0.06;
    const cabeDerecha = mx + ancho <= lienzo.clientWidth;
    seleccion.classList.toggle('izquierda', !cabeDerecha && (mx - ancho >= 0 || mx > lienzo.clientWidth / 2));
  };
  limpiezas.push(escena.postRender.addEventListener(actualizarCapa));

  // Al empezar: nuestro caso (glaciar principal) o el primer pico
  if (principal) ponerObjetivo(objetivoGlaciar(principal));
  else if (picos.length) ponerObjetivo(objetivoPico(picos[0]));

  // ---------------------------------------------------------------
  // Gestos: arrastrar pausa el giro (los pines se tocan como botones)
  // ---------------------------------------------------------------
  const alPresionar = () => {
    arrastrando = true;
    raiz.classList.add('arrastrando'); // el planeta deja de flotar mientras se arrastra
    clearTimeout(temporizadorGiro);
    temporizadorGiro = 0;
    actualizarModo();
  };
  const alSoltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    raiz.classList.remove('arrastrando');
    clearTimeout(temporizadorGiro);
    temporizadorGiro = setTimeout(() => { temporizadorGiro = 0; actualizarModo(); }, op.esperaTrasArrastre);
    actualizarModo();
  };
  // Rueda: en la vista normal, zoom hacia el centro (nuestro); en la lupa/de cerca, el de Cesium
  const alZoom = (e) => {
    encuadreAuto = false; // el usuario eligió su distancia
    if (!vistaNormal()) return;
    e.preventDefault();
    const d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    zoomCentro(Math.exp(Math.max(-300, Math.min(300, d)) * 0.0018), true);
  };
  // Pellizco (dos dedos): la distancia entre los dedos manda la altura, directo
  const dedos = new Map();
  let pellizco = null; // { dist, altura }
  const distDedos = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  const alTocar = (e) => {
    if (e.pointerType !== 'touch') return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pellizco = dedos.size === 2 && vistaNormal() ? { dist: distDedos(), altura: altura() } : null;
  };
  const alMoverDedo = (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pellizco || dedos.size !== 2) return;
    const d = distDedos();
    if (d > 0) { alturaMeta = null; zoomCentro((pellizco.altura / altura()) * (pellizco.dist / d), false); }
  };
  const alSoltarDedo = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pellizco = null; };
  const lienzoCanvas = escena.canvas;
  lienzoCanvas.addEventListener('wheel', alZoom, { passive: false });
  lienzoCanvas.addEventListener('pointerdown', alTocar);
  window.addEventListener('pointermove', alMoverDedo);
  window.addEventListener('pointerup', alSoltarDedo);
  window.addEventListener('pointercancel', alSoltarDedo);
  limpiezas.push(() => {
    lienzoCanvas.removeEventListener('pointerdown', alTocar);
    window.removeEventListener('pointermove', alMoverDedo);
    window.removeEventListener('pointerup', alSoltarDedo);
    window.removeEventListener('pointercancel', alSoltarDedo);
  });
  lienzoCanvas.addEventListener('pointerdown', alPresionar);
  window.addEventListener('pointerup', alSoltar);
  window.addEventListener('pointercancel', alSoltar);
  sinMovimiento.addEventListener('change', actualizarModo);

  limpiezas.push(() => {
    lienzoCanvas.removeEventListener('wheel', alZoom);
    lienzoCanvas.removeEventListener('pointerdown', alPresionar);
    window.removeEventListener('pointerup', alSoltar);
    window.removeEventListener('pointercancel', alSoltar);
    sinMovimiento.removeEventListener('change', actualizarModo);
    clearTimeout(temporizadorGiro);
    temporizadorGiro = 0;
  });

  actualizarModo();

  // ---------------------------------------------------------------
  // Rendimiento en celular: si al empezar va a menos de 30 FPS, se quita la capa de datos
  // (quedan los pines). Solo una vez: si después la persona elige una capa, se respeta.
  // ---------------------------------------------------------------
  let fpsMedidos = null;
  if (window.innerWidth < 900 && !sinMovimiento.matches) {
    let inicio = null;
    let cuadros = 0;
    const quitar = escena.postRender.addEventListener(() => {
      if (!capasDatos.length || !globo.tilesLoaded) return;         // medimos con la capa ya cargada
      if (inicio === null) { inicio = performance.now(); return; }
      cuadros++;
      const ms = performance.now() - inicio;
      if (ms < 4000) return;
      quitar();
      fpsMedidos = Math.round((cuadros * 1000) / ms);
      if (fpsMedidos < 30) {
        quitarCapaDatos();
        infoCapa = null;
        escribirCredito();
        console.info(`APU: ${fpsMedidos} FPS en celular; se quita la capa de datos y quedan los pines.`);
      }
    });
    limpiezas.push(quitar);
  }

  // ---------------------------------------------------------------
  // ¿Responde NASA? Si no, imagen de respaldo
  // ---------------------------------------------------------------
  nasaResponde().then((ok) => { if (!ok) mostrarImagen('NASA GIBS no responde'); });

  // ---------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------
  // extra: más opciones de flyTo (orientation, easingFunction)
  function volar(destino, duracion, alTerminar, extra = {}) {
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); // suelta la lupa (si la cámara estaba atada)
    volando = true;
    actualizarModo();
    let terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      volando = false;
      alTerminar?.();
      actualizarModo();
    };
    viewer.camera.flyTo({
      ...extra,
      destination: destino,
      duration: sinMovimiento.matches ? 0 : duracion,
      complete: fin,
      cancel: fin
    });
  }

  // Mirando recto hacia abajo (sin inclinar), con el norte arriba; vuelo con aceleración suave
  const VUELO_CERCA = {
    orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
  };

  // Lupa: al tocar un glaciar, la cámara se inclina (−45°) sobre él, dentro de la lente, con la vista realista
  // (aplicarVistaRealista: la misma imagen, relieve, luz, sombras, atmósfera y créditos que la montaña).
  // Sin nubes: la capa "Hoy" se oculta mientras dura; la foto MODIS del día está en el botón de capas.
  // La cámara queda atada al glaciar (lookAt): al arrastrar, gira alrededor de él.
  function acercar(lon, lat, id) {
    enfocado = true;
    encuadreAuto = false;
    acercado = { lat, lon, id };
    abrirLente();
    entrarLupa(acercado);
    topeAlejar();
    const target = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const hpr = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(LUPA.pitch), LUPA.rango);
    lupa.orbita = { target, hpr };
    volarOrbita(target, hpr, CERCA.duracion);
    escribirLente();
  }

  // Vuela a la órbita (target + heading/pitch/distancia) y al llegar ata la cámara al punto
  function volarOrbita(target, hpr, duracion) {
    volando = true;
    actualizarModo();
    let terminado = false;
    const fin = (atar) => {
      if (terminado) return;
      terminado = true;
      volando = false;
      if (atar && lupa?.orbita?.target === target) viewer.camera.lookAt(target, hpr);
      actualizarModo();
      escena.requestRender();
    };
    viewer.camera.cancelFlight();
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    if (sinMovimiento.matches) { fin(true); return; }
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
      offset: hpr, duration: duracion, easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      complete: () => fin(true), cancel: () => fin(false)
    });
  }

  function dejarCerca() {
    if (!acercado) return false;
    acercado = null;
    salirLupa();
    cerrarLente();
    topeAlejar();
    escena.light = solActivo ? sol : luz;
    return true;
  }

  function entrarLupa(lugar) {
    salirLupa();
    const yo = { lugar, orbita: null, vr: null, hoyOcultas: capasDatos.filter((c) => c.show) };
    lupa = yo;
    yo.hoyOcultas.forEach((c) => { c.show = false; }); // sin nubes
    cajaCreditos.hidden = false;
    yo.vr = aplicarVistaRealista(viewer, {
      regionId: lugar.id, lon: lugar.lon, creditos: cajaCreditos, indiceImagen: 1,
      alCambiar: () => { if (lupa === yo) { ordenarCapas(); escribirLente(); escribirCredito(); } }
    });
    escribirCredito();
  }
  function salirLupa() {
    const yo = lupa;
    if (!yo || !viewer) return;
    lupa = null;
    yo.vr?.restaurar();
    yo.hoyOcultas.forEach((c) => { if (capasDatos.includes(c)) c.show = true; });
    cajaCreditos.hidden = true;
    escribirCredito();
    escena.requestRender();
  }

  // El contorno del planeta se abre hasta la lente (0,8 s). Si ya estaba en la lente, se queda.
  function abrirLente() {
    escribirLente();
    if (raiz.classList.contains('lente')) return;
    const radio = Math.round(estado().diametroPx / 2) + 2;
    flotante.style.transition = 'none';
    flotante.style.clipPath = `circle(${radio}px at 50% 50%)`;
    void flotante.offsetWidth; // aplica el punto de partida antes de animar
    flotante.style.transition = sinMovimiento.matches ? 'none' : TRANSICION_LENTE;
    flotante.style.clipPath = CLIP_LENTE;
    raiz.classList.add('acercado', 'lente');
  }
  // Al volver: la lente se cierra al tamaño del planeta; al terminar el vuelo, sin recorte (quitarLente)
  function cerrarLente() {
    raiz.classList.remove('lente');
    flotante.style.clipPath = CLIP_PLANETA;
  }
  function quitarLente() {
    if (acercado) return; // se eligió otro glaciar mientras volvía
    flotante.style.transition = '';
    flotante.style.clipPath = '';
    raiz.classList.remove('acercado');
  }
  // Textos del anillo: arriba la foto (MODIS de 250 m o, de lejos, el Blue Marble), abajo las coordenadas
  function escribirLente() {
    if (!acercado) return;
    lente.querySelector('.lente-arriba').textContent = lupa
      ? (cerca ? `MODIS Terra · 250 m · ${fechaCorta(cerca.fecha)}` : (lupa.vr?.imagen?.corto ?? 'NASA Blue Marble'))
      : cerca || volando
        ? `MODIS Terra · 250 m · ${fechaCorta(fechaCerca())}`
        : 'NASA Blue Marble';
    lente.querySelector('.lente-abajo').textContent = coordenadas(acercado.lat, acercado.lon);
  }


  // Dejar un lugar al frente: el planeta gira (1,6 s) hasta tenerlo en el centro y crece hasta
  // llenar su caja (100 %, siempre entero). La rotación se pausa hasta "ver planeta".
  function mirarA(lon, lat) {
    enfocado = true;
    encuadreAuto = false;
    volar(Cesium.Cartesian3.fromDegrees(lon, lat, alturaEncuadre(op.tamanoMaximo)), op.duracionVuelo);
  }

  // Lleva la vista a un punto, con la altura dentro de los topes del zoom
  function irA(lat, lon, alturaM = alturaEncuadre()) {
    if (!viewer) return;
    encuadreAuto = false;
    if (acercado) acercado = { ...acercado, lat, lon }; // de cerca, el arrastre se limita alrededor del nuevo punto
    const h = Math.min(control.maximumZoomDistance, Math.max(control.minimumZoomDistance, alturaM));
    volar(Cesium.Cartesian3.fromDegrees(lon, lat, h), 2.5);
  }

  // Zoom máximo al glaciar (id de contenido/glaciares.js) y avisa con alElegir
  function elegirGlaciar(id) {
    const g = glaciares.find((x) => x.id === id);
    if (!g) return;
    if (viewer) {
      ponerObjetivo(objetivoGlaciar(g));
      acercar(g.lon, g.lat, g.id);
    }
    op.alElegir?.(g);
  }

  // Deja el pico i al frente; la etiqueta pasa a ese pico
  function elegirPico(i) {
    const p = picos[i];
    if (!viewer || !p) return;
    ponerObjetivo(objetivoPico(p));
    mirarA(p.lon, p.lat);
  }

  // Vuelve al planeta del tamaño del diseño y reanuda la rotación
  // (desde cerca: vuelve con el mismo vuelo suave de 2 s y reaparecen órbita, satélite y halo)
  function verPlaneta() {
    if (!viewer) return;
    const deCerca = dejarCerca();
    encuadreAuto = true;
    enfocado = false;
    const lon = objetivo?.lon ?? op.lon;
    // El contenedor vuelve a su tamaño mientras vuela: al llegar, se corrige la distancia
    const ajustar = () => setTimeout(() => {
      if (!viewer || !encuadreAuto || volando) return;
      const p = viewer.camera.positionCartographic;
      const h = alturaEncuadre();
      if (Math.abs(p.height - h) / h > 0.005) volar(Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, h), 0.5);
    });
    const alLlegar = () => { if (deCerca) quitarLente(); ajustar(); };
    volar(Cesium.Cartesian3.fromDegrees(lon, op.lat, alturaEncuadre()),
      deCerca ? CERCA.duracion : op.duracionVuelo, alLlegar, deCerca ? VUELO_CERCA : {});
  }

  function destruir() {
    if (destruido) return;
    destruido = true;
    apagarViewer();
    if (op.credito) op.credito.textContent = '';
    raiz.remove();
  }

  // Para pruebas: ¿terminaron de cargar las imágenes? ¿cuánto mide el planeta en pantalla?
  function estado() {
    if (!viewer) return { modo: 'imagen' };
    const { clientWidth: w, clientHeight: h } = escena.canvas;
    const d = Cesium.Cartesian3.magnitude(viewer.camera.positionWC);
    const mitadV = viewer.camera.frustum.fovy / 2;
    const diametro = (Math.tan(Math.asin(Math.min(1, RADIO_TIERRA / d))) / Math.tan(mitadV)) * h;
    const c = escena.cartesianToCanvasCoordinates(Cesium.Cartesian3.ZERO, new Cesium.Cartesian2());
    return {
      centroPx: c ? [Math.round(c.x), Math.round(c.y)] : null, // centro del planeta en el canvas
      modo: '3d', cargado: globo.tilesLoaded, canvas: [w, h],
      diametroPx: Math.round(diametro), fraccionAlto: +(diametro / h).toFixed(3),
      objetivo: objetivo?.n ?? null, objetivoVisible: !capa.classList.contains('objetivo-oculto'),
      pinesVisibles: pines.filter((p) => p.visible).map((p) => p.g.id),
      satelite: { t: +tSatelite.toFixed(2), detras: satelite.classList.contains('detras') },
      capa: infoCapa ? { ...infoCapa, capas: capasDatos.length, cargando: cargandoCapa } : null, fpsCelular: fpsMedidos,
      volando, girando: debeGirar(),
      acercado: Boolean(acercado), lente: raiz.classList.contains('lente'), alturaKm: Math.round(viewer.camera.positionCartographic.height / 1000),
      zoomKm: [control.minimumZoomDistance / 1000, control.maximumZoomDistance / 1000].map(Math.round),
      fotoCerca: cerca ? { fecha: cerca.fecha, alpha: +cerca.capa.alpha.toFixed(2) } : null,
      lupa: lupa ? { imagen: lupa.vr?.imagen?.id ?? null, relieve: lupa.vr?.relieve ?? null, atada: !Cesium.Matrix4.equals(viewer.camera.transform, Cesium.Matrix4.IDENTITY), pitch: Math.round(Cesium.Math.toDegrees(viewer.camera.pitch)) } : null,
      credito: credito.textContent
    };
  }

  // Botón de capas → "Imagen MODIS del día": la foto de 250 m del día despejado del glaciar, en la lupa
  function ponerFotoDelDia(si) {
    fotoDelDia = Boolean(si);
    escena.requestRender();
  }

  const api = {
    irA, elegirGlaciar, elegirPico, verPlaneta, mostrarCapa, destruir, estado, forzarResize, ponerFotoDelDia,
    // El Cesium.Viewer del globo, para reutilizarlo (no crear otro visor). null si pasó a imagen.
    get viewer() { return viewer; },
    // Capa HTML encima del canvas (flota con el planeta): ahí van pines extra (componentes/en-vivo.js)
    get capa() { return viewer ? capa : null; }
  };
  if (import.meta.env.DEV) window.__globo = api;
  return api;
}
