// El Jukumari asistente: uno solo para toda la app (se monta una vez en main.js, fuera del contenedor
// del router, así no se destruye al cambiar de pantalla). Textos: contenido/asistente.js.
//
// Contexto (qué pantalla es): sale de la ruta (#/menu, #/acceso/…, #/etapas…) y, dentro del menú,
// de los avisos del menú:
//   window.dispatchEvent(new CustomEvent('apu:contexto', { detail: 'glaciar' | 'montana' | 'menu' }))
//   window.dispatchEvent(new CustomEvent('apu:jukumari', { detail: 'frase del glaciar elegido' }))
// En la carga no se muestra (tiene su Jukumari grande).
//
// No interrumpe: la primera vez en cada pantalla su nubecita late 3 veces. Al tocar la nubecita o al
// Jukumari se abre su panel (diálogo). Nunca tapa botones: si choca con uno, se corre.
import '../pantallas/carga/carga.css'; // el Jukumari en 3D (.carga-juku) y la mano que saluda
import './jukumari-asistente.css';
import { PANTALLAS, GLOSARIO, CURIOSOS, PREGUNTAS } from '../contenido/asistente.js';

const CLAVE_VISTAS = 'apu-asistente-vistas';     // pantallas en las que ya latió la nubecita
const CLAVE_MINIMO = 'apu-asistente-minimizado'; // '1' si está como carita
// Ruta → contexto de asistente.js (lecciones y casos no tienen textos propios: solo lo general)
const POR_RUTA = { '': 'carga', menu: 'menu', acceso: 'acceso', etapas: 'etapas', insignias: 'insignias', ajustes: 'ajustes', leccion: 'leccion', caso: 'caso', casos: 'casos' };
const CON_PISTA = new Set(['leccion', 'caso', 'casos']);
// Lo que el Jukumari nunca debe tapar (los pines del globo se mueven todo el tiempo: no cuentan)
const OBSTACULOS = 'button, a[href], input, select, textarea, [role="radio"], .menu-riel, .menu-panel, .menu-pestana, .menu-fechas, .acceso-tarjeta, .etapas-panel';

