// Globo 3D de APU (CesiumJS) con imágenes reales de NASA GIBS.
//
//   const globo = crearGlobo(contenedor, { lat: -15, lon: -65, altura: 20_000_000 });
//   globo.irA(-16.5, -68.15, 300_000);   // vuela a un punto (grados, metros)
//   globo.destruir();                    // al salir de la pantalla
//
// El globo llena su contenedor sobre un fondo opaco igual a var(--noche)
// (un canvas transparente deja una línea oscura en el borde del planeta).
// Si no hay WebGL o NASA no responde, muestra /img/planeta.webp en su lugar.
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './globo3d.css';
import { CESIUM_TOKEN, EXAGERACION } from '../servicios/config.js';
import { CAPAS, proveedor, nasaResponde } from '../servicios/nasa-gibs.js';

const POR_DEFECTO = {
  lat: -15,                 // centrado en Sudamérica
  lon: -65,
  altura: null,             // metros; null = se calcula para que el planeta mida `tamano`
  tamano: 0.70,             // alto del planeta / alto del contenedor (≈ 70cqh)
  rotar: true,
  velocidad: 0.04,          // radianes por segundo (≈ una vuelta cada 2,6 min)
  alturaMinimaGiro: 5_000_000, // cerca del suelo no gira (después de irA)
  esperaTrasArrastre: 4000  // ms hasta que vuelve a girar
};

const RADIO_TIERRA = 6_378_137;

