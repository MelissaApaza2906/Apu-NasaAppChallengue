// Globo 3D de APU (CesiumJS) con imágenes reales de NASA GIBS.
//
//   const globo = crearGlobo(contenedor, {
//     glaciares: GLACIARES,              // los 11 halos que brillan (contenido/glaciares.js)
//     picos: [{ n, h, lat, lon }, …],    // picos de la Cordillera Real
//     alElegir: (glaciar) => { … }       // aviso cuando se elige un glaciar (toque o elegirGlaciar)
//   });
//   globo.elegirGlaciar('kilimanjaro');  // gira (1,6 s) hasta dejarlo al frente, el planeta llena su caja; pausa la rotación
//   globo.elegirPico(0);                 // lo mismo con un pico de la Cordillera Real
//   globo.verPlaneta();                  // vuelve al tamaño del diseño y sigue girando
//   await globo.mostrarCapa('hoy');      // 'hoy' (foto de ayer con nubes reales y el sol real) o null
//   globo.notaGlaciar('cordillera-real', 'La nieve bajó 23 % · Tendencia real'); // texto del chip
//   globo.destruir();                    // al salir de la pantalla
//   globo.viewer                         // el Cesium.Viewer (reutilízalo; null si se ve la imagen)
//
// El planeta es para explorar: siempre se ve entero (el zoom no lo deja pasar del 100 % de su caja).
// Capas de NASA: Blue Marble (base) + luces de las ciudades (VIIRS) en la parte de noche, con un
// terminador en diagonal y la atmósfera azul en el borde. Sin nubes (ver CAPAS_DATOS).
// Glaciares: estrellas (billboards de Cesium) que pulsan; se ocultan detrás del planeta.
// Encima del canvas (HTML/SVG): marcador rojo de 8 px con anillos finos (nuestro caso), chip de lo elegido,
// satélite que se mueve por la órbita punteada del menú y haz de luz del satélite a lo elegido.
//
// El globo llena su contenedor con fondo TRANSPARENTE (se ve el cielo de la pantalla).
// Si no hay WebGL o NASA no responde, muestra /img/planeta.webp en su lugar.
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './globo3d.css';
import { CESIUM_TOKEN, EXAGERACION } from '../servicios/config.js';
import { CAPAS, proveedor, nasaResponde, hayImagen, haceDias, fechaBonita } from '../servicios/nasa-gibs.js';

// Capas que se pueden poner encima del Blue Marble con mostrarCapa(nombre, fecha).
// El planeta es para explorar: los datos por año (nieve, lluvia) van en la vista de la montaña.
// (Nubes encima del planeta: GIBS no tiene una capa de nubes blancas sobre transparente
// —las de nubes son mapas de colores—, así que el planeta va sin nubes.)
const CAPAS_DATOS = {
  // La Tierra de hoy: foto en color real de ayer (con sus nubes), opaca, con el sol en su posición real
  hoy: { capa: CAPAS.fotoDia, titulo: 'Hoy: MODIS Terra (nubes reales)', fechaDefecto: async () => haceDias(1), alpha: 1, sol: true }
};
const CREDITO_BASE = 'Imágenes: NASA GIBS / Blue Marble';

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
  credito: null,            // elemento donde escribir el crédito de NASA (si no, va debajo del globo)
  capa: null,               // capa al empezar: 'hoy' o null (imagen normal)
  marcador: { lat: -16.2, lon: -68.2 }, // nuestro caso si no hay glaciar principal
  duracionVuelo: 1.6,       // segundos: girar hasta dejar lo elegido al frente (y "ver planeta")
  // Órbita punteada del menú (SVG viewBox 100, elipse rx 48 ry 44 girada −24°), medida
  // en "cajas del globo": su caja es 108cqh × 80cqh y la del globo 80cqh × 80cqh, mismo centro.
  orbita: { rx: 48, ry: 44, giro: -24, ancho: 108 / 80, alto: 1 }
};

const RADIO_TOQUE = 22; // px: área de toque mínima de 44 px (celular)

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

