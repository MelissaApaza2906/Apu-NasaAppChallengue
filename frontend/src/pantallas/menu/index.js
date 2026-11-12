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
import { leerProgreso } from '../../servicios/progreso.js';
import { avatarPorId } from '../../contenido/avatares.js';
import { crearEnVivo } from '../../componentes/en-vivo.js';

const AVISO_CAPA = 'No se pudo cargar la capa de NASA. El planeta sigue con la imagen normal.';
const EN_PREPARACION = 'En preparación';
// Opciones del botón flotante de capas (arriba a la derecha)
const CAPAS_MENU = [
  { capa: null, n: 'Normal' },
  { capa: 'hoy', n: 'Hoy (nubes reales)' }
];

// Íconos del riel (mismos trazos que la maqueta)
const ICONOS = {
  explorar: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z"/>',
  entrenar: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};
const RIEL = [
  { k: 'explorar', n: 'Explorar el globo', ruta: null, actual: true },
  { k: 'entrenar', n: 'Entrenamiento', ruta: 'etapas' },
  { k: 'perfil', n: 'Mi expediente', ruta: 'insignias' },
  { k: 'ajustes', n: 'Ajustes', ruta: 'ajustes' }
];
// Capas: 3 rombos apilados
const ICONO_CAPAS = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3 20 7 12 11 4 7z"/><path d="M12 8.5 20 12.5 12 16.5 4 12.5z" opacity=".75"/><path d="M12 14 20 18 12 22 4 18z" opacity=".5"/></svg>';
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

    <div class="menu-arriba-der entra-der">
      <div class="menu-estado">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#F2F4F8" stroke-width="1.5"><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)"/><path d="M4 4l4 4M16 16l4 4M3 8l5-5M16 21l5-5"/></svg>
        <span class="punto" aria-hidden="true"></span>Monitoreo satelital
      </div>
      <div class="menu-capas-caja">
        <button type="button" class="boton-capas hud" aria-label="Capas de datos de NASA" title="Capas de datos de NASA" aria-haspopup="menu" aria-expanded="false" aria-controls="menu-capas">${ICONO_CAPAS}</button>
        <div class="menu-capas hud" id="menu-capas" role="menu" aria-label="Capas de datos de NASA" hidden>
          ${CAPAS_MENU.map((c) => `<button type="button" role="menuitemradio" data-capa="${c.capa ?? ''}" aria-checked="${c.capa === null}">${c.n}</button>`).join('')}
          <span class="separador" role="separator"></span>
          <button type="button" role="menuitemcheckbox" data-eventos aria-checked="true">Eventos en vivo</button>
        </div>
      </div>
      <p class="menu-cargando" role="status" hidden>${AVISO_NUBES}</p>
      <p class="menu-aviso" role="status" hidden>${AVISO_CAPA}</p>
    </div>

    <nav class="menu-riel hud entra-izq" aria-label="Menú">
      ${RIEL.map((m) => `
        <button type="button" class="redondo${m.actual ? ' actual' : ''}" data-k="${m.k}" data-ruta="${m.ruta ?? ''}" aria-label="${m.n}" title="${m.n}"${m.actual ? ' aria-current="page"' : ''}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONOS[m.k]}</svg>
        </button>`).join('')}
    </nav>

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
  // Navegación y menú "Capas de datos"
  // ---------------------------------------------------------------
  $('.logo-btn').addEventListener('click', () => ir(''));
  raiz.querySelectorAll('.menu-riel [data-ruta]').forEach((b) => {
    b.addEventListener('click', () => { if (b.dataset.ruta) ir(b.dataset.ruta); });
  });
  // Botón flotante de capas: el menú se abre debajo (CSS) y se cierra al elegir o al tocar fuera
  const botonCapas = $('.boton-capas');
  const menuCapas = $('.menu-capas');
  function abrirCapas(abrir) {
    menuCapas.hidden = !abrir;
    botonCapas.setAttribute('aria-expanded', String(abrir));
    if (abrir) (menuCapas.querySelector('[aria-checked="true"]') ?? menuCapas.querySelector('button')).focus();
  }
  botonCapas.addEventListener('click', () => abrirCapas(menuCapas.hidden));
  menuCapas.addEventListener('click', (e) => {
    const ev = e.target.closest('[role="menuitemcheckbox"]');
    if (ev) { // "Eventos en vivo": se prende o se apaga; el menú sigue abierto
      const si = ev.getAttribute('aria-checked') !== 'true';
      ev.setAttribute('aria-checked', String(si));
      enVivo?.eventos(si);
      return;
    }
    const b = e.target.closest('[role="menuitemradio"]'); if (!b) return;
    menuCapas.querySelectorAll('[data-capa]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    pedirCapa(b.dataset.capa || null);
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
  // Pide la capa al globo; si NASA no responde, el planeta queda como estaba y se avisa
  function pedirCapa(capa) {
    const aviso = $('.menu-aviso');
    aviso.hidden = true;
    if (!globo?.mostrarCapa) { aviso.hidden = !capa; return; } // planeta de la maqueta: no hay capas
    globo.mostrarCapa(capa).then((r) => {
      if (vivo && !r.ok && r.motivo !== 'reemplazado') aviso.hidden = false;
    });
  }
  // "Cargando nubes de NASA…" mientras llegan las teselas de la capa Hoy (lo avisa el globo)
  const cargandoNubes = (si) => { if (vivo) $('.menu-cargando').hidden = !si; };

  // ---------------------------------------------------------------
  // Planeta: globo 3D de Cesium o, si no está, el planeta de la maqueta
  // ---------------------------------------------------------------
  const ranura = $('.menu-planeta');
  // En vivo: satélite Terra (chip abajo a la derecha) y eventos de NASA EONET (pines en el globo)
  const ponerEnVivo = () => {
    if (!vivo || enVivo) return;
    enVivo = crearEnVivo({ globo, pantalla: raiz });
    enVivo.eventos($('[data-eventos]').getAttribute('aria-checked') === 'true');
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
        alElegir: (g) => { if (vivo) abrirPestana(g); } // al tocar su pin
      });
      if (import.meta.env.DEV) window.__globo = globo; // para las pruebas en el navegador
      ponerEnVivo();
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
    enVivo?.mostrar(false);
    $('.menu-volver').focus();
    avisarAsistente(conMasa ? { contexto: 'montana', masa: true } : 'montana');
  });
  function cerrarMontana() {
    if (!montana) return;
    montana.cerrar();
    montana = null;
    $('.menu-volver').hidden = true;
    enVivo?.mostrar(true);
    avisarAsistente(elegido ? 'glaciar' : 'menu');
  }
  $('.menu-volver').addEventListener('click', () => { cerrarMontana(); $('.pestana-ver').focus(); });

  // Avisa al Jukumari asistente qué se está viendo en el menú: 'menu' | 'glaciar' | 'montana'
  const avisarAsistente = (contexto) => window.dispatchEvent(new CustomEvent('apu:contexto', { detail: contexto }));

  const tocarFuera = (e) => {
    if (!menuCapas.hidden && !e.target.closest('.menu-capas') && !e.target.closest('.boton-capas')) abrirCapas(false);
  };
  const conTeclado = (e) => {
    if (e.key !== 'Escape') return;
    if (montana) cerrarMontana();
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

  // "Mi expediente" del riel: la cara del avatar elegido en el registro (si no hay, el ícono)
  leerProgreso().then((p) => {
    const a = avatarPorId(p.avatar);
    if (!vivo || !a) return;
    const boton = $('.menu-riel [data-k="perfil"]');
    boton.classList.add('con-avatar');
    boton.innerHTML = `<img src="${a.cara}" alt="" width="36" height="36">`;
    boton.title = `Mi expediente (${a.nombre})`;
  }).catch(() => {});
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
