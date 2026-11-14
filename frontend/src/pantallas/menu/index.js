// Pantalla: menú del planeta · Responsable: Melissa
// El planeta es para explorar: grande, centrado y siempre entero, con un pin por glaciar.
// Al tocar un pin, la cámara baja a ~350 km sobre el glaciar (el globo ocupa todo el espacio libre), y se abre la pestaña
// de historia (portada, línea de tiempo, dato grande y "VER MONTAÑA EN 3D", que abre
// montanas-puente.js). El Jukumari es el asistente de toda la app (componentes/jukumari-asistente.js):
// el menú le avisa con 'apu:contexto' cuándo se abre la historia de un glaciar o la montaña.
// Textos y datos de cada glaciar: contenido/glaciares.js. Datos de NASA de la montaña:
// frontend/public/datos/cordillera-real.json.
// Globo: si componentes/globo3d.js exporta crearGlobo(), se usa el globo 3D de Cesium;
// si no (o si falla), se muestra el planeta de la maqueta.
import './menu.css';
import '../carga/carga.css'; // el botón con cuña roja (.btn-mision)
import './montanas-puente.css';
import { ir } from '../../router.js';
import { cargarRegion } from '../../servicios/datos.js';
import { GLACIARES, historiaDe } from '../../contenido/glaciares.js';
import { abrirMontana } from './montanas-puente.js';
import { leerProgreso, verGlaciar, casosResueltos, estadoCaso } from '../../servicios/progreso.js';
import { LECCIONES } from '../../contenido/lecciones.js';
import { CASOS } from '../../contenido/casos.js';
import { apagarEscena3d } from '../../servicios/escena3d-estado.js';
import { darInsignia } from '../../componentes/nueva-insignia.js';
import { crearEnVivo } from '../../componentes/en-vivo.js';

const AVISO_CAPA = 'No se pudo cargar la capa de NASA. El planeta sigue con la imagen normal.';
const EN_PREPARACION = 'En preparación';

