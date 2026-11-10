// Pantalla: menú "Monitoreo glaciar" · Responsable: Melissa
// Copia fiel de la maqueta "APU · Diseño visual del juego" → Pantalla 2 (ApuInicio).
// El planeta es para explorar: siempre se ve entero. Al elegir un lugar, el panel muestra su
// historia y el botón "Ver montaña en 3D", que abre montanas-puente.js (los datos de NASA:
// pestañas Nieve/Lluvia, máquina del tiempo, Nevada/Lluvia y barras, junto a la montaña de Jhoel).
// Datos REALES: frontend/public/datos/cordillera-real.json (MODIS MOD10A1, calculado en backend/).
// Globo: si componentes/globo3d.js exporta crearGlobo(), se usa el globo 3D de Cesium;
// si no (o si falla), se muestra el planeta de la maqueta con su marcador y satélite.
import './menu.css';
import './montanas-puente.css';
import { ir } from '../../router.js';
import { cargarRegion } from '../../servicios/datos.js';
import { GLACIARES } from '../../contenido/glaciares.js';
import { FRASES } from '../../contenido/frases-jukumari.js';
import { abrirMontana } from './montanas-puente.js';

const PICOS = [
  { n: 'Illimani', h: '6 438', lat: -16.64, lon: -67.79, t: 'el Illimani, el guardián de La Paz' },
  { n: 'Huayna Potosí', h: '6 088', lat: -16.26, lon: -68.15, t: 'el Huayna Potosí, muy cerca de El Alto' },
  { n: 'Condoriri', h: '5 648', lat: -16.17, lon: -68.25, t: 'el Condoriri, la "cabeza de cóndor"' },
  { n: 'Illampu', h: '6 368', lat: -15.83, lon: -68.57, t: 'el Illampu, al norte de la cordillera' },
  { n: 'Chacaltaya', h: '5 421', lat: -16.35, lon: -68.13, t: 'el Chacaltaya, donde hubo una pista de esquí' },
  { n: 'Mururata', h: '5 869', lat: -16.53, lon: -67.78, t: 'el Mururata, vecino del Illimani' }
];
const SIN_DATOS = 'El análisis de 25 años de este glaciar todavía no está en APU. Explóralo en el planeta con las imágenes de NASA.';
const AVISO_CAPA = 'No se pudo cargar la capa de NASA. El planeta sigue con la imagen normal.';
// Capas del botón "Capas de datos" del planeta
const CAPAS_MENU = [
  { capa: null, n: 'Normal' },
  { capa: 'hoy', n: 'Hoy (nubes reales)' }
];
const CARRUSELES = [
  { k: 'glaciares', n: 'Glaciares del mundo' },
  { k: 'picos', n: 'Picos de la Cordillera Real' }
];