const leer = (clave, defecto) => { try { return localStorage.getItem(clave) ?? defecto; } catch { return defecto; } };
const escribir = (clave, valor) => { try { localStorage.setItem(clave, valor); } catch { /* modo privado */ } };
const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function montarAsistente(dondeEvitar = document.getElementById('app')) {
  let contexto = 'carga';
  let fraseExtra = '';      // frase del glaciar elegido (aviso del menú)
  let iConsejo = 0;
  let abierto = false;
  let quienAbrio = null;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  const raiz = document.createElement('div');
  raiz.className = 'asistente';
  raiz.hidden = true;
  raiz.innerHTML = `
    <div class="carga-juku asistente-juku">
      <div class="aura" aria-hidden="true"></div>
      <div class="sombra" aria-hidden="true"></div>
      <div class="cuerpo-anim">
        <button type="button" class="juku-btn asistente-abrir" aria-label="Hablar con el Jukumari, tu guía" aria-haspopup="dialog" aria-expanded="false">
          <img class="capa" src="/img/jukumari-cuerpo.webp" alt="">
          <div class="saludo" aria-hidden="true"></div>
        </button>
      </div>
      <button type="button" class="asistente-nube asistente-abrir" aria-label="El Jukumari quiere decirte algo" aria-haspopup="dialog" aria-expanded="false"><span></span><span></span><span></span></button>
      <button type="button" class="asistente-minimizar" aria-label="Minimizar al Jukumari" title="Minimizar">—</button>
    </div>
    <button type="button" class="asistente-carita" aria-label="Mostrar al Jukumari, tu guía">
      <img src="/img/jukumari-cara.webp" alt="" width="56" height="56">
    </button>
    <section class="asistente-panel" role="dialog" aria-modal="false" aria-labelledby="asistente-titulo" tabindex="-1" hidden>
      <header>
        <h2 id="asistente-titulo">Jukumari · tu guía</h2>
        <button type="button" class="asistente-cerrar" aria-label="Cerrar">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </header>
      <div class="asistente-cuerpo"></div>
    </section>`;
  document.body.append(raiz);
  const $ = (s) => raiz.querySelector(s);
  const panel = $('.asistente-panel');
  const cuerpo = $('.asistente-cuerpo');

  // ---------------------------------------------------------------
  // Contenido del panel según la pantalla
  // ---------------------------------------------------------------
  function pintarPanel() {
    const p = PANTALLAS[contexto];
    const saludo = fraseExtra || p?.saludo;
    const conceptos = (p?.conceptos ?? []).filter((c) => GLOSARIO[c]);
    cuerpo.innerHTML = `
      ${saludo ? `<p class="asistente-globo">${escapar(saludo)}</p>` : ''}
      ${CON_PISTA.has(contexto) ? '<div class="asistente-pista" data-pista></div>' : ''}
      ${p?.queHago ? `
        <div class="asistente-bloque">
          <button type="button" class="asistente-opcion" data-accion="quehago" aria-expanded="false">¿Qué hago aquí?</button>
          <p class="asistente-respuesta" data-respuesta="quehago" hidden>${escapar(p.queHago)}</p>
        </div>` : ''}
      ${conceptos.length ? `
        <div class="asistente-bloque">
          <h3>Explícame…</h3>
          <div class="asistente-chips">${conceptos.map((c) => `<button type="button" class="asistente-chip" data-concepto="${c}" aria-pressed="false">${escapar(GLOSARIO[c].titulo)}</button>`).join('')}</div>
          <div class="asistente-concepto" aria-live="polite" hidden></div>
        </div>` : ''}
      ${p?.consejos?.length ? `
        <div class="asistente-bloque">
          <button type="button" class="asistente-opcion" data-accion="consejo">Un consejo</button>
          <p class="asistente-respuesta" data-respuesta="consejo" aria-live="polite" hidden></p>
        </div>` : ''}
      <div class="asistente-bloque">
        <button type="button" class="asistente-opcion" data-accion="sabias">¿Sabías que…?</button>
        <div class="asistente-respuesta" data-respuesta="sabias" aria-live="polite" hidden></div>
      </div>
      <div class="asistente-bloque">
        <h3>Preguntas frecuentes</h3>
        ${PREGUNTAS.map((q) => `<details class="asistente-pregunta"><summary>${escapar(q.p)}</summary><p>${escapar(q.r)}</p></details>`).join('')}
      </div>`;
  }

  cuerpo.addEventListener('click', (e) => {
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    const chip = e.target.closest('[data-concepto]');
    const p = PANTALLAS[contexto];
    if (accion === 'quehago') {
      const r = cuerpo.querySelector('[data-respuesta="quehago"]');
      r.hidden = !r.hidden;
      e.target.closest('button').setAttribute('aria-expanded', String(!r.hidden));
    }
    if (accion === 'consejo' && p?.consejos?.length) {
      const r = cuerpo.querySelector('[data-respuesta="consejo"]');
      r.textContent = p.consejos[iConsejo % p.consejos.length];
      iConsejo += 1; // la próxima vez, el siguiente
      r.hidden = false;
    }
    if (accion === 'sabias') {
      const c = CURIOSOS[Math.floor(Math.random() * CURIOSOS.length)];
      const r = cuerpo.querySelector('[data-respuesta="sabias"]');
      r.innerHTML = `<p>${escapar(c.texto)}</p><small>Fuente: ${escapar(c.fuente)}</small>`;
      r.hidden = false;
    }
    if (chip) {
      const g = GLOSARIO[chip.dataset.concepto];
      const caja = cuerpo.querySelector('.asistente-concepto');
      const yaEstaba = chip.getAttribute('aria-pressed') === 'true';
      cuerpo.querySelectorAll('[data-concepto]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      caja.hidden = yaEstaba;
      if (!yaEstaba) {
        chip.setAttribute('aria-pressed', 'true');
        caja.innerHTML = `<h4>${escapar(g.titulo)}</h4><p>${escapar(g.simple)}</p>${g.mas ? `<details><summary>Saber más</summary><p>${escapar(g.mas)}</p></details>` : ''}`;
      }
    }
  });

  // ---------------------------------------------------------------
  // Abrir y cerrar el panel (diálogo: foco al abrir, vuelve el foco al cerrar)
  // ---------------------------------------------------------------
  function abrir(desde) {
    if (abierto) return;
    abierto = true;
    quienAbrio = desde ?? document.activeElement;
    pintarPanel();
    panel.hidden = false;
    raiz.classList.add('abierto');
    raiz.querySelectorAll('.asistente-abrir').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    panel.scrollTop = 0;
    panel.focus();
  }
  function cerrar(devolverFoco = true) {
    if (!abierto) return;
    abierto = false;
    panel.hidden = true;
    raiz.classList.remove('abierto');
    raiz.querySelectorAll('.asistente-abrir').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (devolverFoco && quienAbrio?.isConnected) quienAbrio.focus();
  }
  raiz.querySelectorAll('.asistente-abrir').forEach((b) => b.addEventListener('click', () => (abierto ? cerrar() : abrir(b))));
  $('.asistente-cerrar').addEventListener('click', () => cerrar());
  document.addEventListener('pointerdown', (e) => { if (abierto && !raiz.contains(e.target)) cerrar(false); });
  document.addEventListener('keydown', (e) => { if (abierto && e.key === 'Escape') { e.stopPropagation(); cerrar(); } }, true);

  // Minimizar a una carita redonda (se recuerda)
  function minimizar(si) {
    raiz.classList.toggle('minimizado', si);
    escribir(CLAVE_MINIMO, si ? '1' : '0');
    if (si) cerrar(false);
    requestAnimationFrame(acomodar);
  }
  $('.asistente-minimizar').addEventListener('click', () => { minimizar(true); $('.asistente-carita').focus(); });
  $('.asistente-carita').addEventListener('click', () => { minimizar(false); $('.asistente-nube').focus(); });
  raiz.classList.toggle('minimizado', leer(CLAVE_MINIMO, '0') === '1');

  // ---------------------------------------------------------------
  // Nubecita: late 3 veces la primera vez en cada pantalla
  // ---------------------------------------------------------------
  function avisarSiEsNueva() {
    let vistas = [];
    try { vistas = JSON.parse(leer(CLAVE_VISTAS, '[]')); } catch { vistas = []; }
    if (vistas.includes(contexto)) return;
    vistas.push(contexto);
    escribir(CLAVE_VISTAS, JSON.stringify(vistas));
    if (sinMovimiento.matches) return;
    const nube = $('.asistente-nube');
    nube.classList.remove('late'); void nube.offsetWidth; nube.classList.add('late');
  }

  // ---------------------------------------------------------------
  // Nunca tapa botones: si choca con uno (o con el riel o un panel), se corre a la derecha;
  // si ya no entra, sube
  // ---------------------------------------------------------------
  const chocan = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  function obstaculos() {
    return [...(dondeEvitar ?? document).querySelectorAll(OBSTACULOS)]
      .filter((el) => !el.closest('.globo3d-pin') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
  }
  function acomodar() {
    if (raiz.hidden) return;
    // Caja en su lugar de siempre: la de ahora menos lo que ya está corrido (aunque esté a mitad de la transición)
    const caja = (raiz.classList.contains('minimizado') ? $('.asistente-carita') : $('.asistente-juku')).getBoundingClientRect();
    const corrido = new DOMMatrixReadOnly(getComputedStyle(raiz).transform === 'none' ? undefined : getComputedStyle(raiz).transform);
    const obs = obstaculos();
    const base = { left: caja.left - corrido.m41, right: caja.right - corrido.m41, top: caja.top - corrido.m42, bottom: caja.bottom - corrido.m42 };
    const prueba = (dx, dy) => ({ left: base.left + dx, right: base.right + dx, top: base.top + dy, bottom: base.bottom + dy });
    const libre = (r) => r.right <= innerWidth - 4 && r.top >= 4 && !obs.some((o) => chocan(r, o));
    let dx = 0;
    let dy = 0;
    if (!libre(prueba(0, 0))) {
      // Candidatos: a la derecha de cada cosa con la que choca, y arriba de ella
      const choques = obs.filter((o) => chocan(base, o));
      const opciones = [];
      for (const o of choques) {
        opciones.push([o.right + 8 - base.left, 0]);
        opciones.push([0, o.top - 8 - base.bottom]);
      }
      // Encadenar: lo de la derecha puede chocar con otra cosa
      for (let i = 0; i < opciones.length && i < 24; i++) {
        const [x, y] = opciones[i];
        const r = prueba(x, y);
        if (libre(r)) { dx = x; dy = y; break; }
        for (const o of obs.filter((q) => chocan(r, q))) opciones.push([o.right + 8 - base.left, y]);
      }
    }
    raiz.style.setProperty('--mover-x', `${Math.round(dx)}px`);
    raiz.style.setProperty('--mover-y', `${Math.round(dy)}px`);
  }
  // Como mucho una vez cada 250 ms (la pantalla puede cambiar mucho: no se espera a que se calme)
  let esperaAcomodo = 0;
  const pedirAcomodo = () => { if (!esperaAcomodo) esperaAcomodo = setTimeout(() => { esperaAcomodo = 0; acomodar(); }, 250); };
  window.addEventListener('resize', pedirAcomodo);
  // Cambios en la pantalla (algo aparece, se esconde o se mueve). Los del globo (pines y satélite,
  // que cambian en cada cuadro) no cuentan.
  const cuenta = (m) => !(m.target instanceof Element && m.target.closest('.globo3d'));
  if (dondeEvitar) {
    new MutationObserver((ms) => { if (ms.some(cuenta)) pedirAcomodo(); })
      .observe(dondeEvitar, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
  }

  // ---------------------------------------------------------------
  // Contexto
  // ---------------------------------------------------------------
  function ponerContexto(nuevo) {
    if (nuevo === contexto && !raiz.hidden) return;
    contexto = nuevo;
    if (nuevo !== 'glaciar') fraseExtra = '';
    iConsejo = 0;
    raiz.hidden = nuevo === 'carga';
    raiz.dataset.contexto = nuevo;
    if (abierto) pintarPanel();
    if (!raiz.hidden) { avisarSiEsNueva(); pedirAcomodo(); setTimeout(acomodar, 900); }
  }
  const contextoDeRuta = () => POR_RUTA[location.hash.replace(/^#\/?/, '').split('/')[0]] ?? 'carga';
  window.addEventListener('hashchange', () => { cerrar(false); ponerContexto(contextoDeRuta()); });
  window.addEventListener('apu:contexto', (e) => {
    if (contextoDeRuta() !== 'menu') return;
    ponerContexto(['glaciar', 'montana', 'menu'].includes(e.detail) ? e.detail : 'menu');
  });
  window.addEventListener('apu:jukumari', (e) => {
    // detail: 'frase' o { texto: 'frase', abrir: true } (abre el panel para decirla)
    const d = e.detail;
    fraseExtra = String((typeof d === 'object' && d ? d.texto : d) ?? '');
    if (abierto) pintarPanel();
    else if (d?.abrir && !raiz.hidden) abrir();
    const nube = $('.asistente-nube');
    if (!sinMovimiento.matches) { nube.classList.remove('late'); void nube.offsetWidth; nube.classList.add('late'); }
  });
  contexto = '';
  ponerContexto(contextoDeRuta());

  return { cerrar, get contexto() { return contexto; } };
}
