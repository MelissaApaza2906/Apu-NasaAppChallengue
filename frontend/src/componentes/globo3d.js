// PROTOTIPO del globo 3D (Melissa). Funciona con los elementos de la pantalla de menú:
// falta convertirlo en una función crearGlobo(contenedor) que use pantallas/menu.
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
// APU · globo 3D de los glaciares del mundo, con datos reales de NASA
import { CESIUM_TOKEN, EXAGERACION, DIAS_ATRAS_FOTO, DIAS_ATRAS_NIEVE } from '../servicios/config.js';
import { GLACIARES } from '../contenido/glaciares.js';
import { CAPAS, proveedor, haceDias, fechaBonita, nasaResponde } from '../servicios/nasa-gibs.js';
import { imagenBrillo } from './brillo.js';
import { AnimadorNieve } from './animador-nieve.js';
import { graficoAnual, barraComparaciones } from './grafico.js';

const $ = (id) => document.getElementById(id);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// =====================================================================
// 1. El globo realista
// =====================================================================
if (CESIUM_TOKEN) Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

const viewer = new Cesium.Viewer('globo', {
  baseLayer: new Cesium.ImageryLayer(proveedor(CAPAS.marmolAzul)),
  terrain: CESIUM_TOKEN ? Cesium.Terrain.fromWorldTerrain() : undefined,
  animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
  homeButton: false, sceneModePicker: false, navigationHelpButton: false,
  fullscreenButton: false, infoBox: false, selectionIndicator: false
});

const escena = viewer.scene;
const globo = escena.globe;
globo.enableLighting = true;          // día y noche según la hora real
globo.showGroundAtmosphere = true;
escena.skyAtmosphere.show = true;
escena.fog.enabled = true;
escena.verticalExaggeration = EXAGERACION;
globo.maximumScreenSpaceError = 1.5;  // más detalle en las montañas

// Luces de las ciudades: solo se ven en el lado de noche
const luces = viewer.imageryLayers.addImageryProvider(proveedor(CAPAS.lucesNoche));
luces.dayAlpha = 0.0;
luces.nightAlpha = 0.9;
luces.brightness = 1.4;

const VISTA_INICIO = Cesium.Cartesian3.fromDegrees(-65, -15, 20000000);
viewer.camera.setView({ destination: VISTA_INICIO });

const animador = new AnimadorNieve(viewer, { opacidad: 0.92, capaEncima: luces });
let capaFoto = null;

// =====================================================================
// 2. Fechas
// =====================================================================
const ULTIMA_NIEVE = haceDias(DIAS_ATRAS_NIEVE);     // NASA publica con unos días de retraso
const ANIO_MAX = Number(ULTIMA_NIEVE.slice(0, 4));
const limitar = (f) => (f > ULTIMA_NIEVE ? ULTIMA_NIEVE : f);

function sumarDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Fecha que se muestra al mover la barra de años:
// sobre un glaciar, su día de comparación; en el globo entero, el mismo día de hoy.
function fechaDelAnio(anio) {
  const dia = glaciarSel ? glaciarSel.diaComparar : ULTIMA_NIEVE.slice(5);
  return limitar(`${anio}-${dia}`);
}

function mostrarFecha(texto, capa, cargando = false) {
  $('fechaGrande').hidden = false;
  $('fechaGrande').classList.toggle('cargando', cargando);
  $('fechaTexto').textContent = texto;
  $('fechaCapa').textContent = capa;
}

// =====================================================================
// 3. Modos: Tierra · Foto de hoy · Nieve
// =====================================================================
let modo = 'realista';
let glaciarSel = null;
let animacion = 0;            // cada animación tiene un número; si cambia, la anterior se detiene

function detenerAnimacion() {
  animacion++;
  ponerIconoPlay(false);
}

async function cambiarModo(nuevo) {
  detenerAnimacion();
  modo = nuevo;
  document.querySelectorAll('.chips .chip').forEach((b) => b.classList.toggle('activo', b.dataset.capa === modo));
  $('tiempo').classList.toggle('apagado', modo !== 'nieve');
  $('comparar').hidden = !(modo === 'nieve' && glaciarSel);

  if (capaFoto) { viewer.imageryLayers.remove(capaFoto, true); capaFoto = null; }
  if (modo !== 'nieve') animador.ocultar();

  if (modo === 'realista') {
    $('fechaGrande').hidden = true;
  }
  if (modo === 'hoy') {
    const f = haceDias(DIAS_ATRAS_FOTO);
    capaFoto = viewer.imageryLayers.addImageryProvider(proveedor(CAPAS.fotoDia, f));
    viewer.imageryLayers.raiseToTop(luces);
    mostrarFecha(fechaBonita(f), 'FOTO REAL · SATÉLITE TERRA (NASA)');
    decir('Esta es la foto real que tomó el satélite Terra de NASA. Las manchas blancas pueden ser nieve o nubes: con la capa "Nieve" las distinguimos.');
  }
  if (modo === 'nieve') {
    await verNieve(fechaDelAnio(Number($('anio').value)));
    decir(glaciarSel
      ? 'Mueve los años o toca "Comparar años": verás el mismo día de cada año, de 2001 a hoy.'
      : 'Esta es la nieve que midió NASA. Dale play para ver cómo se mueve durante todo el año.');
  }
}