// Glaciar como estrella: punto blanco de 6 px con un destello en cruz (32 × 32 px)
function imagenEstrella() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  // Destello en cruz: dos líneas finas que se desvanecen hacia las puntas
  for (const [x1, y1, x2, y2] of [[0, 16, 32, 16], [16, 0, 16, 32]]) {
    const d = g.createLinearGradient(x1, y1, x2, y2);
    d.addColorStop(0, 'rgba(200,235,255,0)');
    d.addColorStop(0.5, 'rgba(235,248,255,.95)');
    d.addColorStop(1, 'rgba(200,235,255,0)');
    g.strokeStyle = d;
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  // Brillo suave alrededor del punto
  const b = g.createRadialGradient(16, 16, 0, 16, 16, 8);
  b.addColorStop(0, 'rgba(180,225,255,.55)');
  b.addColorStop(1, 'rgba(180,225,255,0)');
  g.fillStyle = b;
  g.fillRect(8, 8, 16, 16);
  // Punto de 6 px
  g.fillStyle = '#FFFFFF';
  g.beginPath(); g.arc(16, 16, 3, 0, Math.PI * 2); g.fill();
  return c;
}

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
    irA() {}, elegirPico() {}, verPlaneta() {}, estado: () => ({ modo: 'imagen' }),
    mostrarCapa: async () => ({ ok: false, motivo: 'sin-globo' }),
    notaGlaciar() {},
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

  // Capa de la maqueta: haz, satélite, marcador rojo y selección con etiqueta
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
    <div class="globo3d-marcador oculto" aria-hidden="true">
      <span class="pulso"></span>
      <span class="pulso"></span>
      <span class="punto"></span>
    </div>
    <div class="globo3d-seleccion">
      <span class="nodo" aria-hidden="true"></span>
      <span class="linea" aria-hidden="true"></span>
      <div class="globo3d-etiqueta" role="status"><strong></strong><span></span></div>
    </div>`;
  const marcador = capa.querySelector('.globo3d-marcador');
  const seleccion = capa.querySelector('.globo3d-seleccion');
  const nodo = capa.querySelector('.nodo');
  const etiqueta = capa.querySelector('.globo3d-etiqueta');
  const satelite = capa.querySelector('.globo3d-satelite');
  const haz = capa.querySelector('.globo3d-haz polygon');
  const degradado = capa.querySelector('linearGradient');

  flotante.append(lienzo, anillo, crearHalo(), capa);
  const creditosOcultos = document.createElement('div'); // Cesium escribe aquí; no se muestra
  // Crédito propio de NASA: en el elemento que nos den (el menú lo ubica) o debajo del globo
  const credito = op.credito ?? document.createElement('p');
  if (!op.credito) credito.className = 'globo3d-credito';
  credito.textContent = CREDITO_BASE;
  raiz.append(flotante);
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

  try {
    viewer = new Cesium.Viewer(lienzo, {
      baseLayer: capaBase,
      terrain: CESIUM_TOKEN ? Cesium.Terrain.fromWorldTerrain() : undefined,
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
    if (si) viewer.clock.currentTime = Cesium.JulianDate.now();
    escena.light = si ? sol : luz;
    escena.requestRender();
  }
  const orientarLuz = () => {
    if (escena.light !== luz) return;
    const c = viewer.camera;
    const d = luz.direction;
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
  // Capa de datos de NASA encima del Blue Marble (nieve MODIS o lluvia GPM IMERG)
  // ---------------------------------------------------------------
  let capaDatos = null;   // ImageryLayer de Cesium
  let infoCapa = null;    // { nombre, fecha, sinImagen }
  let pedidoCapa = 0;     // si llega otro pedido mientras esperamos a NASA, el anterior se descarta

  function escribirCredito() {
    const d = infoCapa && CAPAS_DATOS[infoCapa.nombre];
    credito.textContent = d
      ? `${CREDITO_BASE}\n${d.titulo} · ${fechaBonita(infoCapa.fecha)}${infoCapa.sinImagen ? ' · sin imagen de NASA para esta fecha' : ''}${infoCapa.nota ? ` · ${infoCapa.nota}` : ''}`
      : CREDITO_BASE;
  }

  function quitarCapaDatos() {
    if (capaDatos && viewer) viewer.imageryLayers.remove(capaDatos, true);
    capaDatos = null;
  }

  // Capa de NASA debajo de las luces de las ciudades
  function ponerCapa(nombre, f) {
    const c = viewer.imageryLayers.addImageryProvider(proveedor(CAPAS_DATOS[nombre].capa, f));
    c.alpha = CAPAS_DATOS[nombre].alpha ?? 0.85;
    // Los huecos entre las pasadas del satélite vienen en negro: transparentes (se ve el Blue Marble)
    c.colorToAlpha = Cesium.Color.BLACK;
    c.colorToAlphaThreshold = 0.06;
    viewer.imageryLayers.raiseToTop(luces);
    return c;
  }

  // Nada pixelado: nivel de teselas que pide el planeta a su tamaño en pantalla (su ecuador mide
  // π × diámetro px; cada nivel duplica las teselas de 256 px). Una capa con menos detalle no se muestra.
  const nivelNecesario = () => Math.max(0, Math.ceil(Math.log2((Math.PI * estado().diametroPx) / 256)));

  // nombre: 'hoy' | null. fecha: 'AAAA-MM-DD' (por defecto, ayer).
  // Devuelve { ok, nombre, fecha, sinImagen } o { ok: false, motivo: 'sin-respuesta' | 'sin-detalle' }.
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
    if (d.capa.nivelMax < nivelNecesario()) return { ok: false, motivo: 'sin-detalle' };
    const f = fecha ?? await d.fechaDefecto();
    if (yo !== pedidoCapa || !viewer) return { ok: false, motivo: 'reemplazado' };
    if (!f) return { ok: false, motivo: 'sin-respuesta' };
    const hay = await hayImagen(d.capa, f);
    if (yo !== pedidoCapa || !viewer) return { ok: false, motivo: 'reemplazado' };
    if (hay === 'error') return { ok: false, motivo: 'sin-respuesta' };

    quitarCapaDatos();
    infoCapa = { nombre, fecha: f, sinImagen: hay === 'no' };
    if (hay === 'si') capaDatos = ponerCapa(nombre, f);
    usarSol(Boolean(d.sol));
    escribirCredito();
    escena.requestRender();
    return { ok: true, nombre, fecha: f, sinImagen: hay === 'no' };
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
  const topeAlejar = () => {
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
  // (salvo que el usuario ya haya elegido su distancia con zoom o eligiendo un lugar)
  const observador = new ResizeObserver(() => {
    if (!viewer) return;
    viewer.resize(); // que Cesium actualice el frustum antes de calcular
    topeAlejar();
    if (!encuadreAuto) return;
    const p = viewer.camera.positionCartographic;
    encuadrar(p.longitude, p.latitude);
    escena.requestRender();
  });
  observador.observe(lienzo);
  limpiezas.push(() => observador.disconnect());

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
  const hayPulsos = () => glaciares.length > 0 && !sinMovimiento.matches;

  // Dibujo continuo mientras gira, vuela o pulsan los halos; si no, solo cuando algo cambia
  const actualizarModo = () => {
    const continuo = debeGirar() || volando || hayPulsos();
    escena.requestRenderMode = !continuo;
    if (!continuo) escena.requestRender();
    ultimo = performance.now();
  };

  // ---------------------------------------------------------------
  // Glaciares como estrellas (billboards: punto blanco de 6 px con destello en cruz y pulso suave).
  // La Cordillera Real no lleva estrella: es el marcador rojo de 8 px con anillos finos (HTML);
  // su billboard es invisible y solo sirve para tocarla.
  // ---------------------------------------------------------------
  const ocultador = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, Cesium.Cartesian3.ZERO);
  const halos = new Cesium.BillboardCollection({ scene: escena });
  escena.primitives.add(halos);
  const imgEstrella = imagenEstrella();
  const listaHalos = glaciares.map((g, i) => {
    const pos = Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 0);
    const b = halos.add({
      position: pos,
      image: imgEstrella,
      scale: 1,
      color: g.principal ? Cesium.Color.TRANSPARENT : Cesium.Color.WHITE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // la oclusión la hacemos nosotros
      id: g
    });
    return { g, b, pos, base: 1, fase: i * 0.9, invisible: Boolean(g.principal) };
  });

  const actualizarHalos = (ahora) => {
    ocultador.cameraPosition = viewer.camera.positionWC;
    const quieto = sinMovimiento.matches;
    for (const h of listaHalos) {
      h.b.show = ocultador.isPointVisible(h.pos);
      if (!h.b.show || h.invisible) continue;
      const s = quieto ? 0 : Math.sin((ahora / 3200) * 2 * Math.PI + h.fase);
      h.b.scale = h.base * (1 + 0.12 * s);
      h.b.color = Cesium.Color.WHITE.withAlpha(quieto ? 1 : 0.78 + 0.22 * s);
    }
  };

  // Glaciar bajo un punto de la pantalla (radio mínimo de 22 px = toque de 44 px)
  const auxToque = new Cesium.Cartesian2();
  function glaciarEn(pos) {
    let mejor = null;
    let dMin = Infinity;
    for (const h of listaHalos) {
      if (!h.b.show) continue;
      const p = escena.cartesianToCanvasCoordinates(h.pos, auxToque);
      if (!p) continue;
      const d = Math.hypot(p.x - pos.x, p.y - pos.y);
      const radio = RADIO_TOQUE;
      if (d <= radio && d < dMin) { dMin = d; mejor = h.g; }
    }
    return mejor;
  }

  limpiezas.push(escena.preRender.addEventListener(() => {
    const ahora = performance.now();
    const dt = Math.min((ahora - ultimo) / 1000, 0.1); // evita saltos al volver a la pestaña
    ultimo = ahora;
    if (debeGirar()) {
      // Ángulo positivo: la cámara va al oeste y la Tierra se ve girar hacia el este
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, op.velocidad * dt);
    }
    orientarLuz();
    actualizarHalos(ahora);
  }));

  // Anillo de luz: mismo diámetro que el planeta, centrado (la cámara mira al centro de la Tierra).
  // El planeta siempre cabe entero en su caja (el zoom no lo deja pasar del 100 %): sin recorte.
  let diametroAnillo = 0;
  const actualizarAnillo = () => {
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
  // Ángulo de la órbita que queda arriba a la derecha de un punto (fracciones de la caja).
  // Solo el tramo que cae sobre la caja del globo: los extremos de la órbita la pasan y ahí el
  // satélite quedaría debajo de los paneles del menú.
  function anguloArribaDerecha(px, py) {
    const deseo = { x: px + 0.35, y: py - 0.35 };
    let mejor = 0;
    let dMin = Infinity;
    for (let k = 0; k < 360; k++) {
      const t = (k / 360) * 2 * Math.PI;
      const p = puntoOrbita(t);
      if (p.x < 0.08 || p.x > 0.92) continue;
      const d = (p.x - deseo.x) ** 2 + (p.y - deseo.y) ** 2;
      if (d < dMin) { dMin = d; mejor = t; }
    }
    return mejor;
  }
  let tSatelite = null;
  let animSatelite = 0;
  const colocarSatelite = () => {
    const p = puntoOrbita(tSatelite);
    satelite.style.left = `${(p.x * 100).toFixed(2)}%`;
    satelite.style.top = `${(p.y * 100).toFixed(2)}%`;
  };
  function moverSatelite(tDestino) {
    cancelAnimationFrame(animSatelite);
    if (tSatelite === null || sinMovimiento.matches) {
      tSatelite = tDestino;
      colocarSatelite();
      escena.requestRender();
      return;
    }
    const desde = tSatelite;
    let delta = (tDestino - desde) % (2 * Math.PI);
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    const inicio = performance.now();
    const duracion = op.duracionVuelo * 1000;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - inicio) / duracion);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; // ease-in-out
      tSatelite = desde + delta * e;
      colocarSatelite();
      if (k < 1) animSatelite = requestAnimationFrame(paso);
      else escena.requestRender();
    };
    animSatelite = requestAnimationFrame(paso);
  }
  limpiezas.push(() => cancelAnimationFrame(animSatelite));

  // ---------------------------------------------------------------
  // Marcador rojo (nuestro caso) y selección (etiqueta + haz)
  // ---------------------------------------------------------------
  const lugarPrincipal = principal ?? op.marcador;
  const posPrincipal = Cesium.Cartesian3.fromDegrees(lugarPrincipal.lon, lugarPrincipal.lat, 0);
  let posMarcador = posPrincipal;
  let objetivo = null;     // { tipo: 'glaciar' | 'pico', ref, n, sub, lat, lon, h }
  let posObjetivo = null;
  const enPantalla = new Cesium.Cartesian2();
  const enPantallaObj = new Cesium.Cartesian2();

  function ponerObjetivo(nuevo) {
    objetivo = nuevo;
    posObjetivo = nuevo ? Cesium.Cartesian3.fromDegrees(nuevo.lon, nuevo.lat, alturaNumero(nuevo.h)) : null;
    // El marcador rojo va en el pico elegido; si no, en la Cordillera Real
    posMarcador = nuevo?.tipo === 'pico' ? posObjetivo : posPrincipal;
    // Punto celeste propio solo si lo elegido no es nuestro caso
    nodo.hidden = !nuevo || nuevo.tipo === 'pico' || Boolean(nuevo.ref?.principal);
    if (nuevo) {
      etiqueta.querySelector('strong').textContent = nuevo.n;
      etiqueta.querySelector('span').textContent = nuevo.sub;
      etiqueta.classList.remove('aparece');
      void etiqueta.offsetWidth; // reinicia la animación de entrada
      etiqueta.classList.add('aparece');
    }
    escena.requestRender();
  }
  const notas = new Map(); // id del glaciar → texto del chip (notaGlaciar)
  const objetivoGlaciar = (g) => ({ tipo: 'glaciar', ref: g, n: g.nombre, sub: notas.get(g.id) ?? g.pais, lat: g.lat, lon: g.lon, h: 0 });
  const objetivoPico = (p) => ({ tipo: 'pico', ref: p, n: p.n, sub: `${conMiles(p.h)} m s. n. m.`, lat: p.lat, lon: p.lon, h: p.h });

  // Posición en pantalla de un punto si se ve: no está detrás del planeta y cae dentro de la caja,
  // con un margen de 4 px
  function aPantalla(pos, resultado) {
    ocultador.cameraPosition = viewer.camera.positionWC;
    if (!ocultador.isPointVisible(pos) || !Cesium.defined(escena.cartesianToCanvasCoordinates(pos, resultado))) return false;
    const w = lienzo.clientWidth;
    const h = lienzo.clientHeight;
    return resultado.x >= 4 && resultado.x <= w - 4 && resultado.y >= 4 && resultado.y <= h - 4;
  }

  let sateliteColocado = false;
  const actualizarCapa = () => {
    // Marcador rojo
    const veMarcador = aPantalla(posMarcador, enPantalla);
    marcador.classList.toggle('oculto', !veMarcador);
    if (veMarcador) marcador.style.transform = `translate(${enPantalla.x.toFixed(1)}px, ${enPantalla.y.toFixed(1)}px)`;

    // Selección + haz
    const veObjetivo = Boolean(posObjetivo) && aPantalla(posObjetivo, enPantallaObj);
    capa.classList.toggle('objetivo-oculto', !veObjetivo);
    if (!veObjetivo) return;
    const mx = enPantallaObj.x;
    const my = enPantallaObj.y;
    seleccion.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;
    // La etiqueta no se sale de la caja del globo por la derecha: si no cabe, va a la izquierda
    seleccion.classList.toggle('izquierda', mx + etiqueta.offsetWidth + lienzo.clientWidth * 0.06 > lienzo.clientWidth);

    // Primera vez que se ve: el satélite se coloca arriba a la derecha de lo elegido
    if (!sateliteColocado) {
      sateliteColocado = true;
      moverSatelite(anguloArribaDerecha(mx / lienzo.clientWidth, my / lienzo.clientHeight));
    }

    // Haz: triángulo con la punta en el satélite (su antena) y la base, perpendicular, en lo elegido
    const sx = satelite.offsetLeft + satelite.offsetWidth / 2;
    const sy = satelite.offsetTop + satelite.offsetHeight * (26 / 32);
    const dx = mx - sx;
    const dy = my - sy;
    const largo = Math.hypot(dx, dy) || 1;
    const medioAncho = satelite.offsetWidth * 0.28;
    const nx = (-dy / largo) * medioAncho;
    const ny = (dx / largo) * medioAncho;
    haz.setAttribute('points',
      `${sx.toFixed(1)},${sy.toFixed(1)} ${(mx + nx).toFixed(1)},${(my + ny).toFixed(1)} ${(mx - nx).toFixed(1)},${(my - ny).toFixed(1)}`);
    degradado.setAttribute('x1', sx.toFixed(1));
    degradado.setAttribute('y1', sy.toFixed(1));
    degradado.setAttribute('x2', mx.toFixed(1));
    degradado.setAttribute('y2', my.toFixed(1));
  };
  limpiezas.push(escena.postRender.addEventListener(actualizarCapa));

  // Al empezar: nuestro caso (glaciar principal) o el primer pico
  if (principal) ponerObjetivo(objetivoGlaciar(principal));
  else if (picos.length) ponerObjetivo(objetivoPico(picos[0]));

  // ---------------------------------------------------------------
  // Toques: arrastrar pausa el giro; tocar un halo elige ese glaciar
  // ---------------------------------------------------------------
  // Cuando el planeta queda quieto tras un gesto, el satélite vuelve arriba a la derecha de lo elegido
  let temporizadorSatelite = 0;
  const reubicarSatelite = () => {
    clearTimeout(temporizadorSatelite);
    temporizadorSatelite = setTimeout(() => {
      if (!viewer || arrastrando || volando || !posObjetivo || !aPantalla(posObjetivo, enPantallaObj)) return;
      moverSatelite(anguloArribaDerecha(enPantallaObj.x / lienzo.clientWidth, enPantallaObj.y / lienzo.clientHeight));
    }, 700); // tras la inercia del arrastre
  };
  const alPresionar = () => {
    arrastrando = true;
    raiz.classList.add('arrastrando'); // el planeta deja de flotar mientras se arrastra
    clearTimeout(temporizadorGiro);
    clearTimeout(temporizadorSatelite);
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
    reubicarSatelite();
  };
  const alZoom = () => { encuadreAuto = false; reubicarSatelite(); }; // el usuario eligió su distancia
  const lienzoCanvas = escena.canvas;
  lienzoCanvas.addEventListener('wheel', alZoom, { passive: true });
  lienzoCanvas.addEventListener('pointerdown', alPresionar);
  window.addEventListener('pointerup', alSoltar);
  window.addEventListener('pointercancel', alSoltar);
  sinMovimiento.addEventListener('change', actualizarModo);

  const manejador = new Cesium.ScreenSpaceEventHandler(lienzoCanvas);
  manejador.setInputAction((clic) => {
    const g = glaciarEn(clic.position);
    if (g) elegirGlaciar(g.id);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  manejador.setInputAction((mov) => {
    lienzoCanvas.style.cursor = glaciarEn(mov.endPosition) ? 'pointer' : '';
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  limpiezas.push(() => {
    manejador.destroy();
    lienzoCanvas.removeEventListener('wheel', alZoom);
    lienzoCanvas.removeEventListener('pointerdown', alPresionar);
    window.removeEventListener('pointerup', alSoltar);
    window.removeEventListener('pointercancel', alSoltar);
    sinMovimiento.removeEventListener('change', actualizarModo);
    clearTimeout(temporizadorGiro);
    clearTimeout(temporizadorSatelite);
    temporizadorGiro = 0;
  });

  actualizarModo();

  // ---------------------------------------------------------------
  // Rendimiento en celular: si al empezar va a menos de 30 FPS, se quita la capa de datos
  // (quedan los halos). Solo una vez: si después la persona elige una capa, se respeta.
  // ---------------------------------------------------------------
  let fpsMedidos = null;
  if (window.innerWidth < 900 && !sinMovimiento.matches) {
    let inicio = null;
    let cuadros = 0;
    const quitar = escena.postRender.addEventListener(() => {
      if (!capaDatos || !globo.tilesLoaded) return;         // medimos con la capa ya cargada
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
        console.info(`APU: ${fpsMedidos} FPS en celular; se quita la capa de datos y quedan los halos.`);
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
  function volar(destino, duracion, alTerminar) {
    volando = true;
    actualizarModo();
    const fin = () => { volando = false; alTerminar?.(); actualizarModo(); };
    viewer.camera.flyTo({
      destination: destino,
      duration: sinMovimiento.matches ? 0 : duracion,
      complete: fin,
      cancel: fin
    });
  }

  // Dejar un lugar al frente: el planeta gira (1,6 s) hasta tenerlo en el centro y crece hasta
  // llenar su caja (100 %, siempre entero). La rotación se pausa hasta "ver planeta".
  // El satélite va arriba a la derecha del centro (donde quedará el lugar).
  function mirarA(lon, lat) {
    enfocado = true;
    encuadreAuto = false;
    moverSatelite(anguloArribaDerecha(0.5, 0.5));
    volar(Cesium.Cartesian3.fromDegrees(lon, lat, alturaEncuadre(op.tamanoMaximo)), op.duracionVuelo);
  }

  // Lleva la vista a un punto, con la altura dentro de los topes del zoom
  function irA(lat, lon, alturaM = alturaEncuadre()) {
    if (!viewer) return;
    encuadreAuto = false;
    const h = Math.min(control.maximumZoomDistance, Math.max(control.minimumZoomDistance, alturaM));
    volar(Cesium.Cartesian3.fromDegrees(lon, lat, h), 2.5);
  }

  // Deja el glaciar al frente (id de contenido/glaciares.js) y avisa con alElegir
  function elegirGlaciar(id) {
    const g = glaciares.find((x) => x.id === id);
    if (!g) return;
    if (viewer) {
      ponerObjetivo(objetivoGlaciar(g));
      mirarA(g.lon, g.lat);
    }
    op.alElegir?.(g);
  }

  // Deja el pico i al frente; el marcador rojo y la etiqueta pasan a ese pico
  function elegirPico(i) {
    const p = picos[i];
    if (!viewer || !p) return;
    ponerObjetivo(objetivoPico(p));
    mirarA(p.lon, p.lat);
  }

  // Vuelve al planeta del tamaño del diseño y reanuda la rotación
  function verPlaneta() {
    if (!viewer) return;
    encuadreAuto = true;
    enfocado = false;
    const lon = objetivo?.lon ?? op.lon;
    volar(Cesium.Cartesian3.fromDegrees(lon, op.lat, alturaEncuadre()), op.duracionVuelo, () => {
      // el satélite vuelve a quedar arriba a la derecha de lo elegido
      if (posObjetivo && aPantalla(posObjetivo, enPantallaObj)) {
        moverSatelite(anguloArribaDerecha(enPantallaObj.x / lienzo.clientWidth, enPantallaObj.y / lienzo.clientHeight));
      }
    });
  }

  // Texto del chip de un glaciar (debajo del nombre), por ejemplo
  // "La nieve bajó 23 % · Tendencia real" para la Cordillera Real (el menú lo calcula del dato real)
  function notaGlaciar(id, texto) {
    if (texto) notas.set(id, texto);
    else notas.delete(id);
    if (objetivo?.tipo === 'glaciar' && objetivo.ref.id === id) ponerObjetivo(objetivoGlaciar(objetivo.ref));
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
      marcadorVisible: !marcador.classList.contains('oculto'),
      halosVisibles: listaHalos.filter((x) => x.b.show).map((x) => x.g.id),
      capa: infoCapa ? { ...infoCapa, visible: Boolean(capaDatos) } : null, fpsCelular: fpsMedidos,
      volando, girando: debeGirar()
    };
  }

  return {
    irA, elegirGlaciar, elegirPico, verPlaneta, mostrarCapa, destruir, estado, notaGlaciar,
    // El Cesium.Viewer del globo, para reutilizarlo (no crear otro visor). null si pasó a imagen.
    get viewer() { return viewer; }
  };
}
