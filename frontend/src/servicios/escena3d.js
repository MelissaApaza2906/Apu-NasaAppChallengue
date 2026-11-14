// Escena 3D de los casos: UN solo Cesium.Viewer (el globo de componentes/globo3d.js) que se reutiliza
// entre #/casos y #/caso/… (no se recrea al cambiar de pantalla: crear varios tumba el celular).
// Vive en una capa fija detrás de #app; las pantallas de los casos tienen fondo transparente.
//   planeta()             el globo girando lento (archivo, caso resuelto) · volarA(lat, lon) · marcadores(lista)
//   montana(caso, op)     la vista de cerca de la cordillera (relieve e imagen de la lupa: vista-realista.js)
//   escenaEntrar/escenaElegir/escenaSalir  los recuadros grande y medio y los contornos GLIMS (capas-escena.js)
//   nieve(caso, fechas)   la capa de nieve MODIS de NASA GIBS del primer día de la lista con imagen
//   captura()             la foto del canvas (para el informe)
// Sin WebGL, sin token de Cesium o si Cesium falla: montana() devuelve false y la pantalla usa su foto.
// El menú crea su propio globo: al entrar al menú se llama apagar() (nunca hay dos visores a la vez).
import * as Cesium from 'cesium';
import './escena3d.css';
import { crearGlobo } from '../componentes/globo3d.js';
import { aplicarVistaRealista } from '../componentes/vista-realista.js';
import { REGIONES } from '../componentes/montanas3d.js';
import { CAPAS, proveedor } from './nasa-gibs.js';
import { CESIUM_TOKEN } from './config.js';
import { GLACIARES } from '../contenido/glaciares.js';
import { registrarEscena3d } from './escena3d-estado.js';
import { CAJAS, dibujarBorde, dibujarGlims, limpiarEscena } from '../componentes/casos/capas-escena.js';

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';
let capaDom = null, globo = null, vr = null, enMontana = false;
// sinIon: Cesium ion no dio el relieve (token vencido, sin cuota, 403…): la montaña pasa a la foto de respaldo
let sinIon = false, ultimo = null;
let entidades = [], capaNieve = null, orbita = null, girar = false, quitarPre = null, quitarToque = null;
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function asegurar() {
  if (globo) return globo;
  capaDom = document.createElement('div');
  capaDom.className = 'escena3d planeta';
  capaDom.setAttribute('aria-hidden', 'true');
  capaDom.innerHTML = '<div class="escena3d-marco"></div><div class="escena3d-velo"></div><p class="escena3d-credito"></p><div class="escena3d-creditos-cesium"></div>';
  document.body.insertBefore(capaDom, document.getElementById('app'));
  globo = crearGlobo(capaDom.querySelector('.escena3d-marco'), {
    glaciares: [], rotar: true, velocidad: 0.02, tamano: 0.94, capa: null,
    credito: capaDom.querySelector('.escena3d-credito')
  });
  const v = globo.viewer;
  if (v) {
    // La órbita lenta de la montaña (vista cinemática)
    quitarPre = v.scene.preRender.addEventListener(() => {
      if (!enMontana || !orbita || !girar || sinMovimiento()) return;
      orbita.hpr.heading += 0.0016;
      v.camera.lookAt(orbita.target, orbita.hpr);
    });
    const parar = () => { girar = false; };
    v.canvas.addEventListener('pointerdown', parar);
    quitarToque = () => v.canvas.removeEventListener('pointerdown', parar);
  }
  registrarEscena3d(() => api.apagar());
  if (import.meta.env.DEV) { window.__escena3d = api; window.__escena3dViewer = () => viewer(); } // para las pruebas
  return globo;
}

const viewer = () => { const v = asegurar().viewer; return v && !v.isDestroyed() ? v : null; };
const regionDe = (caso) => REGIONES.find((r) => r.id === caso.glaciar) ?? null;
const glaciarDe = (caso) => GLACIARES.find((g) => g.id === caso.glaciar) ?? null;

function clases(extra) {
  capaDom.className = `escena3d ${extra}`.trim();
  globo.forzarResize?.();
}

function limpiarMontana() {
  const v = viewer();
  if (v) limpiarEscena(v);
  if (capaNieve && v) v.imageryLayers.remove(capaNieve, true);
  capaNieve = null;
  orbita = null;
}

function salirMontana() {
  if (!enMontana) return;
  const v = viewer();
  limpiarMontana();
  try { vr?.restaurar(); } catch (e) { console.error(e); }
  vr = null;
  if (v && !v.scene.terrainProvider) v.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider(); // nunca sin terreno
  enMontana = false;
  document.body.classList.remove('modo-montana', 'escena3d-montana');
  if (v) {
    v.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    const c = v.scene.screenSpaceCameraController;
    c.enableInputs = true;
    c.minimumZoomDistance = 1; // el globo vuelve a poner sus topes al encuadrar
  }
}

