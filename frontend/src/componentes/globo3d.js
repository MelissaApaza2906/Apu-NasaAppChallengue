// Globo 3D de APU (CesiumJS) con imágenes reales de NASA GIBS.
//
//   const globo = crearGlobo(contenedor, { tamano: 0.95, picos: [{ n, h, lat, lon }, …] });
//   globo.elegirPico(0);                 // vuela a ~2 500 km del pico; pausa la rotación
//   globo.verPlaneta();                  // vuelve al planeta completo y sigue girando
//   globo.irA(-16.5, -68.15, 300_000);   // vuela a un punto (grados, metros)
//   globo.destruir();                    // al salir de la pantalla
//
// Encima del canvas (HTML/SVG, no entidades de Cesium): marcador del pico con su etiqueta,
// satélite y haz de luz del satélite al marcador. Se recolocan en cada frame.
//
// El globo llena su contenedor con fondo TRANSPARENTE (se ve el cielo de la pantalla).
// Un anillo de luz encima del canvas tapa la línea oscura que WebGL deja en el borde.
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
  tamano: 0.95,             // diámetro del planeta / lado menor del contenedor (maqueta: lo llena)
  rotar: true,
  velocidad: 0.04,          // radianes por segundo (≈ una vuelta cada 2,6 min)
  alturaMinimaGiro: 5_000_000, // cerca del suelo no gira (después de irA)
  esperaTrasArrastre: 4000, // ms hasta que vuelve a girar
  picos: [],                // [{ n: nombre, h: altura en m (6438 o '6 438'), lat, lon }]; empieza en el primero
  marcador: { lat: -16.2, lon: -68.2 }, // si no hay picos: Cordillera Real, sin etiqueta
  alturaPico: 2_500_000,    // metros sobre el pico al elegirlo
  duracionVuelo: 1.6        // segundos
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