const svg = (trazos, ancho = 1.6) => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${ancho}" stroke-linecap="round" stroke-linejoin="round">${trazos}</svg>`;
// Íconos del riel
const ICONOS = {
  explorar: '<circle cx="12" cy="12" r="5.6"/><ellipse cx="12" cy="12" rx="10.6" ry="3.6" transform="rotate(-22 12 12)"/>',
  entrenar: '<path d="M12 6.6C10 5 7 4.4 2.8 4.9v13.4c4.2-.5 7.2.1 9.2 1.7 2-1.6 5-2.2 9.2-1.7V4.9C17 4.4 14 5 12 6.6z"/><path d="M12 6.6V20"/>',
  casos: '<path d="M13.5 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5.5"/><path d="M13.5 3 19 8.5V11"/><path d="M13.5 3v5.5H19"/><circle cx="16" cy="16" r="3.2"/><path d="m18.4 18.4 2.6 2.6"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
};
const RIEL = [
  { k: 'explorar', n: 'Explorar', ruta: null, actual: true },
  { k: 'entrenar', n: 'Entrenar', ruta: 'etapas' },
  { k: 'casos', n: 'Casos', ruta: 'casos' },
  { k: 'ajustes', n: 'Ajustes', ruta: 'ajustes', aparte: true }
];
// Capas: el botón (3 rombos ↔ ✕) y sus opciones. FONDO: uno a la vez. CAPAS: se prenden y se apagan.
const ICONO_CAPAS = svg('<path d="M12 3 20 7 12 11 4 7z"/><path d="M4 12.5 12 16.5 20 12.5" opacity=".75"/><path d="M4 18 12 22 20 18" opacity=".5"/>');
const ICONO_CERRAR = svg('<path d="M6 6l12 12M18 6 6 18"/>', 2.2);
const FONDOS = [
  { capa: '', n: 'Mapa normal', i: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/>' },
  { capa: 'hoy', n: 'Nubes de hoy', i: '<path d="M7 18.5h10.2a4.3 4.3 0 0 0 .4-8.6A6 6 0 0 0 6 9.4a4.6 4.6 0 0 0 1 9.1z"/>' }
];
const CAPAS = [
  { k: 'eventos', n: 'Eventos en vivo', si: true, i: '<circle cx="12" cy="10.5" r="1.7"/><path d="M8.6 7.1a4.8 4.8 0 0 0 0 6.8M15.4 7.1a4.8 4.8 0 0 1 0 6.8M5.8 4.3a8.8 8.8 0 0 0 0 12.4M18.2 4.3a8.8 8.8 0 0 1 0 12.4M12 12.2V21"/>' },
  { k: 'foto-dia', n: 'MODIS del día', si: false, t: 'Foto MODIS de 250 m del día despejado de cada glaciar, en la lupa', i: '<rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1" transform="rotate(45 12 12)"/><path d="M4.5 4.5l3.6 3.6M15.9 15.9l3.6 3.6M3 8.4 8.4 3M15.6 21 21 15.6"/>' }
];
const AVISO_NUBES = 'Cargando nubes de NASA…';
const MONTANA = '<svg aria-hidden="true" viewBox="0 0 32 20" fill="none" stroke="#F2F4F8" stroke-width="1.7" stroke-linejoin="round"><path d="M1 19 11 5l6 8 4-5 10 11"/><path d="M8 9.5 11 5l3 4"/></svg>';

// "BOLIVIA · 16,2° S · 68,2° O"
const grados = (v, pos, neg) => `${Math.abs(v).toFixed(1).replace('.', ',')}° ${v < 0 ? neg : pos}`;
const lugarDe = (g) => `${g.pais.toUpperCase()} · ${grados(g.lat, 'N', 'S')} · ${grados(g.lon, 'E', 'O')}`;
// Números en formato español: 7,4 · 6 768 · 8 848,86 (miles con espacio que no se corta)
const decimalesDe = (n) => (String(n).split('.')[1] ?? '').length;
const numeroEs = (n, d = decimalesDe(n)) => {
  const [entero, fraccion] = n.toFixed(d).split('.');
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (fraccion ? `,${fraccion}` : '');
};
const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let globo = null;
let enVivo = null;    // satélite Terra y eventos de NASA EONET (componentes/en-vivo.js)
let vivo = false;
let quitarAlSalir = null; // listeners y temporizadores que hay que quitar al salir del menú

export function montar(contenedor) {
  vivo = true;
  apagarEscena3d(); // el globo de los casos se apaga: el menú crea el suyo (un solo Cesium a la vez)
  let elegido = null;  // glaciar abierto en la pestaña (null: ninguno)
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

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

    <header class="menu-titulo">
      <p class="menu-modo"><span class="barras" aria-hidden="true">//</span> MODO EXPLORACIÓN</p>
      <h1 class="menu-h1"><span class="brillo">EXPLORA LOS <b>GLACIARES</b> DEL PLANETA</span></h1>
      <p class="menu-pista">Elige un glaciar abajo o toca un <span aria-hidden="true">❄</span><span class="solo-lector">copo</span> en el planeta</p>
    </header>

    <div class="menu-arriba-der entra-der">
      <div class="capas">
        <button type="button" class="capas-boton" aria-expanded="false" aria-controls="capas-lista">
          <span class="capas-circulo">${ICONO_CAPAS}</span>
          <span class="capas-cuenta" aria-hidden="true"></span>
          <span class="capas-nombre" aria-hidden="true">CAPAS</span>
        </button>
        <div class="capas-lista" id="capas-lista" hidden>
          <p class="capas-grupo" id="capas-fondo">FONDO</p>
          <div role="radiogroup" aria-labelledby="capas-fondo">
            ${FONDOS.map((f) => `<button type="button" class="capas-op fondo" role="radio" data-capa="${f.capa}" aria-checked="${f.capa === ''}"><span class="pildora">${f.n}<i aria-hidden="true">✓</i></span><span class="circulo">${svg(f.i)}</span></button>`).join('')}
          </div>
          <p class="capas-grupo" id="capas-capas">CAPAS</p>
          <div role="group" aria-labelledby="capas-capas">
            ${CAPAS.map((c) => `<button type="button" class="capas-op capa" data-${c.k} aria-pressed="${c.si}"${c.t ? ` title="${c.t}"` : ''}><span class="pildora">${c.n}<i aria-hidden="true">✓</i></span><span class="circulo">${svg(c.i)}</span></button>`).join('')}
          </div>
        </div>
      </div>
      <p class="menu-cargando" role="status" hidden>${AVISO_NUBES}</p>
      <p class="menu-aviso" role="status" hidden>${AVISO_CAPA}</p>
    </div>

    <nav class="menu-riel entra-izq" aria-label="Menú">
      ${RIEL.map((m) => `${m.aparte ? '<span class="riel-separador" aria-hidden="true"></span>' : ''}
        <button type="button" class="riel-item${m.actual ? ' actual' : ''}" data-k="${m.k}" data-ruta="${m.ruta ?? ''}"${m.actual ? ' aria-current="page"' : ''}>
          <span class="riel-circulo">${svg(ICONOS[m.k])}<span class="riel-aviso" hidden></span></span>
          <span class="riel-nombre">${m.n}</span>
        </button>`).join('')}
    </nav>

    <section class="menu-carrusel entra-abajo" aria-label="Glaciares">
      <button type="button" class="carrusel-flecha" data-paso="-1" aria-label="Glaciares anteriores">${svg('<path d="M15 5l-7 7 7 7"/>', 2.2)}</button>
      <ol class="carrusel-pista">
        ${GLACIARES.map((g, i) => `<li><button type="button" class="tarjeta-glaciar${g.principal ? ' principal' : ''}" data-id="${g.id}" aria-pressed="false">
          <span class="tg-foto" style="background-image:url('${g.foto?.src ?? '/img/fondo-illimani.webp'}')">${g.principal ? '<span class="tg-caso">NUESTRO CASO</span>' : ''}</span>
          <span class="tg-texto"><span class="tg-num">${String(i + 1).padStart(2, '0')}</span><b class="tg-nombre">${escapar(g.nombre)}</b><span class="tg-lugar">${escapar(g.pais)} · ${grados(g.lat, 'N', 'S')}</span><span class="tg-ver" aria-hidden="true">Ver glaciar ›</span></span>
        </button></li>`).join('')}
      </ol>
      <button type="button" class="carrusel-flecha" data-paso="1" aria-label="Glaciares siguientes">${svg('<path d="M9 5l7 7-7 7"/>', 2.2)}</button>
    </section>

    <aside class="menu-pestana" aria-label="Historia del glaciar" hidden>
      <div class="pestana-portada">
        <span class="pestana-caso">GLACIAR TROPICAL · NUESTRO CASO</span>
        <h2 class="pestana-nombre"></h2>
        <p class="pestana-lugar"></p>
        <a class="pestana-foto" target="_blank" rel="noopener noreferrer"></a>
        <button type="button" class="pestana-cerrar" aria-label="Cerrar la historia y volver al planeta">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <div class="pestana-cuerpo">
        <h3 class="pestana-titulo"><span class="barras" aria-hidden="true">//</span> SU HISTORIA</h3>
        <ol class="pestana-linea"></ol>
        <div class="pestana-dato"></div>
        <button type="button" class="btn-mision pestana-ver">
          <span class="icono" aria-hidden="true">${MONTANA}</span>
          <span class="texto">VER MONTAÑA EN 3D</span>
        </button>
      </div>
    </aside>

    <button type="button" class="menu-volver" hidden>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/></svg>Volver al planeta
    </button>

    <p class="menu-credito"></p>`;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  // ---------------------------------------------------------------
  // Navegación (riel) y avisos: ✓ en Entrenar con las 10 lecciones; casos nuevos en Casos
  // ---------------------------------------------------------------
  $('.logo-btn').addEventListener('click', () => ir(''));
  raiz.querySelectorAll('.menu-riel [data-ruta]').forEach((b) => {
    b.addEventListener('click', () => { if (b.dataset.ruta) ir(b.dataset.ruta); });
  });
  const ponerAviso = (k, texto, etiqueta) => {
    const b = $(`.menu-riel [data-k="${k}"]`), a = b.querySelector('.riel-aviso');
    a.hidden = !texto; a.textContent = texto ?? '';
    b.setAttribute('aria-label', etiqueta);
  };
  leerProgreso().then((p) => {
    if (!vivo) return;
    const hechas = LECCIONES.filter((l) => (p.lecciones ?? []).includes(l.id)).length;
    const todas = hechas === LECCIONES.length;
    ponerAviso('entrenar', todas ? '✓' : null, todas ? `Entrenar: las ${LECCIONES.length} lecciones terminadas` : `Entrenar: ${hechas} de ${LECCIONES.length} lecciones`);
    $('.menu-riel [data-k="entrenar"] .riel-aviso').classList.toggle('listo', todas);
    // Casos nuevos: abiertos (como en #/casos) y todavía sin empezar
    const resueltos = casosResueltos(p);
    const nuevos = CASOS.filter((c, i) => !resueltos.has(c.id) && !estadoCaso(p, c.id) &&
      (i === 0 ? todas : resueltos.has(CASOS[i - 1].id) || (i > 1 && resueltos.has(CASOS[i - 2].id)))).length;
    ponerAviso('casos', nuevos ? String(nuevos) : null, nuevos ? `Casos: ${nuevos} ${nuevos === 1 ? 'caso nuevo' : 'casos nuevos'}` : 'Casos');
  }).catch(() => {});

  // ---------------------------------------------------------------
  // Capas: botón redondo (número rojo = capas activas) que despliega FONDO y CAPAS hacia abajo
  // ---------------------------------------------------------------
  const botonCapas = $('.capas-boton');
  const listaCapas = $('.capas-lista');
  const contarCapas = () => {
    const n = listaCapas.querySelectorAll('.capa[aria-pressed="true"]').length + (listaCapas.querySelector('.fondo[data-capa="hoy"]').getAttribute('aria-checked') === 'true' ? 1 : 0);
    const c = $('.capas-cuenta');
    c.textContent = String(n); c.hidden = !n;
    const abierta = !listaCapas.hidden;
    botonCapas.setAttribute('aria-label', abierta ? 'Cerrar capas' : `Capas de datos de NASA: ${n} ${n === 1 ? 'activa' : 'activas'}`);
  };
  function abrirCapas(abrir) {
    listaCapas.hidden = !abrir;
    $('.capas').classList.toggle('abierta', abrir);
    botonCapas.setAttribute('aria-expanded', String(abrir));
    $('.capas-circulo').innerHTML = abrir ? ICONO_CERRAR : ICONO_CAPAS;
    $('.capas-nombre').textContent = abrir ? 'CERRAR' : 'CAPAS';
    contarCapas();
  }
  botonCapas.addEventListener('click', () => abrirCapas(listaCapas.hidden));
  listaCapas.addEventListener('click', (e) => {
    const capa = e.target.closest('.capa');
    if (capa) { // "Eventos en vivo" / "MODIS del día": se prenden o se apagan
      const si = capa.getAttribute('aria-pressed') !== 'true';
      capa.setAttribute('aria-pressed', String(si));
      if (capa.hasAttribute('data-foto-dia')) globo?.ponerFotoDelDia?.(si);
      else enVivo?.eventos(si);
    }
    const fondo = e.target.closest('.fondo');
    if (fondo && fondo.getAttribute('aria-checked') !== 'true') {
      listaCapas.querySelectorAll('.fondo').forEach((x) => x.setAttribute('aria-checked', String(x === fondo)));
      pedirCapa(fondo.dataset.capa || null);
    }
    contarCapas();
  });
  listaCapas.addEventListener('keydown', (e) => {
    const items = [...listaCapas.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + items.length - 1) % items.length].focus(); }
  });
  contarCapas();

  // ---------------------------------------------------------------
  // Carrusel de glaciares (uno por marcador). Tarjeta → vuela, marca el pin y abre la ficha;
  // pin → marca su tarjeta y la deja a la vista (los dos pasan por alElegir → abrirPestana)
  // ---------------------------------------------------------------
  const pista = $('.carrusel-pista');
  const tarjetas = [...pista.querySelectorAll('.tarjeta-glaciar')];
  function marcarTarjeta(id) {
    tarjetas.forEach((t) => {
      const si = t.dataset.id === id;
      t.classList.toggle('elegida', si);
      t.setAttribute('aria-pressed', String(si));
      if (si) { // centrarla dentro de la pista (sin mover la página)
        const b = t.parentElement.getBoundingClientRect(), p = pista.getBoundingClientRect();
        const x = pista.scrollLeft + (b.left - p.left) - (p.width - b.width) / 2;
        pista.scrollTo({ left: x, behavior: sinMovimiento.matches ? 'auto' : 'smooth' });
      }
    });
  }
  pista.addEventListener('click', (e) => {
    const t = e.target.closest('.tarjeta-glaciar'); if (!t) return;
    if (t.classList.contains('elegida') && elegido?.id === t.dataset.id) { $('.pestana-ver').focus(); return; } // "Ver glaciar ›": la ficha ya está abierta
    if (globo?.elegirGlaciar) globo.elegirGlaciar(t.dataset.id);
    else { const g = GLACIARES.find((x) => x.id === t.dataset.id); if (g) abrirPestana(g); }
  });
  raiz.querySelectorAll('.carrusel-flecha').forEach((f) => f.addEventListener('click', () => {
    pista.scrollBy({ left: Number(f.dataset.paso) * pista.clientWidth * 0.8, behavior: sinMovimiento.matches ? 'auto' : 'smooth' });
  }));
  const flechas = () => {
    const [a, s] = raiz.querySelectorAll('.carrusel-flecha');
    a.disabled = pista.scrollLeft < 4;
    s.disabled = pista.scrollLeft + pista.clientWidth > pista.scrollWidth - 4;
  };
  pista.addEventListener('scroll', flechas, { passive: true });
  requestAnimationFrame(flechas);
  // Pide la capa al globo; si NASA no responde, el planeta queda como estaba y se avisa
  function pedirCapa(capa) {
    const aviso = $('.menu-aviso');
    aviso.hidden = true;
    if (!globo?.mostrarCapa) { aviso.hidden = !capa; return; } // planeta de la maqueta: no hay capas
    globo.mostrarCapa(capa).then((r) => {
      if (vivo && !r.ok && r.motivo !== 'reemplazado') aviso.hidden = false;
      if (vivo && r.ok && capa) darInsignia('capas'); // insignia "Capas": la 1.ª capa de NASA que se ve
    });
  }
  // "Cargando nubes de NASA…" mientras llegan las teselas de la capa Hoy (lo avisa el globo)
  const cargandoNubes = (si) => { if (vivo) $('.menu-cargando').hidden = !si; };

  // ---------------------------------------------------------------
  // Planeta: globo 3D de Cesium o, si no está, el planeta de la maqueta
  // ---------------------------------------------------------------
  const ranura = $('.menu-planeta');
  // Caso resuelto → su glaciar brilla verde en el planeta
  let resueltos = null;
  const marcarResueltos = () => {
    if (!vivo || !resueltos) return;
    for (const c of CASOS) {
      if (resueltos.has(c.id)) ranura.querySelector(`.globo3d-pin[data-id="${c.glaciar}"]`)?.classList.add('resuelto');
    }
  };
  leerProgreso().then((p) => { resueltos = casosResueltos(p); marcarResueltos(); }).catch(() => {});
  // En vivo: satélite Terra (chip abajo a la derecha) y eventos de NASA EONET (pines en el globo)
  const ponerEnVivo = () => {
    if (!vivo || enVivo) return;
    enVivo = crearEnVivo({ globo, pantalla: raiz });
    enVivo.eventos($('[data-eventos]').getAttribute('aria-pressed') === 'true');
    if (import.meta.env.DEV) window.__enVivo = enVivo; // para las pruebas en el navegador
  };
  import('../../componentes/globo3d.js')
    .then((m) => {
      if (!vivo) return;
      if (typeof m.crearGlobo !== 'function') throw new Error('globo3d.js todavía no exporta crearGlobo');
      globo = m.crearGlobo(ranura, {
        glaciares: GLACIARES,
        credito: $('.menu-credito'),
        alCargarCapa: cargandoNubes,
        tamano: 0.96, // el planeta llena el 96 % de su caja (.menu-planeta, sin contar el halo)
        alElegir: (g) => { // al tocar su pin
          if (!vivo) return;
          abrirPestana(g);
          darInsignia('caminante', () => verGlaciar(g.id)); // insignia "Caminante": los 11 glaciares
        }
      });
      if (import.meta.env.DEV) window.__globo = globo; // para las pruebas en el navegador
      ponerEnVivo();
      marcarResueltos();
    })
    .catch((e) => {
      console.info('APU: se usa el planeta de la maqueta.', e.message);
      if (!vivo) return;
      ranura.classList.add('maqueta');
      ponerEnVivo(); // sin globo 3D queda el chip de Terra (sin pines)
      ranura.innerHTML = '<img class="tierra" src="/img/planeta.webp" alt="La Tierra vista desde el espacio, centrada en Sudamérica, con Perú, Bolivia y Chile">';
    });

  // ---------------------------------------------------------------
  // Pestaña de historia
  // ---------------------------------------------------------------
  const pestana = $('.menu-pestana');
  let cuenta = 0;
  function abrirPestana(g) {
    cerrarMontana();
    elegido = g;
    marcarTarjeta(g.id);
    raiz.classList.add('con-pestana');
    // Con el globo 3D, la cámara baja al glaciar y el globo ocupa todo el espacio libre (menu.css)
    raiz.classList.toggle('con-zoom', Boolean(globo?.viewer));
    pestana.hidden = false;
    pestana.classList.toggle('principal', Boolean(g.principal));
    $('.pestana-caso').hidden = !g.principal;
    $('.pestana-nombre').textContent = g.nombre;
    $('.pestana-lugar').textContent = lugarDe(g);
    // Portada: foto real del glaciar (Wikimedia Commons) con su crédito; si no hay, la del Illimani
    const foto = g.foto;
    pestana.style.setProperty('--foto', `url('${foto?.src ?? '/img/fondo-illimani.webp'}')`);
    const credito = $('.pestana-foto');
    credito.hidden = !foto;
    if (foto) {
      credito.textContent = `Foto: ${foto.autor} · ${foto.licencia}`;
      credito.href = foto.url;
      credito.title = `Ver la foto en Wikimedia Commons (${foto.licencia})`;
    }

    // Historia (contenido/glaciares.js → HISTORIAS, unida por id o por nombre)
    const h = historiaDe(g);

    // Línea de tiempo: se dibuja punto por punto; cada hito con su fuente en letra pequeña
    const linea = h?.linea ?? [];
    $('.pestana-linea').innerHTML = linea.length
      ? linea.map((p, i) => `<li class="${p.destacado ? 'destacado' : ''}" style="--i:${i}"><b>${escapar(p.cuando)}</b><span>${escapar(p.texto)}</span>${p.fuente ? `<small>Fuente: ${escapar(p.fuente)}</small>` : ''}</li>`).join('')
      : `<li class="vacio" style="--i:0"><span>${EN_PREPARACION}</span></li>`;

    // Dato grande: el número cuenta desde 0 (con sus decimales, en formato español)
    const d = h?.datoGrande;
    const dato = $('.pestana-dato');
    dato.classList.toggle('vacio', !d);
    dato.classList.toggle('largo', Boolean(d) && numeroEs(d.numero).length > 5); // 8 848,86: letra más chica
    dato.innerHTML = d
      ? `<p class="numero"><b>${numeroEs(0, decimalesDe(d.numero))}</b><span>${escapar(d.unidad)}</span></p><p class="texto">${escapar(d.texto)}</p><p class="fuente">Fuente: ${escapar(d.fuente)}</p>`
      : `<p class="texto">${EN_PREPARACION}</p>`;
    cancelAnimationFrame(cuenta);
    if (d) {
      const b = dato.querySelector('.numero b');
      const dec = decimalesDe(d.numero);
      b.setAttribute('aria-label', numeroEs(d.numero)); // el lector de pantalla dice el número final
      if (sinMovimiento.matches) b.textContent = numeroEs(d.numero);
      else {
        const inicio = performance.now() + 450; // cuando la pestaña terminó de entrar
        const paso = (ahora) => {
          const k = Math.min(1, Math.max(0, (ahora - inicio) / 1200));
          b.textContent = k < 1 ? numeroEs(d.numero * (1 - (1 - k) ** 3), dec) : numeroEs(d.numero);
          if (k < 1) cuenta = requestAnimationFrame(paso);
        };
        cuenta = requestAnimationFrame(paso);
      }
    }
    // Reinicia la entrada (se desliza, la línea se dibuja)
    pestana.classList.remove('entra'); void pestana.offsetWidth; pestana.classList.add('entra');
    pestana.scrollTop = 0;

    // El Jukumari asistente: ahora habla de este glaciar (con su frase, si la tiene)
    avisarAsistente('glaciar');
    window.dispatchEvent(new CustomEvent('apu:jukumari', { detail: h?.jukumari || `${g.nombre}: su historia está en preparación.` }));
  }
  function cerrarPestana() {
    if (!elegido) return;
    elegido = null;
    marcarTarjeta(null);
    cancelAnimationFrame(cuenta);
    raiz.classList.remove('con-pestana', 'con-zoom');
    pestana.hidden = true;
    globo?.verPlaneta?.(); // la cámara vuelve al planeta completo, que sigue girando
    avisarAsistente('menu');
  }
  $('.pestana-cerrar').addEventListener('click', cerrarPestana);

  // ---------------------------------------------------------------
  // "VER MONTAÑA EN 3D": la vista de la montaña (montanas-puente.js)
  // ---------------------------------------------------------------
  let montana = null;
  let abriendo = false;
  $('.pestana-ver').addEventListener('click', async () => {
    if (montana || abriendo || !elegido) return;
    abriendo = true;
    let conMasa = false;
    try {
      // Datos de NASA de este glaciar ('datos/<id>.json' en contenido/glaciares.js); si no hay o no
      // cargan, la vista de la montaña lo dice
      const idDatos = /datos\/([a-z0-9-]+)\.json$/.exec(elegido.datos ?? '')?.[1];
      const region = idDatos
        ? await cargarRegion(idDatos).catch((e) => { console.warn(`APU: no se pudieron leer los datos de ${elegido.nombre}.`, e); return null; })
        : null;
      if (!vivo) return;
      conMasa = Boolean(region?.variables?.masa);
      montana = await abrirMontana({ raiz, glaciar: elegido, region, globo });
    } finally {
      abriendo = false;
    }
    if (!vivo) { montana?.cerrar(); montana = null; return; }
    $('.menu-volver').hidden = false;
    document.documentElement.classList.add('pide-horizontal'); // en celular vertical, la montaña pide girar
    enVivo?.mostrar(false);
    $('.menu-volver').focus();
    avisarAsistente(conMasa ? { contexto: 'montana', masa: true } : 'montana');
  });
  function cerrarMontana() {
    if (!montana) return;
    montana.cerrar();
    montana = null;
    document.documentElement.classList.remove('pide-horizontal');
    $('.menu-volver').hidden = true;
    enVivo?.mostrar(true);
    avisarAsistente(elegido ? 'glaciar' : 'menu');
  }
  $('.menu-volver').addEventListener('click', () => { cerrarMontana(); $('.pestana-ver').focus(); });

  // Avisa al Jukumari asistente qué se está viendo en el menú: 'menu' | 'glaciar' | 'montana'
  const avisarAsistente = (contexto) => window.dispatchEvent(new CustomEvent('apu:contexto', { detail: contexto }));

  const tocarFuera = (e) => {
    if (!listaCapas.hidden && !e.target.closest('.capas')) abrirCapas(false);
  };
  const conTeclado = (e) => {
    if (e.key !== 'Escape') return;
    if (!listaCapas.hidden) { abrirCapas(false); botonCapas.focus(); }
    else if (montana) cerrarMontana();
    else if (elegido) cerrarPestana();
  };
  document.addEventListener('pointerdown', tocarFuera);
  document.addEventListener('keydown', conTeclado);
  quitarAlSalir = () => {
    document.removeEventListener('pointerdown', tocarFuera);
    document.removeEventListener('keydown', conTeclado);
    cancelAnimationFrame(cuenta);
    cerrarMontana();
  };
}

export function desmontar() {
  vivo = false;
  quitarAlSalir?.();
  quitarAlSalir = null;
  enVivo?.destruir();
  enVivo = null;
  globo?.destruir?.();
  globo = null;
}