export const api = {
  // Fondo: el globo girando. lado: 'derecha' (archivo) | 'centro' (caso resuelto)
  planeta(lado = 'derecha') {
    asegurar();
    capaDom.hidden = false;
    const v = viewer();
    if (v) v.useDefaultRenderLoop = true;
    const venia = enMontana;
    salirMontana();
    clases(`planeta ${lado}`);
    if (venia) globo.verPlaneta?.();
    return Boolean(v);
  },
  volarA(lat, lon) { if (!enMontana) globo?.irA?.(lat, lon); },
  // [{ id, lat, lon, estado: 'resuelto' | 'abierto' | 'clasificado' | 'camino', foco }]
  marcadores(lista) {
    const v = viewer(); if (!v) return;
    entidades.forEach((e) => v.entities.remove(e));
    const COLOR = { resuelto: '#2BC56B', abierto: '#4F8DFF', clasificado: '#D12021', camino: '#A9B4CC' };
    const t0 = performance.now();
    entidades = lista.map((m) => v.entities.add({
      position: Cesium.Cartesian3.fromDegrees(m.lon, m.lat, 8000),
      point: {
        pixelSize: m.foco || m.estado === 'resuelto'
          ? new Cesium.CallbackProperty(() => (m.foco ? 14 : 9) + (m.foco ? 6 : 2) * (0.5 + 0.5 * Math.sin((performance.now() - t0) / 260)), false)
          : 8,
        color: Cesium.Color.fromCssColorString(COLOR[m.estado] ?? COLOR.camino),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.85), outlineWidth: m.foco ? 3 : 1.5
      }
    }));
    v.scene.requestRender();
  },
  // La montaña de la cordillera: { girar, interactivo, clase: 'oscura' | 'desenfocada' | 'clara' }
  montana(caso, { girar: gira = true, interactivo = false, clase = 'oscura', frente = false } = {}) {
    asegurar();
    capaDom.hidden = false;
    const v = viewer();
    const region = regionDe(caso);
    ultimo = { caso, op: { girar: gira, interactivo, clase, frente } };
    if (!v || !CESIUM_TOKEN || !region || sinIon) { capaDom.style.setProperty('--foto', `url(${api.foto(caso)})`); clases(`foto ${clase}`); return false; }
    v.useDefaultRenderLoop = true;
    if (!enMontana) {
      enMontana = true;
      document.body.classList.add('modo-montana', 'escena3d-montana'); // el globo deja de mover la cámara
      entidades.forEach((e) => v.entities.remove(e)); entidades = [];
      // Si el relieve de Cesium ion todavía no llegó (entrar directo a un caso), el globo no tiene terreno y
      // no dibuja nada; en modo montaña su respaldo no actúa. Se pone el elipsoide liso y vista-realista
      // pide el relieve real por su cuenta.
      if (!v.scene.terrainProvider) v.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      try { vr = aplicarVistaRealista(v, { regionId: caso.glaciar, lon: region.lon, creditos: capaDom.querySelector('.escena3d-creditos-cesium') }); } catch (e) { console.warn(e); }
      // Sin relieve, la montaña sería un planeta liso y borroso: mejor la foto de la cordillera (como sin token)
      vr?.relieveListo?.then((r) => {
        if (r !== 'sin' || !enMontana || !ultimo) return;
        console.info('APU: Cesium ion no dio el relieve; la montaña usa la foto de respaldo.');
        sinIon = true;
        salirMontana();
        api.montana(ultimo.caso, ultimo.op);
      });
      v.scene.requestRenderMode = false;
    }
    clases(`montana ${clase}`);
    const c = v.scene.screenSpaceCameraController;
    c.enableInputs = interactivo;
    c.enableRotate = c.enableZoom = c.enableTilt = true;
    c.minimumZoomDistance = 1500;
    c.maximumZoomDistance = 400_000;
    // Encuadre: el centro del recuadro grande, con el rumbo y la inclinación de montanas3d.js
    const [o, s, e, n] = caso.caja;
    const target = Cesium.Cartesian3.fromDegrees((o + e) / 2, (s + n) / 2, 3000);
    const hpr = new Cesium.HeadingPitchRange(Cesium.Math.toRadians(region.heading ?? 0), Cesium.Math.toRadians(frente ? -12 : (region.pitch ?? -28)), (region.altura ?? 60000) * (frente ? 1.1 : 1.6));
    girar = gira;
    if (orbita && Cesium.Cartesian3.equals(orbita.target, target)) { orbita.hpr.pitch = hpr.pitch; orbita.hpr.range = hpr.range; return true; }
    orbita = null;
    v.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    const fin = () => { orbita = { target, hpr: new Cesium.HeadingPitchRange(hpr.heading, hpr.pitch, hpr.range) }; v.camera.lookAt(target, orbita.hpr); };
    if (sinMovimiento()) fin();
    else v.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), { offset: hpr, duration: 2.4, complete: fin, cancel: fin });
    return true;
  },
  // La pista Escena (componentes/casos/capas-escena.js): grande punteado blanco, medio ámbar y GLIMS.
  // Devuelve { medio, glims } (qué se pudo dibujar).
  async escenaEntrar(caso) {
    const v = viewer(); if (!v || !enMontana) return { medio: false, glims: false };
    const cajas = CAJAS[caso.id] ?? {};
    dibujarBorde(v, cajas.grande ?? caso.caja, '#F2F4F8', 'caja-grande', true);
    if (cajas.medio) dibujarBorde(v, cajas.medio, '#F2B90C', 'caja-medio');
    const glims = await dibujarGlims(v, caso.id);
    return { medio: Boolean(cajas.medio), glims: Boolean(glims) };
  },
  // Elegir un recuadro: su borde se resalta y la cámara vuela a encuadrarlo
  escenaElegir(caso, cual) {
    const v = viewer(); if (!v || !enMontana) return;
    const cajas = CAJAS[caso.id] ?? {};
    const grande = cajas.grande ?? caso.caja;
    dibujarBorde(v, grande, '#F2F4F8', 'caja-grande', cual !== 'grande');
    if (cajas.medio) dibujarBorde(v, cajas.medio, '#F2B90C', 'caja-medio', cual !== 'medio');
    const caja = cual === 'medio' && cajas.medio ? cajas.medio : grande;
    orbita = null; girar = false;
    v.camera.cancelFlight(); // si la montaña todavía estaba volando, su vuelo termina aquí
    orbita = null;
    v.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    v.camera.flyTo({ destination: Cesium.Rectangle.fromDegrees(...caja), duration: sinMovimiento() ? 0 : 1.5 });
  },
  escenaSalir() { const v = viewer(); if (v) limpiarEscena(v); },
  // Capa de nieve MODIS (GIBS): el primer día de `fechas` con imagen sobre la cordillera. Devuelve el día usado o null.
  async nieve(caso, fechas) {
    const v = viewer(); if (!v || !enMontana) return null;
    const g = glaciarDe(caso);
    const [o, s, e, n] = caso.caja;
    const dia = await primerDiaConNieve(fechas, g?.lat ?? (s + n) / 2, g?.lon ?? (o + e) / 2);
    if (!dia || !enMontana) return null;
    const anterior = capaNieve;
    capaNieve = v.imageryLayers.addImageryProvider(proveedor(CAPAS.nieveDia, dia));
    capaNieve.alpha = 0.6;
    if (anterior) setTimeout(() => { if (!v.isDestroyed()) v.imageryLayers.remove(anterior, true); }, 600);
    return dia;
  },
  quitarNieve() { const v = viewer(); if (capaNieve && v) v.imageryLayers.remove(capaNieve, true); capaNieve = null; },
  // Foto del canvas justo después de dibujar (sin preserveDrawingBuffer)
  captura() {
    const v = viewer(); if (!v || !enMontana) return null;
    try { v.scene.render(); return v.canvas.toDataURL('image/jpeg', 0.85); } catch (e) { console.warn('APU: no se pudo capturar la montaña.', e); return null; }
  },
  foto(caso) { return glaciarDe(caso)?.foto?.src ?? '/img/planeta.webp'; },
  hay3d() { return Boolean(viewer()); },
  ocultar() {
    if (!capaDom) return;
    capaDom.hidden = true;
    const v = viewer(); if (v) v.useDefaultRenderLoop = false;
  },
  apagar() {
    if (!globo) return;
    salirMontana();
    quitarPre?.(); quitarToque?.();
    globo.destruir?.();
    capaDom?.remove();
    globo = null; capaDom = null; entidades = []; quitarPre = null; quitarToque = null;
  }
};

// La tesela de zoom 6 que cubre el lugar: si pesa poco, GIBS no tiene imagen ese día (nubes o sin pasada)
async function primerDiaConNieve(fechas, lat, lon) {
  const z = 6, n = 2 ** z;
  const x = Math.floor((lon + 180) / 360 * n);
  const r = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
  for (const f of fechas) {
    const url = `${GIBS}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${CAPAS.nieveDia.layer}&STYLE=default&TILEMATRIXSET=${CAPAS.nieveDia.matriz}&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=${encodeURIComponent(CAPAS.nieveDia.formato)}&TIME=${f}`;
    try {
      const resp = await fetch(url);
      if (resp.ok && (await resp.blob()).size > 900) return f;
    } catch { return fechas[0] ?? null; } // NASA no responde: se intenta igual con el primero
  }
  return null;
}

export default api;