async function verNieve(fecha) {
  mostrarFecha(fechaBonita(fecha), 'NIEVE · MODIS (NASA)', true);
  await animador.mostrar(fecha);
  mostrarFecha(fechaBonita(fecha), 'NIEVE · MODIS (NASA)', false);
}

document.querySelectorAll('.chips .chip').forEach((b) => b.addEventListener('click', () => cambiarModo(b.dataset.capa)));

// =====================================================================
// 4. Animaciones de la nieve
// =====================================================================
// a) Play: la nieve semana a semana durante el año elegido (como el video de NASA)
async function animarAnio() {
  const yo = ++animacion;
  ponerIconoPlay(true);
  const anio = Number($('anio').value);
  let f = `${anio}-01-01`;
  const fin = limitar(`${anio}-12-31`);
  while (f <= fin && yo === animacion) {
    await verNieve(f);
    await esperar(250);
    f = sumarDias(f, 7);
  }
  if (yo === animacion) ponerIconoPlay(false);
}

// b) Comparar años: el mismo día de cada año, de 2001 a hoy
async function compararAnios() {
  const yo = ++animacion;
  ponerIconoPlay(true);
  decir('Mira el mismo día de cada año. ¿La nieve se mantiene o se achica? Después lo comprobamos con los números.');
  for (let anio = 2001; anio <= ANIO_MAX && yo === animacion; anio++) {
    $('anio').value = anio;
    $('anioTexto').textContent = anio;
    await verNieve(fechaDelAnio(anio));
    await esperar(700);
  }
  if (yo === animacion) {
    ponerIconoPlay(false);
    if (glaciarSel) decir('Eso es lo que se ve. En el panel tienes lo que dicen los números de 25 años de NASA.');
  }
}

$('play').addEventListener('click', () => {
  if ($('play').dataset.andando === 'si') { detenerAnimacion(); return; }
  if (modo !== 'nieve') cambiarModo('nieve').then(animarAnio);
  else animarAnio();
});
$('comparar').addEventListener('click', compararAnios);

function ponerIconoPlay(andando) {
  const b = $('play');
  b.dataset.andando = andando ? 'si' : 'no';
  b.setAttribute('aria-label', andando ? 'Pausar la animación' : 'Animar la nieve de todo el año');
  b.innerHTML = andando
    ? '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
    : '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
}

// Barra de años
const anioInput = $('anio');
anioInput.max = String(ANIO_MAX);
anioInput.value = String(ANIO_MAX);
$('anioTexto').textContent = ANIO_MAX;
anioInput.addEventListener('input', () => { $('anioTexto').textContent = anioInput.value; });
anioInput.addEventListener('change', () => {
  detenerAnimacion();
  if (modo === 'nieve') verNieve(fechaDelAnio(Number(anioInput.value)));
});

// =====================================================================
// 5. Los glaciares que brillan
// =====================================================================
const brilloCian = imagenBrillo('63,180,255');
const brilloNaranja = imagenBrillo('255,138,42');
const t0 = performance.now();

GLACIARES.forEach((g, i) => viewer.entities.add({
  id: g.id,
  position: Cesium.Cartesian3.fromDegrees(g.lon, g.lat, 7000),
  billboard: {
    image: g.principal ? brilloNaranja : brilloCian,
    scale: new Cesium.CallbackProperty(() => {
      const t = (performance.now() - t0) / 1000;
      return (g.principal ? 0.75 : 0.5) * (1 + 0.18 * Math.sin(t * 2.2 + i));
    }, false),
    scaleByDistance: new Cesium.NearFarScalar(2e5, 1.6, 2e7, 0.7),
    disableDepthTestDistance: 3e5
  },
  label: {
    text: g.nombre.toUpperCase(),
    font: '700 15px Orbitron, sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.fromCssColorString('#060B26'),
    outlineWidth: 4,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    pixelOffset: new Cesium.Cartesian2(0, -34),
    showBackground: true,
    backgroundColor: Cesium.Color.fromCssColorString('rgba(14,26,72,0.85)'),
    backgroundPadding: new Cesium.Cartesian2(10, 6),
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, g.principal ? 2.5e7 : 1.2e7),
    disableDepthTestDistance: 3e5
  }
}));

