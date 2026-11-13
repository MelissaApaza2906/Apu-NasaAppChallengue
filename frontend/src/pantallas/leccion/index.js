// Pantalla: lección · #/leccion/<id> (id de contenido/lecciones.js)
// Responsable: Luis
// Igual a docs/mockups/lecciones/leccion-N-{teoria,tarjetas,trivia,meta}.png:
//   camino de pasos arriba: Teoría → (Actividad, si la lección tiene una lista) → Tarjetas → Trivia → 🏁 Meta
//   y el Jukumari de cuerpo entero abajo a la derecha, con un globo que "dice" y otro que "piensa".
// Textos: contenido/lecciones.js. Lo visual de cada lección (título, qué significa, cómo se usa, dibujo): visuales.js.
// Las marcas {p}, {pendiente_decada}… se llenan con los JSON reales (public/datos/…); si falta el dato: "—".
// Al aprobar la trivia (3 de 5) se guarda la lección y se da su insignia (componentes/nueva-insignia.js).
import './leccion.css';
import { ir } from '../../router.js';
import { LECCIONES } from '../../contenido/lecciones.js';
import { insigniaPorId } from '../../contenido/insignias.js';
import { leerProgreso, completarLeccion } from '../../servicios/progreso.js';
import { cargarRegion } from '../../servicios/datos.js';
import { darInsignia } from '../../componentes/nueva-insignia.js';
import { VISUAL } from './visuales.js';

const APROBAR = 3;                       // de 5 (60 %)
const REGION = 'cordillera-real';         // la región del caso de las lecciones
const CLAVE_HIPOTESIS = 'apu-hipotesis';  // la hipótesis elegida en la lección 2 (la lee la 9)
const LETRAS = ['A', 'B', 'C', 'D'];
const NOMBRE_PASO = { teoria: 'TEORÍA', actividad: 'ACTIVIDAD', tarjetas: 'TARJETAS', trivia: 'TRIVIA', meta: 'META' };