// Luz "pegada" a la cámara: viene de arriba a la izquierda y por delante,
// así lo que se mira queda iluminado y el borde derecho en penumbra.
// (≈52° respecto a la vista: con la cámara cerca se ve menos de medio planeta)
const LUZ = { derecha: 0.95, abajo: 0.22, adelante: 0.75 };

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

  // API mínima cuando no hay globo 3D (imagen de respaldo)
  const apiSinGlobo = () => ({
    irA() {}, elegirPico() {}, verPlaneta() {}, estado: () => ({ modo: 'imagen' }),
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

  // Capa de la maqueta: haz, satélite y marcador con etiqueta
  const idDegradado = `globo3d-haz-${Math.random().toString(36).slice(2, 8)}`;
  const capa = document.createElement('div');
  capa.className = 'globo3d-capa oculto';
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
    <div class="globo3d-marcador">
      <span class="pulso" aria-hidden="true"></span>
      <span class="pulso" aria-hidden="true"></span>
      <span class="punto" aria-hidden="true"></span>
      <span class="linea" aria-hidden="true"></span>
      <div class="globo3d-etiqueta"><strong></strong><span></span></div>
    </div>`;
  const marcador = capa.querySelector('.globo3d-marcador');
  const etiqueta = capa.querySelector('.globo3d-etiqueta');
  const satelite = capa.querySelector('.globo3d-satelite');
  const haz = capa.querySelector('.globo3d-haz polygon');
  const degradado = capa.querySelector('linearGradient');

  flotante.append(lienzo, anillo, crearHalo(), capa);
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
  escena.backgroundColor = Cesium.Color.TRANSPARENT;
  if (escena.sun) escena.sun.show = false;
  if (escena.moon) escena.moon.show = false;
  escena.skyAtmosphere.show = true;
  globo.showGroundAtmosphere = true;
  globo.baseColor = Cesium.Color.fromCssColorString('#0C294D'); // mientras llegan las imágenes
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

  // Distancia de cámara para que el planeta mida op.tamano del lado menor del contenedor.
  // Cesium usa el campo de visión (fov) sobre el lado mayor del canvas.
  function alturaEncuadre() {
    const { clientWidth: w, clientHeight: h } = escena.canvas;
    if (!w || !h) return 20_000_000;
    const tanMitad = Math.tan(viewer.camera.frustum.fov / 2);
    const tanMitadLadoMenor = tanMitad * Math.min(w, h) / Math.max(w, h);
    const angulo = Math.atan(op.tamano * tanMitadLadoMenor); // radio angular del planeta
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
  // Medido en 844×390 girando con la GPU (Iris Xe): ver FPS en el commit. Si un celular real
  // va a menos de 30 FPS, usar resolutionScale 0.85 cuando innerWidth < 900.
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
  let enfocado = false;   // mirando un pico de cerca: no gira
  let volando = false;    // la cámara está en un flyTo
  let ultimo = performance.now();

  const debeGirar = () => op.rotar && !sinMovimiento.matches && !arrastrando && !temporizadorGiro
    && !enfocado && !volando;

  // Renderizado continuo solo mientras gira o vuela; quieto, Cesium dibuja solo cuando algo cambia
  const actualizarModo = () => {
    const continuo = debeGirar() || volando;
    escena.requestRenderMode = !continuo;
    if (!continuo) escena.requestRender();
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

  // Anillo de luz: mismo diámetro que el planeta, centrado (la cámara mira al centro de la Tierra).
  // Se oculta cuando la cámara se acerca (irA) y el planeta ya no cabe entero.
  let diametroAnillo = 0;
  // De cerca (elegirPico) el canvas se recorta en círculo del tamaño del planeta
  // (ver .globo3d.cerca en el CSS) y el anillo marca ese borde.
  const actualizarAnillo = () => {
    const e = estado();
    const cerca = raiz.classList.contains('cerca');
    const lado = Math.min(...e.canvas);
    const visible = cerca || (viewer.camera.positionCartographic.height > op.alturaMinimaGiro
      && e.diametroPx <= lado * 1.02);
    anillo.hidden = !visible;
    const diametro = cerca ? Math.round(lado * op.tamano) : e.diametroPx;
    if (visible && Math.abs(diametro - diametroAnillo) >= 1) {
      diametroAnillo = diametro;
      anillo.style.width = anillo.style.height = `${diametroAnillo}px`;
    }
  };
  limpiezas.push(escena.postRender.addEventListener(actualizarAnillo));

  // ---------------------------------------------------------------
  // Marcador, etiqueta y haz: siguen al pico en cada frame
  // ---------------------------------------------------------------
  const picos = op.picos ?? [];
  let picoActual = -1;
  let posMarcador = null;
  const ocultador = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, Cesium.Cartesian3.ZERO);
  const enPantalla = new Cesium.Cartesian2();

  function ponerMarcador(i) {
    const p = picos[i];
    const lugar = p ?? op.marcador;
    picoActual = p ? i : -1;
    posMarcador = Cesium.Cartesian3.fromDegrees(lugar.lon, lugar.lat, alturaNumero(p?.h));
    etiqueta.hidden = !p;
    capa.querySelector('.linea').hidden = !p;
    if (p) {
      etiqueta.querySelector('strong').textContent = p.n;
      etiqueta.querySelector('span').textContent = `${conMiles(p.h)} m s. n. m.`;
      etiqueta.classList.remove('aparece');
      void etiqueta.offsetWidth; // reinicia la animación de entrada
      etiqueta.classList.add('aparece');
    }
    escena.requestRender();
  }

  const actualizarCapa = () => {
    if (!posMarcador) return;
    ocultador.cameraPosition = viewer.camera.positionWC;
    const visible = ocultador.isPointVisible(posMarcador)
      && Cesium.defined(escena.cartesianToCanvasCoordinates(posMarcador, enPantalla));
    capa.classList.toggle('oculto', !visible);
    if (!visible) return;

    const mx = enPantalla.x;
    const my = enPantalla.y;
    marcador.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;

    // Haz: triángulo con la punta en el satélite (su antena) y la base, perpendicular, en el marcador
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
  ponerMarcador(picos.length ? 0 : -1);

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

  function irA(lat, lon, alturaM = 1_500_000) {
    if (!viewer) return;
    encuadreAuto = false;
    volar(Cesium.Cartesian3.fromDegrees(lon, lat, alturaM), 2.5);
  }

  // Vuela a ~2 500 km sobre el pico i; pausa la rotación; marcador y etiqueta pasan a ese pico
  function elegirPico(i) {
    const p = picos[i];
    if (!viewer || !p) return;
    enfocado = true;
    encuadreAuto = false;
    raiz.classList.add('cerca');
    ponerMarcador(i);
    volar(Cesium.Cartesian3.fromDegrees(p.lon, p.lat, op.alturaPico), op.duracionVuelo);
  }

  // Vuelve al planeta completo (llena el contenedor) y reanuda la rotación
  function verPlaneta() {
    if (!viewer) return;
    encuadreAuto = true;
    raiz.classList.remove('cerca');
    const lon = picos[picoActual]?.lon ?? op.lon;
    volar(Cesium.Cartesian3.fromDegrees(lon, op.lat, alturaEncuadre()), op.duracionVuelo,
      () => { enfocado = false; });
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
    const diametro = (Math.tan(Math.asin(Math.min(1, RADIO_TIERRA / d))) / Math.tan(mitadV)) * h;
    return {
      modo: '3d', cargado: globo.tilesLoaded, canvas: [w, h],
      diametroPx: Math.round(diametro), fraccionAlto: +(diametro / h).toFixed(3),
      pico: picos[picoActual]?.n ?? null, marcadorVisible: !capa.classList.contains('oculto'),
      volando, girando: debeGirar()
    };
  }

  return { irA, elegirPico, verPlaneta, destruir, estado };
}