const manejador = new Cesium.ScreenSpaceEventHandler(escena.canvas);
manejador.setInputAction((clic) => {
  const tocado = escena.pick(clic.position);
  if (!Cesium.defined(tocado) || !tocado.id) return;
  const g = GLACIARES.find((x) => x.id === tocado.id.id);
  if (g) volarA(g);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

manejador.setInputAction((mov) => {
  const t = escena.pick(mov.endPosition);
  escena.canvas.style.cursor = Cesium.defined(t) && t.id ? 'pointer' : 'grab';
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// =====================================================================
// 6. Volar a un glaciar y abrir su panel
// =====================================================================
function volarA(g) {
  glaciarSel = g;
  girando = false;
  ponerIconoGiro();
  const c = g.caja;
  const centro = Cesium.Cartesian3.fromDegrees((c.oeste + c.este) / 2, (c.sur + c.norte) / 2, 0);
  const ancho = Math.max(c.este - c.oeste, c.norte - c.sur);
  viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(centro, ancho * 40000), {
    offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(20), Cesium.Math.toRadians(-28), ancho * 150000),
    duration: 3.2
  });
  abrirPanel(g);
  decir(g.texto);
  $('comparar').hidden = modo !== 'nieve';
  if (modo === 'nieve') { detenerAnimacion(); verNieve(fechaDelAnio(Number(anioInput.value))); }
}

$('irCordillera').addEventListener('click', () => volarA(GLACIARES[0]));

$('cerrarPanel').addEventListener('click', () => {
  $('panel').hidden = true;
  glaciarSel = null;
  $('comparar').hidden = true;
  viewer.camera.flyTo({ destination: VISTA_INICIO, duration: 2.5 });
  decir('Toca otra luz para visitar otro glaciar.');
});

async function abrirPanel(g) {
  $('panel').hidden = false;
  $('pNombre').textContent = g.nombre;
  $('pPais').textContent = g.pais;
  const caja = $('pResultados');

  if (!g.datos) {
    caja.innerHTML = '<div class="resultado"><span class="linea">Todavía no procesamos los datos de esta región. Las imágenes de NASA sí se ven en vivo en el globo.</span></div>';
    return;
  }
  caja.innerHTML = '<div class="resultado"><span class="linea">Cargando resultados…</span></div>';
  try {
    const d = await (await fetch('/' + g.datos)).json();
    const partes = [];
    if (d.variables.nieve) partes.push(tarjeta('Nieve', d.variables.nieve, '#E6F4FF'));
    if (d.variables.lluvia) partes.push(tarjeta('Lluvia', d.variables.lluvia, '#7FD0FF'));
    caja.innerHTML = partes.join('');
  } catch (e) {
    caja.innerHTML = '<div class="resultado"><span class="linea">No se pudo leer el archivo de datos de esta región.</span></div>';
    console.error('APU: error leyendo', g.datos, e);
  }
}

// Tarjeta de resultados de una variable, con los números reales del JSON
function tarjeta(nombre, v, color) {
  const real = v.veredicto === 'real';
  const minimo = Math.min(...v.anual);
  const anioMin = v.anios[v.anual.indexOf(minimo)];
  const p = v.p < 0.001 ? '< 0.001' : v.p.toFixed(v.p < 0.01 ? 3 : 2);
  const signo = v.tendencia_por_decada > 0 ? '+' : '';
  const total = v.bajo + v.subio + (v.empate || 0);
  return `<section class="resultado">
    <header><h3>${nombre}</h3><span class="veredicto ${real ? 'real' : 'nose'}">${real ? 'TENDENCIA REAL' : 'TODAVÍA NO SE SABE'}</span></header>
    ${graficoAnual(v.anios, v.anual, { color, destacar: anioMin })}
    ${barraComparaciones(v.bajo, v.subio)}
    <span class="linea">De <b>${total}</b> comparaciones entre años, bajó <b>${v.bajo}</b> y subió <b>${v.subio}</b>. Valor p = <b>${p}</b>${real ? ' (menor que 0.05).' : ' (mayor que 0.05).'}</span>
    <span class="linea">Tendencia: <b>${signo}${v.tendencia_por_decada} ${v.unidad_tendencia}</b> por década. Año más bajo: <b>${anioMin}</b>.</span>
    <span class="linea">Fuente: ${v.fuente} · ${v.anios[0]}–${v.anios[v.anios.length - 1]}</span>
  </section>`;
}

// =====================================================================
// 7. Giro automático
// =====================================================================
let girando = true;
function ponerIconoGiro() {
  const b = $('girar');
  b.setAttribute('aria-label', girando ? 'Pausar el giro' : 'Girar el globo');
  b.innerHTML = girando
    ? '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
    : '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4"/></svg>';
}
$('girar').addEventListener('click', () => { girando = !girando; ponerIconoGiro(); });
manejador.setInputAction(() => { girando = false; ponerIconoGiro(); }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

let ultimo = performance.now();
escena.preRender.addEventListener(() => {
  const ahora = performance.now();
  const dt = (ahora - ultimo) / 1000;
  ultimo = ahora;
  if (girando && viewer.camera.positionCartographic.height > 5e6) {
    viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.05 * dt);
  }
});

// =====================================================================
// 8. Cóndor y estado de la conexión con NASA
// =====================================================================
function decir(texto) { $('dialogo').textContent = texto; }

(async () => {
  const ok = await nasaResponde();
  $('estadoNasa').textContent = ok ? 'CONECTADO A NASA · EN VIVO' : 'SIN CONEXIÓN CON NASA';
  $('estadoNasa').classList.toggle('ok', ok);
  if (!CESIUM_TOKEN) console.info('APU: sin token de Cesium ion las montañas se ven planas. Ver js/config.js');
})();
