// En vivo sobre el globo del menú: el satélite Terra (el que mide la nieve con MODIS) y los
// eventos de la Tierra de NASA EONET (icebergs y volcanes).
//
//   const vivo = crearEnVivo({ globo, pantalla });  // globo: crearGlobo(); pantalla: raíz del menú
//   vivo.eventos(false);   // muestra u oculta los pines de EONET (menú de capas)
//   vivo.mostrar(false);   // oculta todo (vista de la montaña)
//   vivo.destruir();
//
// Terra: su órbita (TLE de CelesTrak) + satellite.js → posición real cada 1 s: un punto blanco
// pequeño con una estela de sus últimos 10 min, y un chip abajo a la derecha. Al tocar el chip, la
// cámara gira hasta Terra y habla el Jukumari. EONET: al empezar y cada 30 min; pines HTML encima
// del canvas (rombo celeste = iceberg, triángulo naranja = volcán) y una tarjeta al tocarlos.
// Datos con respaldo (servicios/en-vivo.js): sin internet se ve lo último guardado con su fecha.
import * as Cesium from 'cesium';
import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';
import { leerTerra, leerEventos, lugarAproximado, fechaLarga } from '../servicios/en-vivo.js';
import { darInsignia } from './nueva-insignia.js';

const CADA_EVENTOS = 30 * 60 * 1000;
const ESTELA_S = 10 * 60;          // estela: últimos 10 minutos
const PASO_ESTELA_S = 20;
const FRASE_TERRA = 'Este es Terra: el satélite de NASA que midió la nieve de la Cordillera Real. ¡Está volando ahora mismo!';
const TIPOS = { iceberg: 'Iceberg', volcan: 'Volcán activo' };
// Pines de 16 px con borde oscuro (distintos a los discos de los glaciares)
const FORMA = {
  iceberg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 15 8 8 15 1 8Z" fill="#8FDBFF" stroke="#0B192E" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  volcan: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 15 14.5H1Z" fill="#FF8A3D" stroke="#0B192E" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};
const CERRAR = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const conMiles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export function crearEnVivo({ globo, pantalla }) {
  let destruido = false;
  let visible = true;
  let conEventos = true;
  let satrec = null;
  let infoTle = null;    // { fecha, enVivo }
  let terra = null;      // { lat, lon, alturaKm }
  let infoEventos = { eventos: [], fecha: null, enVivo: false };

  // ---------------------------------------------------------------
  // Chip de Terra y tarjeta de evento (en la pantalla, abajo a la derecha)
  // ---------------------------------------------------------------
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'envivo-chip hud';
  chip.hidden = true;
  chip.innerHTML = '<span class="envivo-texto"></span><small class="envivo-fecha" hidden></small>';
  const tarjeta = document.createElement('div');
  tarjeta.className = 'envivo-tarjeta hud';
  tarjeta.setAttribute('role', 'dialog');
  tarjeta.setAttribute('aria-label', 'Evento de la Tierra');
  tarjeta.hidden = true;
  pantalla.append(tarjeta, chip);

  // ---------------------------------------------------------------
  // Terra en el globo: un punto blanco y una estela que se desvanece (3 tramos)
  // ---------------------------------------------------------------
  let viewer = null;
  let entidades = [];
  let quitarRender = null;
  let cajaPines = null;
  let pines = [];        // { e, b, pos, ve }
  const ocultador = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, Cesium.Cartesian3.ZERO);
  const aux = new Cesium.Cartesian2();

  function prepararGlobo() {
    const v = globo?.viewer;
    if (v === viewer) return Boolean(v && !v.isDestroyed());
    // El globo cambió (pasó a imagen): lo anterior murió con su visor
    viewer = v && !v.isDestroyed() ? v : null;
    entidades = [];
    quitarRender?.();
    quitarRender = null;
    cajaPines?.remove();
    cajaPines = null;
    pines = [];
    if (!viewer) return false;

    const punto = viewer.entities.add({
      name: 'Terra',
      show: false,
      point: { pixelSize: 6, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#0B192E'), outlineWidth: 1.5 }
    });
    // Posiciones por CallbackProperty: geometría dinámica que se dibuja en el mismo cuadro (con
    // posiciones constantes, Cesium la rehace en un worker y, sin pedir otro cuadro, no se ve)
    const tramos = [0.12, 0.28, 0.5].map((a) => {
      const t = viewer.entities.add({
        show: false,
        polyline: { width: 2, arcType: Cesium.ArcType.NONE, material: Cesium.Color.WHITE.withAlpha(a) }
      });
      t.puntos = [];
      t.polyline.positions = new Cesium.CallbackProperty(() => t.puntos, false);
      return t;
    });
    entidades = [punto, ...tramos];

    // Pines de EONET encima del canvas, debajo de los de los glaciares
    const capa = globo.capa;
    if (capa) {
      cajaPines = document.createElement('div');
      cajaPines.className = 'globo3d-eventos';
      const glaciares = capa.querySelector('.globo3d-pines');
      if (glaciares) glaciares.before(cajaPines);
      else capa.append(cajaPines);
      ponerPines();
    }
    quitarRender = viewer.scene.postRender.addEventListener(moverPines);
    return true;
  }

  // Posición de Terra en un instante (null si la órbita no se puede calcular)
  function posicionTerra(fecha) {
    const pv = propagate(satrec, fecha);
    if (!pv?.position) return null;
    const g = eciToGeodetic(pv.position, gstime(fecha));
    let lon = Cesium.Math.toDegrees(g.longitude);
    lon = ((lon + 540) % 360) - 180;
    return { lat: Cesium.Math.toDegrees(g.latitude), lon, alturaKm: g.height, lonR: g.longitude, latR: g.latitude };
  }

  function pasoTerra() {
    if (destruido || !satrec) return;
    const ahora = new Date();
    const p = posicionTerra(ahora);
    if (!p) { chip.hidden = true; return; }
    terra = p;
    escribirChip();
    if (!prepararGlobo() || !visible) return;
    const [punto, ...tramos] = entidades;
    punto.position = Cesium.Cartesian3.fromRadians(p.lonR, p.latR, p.alturaKm * 1000);
    punto.show = true;
    // Estela: puntos cada 20 s de los últimos 10 min, partidos en 3 tramos (el más viejo, más tenue)
    const puntos = [];
    for (let s = ESTELA_S; s >= 0; s -= PASO_ESTELA_S) {
      const q = s ? posicionTerra(new Date(ahora - s * 1000)) : p;
      if (q) puntos.push(Cesium.Cartesian3.fromRadians(q.lonR, q.latR, q.alturaKm * 1000));
    }
    const tercio = Math.ceil(puntos.length / 3);
    tramos.forEach((t, i) => {
      t.puntos = puntos.slice(i * tercio, Math.min(puntos.length, (i + 1) * tercio + 1));
      t.show = true;
    });
    viewer.scene.requestRender();
  }

  function escribirChip() {
    if (!terra) return;
    const enVivo = infoTle?.enVivo;
    const texto = `🛰 Terra${enVivo ? ' en vivo' : ''} · ${lugarAproximado(terra.lat, terra.lon)} · ${conMiles(terra.alturaKm)} km`;
    chip.querySelector('.envivo-texto').textContent = texto;
    const f = chip.querySelector('.envivo-fecha');
    f.hidden = Boolean(enVivo);
    f.textContent = enVivo ? '' : `Actualizado el ${fechaLarga(infoTle?.fecha)}`;
    chip.setAttribute('aria-label', `${texto.replace('🛰 ', '')}${enVivo ? '' : `. ${f.textContent}`}. Tocar para verlo en el globo`);
    chip.hidden = !visible;
  }

  chip.addEventListener('click', () => {
    if (terra) globo?.irA?.(terra.lat, terra.lon);
    window.dispatchEvent(new CustomEvent('apu:jukumari', { detail: { texto: FRASE_TERRA, abrir: true } }));
    darInsignia('ojo-terra'); // insignia "Ojo de Terra"
  });

  // ---------------------------------------------------------------
  // Pines de EONET (16 px; área táctil de 44 px)
  // ---------------------------------------------------------------
  function ponerPines() {
    if (!cajaPines) return;
    cajaPines.replaceChildren();
    pines = infoEventos.eventos.map((e) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `globo3d-evento ${e.tipo} oculto`;
      b.tabIndex = -1;
      b.setAttribute('aria-label', `${TIPOS[e.tipo] ?? 'Evento'}: ${e.titulo}`);
      b.innerHTML = FORMA[e.tipo] ?? FORMA.iceberg;
      b.addEventListener('click', () => abrirTarjeta(e, b));
      cajaPines.append(b);
      return { e, b, pos: Cesium.Cartesian3.fromDegrees(e.lon, e.lat, 0), ve: false };
    });
    cajaPines.hidden = !conEventos || !visible;
    viewer?.scene.requestRender();
  }

  function moverPines() {
    if (!cajaPines || cajaPines.hidden || !viewer) return;
    const escena = viewer.scene;
    const w = escena.canvas.clientWidth;
    const h = escena.canvas.clientHeight;
    ocultador.cameraPosition = viewer.camera.positionWC;
    for (const p of pines) {
      const ve = ocultador.isPointVisible(p.pos)
        && Cesium.defined(escena.cartesianToCanvasCoordinates(p.pos, aux))
        && aux.x >= 4 && aux.x <= w - 4 && aux.y >= 4 && aux.y <= h - 4;
      if (ve !== p.ve) {
        p.ve = ve;
        p.b.classList.toggle('oculto', !ve);
        p.b.tabIndex = ve ? 0 : -1;
      }
      if (ve) p.b.style.transform = `translate(${aux.x.toFixed(1)}px, ${aux.y.toFixed(1)}px)`;
    }
  }

  let quienAbrio = null;
  function abrirTarjeta(e, desde) {
    quienAbrio = desde;
    pines.forEach((p) => p.b.classList.toggle('elegido', p.e === e));
    const respaldo = infoEventos.enVivo ? '' : `<p class="envivo-respaldo">Actualizado el ${escapar(fechaLarga(infoEventos.fecha))}</p>`;
    tarjeta.innerHTML = `
      <button type="button" class="envivo-cerrar" aria-label="Cerrar">${CERRAR}</button>
      <span class="envivo-tipo ${e.tipo}">${FORMA[e.tipo] ?? ''}${escapar(TIPOS[e.tipo] ?? 'Evento')}</span>
      <h3>${escapar(e.titulo)}</h3>
      <p>Última observación: ${escapar(fechaLarga(e.fecha, { utc: true }))}</p>
      <p class="envivo-fuente">Fuente: NASA EONET</p>${respaldo}`;
    tarjeta.querySelector('.envivo-cerrar').addEventListener('click', cerrarTarjeta);
    tarjeta.hidden = false;
    tarjeta.querySelector('.envivo-cerrar').focus();
  }
  function cerrarTarjeta() {
    if (tarjeta.hidden) return;
    tarjeta.hidden = true;
    pines.forEach((p) => p.b.classList.remove('elegido'));
    if (quienAbrio?.isConnected && !quienAbrio.classList.contains('oculto')) quienAbrio.focus();
    quienAbrio = null;
  }
  const conEscape = (ev) => { if (ev.key === 'Escape' && !tarjeta.hidden) { ev.stopPropagation(); cerrarTarjeta(); } };
  document.addEventListener('keydown', conEscape, true);

  // ---------------------------------------------------------------
  // Datos: órbita al empezar; eventos al empezar y cada 30 min
  // ---------------------------------------------------------------
  let reloj = 0;
  leerTerra().then((tle) => {
    if (destruido || !tle) return;
    try {
      satrec = twoline2satrec(...tle.lineas);
    } catch (e) {
      console.info('APU: la órbita de Terra no se pudo leer.', e.message);
      return;
    }
    infoTle = tle;
    pasoTerra();
    reloj = setInterval(pasoTerra, 1000);
  });

  async function actualizarEventos() {
    const r = await leerEventos();
    if (destruido) return;
    infoEventos = r;
    cerrarTarjeta();
    if (prepararGlobo()) ponerPines();
  }
  actualizarEventos();
  const relojEventos = setInterval(actualizarEventos, CADA_EVENTOS);

  return {
    // Pines de EONET (opción "Eventos en vivo" del menú de capas)
    eventos(si) {
      conEventos = Boolean(si);
      if (!conEventos) cerrarTarjeta();
      if (cajaPines) cajaPines.hidden = !conEventos || !visible;
      viewer?.scene.requestRender();
    },
    // Todo lo en vivo (se oculta en la vista de la montaña)
    mostrar(si) {
      visible = Boolean(si);
      if (!visible) cerrarTarjeta();
      chip.hidden = !visible || !terra;
      if (cajaPines) cajaPines.hidden = !conEventos || !visible;
      entidades.forEach((e) => { e.show = visible && Boolean(terra); });
      if (viewer && !viewer.isDestroyed()) viewer.scene.requestRender();
    },
    // Para pruebas
    estado: () => ({
      terra: terra && { lat: +terra.lat.toFixed(2), lon: +terra.lon.toFixed(2), km: Math.round(terra.alturaKm) },
      tle: infoTle && { enVivo: infoTle.enVivo, fecha: infoTle.fecha },
      eventos: { total: infoEventos.eventos.length, enVivo: infoEventos.enVivo, fecha: infoEventos.fecha, visibles: pines.filter((p) => p.ve).length }
    }),
    destruir() {
      if (destruido) return;
      destruido = true;
      clearInterval(reloj);
      clearInterval(relojEventos);
      document.removeEventListener('keydown', conEscape, true);
      quitarRender?.();
      if (viewer && !viewer.isDestroyed()) entidades.forEach((e) => viewer.entities.remove(e));
      cajaPines?.remove();
      chip.remove();
      tarjeta.remove();
    }
  };
}
