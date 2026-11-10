// Pantalla: menú "Monitoreo glaciar" · Responsable: Melissa
// Copia fiel de la maqueta "APU · Diseño visual del juego" → Pantalla 2 (ApuInicio).
// Datos REALES: frontend/public/datos/cordillera-real.json (MODIS MOD10A1, calculado en backend/).
// Globo: si componentes/globo3d.js exporta crearGlobo(), se usa el globo 3D de Cesium;
// si no (o si falla), se muestra el planeta de la maqueta con su marcador y satélite.
import './menu.css';
import { ir } from '../../router.js';
import { cargarRegion } from '../../servicios/datos.js';
import { GLACIARES } from '../../contenido/glaciares.js';
import { FRASES } from '../../contenido/frases-jukumari.js';
import { crearClima } from '../../componentes/clima-particulas.js';

const PICOS = [
  { n: 'Illimani', h: '6 438', lat: -16.64, lon: -67.79, t: 'el Illimani, el guardián de La Paz' },
  { n: 'Huayna Potosí', h: '6 088', lat: -16.26, lon: -68.15, t: 'el Huayna Potosí, muy cerca de El Alto' },
  { n: 'Condoriri', h: '5 648', lat: -16.17, lon: -68.25, t: 'el Condoriri, la "cabeza de cóndor"' },
  { n: 'Illampu', h: '6 368', lat: -15.83, lon: -68.57, t: 'el Illampu, al norte de la cordillera' },
  { n: 'Chacaltaya', h: '5 421', lat: -16.35, lon: -68.13, t: 'el Chacaltaya, donde hubo una pista de esquí' },
  { n: 'Mururata', h: '5 869', lat: -16.53, lon: -67.78, t: 'el Mururata, vecino del Illimani' }
];
const PERIODOS = [[2001, 2005, 2021, 2025], [2006, 2010, 2016, 2020]];
const ANIOS_TIEMPO = [2001, 2025]; // máquina del tiempo: nieve MODIS del 15 de agosto de cada año
const PASO_PLAY = 1200;            // ms por año al reproducir
const INTRO_CR = 'Explora la nieve de la Cordillera Real y analiza su evolución con datos reales del satélite MODIS de NASA.';
const SIN_DATOS = 'Aquí vemos la nieve del satélite MODIS. El análisis de 25 años de este glaciar todavía no está en APU.';
const AVISO_CAPA = 'No se pudo cargar la capa de NASA. Los números del panel son los mismos.';
// Capas del botón "Capas de datos" (variable = qué datos muestra el panel)
const CAPAS_MENU = [
  { capa: 'nieve', n: 'Nieve (MODIS)', variable: 'nieve' },
  { capa: 'lluvia', n: 'Lluvia (GPM IMERG)', variable: 'lluvia' },
  { capa: 'hoy', n: 'Hoy (nubes, MODIS)', variable: 'nieve' },
  { capa: null, n: 'Sin capa', variable: 'nieve' }
];
// Textos del panel según la variable (los números salen de cordillera-real.json)
const VARIABLES = {
  nieve: {
    titulo: 'Monitoreo glaciar', intro: INTRO_CR, cambio: 'Índice de nieve',
    grafico: 'Índice de nieve por año', fuente: 'Línea amarilla: tendencia · Fuente: NASA MODIS (MOD10A1), Cordillera Real',
    color: '#8FDBFF', area: '#5BA0FF', decimales: 2, escala: [1.2, 3.0]
  },
  lluvia: {
    titulo: 'Lluvia en la cordillera', cambio: 'Lluvia',
    intro: 'Mira cuánta lluvia cayó cada año en la Cordillera Real, con datos reales del satélite GPM (IMERG) de NASA.',
    grafico: 'Lluvia por año (mm por año)', fuente: 'Línea amarilla: tendencia · Fuente: NASA GPM IMERG (mensual), Cordillera Real',
    color: '#4F8DFF', area: '#4F8DFF', decimales: 0, escala: null // --dato-lluvia; escala según los datos
  }
};
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
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const nombreMes = (m) => `${MESES_LARGOS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`; // '2018-01' → 'Enero 2018'