let vivo = false;
let temporizadores = [];

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtNum = (v, d) => v.toFixed(d).replace('.', ',');
const conSigno = (v, d) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmtNum(Math.abs(v), d)}`;
const decimales = (v) => (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch { /* modo privado */ } };

// ── Datos reales de la lección ───────────────────────────────────────
async function leerJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(ruta);
  return r.json(); // si el servidor devuelve otra cosa (index.html), esto lanza y el dato queda "—"
}

async function cargarDatos() {
  const d = {};
  try {
    const r = await cargarRegion(REGION);
    const v = r.variables?.nieve;
    if (v) {
      Object.assign(d, {
        region: r.nombre, fuente: v.fuente, unidad: v.unidad,
        desde: String(v.desde ?? '').slice(0, 4), hasta: String(v.hasta ?? '').slice(0, 4),
        p: Number.isFinite(v.p) ? v.p : null,
        pendiente: Number.isFinite(v.tendencia_por_decada) ? v.tendencia_por_decada : null,
        veredicto: v.veredicto ?? null,
        anual: Array.isArray(v.anual) && v.anual.every(Number.isFinite) ? v.anual : null
      });
      // Promedio de cada mes (ene…dic) con los valores mensuales reales
      if (Array.isArray(v.meses) && Array.isArray(v.valores)) {
        const suma = Array(12).fill(0), n = Array(12).fill(0);
        v.meses.forEach((m, i) => {
          const mes = Number(String(m).slice(5, 7)) - 1, val = v.valores[i];
          if (mes >= 0 && mes < 12 && Number.isFinite(val)) { suma[mes] += val; n[mes] += 1; }
        });
        if (n.every((x) => x > 0)) d.mensual = suma.map((s, i) => s / n[i]);
      }
    }
  } catch { /* sin datos: todo queda "—" */ }
  try {
    const j = await leerJSON('/datos/lecciones/pruebas.json');
    const lista = Array.isArray(j) ? j : j?.pruebas;
    if (Array.isArray(lista)) {
      d.pruebas = lista.map((x) => String(typeof x === 'string' ? x : x?.resultado ?? x?.color ?? x?.estado ?? '').toLowerCase());
      d.n_ok = Number.isFinite(j?.n_ok) ? j.n_ok : d.pruebas.filter((x) => x === 'verde').length;
      d.n_pruebas = Number.isFinite(j?.n_pruebas) ? j.n_pruebas : d.pruebas.length;
    }
  } catch { /* aún no existe: {n_ok} y {n_pruebas} quedan "—" */ }
  return d;
}

// Las marcas, ya escritas como texto (sin HTML)
function marcas(d, apodo) {
  const l2 = LECCIONES.find((l) => l.hipotesis);
  const elegida = leer(CLAVE_HIPOTESIS);
  const valida = l2?.hipotesis.opciones.includes(elegida) ? elegida : null;
  return {
    apodo: apodo || 'detective',
    region: d.region, desde: d.desde || null, hasta: d.hasta || null,
    pendiente_decada: d.pendiente != null ? conSigno(d.pendiente, decimales(d.pendiente)) : null,
    p: d.p != null ? (d.p < 0.01 ? '< 0,01' : fmtNum(d.p, 2)) : null,
    veredicto_texto: d.veredicto ? (d.veredicto === 'real' ? 'es muy difícil que sea solo suerte' : 'todavía no se sabe si es más que azar') : null,
    n_ok: d.n_ok, n_pruebas: d.n_pruebas,
    hipotesis: valida ? `${l2.hipotesis.pregunta} ${valida}` : null,
    hipotesisCorta: valida ? `La nieve ${valida}` : '—',
    hayDatos: d.p != null
  };
}
const rellenar = (t, m, escapar) => String(t ?? '').replace(/\{(\w+)\}/g, (_, k) => (m[k] == null || m[k] === '' ? '—' : escapar ? esc(m[k]) : String(m[k])));

// ── Pantalla ─────────────────────────────────────────────────────────
export function montar(contenedor, params = []) {
  vivo = true;
  const l = LECCIONES.find((x) => x.id === params[0]);
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-leccion';
  contenedor.append(raiz);

  if (!l) {
    raiz.innerHTML = `<div class="lec-fondo" aria-hidden="true"></div>
      <div class="lec-nada"><h1 class="titulo-apu">LECCIÓN</h1><p>No encontramos esa lección.</p>
      <button type="button" class="btn-apu secundario" data-etapas>VOLVER A LAS ETAPAS</button></div>`;
    raiz.querySelector('[data-etapas]').addEventListener('click', () => ir('etapas'));
    return;
  }

  const vis = VISUAL[l.id] ?? {};
  const idx = LECCIONES.indexOf(l);
  const siguiente = LECCIONES[idx + 1] ?? null;
  const conActividad = Boolean(l.hipotesis); // las demás actividades aún no están listas: no se muestran
  const pasos = ['teoria', ...(conActividad ? ['actividad'] : []), 'tarjetas', 'trivia', 'meta'];
  const est = { paso: 'teoria', hechos: new Set(), carta: 0, volteada: false, vistas: new Set([0]), pregunta: 0, aciertos: 0, respondida: false };
  let d = {}, m = marcas({}, '');
  const txt = (t) => esc(rellenar(t, m));      // texto plano con marcas
  const html = (t) => rellenar(t, m, true);    // texto con <b> de lecciones.js, marcas escapadas

  raiz.innerHTML = `
    <div class="lec-fondo" aria-hidden="true"></div>
    <span class="lec-esq arriba" aria-hidden="true"></span><span class="lec-esq abajo" aria-hidden="true"></span>
    <header class="lec-cabeza">
      <button type="button" class="lec-logo" aria-label="Volver a las etapas"><img src="/img/logo-apu.png" alt=""></button>
      <nav class="lec-camino" aria-label="Pasos de la lección"><ol></ol></nav>
    </header>
    <main class="lec-cuerpo" tabindex="-1"></main>
    <aside class="lec-juku">
      <p class="lec-piensa" aria-live="polite"><span aria-hidden="true">💭</span> <span data-piensa></span></p>
      <p class="lec-dice" aria-live="polite"><b>JUKUMARI</b><span data-dice></span></p>
      <img src="/img/jukumari-cuerpo.webp" alt="El Jukumari, tu guía">
    </aside>
    <div class="lec-confeti" aria-hidden="true"></div>`;
  const $ = (s) => raiz.querySelector(s);
  const cuerpo = $('.lec-cuerpo');
  $('.lec-logo').addEventListener('click', () => ir('etapas'));

  const jukumari = (dice, piensa) => {
    $('[data-dice]').textContent = rellenar(dice, m);
    $('[data-piensa]').textContent = rellenar(piensa, m);
    $('.lec-piensa').hidden = !piensa;
  };

  // Camino de pasos
  const pintarCamino = () => {
    const actual = pasos.indexOf(est.paso);
    $('.lec-camino ol').innerHTML = pasos.map((p, i) => {
      const hecho = est.hechos.has(p) && p !== est.paso;
      const clase = p === est.paso ? 'actual' : hecho ? 'hecho' : '';
      const marca = hecho ? '✓' : p === 'meta' ? '🏁' : String(i + 1);
      const une = i ? `<li class="lec-une ${est.hechos.has(pasos[i - 1]) && i <= actual ? 'hecho' : ''}" aria-hidden="true"></li>` : '';
      return `${une}<li class="lec-paso ${clase}"><button type="button" data-paso="${p}" ${hecho ? '' : 'disabled'}
        ${p === est.paso ? 'aria-current="step"' : ''} aria-label="${NOMBRE_PASO[p]}${hecho ? ', hecho' : ''}">
        <span class="bola">${marca}</span><span class="nombre">${NOMBRE_PASO[p]}</span></button></li>`;
    }).join('');
  };
  $('.lec-camino').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-paso]');
    if (b && !b.disabled) ir_a(b.dataset.paso);
  });

  const ir_a = (paso) => {
    const i = pasos.indexOf(est.paso);
    if (pasos.indexOf(paso) > i) est.hechos.add(est.paso);
    est.paso = paso;
    pintarCamino();
    raiz.classList.toggle('en-meta', paso === 'meta');
    $('.lec-confeti').replaceChildren();
    // Entrar a la trivia siempre la empieza de cero (y la meta vuelve a quedar por delante)
    const empezarTrivia = () => { est.pregunta = 0; est.aciertos = 0; est.hechos.delete('trivia'); est.hechos.delete('meta'); pintarCamino(); pintarTrivia(); };
    ({ teoria: pintarTeoria, actividad: pintarActividad, tarjetas: pintarTarjetas, trivia: empezarTrivia, meta: pintarMeta })[paso]();
    cuerpo.scrollTop = 0;
    cuerpo.querySelector('h1')?.focus({ preventScroll: true });
  };
  const despuesDe = (paso) => pasos[pasos.indexOf(paso) + 1];
  const textoSeguir = (paso) => ({ actividad: 'IR A LA ACTIVIDAD', tarjetas: 'PRACTICAR CON TARJETAS', trivia: 'IR A LA TRIVIA', meta: 'VER MI RESULTADO' })[despuesDe(paso)];
  const titulo = (partes) => partes ? `${esc(partes[0])}<em>${esc(partes[1])}</em>${esc(partes[2])}` : esc(l.titulo);

  // ── Teoría
  function pintarTeoria() {
    cuerpo.innerHTML = `
      <p class="lec-ceja">LECCIÓN ${l.numero} · ${esc(l.titulo.toUpperCase())}</p>
      <h1 class="lec-titulo" tabindex="-1">${titulo(vis.titulo)}</h1>
      <div class="lec-que-como">
        <div class="lec-que"><h2 class="lec-ceja">QUÉ SIGNIFICA</h2><p>${vis.significa ?? html(l.teoria.intro)}</p></div>
        ${vis.como ? `<div class="lec-como"><h2 class="lec-ceja gris">CÓMO SE USA</h2><ol>${vis.como.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>` : ''}
      </div>
      <div class="lec-dibujo">${vis.dibujo ? vis.dibujo(l, d, m) : ''}</div>
      <div class="lec-pie">
        <button type="button" class="lec-libro" aria-haspopup="dialog">📖 ¿Quieres saber más? Toca el libro</button>
        <button type="button" class="btn-apu" data-seguir>${textoSeguir('teoria')}</button>
      </div>`;
    vis.alMontar?.(cuerpo, d, m);
    cuerpo.querySelector('.lec-libro').addEventListener('click', abrirLibro);
    cuerpo.querySelector('[data-seguir]').addEventListener('click', () => ir_a(despuesDe('teoria')));
    jukumari(vis.dice ?? l.jukumari.inicio, vis.piensa ?? '');
  }

  // El libro 📖: la idea completa, para curiosos, vocabulario y fuentes
  function abrirLibro() {
    const t = l.teoria;
    const v = document.createElement('dialog');
    v.className = 'panel-apu lec-ventana';
    v.setAttribute('aria-labelledby', 'lec-libro-titulo');
    v.innerHTML = `
      <header><h2 id="lec-libro-titulo">📖 ${esc(l.titulo)}</h2>
        <button type="button" class="lec-cerrar" aria-label="Cerrar">✕</button></header>
      <div class="lec-ventana-cuerpo">
        <p>${html(t.intro)}</p>
        ${t.paraPensar ? `<h3>PARA PENSAR</h3><p>${txt(t.paraPensar)}</p>` : ''}
        ${t.paraCuriosos ? `<h3>PARA CURIOSOS</h3><p>${txt(t.paraCuriosos)}</p>` : ''}
        ${t.metodo ? `<h3>${esc(t.metodo.toUpperCase())}</h3><ol>${t.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>` : ''}
        ${l.satelites ? `<h3>LOS SATÉLITES</h3><ul>${l.satelites.map((s) => `<li><b>${esc(s.nombre)}</b>${s.enApu ? ' <span class="lec-chip verde">EN APU</span>' : ''} — ${esc(s.mide)} (desde ${esc(s.desde)}). ${esc(s.detalle)}.</li>`).join('')}</ul>${l.nota3d ? `<p>${esc(l.nota3d)}</p>` : ''}` : ''}
        ${t.vocabulario ? `<h3>VOCABULARIO</h3><dl>${t.vocabulario.map((x) => `<dt>${esc(x.palabra)}</dt><dd>${esc(x.significa)}</dd>`).join('')}</dl>` : ''}
        ${t.fuentes ? `<h3>FUENTES</h3><ul>${t.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.texto)}</a></li>`).join('')}</ul>` : ''}
        ${d.fuente && (l.datos || /\{(p|pendiente_decada|hipotesis)\}/.test(JSON.stringify(l))) ? `<h3>DATOS</h3><p>${esc(d.fuente)} · ${esc(d.region)} · ${esc(d.desde)}–${esc(d.hasta)}.</p>` : ''}
      </div>`;
    raiz.append(v);
    v.querySelector('.lec-cerrar').addEventListener('click', () => v.close());
    v.addEventListener('click', (e) => { if (e.target === v) v.close(); });
    v.addEventListener('close', () => v.remove(), { once: true });
    v.showModal();
  }

  // ── Actividad (lección 2: tu hipótesis)
  function pintarActividad() {
    const h = l.hipotesis;
    const elegida = leer(CLAVE_HIPOTESIS);
    cuerpo.innerHTML = `
      <p class="lec-ceja">LECCIÓN ${l.numero} · ACTIVIDAD</p>
      <h1 class="lec-titulo" tabindex="-1">Elige tu <em>hipótesis</em></h1>
      <p class="lec-pregunta">${esc(h.pregunta)}</p>
      <div class="lec-opciones tres" role="radiogroup" aria-label="Tu hipótesis">
        ${h.opciones.map((o, i) => `<button type="button" role="radio" class="lec-opcion ${o === elegida ? 'elegida' : ''}" aria-checked="${o === elegida}" data-o="${esc(o)}"><span class="letra">${LETRAS[i]}</span><span>${esc(o)}</span></button>`).join('')}
      </div>
      <p class="lec-nota">Puede estar equivocada, ¡y eso está bien! En la lección 9 la comparamos con los datos.</p>
      <div class="lec-pie derecha"><button type="button" class="btn-apu" data-seguir ${h.opciones.includes(elegida) ? '' : 'disabled'}>${textoSeguir('actividad')}</button></div>`;
    cuerpo.querySelectorAll('.lec-opcion').forEach((b) => b.addEventListener('click', () => {
      guardarLocal(CLAVE_HIPOTESIS, b.dataset.o);
      m = marcas(d, m.apodo);
      cuerpo.querySelectorAll('.lec-opcion').forEach((x) => { x.classList.toggle('elegida', x === b); x.setAttribute('aria-checked', String(x === b)); });
      cuerpo.querySelector('[data-seguir]').disabled = false;
      jukumari('¡Anotado! Los datos dirán si tenías razón.', `Mi corazonada: la nieve ${b.dataset.o}…`);
    }));
    cuerpo.querySelector('[data-seguir]').addEventListener('click', () => ir_a(despuesDe('actividad')));
    jukumari(l.jukumari.inicio, '¿Qué crees que pasó con la nieve?');
  }

  // ── Tarjetas
  function pintarTarjetas() {
    const total = l.tarjetas.length;
    cuerpo.innerHTML = `
      <p class="lec-ceja" data-cont></p>
      <h1 class="lec-titulo" tabindex="-1">Voltea y <em>memoriza</em></h1>
      <div class="lec-mazo-zona">
        <div class="lec-mazo">
          <span class="capa c3" aria-hidden="true"></span><span class="capa c2" aria-hidden="true"></span>
          <button type="button" class="lec-carta"></button>
        </div>
        <ol class="lec-avance" aria-label="Tarjetas">${l.tarjetas.map((_, i) => `<li><button type="button" data-c="${i}" aria-label="Tarjeta ${i + 1}">${i + 1}</button></li>`).join('')}</ol>
      </div>
      <div class="lec-pie derecha">
        <button type="button" class="btn-apu secundario" data-ant>ANTERIOR</button>
        <button type="button" class="btn-apu" data-sig>SIGUIENTE</button>
      </div>`;
    const carta = cuerpo.querySelector('.lec-carta');
    const pintar = (animar) => {
      const t = l.tarjetas[est.carta];
      const icono = vis.iconos?.[est.carta] ?? '❄';
      cuerpo.querySelector('[data-cont]').textContent = `LECCIÓN ${l.numero} · TARJETA ${est.carta + 1} DE ${total}`;
      carta.classList.toggle('volteada', est.volteada);
      carta.setAttribute('aria-label', est.volteada ? `Respuesta: ${rellenar(t.respuesta, m)}. Toca para volver a la pregunta.` : `Pregunta: ${rellenar(t.pregunta, m)}. Toca para voltear.`);
      carta.innerHTML = `
        <span class="cara frente" aria-hidden="true"><span class="lec-ceja">PREGUNTA</span><span class="lec-icono-carta">${icono}</span>
          <span class="lec-carta-texto">${txt(t.pregunta)}</span><span class="lec-voltear">↻ Toca para voltear</span></span>
        <span class="cara dorso" aria-hidden="true"><span class="lec-ceja">RESPUESTA</span>
          <span class="lec-carta-texto">${txt(t.respuesta)}</span><span class="lec-voltear">↻ Toca para volver</span></span>`;
      if (animar) { const mazo = cuerpo.querySelector('.lec-mazo'); mazo.classList.remove('gira'); void mazo.offsetWidth; mazo.classList.add('gira'); }
      cuerpo.querySelectorAll('.lec-avance button').forEach((b, i) => {
        b.classList.toggle('actual', i === est.carta);
        b.classList.toggle('vista', est.vistas.has(i) && i !== est.carta);
        if (i === est.carta) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      cuerpo.querySelector('[data-ant]').disabled = est.carta === 0;
      cuerpo.querySelector('[data-sig]').textContent = est.carta === total - 1 ? 'IR A LA TRIVIA' : 'SIGUIENTE';
      jukumari(est.volteada ? '¡Eso es! Léela otra vez en voz alta.' : 'Gira la tarjeta para memorizar la idea.',
        est.volteada ? '¿La podría explicar con mis palabras?' : `La respuesta: ${recortar(rellenar(t.respuesta, m), 70)}`);
    };
    const mover = (i) => { est.carta = i; est.volteada = false; est.vistas.add(i); pintar(true); };
    carta.addEventListener('click', () => { est.volteada = !est.volteada; pintar(false); });
    cuerpo.querySelector('.lec-avance').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) mover(Number(b.dataset.c)); });
    cuerpo.querySelector('[data-ant]').addEventListener('click', () => est.carta > 0 && mover(est.carta - 1));
    cuerpo.querySelector('[data-sig]').addEventListener('click', () => (est.carta < total - 1 ? mover(est.carta + 1) : ir_a('trivia')));
    pintar(false);
  }

  // ── Trivia
  function pintarTrivia() {
    const total = l.trivia.length;
    est.respondida = false;
    const q = l.trivia[est.pregunta];
    cuerpo.innerHTML = `
      <div class="lec-trivia-cabeza">
        <p class="lec-ceja">TRIVIA · PREGUNTA ${est.pregunta + 1} DE ${total}</p>
        <span class="lec-copos" role="img" aria-label="${est.aciertos} aciertos de ${total}">${l.trivia.map((_, i) => `<span class="${i < est.aciertos ? 'lleno' : ''}">❄</span>`).join('')}</span>
      </div>
      <h1 class="lec-titulo chico" tabindex="-1">${txt(q.pregunta)}</h1>
      <div class="lec-opciones">
        ${q.opciones.map((o, i) => `<button type="button" class="lec-opcion" data-i="${i}"><span class="letra">${LETRAS[i]}</span><span>${txt(o)}</span></button>`).join('')}
      </div>
      <div class="lec-explica-fila">
        <p class="lec-explica" aria-live="polite"></p>
        <button type="button" class="btn-apu" data-sig hidden>${est.pregunta === total - 1 ? 'VER MI RESULTADO' : 'SIGUIENTE'}</button>
      </div>`;
    const ops = [...cuerpo.querySelectorAll('.lec-opcion')];
    ops.forEach((b) => b.addEventListener('click', () => {
      if (est.respondida) return;
      est.respondida = true;
      const i = Number(b.dataset.i), bien = i === q.correcta;
      if (bien) est.aciertos += 1;
      ops.forEach((x, j) => {
        x.disabled = true;
        if (j === q.correcta) { x.classList.add('correcta'); x.querySelector('.letra').textContent = '✓'; }
        else if (x === b) { x.classList.add('mal'); x.querySelector('.letra').textContent = '✕'; }
      });
      cuerpo.querySelectorAll('.lec-copos span').forEach((c, k) => c.classList.toggle('lleno', k < est.aciertos));
      cuerpo.querySelector('.lec-copos').setAttribute('aria-label', `${est.aciertos} aciertos de ${total}`);
      cuerpo.querySelector('.lec-explica').innerHTML = `<b class="${bien ? 'bien' : 'mal'}">${bien ? '¡Bien!' : 'Casi.'}</b> ${txt(q.explicacion)}`;
      const sig = cuerpo.querySelector('[data-sig]');
      sig.hidden = false; sig.focus();
      jukumari(bien ? l.jukumari.acierto : 'Si fallas, te explico por qué. ¡Así se aprende!', bien ? '' : `Pista: ${l.jukumari.fallo}`);
    }));
    cuerpo.querySelector('[data-sig]').addEventListener('click', () => {
      if (est.pregunta < total - 1) { est.pregunta += 1; pintarTrivia(); cuerpo.querySelector('h1')?.focus({ preventScroll: true }); }
      else ir_a('meta');
    });
    jukumari(est.pregunta === 0 ? 'Si fallas, te explico por qué. ¡Así se aprende!' : 'Otra más. ¡Tú puedes!', 'Lee todas las opciones antes de tocar…');
  }

  // ── Meta
  function pintarMeta() {
    const total = l.trivia.length;
    const aprobo = est.aciertos >= APROBAR;
    const ins = l.insignia ? insigniaPorId(l.insignia) : null;
    const medalla = !ins
      ? `<svg class="lec-sello" viewBox="0 0 200 220" role="img" aria-label="Sello: paso superado"><path d="M100 6 190 58v104l-90 52-90-52V58Z" fill="#0F2150" stroke="var(--dato-lluvia)" stroke-width="8"/><path d="M100 30 168 70v80l-68 40-68-40V70Z" fill="none" stroke="var(--rojo-apu)" stroke-width="4"/><path d="m62 112 26 26 52-56" fill="none" stroke="var(--nieve)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : ins.img ? `<img src="${esc(ins.img)}" alt="Insignia ${esc(ins.nombre)}">`
        : '<span class="lec-hex-pendiente" role="img" aria-label="Insignia con dibujo pendiente">?</span>';
    const nombre = !ins ? '¡Paso superado!' : ins.img ? ins.nombre : `${ins.nombre} (dibujo pendiente)`;
    const ultimo = !siguiente;
    cuerpo.innerHTML = `
      <div class="lec-meta ${aprobo ? '' : 'sin-aprobar'}">
        <p class="lec-ceja">${aprobo ? `LECCIÓN ${l.numero} COMPLETADA` : `LECCIÓN ${l.numero} · NECESITAS ${APROBAR} DE ${total}`} · ${esc(l.titulo.toUpperCase())}</p>
        <h1 class="lec-titulo grande" tabindex="-1">${aprobo ? '¡MISIÓN CUMPLIDA!' : '¡CASI LO LOGRAS!'}</h1>
        <div class="lec-medalla"><span class="lec-brillo" aria-hidden="true"></span>${medalla}</div>
        <h2 class="lec-medalla-nombre">${esc(nombre)}</h2>
        <p class="lec-medalla-frase">${aprobo ? txt(l.jukumari.acierto) : 'Repasa la teoría y vuelve a intentarlo.'}</p>
        <p class="lec-puntaje"><span class="lec-copos grandes" aria-hidden="true">${l.trivia.map((_, i) => `<span class="${i < est.aciertos ? 'lleno' : ''}">❄</span>`).join('')}</span><b>${est.aciertos} de ${total}</b></p>
        <div class="lec-pie centro">
          ${aprobo
            ? `<button type="button" class="btn-apu secundario" data-repetir>REPETIR TRIVIA</button>
               <button type="button" class="btn-apu" data-seguir>${ultimo ? 'VER MI INFORME' : `IR A LA LECCIÓN ${siguiente.numero}`}</button>`
            : `<button type="button" class="btn-apu secundario" data-teoria>VOLVER A LA TEORÍA</button>
               <button type="button" class="btn-apu" data-repetir>REPETIR TRIVIA</button>`}
        </div>
      </div>`;
    cuerpo.querySelector('[data-repetir]').addEventListener('click', () => ir_a('trivia'));
    cuerpo.querySelector('[data-teoria]')?.addEventListener('click', () => ir_a('teoria'));
    cuerpo.querySelector('[data-seguir]')?.addEventListener('click', () => ir(ultimo ? 'casos' : `leccion/${siguiente.id}`));
    jukumari(aprobo ? '¡Lo lograste, {apodo}!' : l.jukumari.fallo,
      aprobo ? (ultimo ? 'Lo que viene: tu informe del caso' : `Lo que viene: ${siguiente.titulo}`) : '¿Qué parte me costó más?');
    if (aprobo) {
      est.hechos.add('meta');
      echarConfeti();
      completarLeccion(l.id).catch(() => {});
      if (l.insignia) temporizadores.push(setTimeout(() => { if (vivo) darInsignia(l.insignia); }, 1600));
    }
  }

  function echarConfeti() {
    const colores = ['var(--bandera-rojo)', 'var(--bandera-amarillo)', 'var(--bandera-verde)', 'var(--dato-lluvia)', 'var(--nieve)'];
    const caja = $('.lec-confeti');
    caja.replaceChildren(...Array.from({ length: 46 }, (_, i) => {
      const s = document.createElement('i');
      const dur = 7 + Math.random() * 7;
      s.style.cssText = `left:${(8 + Math.random() * 62).toFixed(1)}%;background:${colores[i % colores.length]};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--giro:${Math.round(Math.random() * 720 - 360)}deg;--dx:${((Math.random() - 0.5) * 8).toFixed(1)}cqw;width:${(5 + Math.random() * 6).toFixed(0)}px`;
      return s;
    }));
  }

  ir_a('teoria');
  // Los datos llegan después: se vuelve a pintar el paso actual con las marcas llenas
  Promise.all([cargarDatos(), leerProgreso().catch(() => ({}))]).then(([datos, p]) => {
    if (!vivo) return;
    d = datos; m = marcas(d, String(p.apodo || '').trim());
    if (est.paso === 'teoria') ir_a('teoria');
    else if (est.paso === 'meta') jukumari(est.aciertos >= APROBAR ? '¡Lo lograste, {apodo}!' : l.jukumari.fallo, $('[data-piensa]').textContent);
  });
}

function recortar(t, n) { return t.length > n ? `${t.slice(0, n).trimEnd()}…` : t; }

export function desmontar() {
  vivo = false;
  temporizadores.forEach(clearTimeout);
  temporizadores = [];
}