// Luz "pegada" a la cámara: viene de arriba a la izquierda y por delante,
// así lo que se mira queda iluminado y el borde derecho en penumbra.
const LUZ = { derecha: 0.62, abajo: 0.22, adelante: 0.75 };

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function crearGlobo(contenedor, opciones = {}) {
  const op = { ...POR_DEFECTO, ...opciones };

  const raiz = document.createElement('div');
  raiz.className = 'globo3d';
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

  if (!hayWebGL()) {
    mostrarImagen('este navegador no tiene WebGL');
    return { irA() {}, destruir: () => { destruido = true; raiz.remove(); } };
  }

  // ---------------------------------------------------------------
  // El globo
  // ---------------------------------------------------------------
  if (CESIUM_TOKEN) Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

  // El halo va ENCIMA del canvas (mix-blend-mode: screen); ambos flotan juntos y el crédito queda quieto
  const flotante = document.createElement('div');
  flotante.className = 'globo3d-flotante';
  const lienzo = document.createElement('div');
  lienzo.className = 'globo3d-lienzo';
  flotante.append(lienzo, crearHalo());
  const creditosOcultos = document.createElement('div'); // Cesium escribe aquí; no se muestra
  const credito = document.createElement('p');
  credito.className = 'globo3d-credito';
  credito.textContent = 'Imágenes: NASA GIBS / Blue Marble';
  raiz.append(flotante, credito);

  // Imagen base algo más viva, como en el diseño
  const capaBase = new Cesium.ImageryLayer(proveedor(CAPAS.marmolAzul), {
    brightness: 1.1,
    contrast: 1.15,
    saturation: 1.2
  });

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
      contextOptions: { webgl: { alpha: false } },
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      showRenderLoopErrors: false
    });
  } catch (e) {
    console.error(e);
    mostrarImagen('Cesium no pudo iniciar WebGL');
    return { irA() {}, destruir: () => { destruido = true; raiz.remove(); } };
  }

  const escena = viewer.scene;
  const globo = escena.globe;
  const colorNoche = getComputedStyle(raiz).getPropertyValue('--noche').trim() || '#0B192E';
  escena.backgroundColor = Cesium.Color.fromCssColorString(colorNoche);
  if (escena.sun) escena.sun.show = false;
  if (escena.moon) escena.moon.show = false;
  escena.skyAtmosphere.show = true;
  globo.showGroundAtmosphere = true;
  globo.baseColor = Cesium.Color.fromCssColorString('#0C294D'); // mientras llegan las imágenes
  escena.verticalExaggeration = CESIUM_TOKEN ? EXAGERACION : 1;

  // Día y noche con un sol fijo respecto a la vista
  globo.enableLighting = true;
  const luz = new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(1, 0, 0), intensity: 2.2 });
  escena.light = luz;
  const auxLuz = new Cesium.Cartesian3();
  const orientarLuz = () => {
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

  // Distancia de cámara para que el planeta mida op.tamano del alto del contenedor.
  // Cesium usa el campo de visión (fov) sobre el lado mayor del canvas.
  function alturaEncuadre() {
    const { clientWidth: w, clientHeight: h } = escena.canvas;
    if (!w || !h) return 20_000_000;
    const mitad = viewer.camera.frustum.fov / 2;
    const tanMitadVertical = w >= h ? Math.tan(mitad) * (h / w) : Math.tan(mitad);
    const angulo = Math.atan(op.tamano * tanMitadVertical); // radio angular del planeta
    return RADIO_TIERRA / Math.sin(angulo) - RADIO_TIERRA;
  }

  let encuadreAuto = op.altura == null;
  const encuadrar = (lon, lat) => {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromRadians(lon, lat, encuadreAuto ? alturaEncuadre() : op.altura)
    });
  };
  encuadrar(Cesium.Math.toRadians(op.lon), Cesium.Math.toRadians(op.lat));

  // Si algo falla al dibujar, pasamos a la imagen
  limpiezas.push(escena.renderError.addEventListener((_, err) => {
    console.error(err);
    setTimeout(() => mostrarImagen('error de render')); // fuera del ciclo de dibujo de Cesium
  }));

  // ---------------------------------------------------------------
  // Resolución: la que recomienda el navegador (bordes nítidos sin dibujar de más)
  // ---------------------------------------------------------------
  // Medido en 844×390 girando: ~57 FPS (Iris Xe), así que no hace falta bajar la escala en celular.
  // Si un celular real va a menos de 30 FPS, usar resolutionScale 0.85 cuando innerWidth < 900.
  viewer.useBrowserRecommendedResolution = true;
  viewer.resolutionScale = 1;

  // Cada vez que el canvas cambia de tamaño, el planeta vuelve a medir op.tamano
  // (salvo que el usuario ya haya elegido su distancia con zoom o irA)
  const observador = new ResizeObserver(() => {
    if (!viewer || !encuadreAuto) return;
    viewer.resize(); // que Cesium actualice el frustum antes de calcular
    const p = viewer.camera.positionCartographic;
    encuadrar(p.longitude, p.latitude);
    escena.requestRender();
  });
  observador.observe(lienzo);
  limpiezas.push(() => observador.disconnect());

  // ---------------------------------------------------------------
  // Rotación lenta hacia el este
  // ---------------------------------------------------------------
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let arrastrando = false;
  let temporizadorGiro = 0;
  let ultimo = performance.now();

  const debeGirar = () => op.rotar && !sinMovimiento.matches && !arrastrando && !temporizadorGiro;

  // Renderizado continuo solo mientras gira; quieto, Cesium dibuja solo cuando algo cambia
  const actualizarModo = () => {
    const gira = debeGirar();
    escena.requestRenderMode = !gira;
    if (!gira) escena.requestRender();
    ultimo = performance.now();
  };

  limpiezas.push(escena.preRender.addEventListener(() => {
    const ahora = performance.now();
    const dt = Math.min((ahora - ultimo) / 1000, 0.1); // evita saltos al volver a la pestaña
    ultimo = ahora;
    if (debeGirar() && viewer.camera.positionCartographic.height > op.alturaMinimaGiro) {
      // Ángulo positivo: la cámara va al oeste y la Tierra se ve girar hacia el este
      viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, op.velocidad * dt);
    }
    orientarLuz();
  }));

  const alPresionar = () => {
    arrastrando = true;
    clearTimeout(temporizadorGiro);
    temporizadorGiro = 0;
    actualizarModo();
  };
  const alSoltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    clearTimeout(temporizadorGiro);
    temporizadorGiro = setTimeout(() => { temporizadorGiro = 0; actualizarModo(); }, op.esperaTrasArrastre);
    actualizarModo();
  };
  const alZoom = () => { encuadreAuto = false; }; // el usuario eligió su distancia
  const lienzoCanvas = escena.canvas;
  lienzoCanvas.addEventListener('wheel', alZoom, { passive: true });
  limpiezas.push(() => lienzoCanvas.removeEventListener('wheel', alZoom));
  lienzoCanvas.addEventListener('pointerdown', alPresionar);
  window.addEventListener('pointerup', alSoltar);
  window.addEventListener('pointercancel', alSoltar);
  sinMovimiento.addEventListener('change', actualizarModo);
  limpiezas.push(() => {
    lienzoCanvas.removeEventListener('pointerdown', alPresionar);
    window.removeEventListener('pointerup', alSoltar);
    window.removeEventListener('pointercancel', alSoltar);
    sinMovimiento.removeEventListener('change', actualizarModo);
    clearTimeout(temporizadorGiro);
    temporizadorGiro = 0;
  });

  actualizarModo();

  // ---------------------------------------------------------------
  // ¿Responde NASA? Si no, imagen de respaldo
  // ---------------------------------------------------------------
  nasaResponde().then((ok) => { if (!ok) mostrarImagen('NASA GIBS no responde'); });

  // ---------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------
  function irA(lat, lon, alturaM = 1_500_000) {
    if (!viewer) return;
    encuadreAuto = false;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, alturaM),
      duration: sinMovimiento.matches ? 0 : 2.5
    });
    escena.requestRender();
  }

  function destruir() {
    if (destruido) return;
    destruido = true;
    apagarViewer();
    raiz.remove();
  }

  // Para pruebas: ¿terminaron de cargar las imágenes? ¿cuánto mide el planeta en pantalla?
  function estado() {
    if (!viewer) return { modo: 'imagen' };
    const { clientWidth: w, clientHeight: h } = escena.canvas;
    const d = Cesium.Cartesian3.magnitude(viewer.camera.positionWC);
    const mitadV = viewer.camera.frustum.fovy / 2;
    const diametro = (Math.tan(Math.asin(RADIO_TIERRA / d)) / Math.tan(mitadV)) * h;
    return { modo: '3d', cargado: globo.tilesLoaded, canvas: [w, h], diametroPx: Math.round(diametro), fraccionAlto: +(diametro / h).toFixed(3) };
  }

  return { irA, destruir, estado };
}