let globo = null;
let vivo = false;
let quitarAlSalir = null; // listeners en document que hay que quitar al salir del menú

export function montar(contenedor) {
  vivo = true;
  const principal = GLACIARES.find((g) => g.principal) ?? GLACIARES[0];
  // modo: qué muestra el carrusel · elegido: lo último elegido ('glaciar' o 'pico')
  const estado = {
    modo: 'glaciares', elegido: 'glaciar', glaciar: principal.id, pico: 0,
    ventana: { glaciares: 0, picos: 0 }, periodo: 0, cerca: false,
    capa: 'nieve', variable: 'nieve', anio: null, textoLugar: principal.texto
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

    <aside class="menu-panel hud entra-der" aria-label="Monitoreo glaciar">
      <div>
        <h2><span class="barras" aria-hidden="true">//</span><span class="titulo-texto">Monitoreo glaciar</span></h2>
        <p class="intro">${INTRO_CR}</p>
      </div>
      <div class="linea" aria-hidden="true"></div>
      <p class="aviso-capa" role="status" hidden>${AVISO_CAPA}</p>
      <p class="sin-datos" hidden>${SIN_DATOS}</p>
      <div class="con-datos">
      <div class="comparar">
        <label for="menu-periodo">Comparar periodo
          <select id="menu-periodo">
            <option value="0">2001–05 / 2021–25</option>
            <option value="1">2006–10 / 2016–20</option>
          </select>
        </label>
        <div class="cambio"><b class="cambio-valor">…</b><span class="cambio-etiqueta">Índice de nieve</span></div>
      </div>
      <span class="nota nota-periodo" hidden></span>
      <div class="clima" role="group" aria-label="Nevada y lluvia según el dato de cada mes">
        <div class="clima-fila">
          <button type="button" data-clima="nieve" aria-pressed="false">❄ Nevada</button>
          <button type="button" data-clima="lluvia" aria-pressed="false">☂ Lluvia</button>
          <select class="clima-mes" aria-label="Mes del dato"></select>
        </div>
        <p class="clima-valor" aria-live="polite" hidden></p>
        <span class="nota">Efecto visual: la intensidad sale del dato de NASA de ese mes.</span>
      </div>
      <div class="ilustrativas">
      <div class="miniaturas">
        <figure><img src="/img/ilustrativa-antes.webp" alt="Imagen ilustrativa de la montaña con más nieve"><figcaption class="anio-antes"></figcaption></figure>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#F2F4F8" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>
        <figure><img src="/img/ilustrativa-despues.webp" alt="Imagen ilustrativa de la montaña con menos nieve"><figcaption class="anio-despues"></figcaption></figure>
      </div>
      <span class="nota">Imágenes ilustrativas. En la app: foto real de NASA de cada fecha.</span>
      </div>
      <div class="tarjetas"></div>
      <figure class="grafico">
        <figcaption><span class="titulo-graf">Índice de nieve por año</span> · <span class="rango"></span></figcaption>
        <svg role="img" viewBox="0 0 300 110"></svg>
        <span class="nota fuente-graf">Línea amarilla: tendencia · Fuente: NASA MODIS (MOD10A1), Cordillera Real</span>
        <button type="button" class="ver-barras" aria-pressed="false">▥ Ver los años en 3D</button>
        <span class="nota nota-barras" aria-live="polite" hidden></span>
      </figure>
      </div>
    </aside>

    <div class="menu-fechas" role="group" aria-label="Máquina del tiempo: nieve de cada año" hidden>
      <button type="button" class="reciente" aria-pressed="true">Más reciente</button>
      <button type="button" class="play" aria-pressed="false" aria-label="Reproducir los años">▶</button>
      <input type="range" class="anio" min="${ANIOS_TIEMPO[0]}" max="${ANIOS_TIEMPO[1]}" step="1" value="${ANIOS_TIEMPO[0]}" aria-label="Año de la nieve (15 de agosto)">
      <output class="anio-valor" aria-live="polite">15 ago</output>
    </div>

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
        credito: $('.menu-credito'),
        alElegir: (g) => { if (vivo) mostrarGlaciar(g, true); } // también al tocar un halo en el globo
      });
      if (import.meta.env.DEV) window.__globo = globo; // para las pruebas en el navegador
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

  // Panel: datos de la variable elegida (nieve o lluvia) o el aviso de que aún no hay análisis
  function pintarPanel() {
    const con = lugarConDatos();
    const V = VARIABLES[estado.variable];
    const g = glaciarActual();
    $('.titulo-texto').textContent = con ? V.titulo : 'Monitoreo glaciar';
    $('.intro').textContent = con ? V.intro : `Explora ${g.nombre} (${g.pais}) con las capas de los satélites de NASA.`;
    $('.con-datos').hidden = !con;
    $('.sin-datos').hidden = con;
    if (!con && tipoClima) { tipoClima = null; pintarClima(); } // el efecto es de la Cordillera Real
    if (!con) apagarBarras();
    if (con && region) pintarVariable();
  }

  // El Jukumari: con la lluvia explica la lluvia; si no, habla del lugar elegido
  function pintarDialogo() {
    $('.dialogo').textContent = estado.variable === 'lluvia' && lugarConDatos() ? FRASES.lluvia : estado.textoLugar;
    if (!burbuja.hidden) burbuja.textContent = $('.dialogo').textContent;
  }

  function mostrarGlaciar(g, alejarVentana) {
    apagarBarras();
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
    pintarPanel();
    pintarTodo();
  }

  function mostrarPico(i) {
    apagarBarras();
    const p = PICOS[i];
    estado.elegido = 'pico';
    estado.pico = i;
    estado.cerca = true;
    estado.textoLugar = `Explora ${p.t}. Con datos reales de NASA comprobamos que la nieve de la Cordillera Real bajó desde 2001.`;
    pintarDialogo();
    pintarEtiqueta(p.n, `${p.h} m s. n. m.`);
    pintarPanel();
    pintarTodo();
  }

  function pintarTodo() {
    pintarCarrusel();
    $('.ver-planeta').hidden = !estado.cerca;
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
    apagarBarras();
    globo?.verPlaneta?.();
    estado.cerca = false;
    pintarTodo();
  });

  // Pantallas bajas (celular horizontal): el Jukumari es solo una carita; al tocarla dice su texto
  // en un globo de diálogo que se cierra a los 5 s o al tocar fuera.
  const bajas = window.matchMedia('(max-height: 500px)');
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
    estado.variable = CAPAS_MENU.find((c) => c.capa === capa).variable;
    estado.anio = null;
    menuCapas.querySelectorAll('[data-capa]').forEach((b) => b.setAttribute('aria-checked', String((b.dataset.capa || null) === capa)));
    pedirCapa(capa);
    pintarPanel();
    if (conBarras) pintarBarras(); // las barras pasan a la otra variable
    pintarDialogo();
    pintarFechas();
  }

  // Máquina del tiempo: nieve MODIS del 15 de agosto de cada año (2001–2025) o la más reciente.
  // estado.anio = null → la más reciente. El año elegido se marca en el gráfico con su índice real.
  const deslizador = $('.menu-fechas .anio');
  const botonPlay = $('.menu-fechas .play');
  let reloj = 0;
  function verAnio(anio) {
    estado.anio = anio;
    deslizador.value = String(anio);
    pintarFechas();
    $('.anio-valor').textContent = `… ${anio}`; // mientras NASA responde
    if (region && estado.variable === 'nieve' && lugarConDatos()) pintarVariable();
    if (conBarras && region) globo?.destacarBarra?.(barraDestacada());
    $('.aviso-capa').hidden = true;
    if (!globo?.mostrarNieveDelAnio) { $('.aviso-capa').hidden = false; return; } // planeta de la maqueta
    globo.mostrarNieveDelAnio(anio).then((r) => {
      if (!vivo || estado.anio !== anio) return;
      if (!r.ok && r.motivo === 'sin-respuesta') $('.aviso-capa').hidden = false;
      $('.anio-valor').textContent = r.ok ? `${Number(r.fecha.slice(8))} ago ${anio}` : `${anio}: sin imagen`;
    });
  }
  function parar() {
    clearInterval(reloj);
    reloj = 0;
    botonPlay.setAttribute('aria-pressed', 'false');
    botonPlay.textContent = '▶';
    botonPlay.setAttribute('aria-label', 'Reproducir los años');
  }
  botonPlay.addEventListener('click', () => {
    if (reloj) { parar(); return; }
    // Empieza en 2001 (o donde estaba) y avanza 1 año cada 1,2 s hasta 2025
    let anio = estado.anio === null || estado.anio >= ANIOS_TIEMPO[1] ? ANIOS_TIEMPO[0] : estado.anio;
    verAnio(anio);
    botonPlay.setAttribute('aria-pressed', 'true');
    botonPlay.textContent = '❚❚';
    botonPlay.setAttribute('aria-label', 'Pausar');
    reloj = setInterval(() => {
      anio += 1;
      if (anio > ANIOS_TIEMPO[1]) { parar(); return; }
      verAnio(anio);
    }, PASO_PLAY);
  });
  deslizador.addEventListener('input', () => { parar(); verAnio(Number(deslizador.value)); });
  $('.menu-fechas .reciente').addEventListener('click', () => {
    parar();
    estado.anio = null;
    pintarFechas();
    if (region && estado.variable === 'nieve' && lugarConDatos()) pintarVariable();
    if (conBarras && region) globo?.destacarBarra?.(barraDestacada());
    pedirCapa('nieve');
  });
  function pintarFechas() {
    const visible = estado.capa === 'nieve';
    if (!visible) parar();
    $('.menu-fechas').hidden = !visible;
    raiz.classList.toggle('con-fechas', visible);
    $('.menu-fechas .reciente').setAttribute('aria-pressed', String(estado.anio === null));
    deslizador.classList.toggle('activo', estado.anio !== null);
    if (estado.anio === null) $('.anio-valor').textContent = '15 ago';
  }

  // Nevada / Lluvia según el dato: la intensidad es el valor real del mes elegido
  // (variables.nieve.valores o variables.lluvia.valores) entre el mínimo y el máximo de la serie.
  let clima = null;
  let tipoClima = null; // 'nieve' | 'lluvia' | null
  const selMes = $('.clima-mes');
  function llenarMeses(tipo) {
    const v = region.variables[tipo];
    const anterior = selMes.value;
    // Del más reciente al más antiguo, agrupados por año
    const porAnio = new Map();
    v.meses.forEach((m) => { const a = m.slice(0, 4); if (!porAnio.has(a)) porAnio.set(a, []); porAnio.get(a).push(m); });
    selMes.innerHTML = [...porAnio].reverse().map(([a, ms]) => `<optgroup label="${a}">${ms.slice().reverse().map((m) => `<option value="${m}">${nombreMes(m)}</option>`).join('')}</optgroup>`).join('');
    selMes.value = v.meses.includes(anterior) ? anterior : v.meses[v.meses.length - 1];
  }
  function apagarClima() {
    clima?.destruir();
    clima = null;
  }
  function pintarClima() {
    raiz.querySelectorAll('.clima [data-clima]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.clima === tipoClima)));
    const valor = $('.clima-valor');
    apagarClima();
    if (!tipoClima) { valor.hidden = true; return; }
    valor.hidden = false;
    if (!region) { valor.textContent = 'Cargando los datos…'; return; }
    const v = region.variables[tipoClima];
    const i = v.meses.indexOf(selMes.value);
    if (i < 0) { valor.textContent = 'Ese mes no tiene dato.'; return; }
    const x = v.valores[i];
    const min = Math.min(...v.valores);
    const max = Math.max(...v.valores);
    const intensidad01 = (x - min) / (max - min);
    const dato = tipoClima === 'lluvia' ? `${Math.round(x)} mm` : `índice de nieve ${fmt(x, 2)}`;
    valor.textContent = `${nombreMes(v.meses[i])} · ${dato}`;
    if (!globo?.viewer) { valor.textContent += ' · el efecto necesita el globo 3D'; return; }
    clima = crearClima(globo.viewer, { tipo: tipoClima, intensidad01 });
    if (!clima.animado) valor.textContent += ' · sin animación (menos movimiento)';
  }
  raiz.querySelectorAll('.clima [data-clima]').forEach((b) => {
    b.addEventListener('click', () => {
      tipoClima = tipoClima === b.dataset.clima ? null : b.dataset.clima;
      if (tipoClima && region) llenarMeses(tipoClima);
      pintarClima();
    });
  });
  selMes.addEventListener('change', pintarClima);

  // Barras 3D: los años del gráfico como columnas sobre la Cordillera Real (cámara inclinada)
  let conBarras = false;
  const botonBarras = $('.ver-barras');
  const notaBarras = $('.nota-barras');
  const barraDestacada = () => {
    const anios = region.variables[estado.variable].anios;
    return estado.anio !== null && anios.includes(estado.anio) ? estado.anio : anios[anios.length - 1];
  };
  function pintarBarras() {
    botonBarras.setAttribute('aria-pressed', String(conBarras));
    botonBarras.textContent = conBarras ? '✕ Quitar las barras 3D' : '▥ Ver los años en 3D';
    notaBarras.hidden = true;
    if (!conBarras) { globo?.quitarBarras?.(); return; }
    if (!region) { notaBarras.hidden = false; notaBarras.textContent = 'Cargando los datos…'; return; }
    const v = region.variables[estado.variable];
    const lluvia = estado.variable === 'lluvia';
    const r = globo?.mostrarBarras?.({ anios: v.anios, valores: v.anual, destacado: barraDestacada(),
      decimales: lluvia ? 0 : 2, unidad: lluvia ? ' mm' : '' });
    notaBarras.hidden = false;
    notaBarras.textContent = r?.ok
      ? `${v.anios[0]} (Illampu) → ${v.anios[v.anios.length - 1]} (Illimani). Alto = ${lluvia ? 'lluvia del año' : 'índice de nieve del año'}. Toca una columna.`
      : 'Las barras necesitan el globo 3D.';
    if (r?.ok) { estado.cerca = true; pintarTodo(); }
  }
  function apagarBarras() {
    if (!conBarras) return;
    conBarras = false;
    pintarBarras();
  }
  botonBarras.addEventListener('click', () => {
    conBarras = !conBarras;
    pintarBarras();
    if (!conBarras) { globo?.verPlaneta?.(); estado.cerca = false; pintarTodo(); }
  });

  const tocarFuera = (e) => {
    if (!burbuja.hidden && !e.target.closest('.menu-guia')) cerrarBurbuja();
    if (!menuCapas.hidden && !e.target.closest('.menu-capas') && !e.target.closest('[data-k="capas"]')) abrirCapas(false);
  };
  document.addEventListener('pointerdown', tocarFuera);
  quitarAlSalir = () => { document.removeEventListener('pointerdown', tocarFuera); bajas.removeEventListener('change', ajustarCara); clearTimeout(cierre); parar(); apagarClima(); };

  // Al empezar: nuestro caso, la Cordillera Real, con el planeta completo y la capa de nieve
  pintarDialogo();
  pintarEtiqueta(principal.nombre, principal.pais);
  pintarTodo();
  pintarFechas();

  // Panel con datos reales (cordillera-real.json)
  $('#menu-periodo').addEventListener('change', (e) => { estado.periodo = Number(e.target.value); if (region) pintarVariable(); });

  function pintarVariable() {
    const V = VARIABLES[estado.variable];
    const v = region.variables[estado.variable];
    const anios = v.anios, valores = v.anual, n = valores.length;
    const ultimo = anios[n - 1];
    const lluvia = estado.variable === 'lluvia';
    const real = v.veredicto === 'real';

    // Cambio entre periodos (el segundo periodo llega hasta el último año con datos)
    const promedio = (a, b) => { const s = anios.map((x, i) => (x >= a && x <= b ? valores[i] : null)).filter((x) => x !== null); return s.reduce((t, x) => t + x, 0) / s.length; };
    const periodo = (p) => [p[0], p[1], p[2], Math.min(p[3], ultimo)];
    const etiquetaPer = (p) => `${p[0]}–${String(p[1]).slice(2)} / ${p[2]}–${String(p[3]).slice(2)}`;
    [...$('#menu-periodo').options].forEach((o, i) => { o.textContent = etiquetaPer(periodo(PERIODOS[i])); });
    const per = periodo(PERIODOS[estado.periodo]);
    const cambio = (promedio(per[2], per[3]) - promedio(per[0], per[1])) / promedio(per[0], per[1]) * 100;
    $('.cambio-valor').textContent = `${cambio < 0 ? '↓ −' : '↑ +'}${fmt(Math.abs(cambio), 0)} %`;
    $('.cambio-etiqueta').textContent = V.cambio;
    $('.cambio').classList.toggle('duda', !real); // sin tendencia real: amarillo, no rojo
    // Si el periodo se recortó (la lluvia llega a 2024), se explica por qué falta el año
    const falta = PERIODOS[estado.periodo][3];
    $('.nota-periodo').hidden = falta <= ultimo;
    $('.nota-periodo').textContent = `${falta} no entra porque aún no tiene todos sus meses`;
    $('.anio-antes').textContent = `${per[0]}–${String(per[1]).slice(2)}`;
    $('.anio-despues').textContent = `${per[2]}–${String(per[3]).slice(2)}`;
    $('.ilustrativas').hidden = lluvia; // las fotos ilustrativas son de nieve

    // Tarjetas
    const iMin = valores.indexOf(Math.min(...valores));
    $('.tarjetas').innerHTML = [
      lluvia ? ['☂', `Lluvia ${ultimo}`, `${fmt(valores[n - 1], 0)} mm por año`, ''] : ['❄', `Índice de nieve ${ultimo}`, `${fmt(valores[n - 1], 2)} / 100`, ''],
      ['▲', lluvia ? 'Año con menos lluvia' : 'Año con menos nieve', String(anios[iMin]), ''],
      ['↘', 'Cambio por década', lluvia ? `${fmt(v.tendencia_por_decada, 1)} mm por año` : fmt(v.tendencia_por_decada, 2), ''],
      [real ? '✓' : '?', 'Tendencia', `${real ? 'Real' : 'Todavía no se sabe'} · p = ${fmt(v.p, 2)}`, real ? ' alerta' : ' duda']
    ].map(([ic, et, val, cl]) => `<div class="tarjeta${cl}"><span class="icono" aria-hidden="true">${ic}</span><span class="texto"><span>${et}</span><b>${val}</b></span></div>`).join('');

    // Gráfico: valores anuales + línea de tendencia (pendiente real por década)
    const [min, max] = V.escala ?? [Math.min(...valores) * 0.95, Math.max(...valores) * 1.05];
    const X = (i) => 12 + i * (284 / (n - 1));
    const Y = (x) => 96 - (x - min) / (max - min) * 84;
    const linea = valores.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(' ');
    const pend = v.tendencia_por_decada / 10;
    const med = [...valores].sort((a, b) => a - b)[Math.floor(n / 2)];
    const mitad = (n - 1) / 2;
    $('.titulo-graf').textContent = V.grafico;
    $('.fuente-graf').textContent = V.fuente;
    $('.rango').textContent = `${anios[0]}–${ultimo}`;
    const svg = $('.grafico svg');
    const que = lluvia ? 'Lluvia por año' : 'Índice de nieve';
    svg.setAttribute('aria-label', `${que} de la Cordillera Real de ${anios[0]} a ${ultimo}: empieza en ${fmt(valores[0], V.decimales)} y termina en ${fmt(valores[n - 1], V.decimales)}, ${real ? 'con tendencia a la baja' : 'sin una tendencia segura todavía'}.`);
    svg.innerHTML = `
      <defs><linearGradient id="menuArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V.area}" stop-opacity=".55"/><stop offset="1" stop-color="${V.area}" stop-opacity="0"/></linearGradient></defs>
      <line x1="12" y1="96" x2="296" y2="96" stroke="rgba(242,244,248,.4)"/>
      <line x1="12" y1="10" x2="12" y2="96" stroke="rgba(242,244,248,.4)"/>
      <path d="${linea} L296 96 L12 96 Z" fill="url(#menuArea)"/>
      <path class="linea-graf" d="${linea}" fill="none" stroke="${V.color}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M12 ${Y(med - pend * mitad).toFixed(1)} L296 ${Y(med + pend * mitad).toFixed(1)}" fill="none" stroke="#F9C80E" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round"/>
      <circle cx="12" cy="${Y(valores[0]).toFixed(1)}" r="3.4" fill="${V.color}"/>
      <circle cx="296" cy="${Y(valores[n - 1]).toFixed(1)}" r="4.6" fill="#0B192E" stroke="#D12021" stroke-width="2.4"/>
      <text x="16" y="${(Y(valores[0]) - 5).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" font-family="Inter, sans-serif">${fmt(valores[0], V.decimales)}</text>
      <text x="292" y="${(Y(valores[n - 1]) - 9).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" text-anchor="end" font-family="Inter, sans-serif">${fmt(valores[n - 1], V.decimales)}</text>
      <text x="12" y="108" fill="#A9B4CC" font-size="9" font-family="Inter, sans-serif">${anios[0]}</text>
      <text x="296" y="108" fill="#A9B4CC" font-size="9" text-anchor="end" font-family="Inter, sans-serif">${ultimo}</text>
      ${marcaAnio()}`;

    // Máquina del tiempo: el año que se ve en el globo, con su índice real de ese año
    function marcaAnio() {
      const i = estado.anio === null || lluvia ? -1 : anios.indexOf(estado.anio);
      if (i < 0) return '';
      const x = X(i), y = Y(valores[i]);
      const texto = `${anios[i]} · ${fmt(valores[i], V.decimales)}`;
      const ancla = x > 210 ? 'end' : x < 90 ? 'start' : 'middle';
      return `<line x1="${x.toFixed(1)}" y1="10" x2="${x.toFixed(1)}" y2="96" stroke="#F2F4F8" stroke-opacity=".55" stroke-dasharray="2 2"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#F2F4F8" stroke="#0B192E" stroke-width="1.5"/>
        <text x="${x.toFixed(1)}" y="8" fill="#F2F4F8" font-size="9.5" font-weight="700" text-anchor="${ancla}" font-family="Inter, sans-serif">${texto}</text>`;
    }
    svg.setAttribute('aria-label', svg.getAttribute('aria-label') + (estado.anio !== null && !lluvia && anios.includes(estado.anio)
      ? ` Año marcado: ${estado.anio}, índice ${fmt(valores[anios.indexOf(estado.anio)], V.decimales)}.` : ''));
  }

  cargarRegion('cordillera-real').then((datos) => {
    if (!vivo) return;
    region = datos;
    pintarPanel();
    llenarMeses(tipoClima ?? 'nieve'); // el selector nunca queda vacío
    if (tipoClima) pintarClima();      // se eligió antes de que llegaran los datos
    if (conBarras) pintarBarras();
  }).catch((e) => {
    console.warn('APU: no se pudieron leer los datos de la Cordillera Real.', e);
    $('.tarjetas').innerHTML = '<p class="nota">No se pudieron cargar los datos. Revisa que exista public/datos/cordillera-real.json.</p>';
  });
}

export function desmontar() {
  vivo = false;
  quitarAlSalir?.();
  quitarAlSalir = null;
  globo?.destruir?.();
  globo = null;
}