// Íconos del riel (mismos trazos que la maqueta)
const ICONOS = {
  explorar: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z"/>',
  entrenar: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
  capas: '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
const RIEL = [
  { k: 'explorar', n: 'Explorar el globo', ruta: null, actual: true },
  { k: 'entrenar', n: 'Entrenamiento', ruta: 'etapas' },
  { k: 'capas', n: 'Capas de datos', ruta: null },
  { k: 'perfil', n: 'Mi expediente', ruta: 'insignias' },
  { k: 'ajustes', n: 'Ajustes', ruta: 'ajustes' }
];
const MONTANA = '<svg aria-hidden="true" viewBox="0 0 32 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M1 19 11 5l6 8 4-5 10 11"/><path d="M8 9.5 11 5l3 4"/></svg>';
const SATELITE = '<svg class="menu-sat" aria-hidden="true" viewBox="0 0 64 32"><rect x="0" y="9" width="22" height="14" fill="#2F6FD6" stroke="#CFE3FF"/><path d="M7 9v14M14 9v14M0 16h22" stroke="#CFE3FF" stroke-width=".6"/><rect x="42" y="9" width="22" height="14" fill="#2F6FD6" stroke="#CFE3FF"/><path d="M49 9v14M56 9v14M42 16h22" stroke="#CFE3FF" stroke-width=".6"/><rect x="24" y="8" width="16" height="16" rx="2" fill="#E8EEF8" stroke="#9FB3D9"/><circle cx="32" cy="26" r="3" fill="#B8C6E0"/></svg>';

const fmt = (v, d) => v.toFixed(d).replace('.', ',');

let globo = null;
let vivo = false;
let quitarAlSalir = null; // listeners en document que hay que quitar al salir del menú

export function montar(contenedor) {
  vivo = true;
  const principal = GLACIARES.find((g) => g.principal) ?? GLACIARES[0];
  // modo: qué muestra el carrusel · elegido: lo último elegido ('glaciar' o 'pico')
  // modo: qué muestra el carrusel · elegido: lo último elegido ('glaciar' o 'pico')
  const estado = {
    modo: 'glaciares', elegido: 'glaciar', glaciar: principal.id, pico: 0,
    ventana: { glaciares: 0, picos: 0 }, cerca: false, capa: null, variable: 'nieve', textoLugar: principal.texto
  };
  let region = null; // cordillera-real.json cuando termina de cargar
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-menu menu-cielo';
  raiz.innerHTML = `
    <div class="menu-estrellas" aria-hidden="true">
      <span style="left:14%;top:18%"></span><span style="left:22%;top:70%;animation-delay:.9s"></span>
      <span style="left:66%;top:9%;animation-delay:1.7s"></span><span style="left:70%;top:72%;animation-delay:.5s"></span>
      <span style="left:30%;top:6%;animation-delay:2.1s"></span><span style="left:9%;top:52%;animation-delay:1.3s"></span>
    </div>

    <svg class="menu-orbita" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
      <ellipse cx="50" cy="50" rx="48" ry="44" fill="none" stroke="rgba(169,200,255,.55)" stroke-width=".25" stroke-dasharray="1 1.4" transform="rotate(-24 50 50)"/>
    </svg>

    <div class="menu-planeta"></div>

    <header class="menu-logo entra-izq">
      <button type="button" class="logo-btn" aria-label="APU: volver a la pantalla de inicio" title="Volver a la pantalla de inicio">
        <img src="/img/logo-apu.png" alt="">
      </button>
      <span class="separador" aria-hidden="true"></span>
    </header>

    <div class="menu-estado entra-der">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#F2F4F8" stroke-width="1.5"><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)"/><path d="M4 4l4 4M16 16l4 4M3 8l5-5M16 21l5-5"/></svg>
      <span class="punto" aria-hidden="true"></span>Monitoreo satelital
    </div>

    <nav class="menu-riel hud entra-izq" aria-label="Menú">
      ${RIEL.map((m) => `
        <button type="button" class="redondo${m.actual ? ' actual' : ''}" data-k="${m.k}" data-ruta="${m.ruta ?? ''}" aria-label="${m.n}" title="${m.n}"${m.actual ? ' aria-current="page"' : ''}${m.k === 'capas' ? ' aria-haspopup="menu" aria-expanded="false" aria-controls="menu-capas"' : ''}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONOS[m.k]}</svg>
        </button>`).join('')}
    </nav>

    <div class="menu-capas hud" id="menu-capas" role="menu" aria-label="Capas de datos de NASA" hidden>
      ${CAPAS_MENU.map((c) => `<button type="button" role="menuitemradio" data-capa="${c.capa ?? ''}" aria-checked="${c.capa === 'nieve'}">${c.n}</button>`).join('')}
    </div>

    <aside class="menu-panel hud entra-der" aria-label="Historia del lugar">
      <p class="pestana">Historia</p>
      <div>
        <h2><span class="barras" aria-hidden="true">//</span><span class="titulo-texto">${principal.nombre}</span></h2>
        <p class="lugar-sub">${principal.pais}</p>
      </div>
      <div class="linea" aria-hidden="true"></div>
      <p class="aviso-capa" role="status" hidden>${AVISO_CAPA}</p>
      <p class="historia"></p>
      <div class="resumen" hidden>
        <b class="resumen-valor"></b>
        <span class="resumen-texto"></span>
      </div>
      <p class="sin-datos" hidden>${SIN_DATOS}</p>
      <button type="button" class="ver-montana">
        <svg aria-hidden="true" viewBox="0 0 32 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M1 19 11 5l6 8 4-5 10 11"/><path d="M8 9.5 11 5l3 4"/></svg>Ver montaña en 3D
      </button>
    </aside>

    <div class="menu-guia entra-abajo">
      <div class="hud caja">
        <b>Tu guía · Jukumari</b>
        <p class="dialogo"></p>
      </div>
      <img src="/img/jukumari-cara.webp" alt="El Jukumari, tu guía">
      <p class="burbuja" role="status" hidden></p>
    </div>

    <p class="menu-credito"></p>

    <div class="menu-modos entra-abajo">
      <div class="selector" role="group" aria-label="Qué mostrar en el carrusel">
        ${CARRUSELES.map((c) => `<button type="button" data-modo="${c.k}" aria-pressed="${c.k === 'glaciares'}">${c.n}</button>`).join('')}
      </div>
      <button type="button" class="ver-planeta" hidden>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/></svg>Ver planeta
      </button>
    </div>

    <div class="menu-picos hud entra-abajo" role="group" aria-label="Glaciares del mundo">
      <button type="button" class="flecha anterior" aria-label="Picos anteriores"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg></button>
      <div class="lista"></div>
      <button type="button" class="flecha siguiente" aria-label="Más picos"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>`;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  // Navegación
  $('.logo-btn').addEventListener('click', () => ir(''));
  raiz.querySelectorAll('.menu-riel [data-ruta]').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.k === 'capas') abrirCapas($('.menu-capas').hidden);
      else if (b.dataset.ruta) ir(b.dataset.ruta);
    });
  });

  // Planeta: globo 3D de Cesium o, si no está, el planeta de la maqueta
  const ranura = $('.menu-planeta');
  let etiqueta = null;
  const planetaMaqueta = () => {
    ranura.classList.add('maqueta');
    ranura.innerHTML = `
      <img class="tierra" src="/img/planeta.webp" alt="La Tierra vista desde el espacio, centrada en Sudamérica, con Perú, Bolivia y Chile">
      <svg class="capa" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs><linearGradient id="menuHaz" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4FF" stop-opacity=".75"/><stop offset="1" stop-color="#9FD4FF" stop-opacity=".05"/></linearGradient></defs>
        <polygon class="haz" points="93,9 47,44 61,56" fill="url(#menuHaz)"/>
        <line x1="54.6" y1="49" x2="61.5" y2="45" stroke="#F2F4F8" stroke-width=".25"/>
      </svg>
      ${SATELITE}
      <span class="marcador" aria-hidden="true"><span class="anillo"></span><span class="anillo" style="animation-delay:1.1s"></span><span class="punto"></span></span>
      <div class="etiqueta" role="status"></div>`;
    etiqueta = ranura.querySelector('.etiqueta');
  };
  import('../../componentes/globo3d.js')
    .then((m) => {
      if (!vivo) return;
      if (typeof m.crearGlobo !== 'function') throw new Error('globo3d.js todavía no exporta crearGlobo');
      globo = m.crearGlobo(ranura, {
        picos: PICOS.map(({ n, h, lat, lon }) => ({ n, h, lat, lon })),
        glaciares: GLACIARES,
        capa: null, // el planeta empieza con la imagen normal (Blue Marble + luces de noche)
        credito: $('.menu-credito'),
        tamano: 0.96, // el planeta llena el 96 % de su caja (.menu-planeta, sin contar el halo)
        alElegir: (g) => { if (vivo) mostrarGlaciar(g, true); } // también al tocar un halo en el globo
      });
      if (import.meta.env.DEV) window.__globo = globo; // para las pruebas en el navegador
      ponerChip(); // si los datos llegaron antes que el globo
    })
    .catch((e) => { console.info('APU: se usa el planeta de la maqueta.', e.message); if (vivo) { planetaMaqueta(); pintarTodo(); } });

  // Carrusel (3 a la vista) de glaciares o picos + etiqueta + diálogo del Jukumari + panel
  const lista = $('.lista');
  const elementos = () => (estado.modo === 'glaciares' ? GLACIARES : PICOS);
  const nombreDe = (x) => x.nombre ?? x.n;
  const esElegido = (i) => (estado.modo === 'glaciares'
    ? estado.elegido === 'glaciar' && GLACIARES[i].id === estado.glaciar
    : estado.elegido === 'pico' && i === estado.pico);

  function pintarCarrusel() {
    const items = elementos();
    $('.menu-picos').setAttribute('aria-label', CARRUSELES.find((c) => c.k === estado.modo).n);
    raiz.querySelectorAll('.menu-modos [data-modo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === estado.modo)));
    lista.innerHTML = [0, 1, 2].map((k) => {
      const i = (estado.ventana[estado.modo] + k) % items.length;
      const sel = esElegido(i);
      return `<button type="button" class="pico${sel ? ' elegido' : ''}" data-i="${i}" aria-pressed="${sel}">${MONTANA}<span>${nombreDe(items[i])}</span></button>`;
    }).join('');
  }

  function pintarEtiqueta(n, sub) { // solo en el planeta de la maqueta (el globo 3D tiene la suya)
    if (!etiqueta) return;
    etiqueta.innerHTML = `${MONTANA}<span><b>${n}</b><span>${sub}</span></span>`;
    etiqueta.classList.remove('nueva'); void etiqueta.offsetWidth; etiqueta.classList.add('nueva');
  }

  // ¿Lo elegido tiene el análisis de 25 años? (la Cordillera Real y sus picos)
  const glaciarActual = () => GLACIARES.find((x) => x.id === estado.glaciar) ?? principal;
  const lugarConDatos = () => estado.elegido === 'pico' || Boolean(glaciarActual().datos);

  // Resumen real de la nieve: cambio entre 2001–05 y 2021–25 (o el último año con datos) y tendencia
  function resumenNieve() {
    const v = region.variables.nieve;
    const ultimo = v.anios.at(-1);
    const prom = (a, b) => { const s = v.anios.map((x, i) => (x >= a && x <= b ? v.anual[i] : null)).filter((x) => x !== null); return s.reduce((t, x) => t + x, 0) / s.length; };
    const cambio = (prom(2021, Math.min(2025, ultimo)) - prom(2001, 2005)) / prom(2001, 2005) * 100;
    return { cambio, real: v.veredicto === 'real', desde: '2001–05', hasta: `2021–${String(Math.min(2025, ultimo)).slice(2)}` };
  }

  // Panel "Historia": el texto del lugar elegido, su resumen (si tiene datos) y "Ver montaña en 3D"
  function pintarPanel() {
    const con = lugarConDatos();
    const g = glaciarActual();
    const p = PICOS[estado.pico];
    $('.titulo-texto').textContent = estado.elegido === 'pico' ? p.n : g.nombre;
    $('.lugar-sub').textContent = estado.elegido === 'pico' ? `${p.h} m s. n. m. · Cordillera Real, Bolivia` : g.pais;
    $('.historia').textContent = estado.textoLugar;
    $('.sin-datos').hidden = con;
    $('.resumen').hidden = !con || !region;
    if (con && region) {
      const r = resumenNieve();
      $('.resumen-valor').textContent = `${r.cambio < 0 ? '↓ −' : '↑ +'}${fmt(Math.abs(r.cambio), 0)} %`;
      $('.resumen-texto').textContent = `Índice de nieve de la Cordillera Real, ${r.desde} frente a ${r.hasta} · ${r.real ? 'Tendencia real' : 'Tendencia: todavía no se sabe'}`;
      $('.resumen').classList.toggle('duda', !r.real);
    }
    const panel = $('.menu-panel');
    panel.classList.remove('abre'); void panel.offsetWidth; panel.classList.add('abre');
  }

  // El Jukumari: con la lluvia (en la montaña) explica la lluvia; si no, habla del lugar elegido
  function pintarDialogo() {
    $('.dialogo').textContent = estado.variable === 'lluvia' && lugarConDatos() ? FRASES.lluvia : estado.textoLugar;
    if (!burbuja.hidden) burbuja.textContent = $('.dialogo').textContent;
  }

  // El chip del globo sobre la Cordillera Real: "La nieve bajó 23 % · Tendencia real" (dato real)
  function ponerChip() {
    if (!region || !globo?.notaGlaciar) return;
    const r = resumenNieve();
    globo.notaGlaciar(principal.id, `La nieve ${r.cambio < 0 ? 'bajó' : 'subió'} ${fmt(Math.abs(r.cambio), 0)} % · ${r.real ? 'Tendencia real' : 'Tendencia: aún no se sabe'}`);
  }

  // La historia se abre cuando el planeta terminó de girar hacia el lugar (vuelo de 1,6 s)
  let esperaHistoria = 0;
  const abrirHistoria = () => {
    clearTimeout(esperaHistoria);
    esperaHistoria = setTimeout(() => { if (vivo) pintarPanel(); }, globo?.viewer ? 1600 : 0);
  };

  function mostrarGlaciar(g, alejarVentana) {
    cerrarMontana();
    estado.elegido = 'glaciar';
    estado.glaciar = g.id;
    estado.cerca = true;
    if (alejarVentana) { // si vino de un toque en el globo, el carrusel pasa a glaciares y lo muestra
      estado.modo = 'glaciares';
      const i = GLACIARES.indexOf(g);
      const v = estado.ventana.glaciares;
      if (![0, 1, 2].some((k) => (v + k) % GLACIARES.length === i)) estado.ventana.glaciares = i;
    }
    estado.textoLugar = g.texto;
    pintarDialogo();
    pintarEtiqueta(g.nombre, g.pais);
    abrirHistoria();
    pintarTodo();
  }

  function mostrarPico(i) {
    cerrarMontana();
    const p = PICOS[i];
    estado.elegido = 'pico';
    estado.pico = i;
    estado.cerca = true;
    estado.textoLugar = `Explora ${p.t}. Con datos reales de NASA comprobamos que la nieve de la Cordillera Real bajó desde 2001.`;
    pintarDialogo();
    pintarEtiqueta(p.n, `${p.h} m s. n. m.`);
    abrirHistoria();
    pintarTodo();
  }

  function pintarTodo() {
    pintarCarrusel();
    const boton = $('.ver-planeta');
    boton.hidden = !estado.cerca && !montana;
    boton.lastChild.textContent = montana ? 'Volver al planeta' : 'Ver planeta';
  }

  lista.addEventListener('click', (e) => {
    const b = e.target.closest('.pico'); if (!b) return;
    const i = Number(b.dataset.i);
    if (estado.modo === 'glaciares') {
      if (globo?.elegirGlaciar) globo.elegirGlaciar(GLACIARES[i].id); // avisa con alElegir → mostrarGlaciar
      else mostrarGlaciar(GLACIARES[i], false);
    } else {
      globo?.elegirPico?.(i);
      mostrarPico(i);
    }
  });
  const mover = (paso) => {
    const n = elementos().length;
    estado.ventana[estado.modo] = (estado.ventana[estado.modo] + n + paso) % n;
    pintarCarrusel();
  };
  $('.anterior').addEventListener('click', () => mover(-1));
  $('.siguiente').addEventListener('click', () => mover(1));
  raiz.querySelectorAll('.menu-modos [data-modo]').forEach((b) => {
    b.addEventListener('click', () => { estado.modo = b.dataset.modo; pintarCarrusel(); });
  });
  $('.ver-planeta').addEventListener('click', () => {
    if (montana) { cerrarMontana(); pintarTodo(); return; } // "Volver al planeta"
    globo?.verPlaneta?.();
    estado.cerca = false;
    pintarTodo();
  });

  // ---------------------------------------------------------------
  // "Ver montaña en 3D": el puente (montanas-puente.js) pone la vista de Jhoel (o "En proceso")
  // en el espacio del planeta y el panel con los datos de NASA a la derecha
  // ---------------------------------------------------------------
  let montana = null;
  let abriendo = false;
  $('.ver-montana').addEventListener('click', async () => {
    if (montana || abriendo) return;
    abriendo = true;
    const lugar = estado.elegido === 'pico'
      ? { tipo: 'pico', ...PICOS[estado.pico], nombre: PICOS[estado.pico].n, pais: 'Bolivia' }
      : glaciarActual();
    try {
      montana = await abrirMontana({
        raiz, glaciar: lugar, region, globo,
        alCambiarVariable: (v) => { estado.variable = v; pintarDialogo(); }
      });
    } finally {
      abriendo = false;
    }
    if (!vivo) { montana?.cerrar(); montana = null; return; }
    pintarTodo();
    $('.ver-planeta').focus();
  });
  function cerrarMontana() {
    if (!montana) return;
    montana.cerrar();
    montana = null;
  }

  // El Jukumari es solo una carita (en todas las pantallas, para dejar libre el espacio bajo el
  // planeta); al tocarla dice su texto en un globo de diálogo que se cierra a los 5 s o al tocar fuera.
  const bajas = window.matchMedia('all');
  const cara = $('.menu-guia img');
  const burbuja = $('.menu-guia .burbuja');
  let cierre = 0;
  const cerrarBurbuja = () => { clearTimeout(cierre); burbuja.hidden = true; };
  const abrirBurbuja = () => {
    burbuja.textContent = $('.dialogo').textContent;
    burbuja.hidden = false;
    burbuja.classList.remove('nueva'); void burbuja.offsetWidth; burbuja.classList.add('nueva');
    clearTimeout(cierre);
    cierre = setTimeout(cerrarBurbuja, 5000);
  };
  const ajustarCara = () => {
    if (bajas.matches) { cara.setAttribute('role', 'button'); cara.tabIndex = 0; cara.setAttribute('aria-label', 'Escuchar al Jukumari, tu guía'); }
    else { cara.removeAttribute('role'); cara.removeAttribute('tabindex'); cara.removeAttribute('aria-label'); cerrarBurbuja(); }
  };
  ajustarCara();
  bajas.addEventListener('change', ajustarCara);
  cara.addEventListener('click', () => { if (bajas.matches) (burbuja.hidden ? abrirBurbuja() : cerrarBurbuja()); });
  cara.addEventListener('keydown', (e) => { if (bajas.matches && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirBurbuja(); } });
  // Menú "Capas de datos": al lado del riel, a la altura de su botón
  const botonCapas = $('.menu-riel [data-k="capas"]');
  const menuCapas = $('.menu-capas');
  function abrirCapas(abrir) {
    menuCapas.hidden = !abrir;
    botonCapas.setAttribute('aria-expanded', String(abrir));
    if (!abrir) return;
    const base = raiz.getBoundingClientRect();
    const rb = botonCapas.getBoundingClientRect();
    const rr = $('.menu-riel').getBoundingClientRect();
    menuCapas.style.left = `${rr.right - base.left + 10}px`;
    menuCapas.style.top = `${Math.max(8, Math.min(rb.top - base.top + rb.height / 2 - menuCapas.offsetHeight / 2, base.height - menuCapas.offsetHeight - 8))}px`;
    (menuCapas.querySelector('[aria-checked="true"]') ?? menuCapas.querySelector('button')).focus();
  }
  menuCapas.addEventListener('click', (e) => {
    const b = e.target.closest('[role="menuitemradio"]'); if (!b) return;
    elegirCapa(b.dataset.capa || null);
    abrirCapas(false);
    botonCapas.focus();
  });
  menuCapas.addEventListener('keydown', (e) => {
    const items = [...menuCapas.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { abrirCapas(false); botonCapas.focus(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + items.length - 1) % items.length].focus(); }
  });

  // Pide la capa al globo; si NASA no responde, el globo queda como estaba y el panel lo dice
  function pedirCapa(capa, fecha) {
    $('.aviso-capa').hidden = true;
    if (!globo?.mostrarCapa) { $('.aviso-capa').hidden = !capa; return; } // planeta de la maqueta: no hay capas
    globo.mostrarCapa(capa, fecha).then((r) => {
      if (vivo && !r.ok && r.motivo === 'sin-respuesta') $('.aviso-capa').hidden = false;
    });
  }


  function elegirCapa(capa) {
    estado.capa = capa;
    menuCapas.querySelectorAll('[data-capa]').forEach((b) => b.setAttribute('aria-checked', String((b.dataset.capa || null) === capa)));
    pedirCapa(capa);
  }

  const tocarFuera = (e) => {
    if (!burbuja.hidden && !e.target.closest('.menu-guia')) cerrarBurbuja();
    if (!menuCapas.hidden && !e.target.closest('.menu-capas') && !e.target.closest('[data-k="capas"]')) abrirCapas(false);
  };
  document.addEventListener('pointerdown', tocarFuera);
  quitarAlSalir = () => { document.removeEventListener('pointerdown', tocarFuera); bajas.removeEventListener('change', ajustarCara); clearTimeout(cierre); clearTimeout(esperaHistoria); cerrarMontana(); };

  // Al empezar: nuestro caso, la Cordillera Real, con el planeta completo
  pintarDialogo();
  pintarEtiqueta(principal.nombre, principal.pais);
  pintarPanel();
  pintarTodo();

  cargarRegion('cordillera-real').then((datos) => {
    if (!vivo) return;
    region = datos;
    pintarPanel();
    ponerChip();
    montana?.ponerRegion(datos);
  }).catch((e) => {
    console.warn('APU: no se pudieron leer los datos de la Cordillera Real.', e);
    $('.resumen').hidden = true;
  });
}

export function desmontar() {
  vivo = false;
  quitarAlSalir?.();
  quitarAlSalir = null;
  globo?.destruir?.();
  globo = null;
}