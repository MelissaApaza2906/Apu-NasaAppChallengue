// Pantalla: lección · #/leccion/<id> (id de contenido/lecciones.js, ruta de 10 lecciones)
// Igual a docs/mockups/lecciones-v3/nuevo-lN-{p1..p4,tar,tri,meta}.jpg:
//   barra de arriba: TEORÍA ●●●● → TARJETAS → TRIVIA → META
//   Teoría: 4 páginas (título, texto, visual, EJEMPLO amarillo y "¿LO ENTENDISTE?"). No se pasa de página
//           sin acertar el chequeo (se puede reintentar). "Para curiosos" abre paraCuriosos si existe.
//   Tarjetas: 5 que se voltean. Trivia: 5 preguntas (opciones, clasificar, ordenar, pixeles, juez).
//   Meta: confeti, insignia del bloque (L2, L4 y L10), "AHORA SABES" y la siguiente lección (L10 → #/casos).
// El Jukumari guía siempre (globo "dice" blanco + nube "piensa" punteada); si no pasa nada en 20 s, da un consejo.
// Textos: contenido/lecciones.js (traen <b> y <em>: es contenido propio). Visuales: visuales.js. Datos: datos.js.
// Avance (fase, página, chequeos, pregunta, aciertos) en el navegador; la hipótesis de la L5, en el perfil.
import './leccion.css';
import { ir } from '../../router.js';
import { LECCIONES, BLOQUES } from '../../contenido/lecciones.js';
import { insigniaPorId } from '../../contenido/insignias.js';
import { leerProgreso, completarLeccion, guardarHipotesis, leerAvance, guardarAvance } from '../../servicios/progreso.js';
import { darInsignia } from '../../componentes/nueva-insignia.js';
import { cargarDatos, marcas, rellenar, esc } from './datos.js';
import { VISUALES, MONTAR, escena, linea } from './visuales.js';

const APROBAR = 0.6;          // 3 de 5
const ESPERA = 20000;         // ms sin hacer nada → consejo del Jukumari
const FASES = ['teoria', 'tarjetas', 'trivia', 'meta'];
const NOMBRE_FASE = { teoria: 'TEORÍA', tarjetas: 'TARJETAS', trivia: 'TRIVIA', meta: 'META' };
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ICONO_ETIQUETA = { Nieve: '❄', Nube: '☁', Sal: '🧂', Agua: '💧' };

let vivo = false;
let temporizadores = [];
let quitar = [];

const sinEtiquetas = (t) => String(t ?? '').replace(/<[^>]*>/g, '');
const mezclar = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

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

  const idx = LECCIONES.indexOf(l);
  const siguiente = LECCIONES[idx + 1] ?? null;
  const bloque = BLOQUES[l.bloque] ?? null;
  const previo = leerAvance(l.id) ?? {};
  const est = {
    fase: FASES.includes(previo.fase) && previo.fase !== 'meta' ? previo.fase : 'teoria',
    pagina: Number.isInteger(previo.pagina) ? Math.min(3, Math.max(0, previo.pagina)) : 0,
    chequeos: Array.isArray(previo.chequeos) ? l.paginas.map((_, i) => Boolean(previo.chequeos[i])) : l.paginas.map(() => false),
    alcanzada: Number.isInteger(previo.alcanzada) ? previo.alcanzada : 0,
    carta: Number.isInteger(previo.carta) ? Math.min(l.tarjetas.length - 1, previo.carta) : 0,
    volteada: false, vistas: new Set([0]),
    pregunta: Number.isInteger(previo.pregunta) ? previo.pregunta : 0,
    aciertos: Number.isInteger(previo.aciertos) ? previo.aciertos : 0,
    fallosSeguidos: 0
  };
  if (est.fase === 'trivia' && !Number.isInteger(previo.pregunta)) { est.pregunta = 0; est.aciertos = 0; }
  const guardar = () => guardarAvance(l.id, {
    fase: est.fase, pagina: est.pagina, chequeos: est.chequeos, alcanzada: est.alcanzada,
    carta: est.carta, pregunta: est.pregunta, aciertos: est.aciertos
  });

  // Datos reales y perfil (llegan después: se vuelve a pintar con las marcas llenas)
  let d = {}, perfil = {}, m = marcas({}, {}), cargado = false;
  const H = (t) => rellenar(t, m, true);               // contenido de lecciones.js (con <b>/<em>), marcas escapadas
  const T = (t) => esc(rellenar(sinEtiquetas(t), m));   // texto plano escapado
  const listo = Promise.all([cargarDatos().catch(() => ({})), leerProgreso().catch(() => ({}))]).then(([datos, p]) => {
    d = datos; perfil = p; m = marcas(d, p); cargado = true;
  });

  raiz.innerHTML = `
    <div class="lec-fondo" aria-hidden="true"></div>
    <span class="lec-esq arriba" aria-hidden="true"></span><span class="lec-esq abajo" aria-hidden="true"></span>
    <header class="lec-cabeza">
      <button type="button" class="lec-logo" aria-label="Volver a las etapas"><img src="/img/logo-apu.png" alt=""></button>
      <nav class="lec-camino" aria-label="Fases de la lección"><ol></ol></nav>
    </header>
    <main class="lec-cuerpo" tabindex="-1"></main>
    <aside class="lec-juku" aria-label="El Jukumari, tu guía">
      <p class="lec-piensa" aria-live="polite"><span aria-hidden="true">💭</span> <span data-piensa></span></p>
      <p class="lec-dice" aria-live="polite"><b>JUKUMARI</b><span data-dice></span></p>
      <img src="/img/jukumari-cuerpo.webp" alt="">
    </aside>
    <div class="lec-confeti" aria-hidden="true"></div>`;
  const $ = (s) => raiz.querySelector(s);
  const cuerpo = $('.lec-cuerpo');
  $('.lec-logo').addEventListener('click', () => ir('etapas'));

  // ── El Jukumari: dice (globo blanco) y piensa (nube punteada)
  let consejos = [], nConsejo = 0, reloj = 0;
  const jukumari = (dice, piensa = '') => {
    $('[data-dice]').textContent = rellenar(sinEtiquetas(dice), m);
    $('[data-piensa]').textContent = rellenar(sinEtiquetas(piensa), m);
    $('.lec-piensa').hidden = !piensa;
    const g = $('.lec-dice'); g.classList.remove('habla'); void g.offsetWidth; g.classList.add('habla');
  };
  // Si no hace nada en 20 s, el globo cambia a un consejo (y vuelve a contar)
  const esperar = () => {
    clearTimeout(reloj);
    if (!consejos.length || !vivo) return;
    reloj = setTimeout(() => {
      if (!vivo) return;
      jukumari(consejos[nConsejo++ % consejos.length], $('[data-piensa]').textContent);
      esperar();
    }, ESPERA);
  };
  const conConsejos = (lista) => { consejos = lista; nConsejo = 0; esperar(); };
  const alActuar = () => esperar();
  raiz.addEventListener('pointerdown', alActuar);
  raiz.addEventListener('keydown', alActuar);
  quitar.push(() => clearTimeout(reloj));

  // ── Barra de arriba: TEORÍA ●●●● → TARJETAS → TRIVIA → META
  const pintarCamino = () => {
    const actual = FASES.indexOf(est.fase);
    $('.lec-camino ol').innerHTML = FASES.map((f, i) => {
      const hecha = i < est.alcanzada || (f === 'meta' && est.fase === 'meta');
      const clase = f === est.fase ? 'actual' : hecha ? 'hecha' : '';
      const puntos = f === 'teoria' ? `<span class="puntos" aria-hidden="true">${l.paginas.map((_, k) =>
        `<i class="${est.chequeos[k] ? 'ok' : ''}${est.fase === 'teoria' && k === est.pagina ? ' aqui' : ''}"></i>`).join('')}</span>` : '';
      const une = i ? `<li class="lec-une ${i <= est.alcanzada ? 'hecha' : ''}" aria-hidden="true"></li>` : '';
      const puede = i <= est.alcanzada && f !== est.fase && f !== 'meta';
      return `${une}<li><button type="button" class="lec-fase ${clase}" data-fase="${f}" ${puede ? '' : 'disabled'}
        ${f === est.fase ? 'aria-current="step"' : ''} aria-label="${NOMBRE_FASE[f]}${clase === 'hecha' ? ', hecha' : ''}${f === 'teoria' ? `, ${est.chequeos.filter(Boolean).length} de 4 páginas` : ''}">
        ${clase === 'hecha' ? '<span aria-hidden="true">✓</span>' : ''}${NOMBRE_FASE[f]}${puntos}</button></li>`;
    }).join('');
    void actual;
  };
  $('.lec-camino').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-fase]');
    if (b && !b.disabled) irA(b.dataset.fase);
  });

  const irA = async (fase) => {
    const i = FASES.indexOf(fase);
    est.alcanzada = Math.max(est.alcanzada, i);
    est.fase = fase;
    raiz.classList.toggle('en-meta', fase === 'meta');
    $('.lec-confeti').replaceChildren();
    if (fase === 'trivia') { est.pregunta = 0; est.aciertos = 0; est.fallosSeguidos = 0; }
    guardar();
    pintarCamino();
    await pintarFase();
    cuerpo.scrollTop = 0;
    cuerpo.querySelector('h1')?.focus({ preventScroll: true });
  };
  const pintarFase = async () => {
    if (est.fase === 'trivia' || est.fase === 'meta') {
      if (!cargado) { cuerpo.innerHTML = '<p class="lec-cargando">Cargando…</p>'; await listo; if (!vivo) return; }
    }
    ({ teoria: pintarTeoria, tarjetas: pintarTarjetas, trivia: pintarTrivia, meta: pintarMeta })[est.fase]();
  };

  // ── Teoría
  function pintarTeoria(conInicio = false) {
    const i = est.pagina, p = l.paginas[i];
    const ultima = i === l.paginas.length - 1;
    const ch = p.chequeo;
    const visual = VISUALES[l.id]?.[i];
    const curiosos = p.paraCuriosos || (i === 0 && l.fuentes);
    cuerpo.innerHTML = `
      <p class="lec-ceja">LECCIÓN ${l.numero} · ${esc(l.titulo.toUpperCase())} · PÁGINA ${i + 1} DE ${l.paginas.length}</p>
      <h1 class="lec-titulo" tabindex="-1">${H(p.titulo)}</h1>
      <p class="lec-texto">${H(p.texto)}</p>
      <div class="lec-teoria">
        <div class="lec-visual">${visual ? visual({ d, m, l, perfil }) : ''}</div>
        <div class="lec-lado">
          <div class="lec-ejemplo"><p class="lec-ceja amarilla">EJEMPLO</p><p>${H(p.ejemplo)}</p></div>
          <div class="lec-chequeo" role="group" aria-labelledby="lec-cheq-p">
            <p class="lec-ceja">¿LO ENTENDISTE?</p>
            <p id="lec-cheq-p" class="lec-cheq-pregunta">${H(ch.pregunta)}</p>
            <div class="lec-cheq-ops">${ch.opciones.map((o, k) => `<button type="button" class="lec-opcion chica" data-k="${k}"><span class="letra">${LETRAS[k]}</span><span>${H(o)}</span></button>`).join('')}</div>
            <p class="lec-explica" aria-live="polite"></p>
          </div>
        </div>
      </div>
      <div class="lec-pie">
        <button type="button" class="btn-apu secundario" data-ant ${i === 0 ? 'disabled' : ''}>ANTERIOR</button>
        ${curiosos ? `<button type="button" class="lec-libro" aria-haspopup="dialog">📖 ${p.paraCuriosos ? 'Para curiosos' : 'Fuentes'}</button>` : '<span></span>'}
        <button type="button" class="btn-apu" data-sig ${est.chequeos[i] ? '' : 'disabled'}>${ultima ? 'IR A TARJETAS' : 'SIGUIENTE PÁGINA'}</button>
      </div>
      <p class="lec-nota lec-falta" ${est.chequeos[i] ? 'hidden' : ''}>Responde “¿Lo entendiste?” para seguir.</p>`;
    if (visual) MONTAR[l.id]?.[i]?.(cuerpo.querySelector('.lec-visual'), {
      d, m, l, perfil,
      guardarHipotesis: (op, conf) => {
        perfil = { ...perfil, hipotesis: [op, conf].filter(Boolean).join('|') };
        m = marcas(d, perfil);
        guardarHipotesis(op, conf).catch(() => {});
        jukumari('¡Anotado! Los datos dirán si tenías razón.', `Mi corazonada: la nieve ${op}…`);
      }
    });
    const ops = [...cuerpo.querySelectorAll('.lec-cheq-ops .lec-opcion')];
    const explica = cuerpo.querySelector('.lec-chequeo .lec-explica');
    const marcarBien = () => {
      ops.forEach((b, k) => { b.disabled = true; if (k === ch.correcta) { b.classList.add('correcta'); b.querySelector('.letra').textContent = '✓'; } });
      explica.innerHTML = `<b class="bien">¡Bien!</b> ${H(ch.explicacion)}`;
      cuerpo.querySelector('[data-sig]').disabled = false;
      cuerpo.querySelector('.lec-falta').hidden = true;
    };
    if (est.chequeos[i]) marcarBien();
    ops.forEach((b) => b.addEventListener('click', () => {
      const k = Number(b.dataset.k);
      if (k === ch.correcta) {
        est.chequeos[i] = true; guardar(); pintarCamino();
        marcarBien();
        jukumari(l.jukumari.acierto, p.jukumari.piensa);
        cuerpo.querySelector('[data-sig]').focus();
      } else {
        b.disabled = true; b.classList.add('mal'); b.querySelector('.letra').textContent = '✕';
        explica.innerHTML = `<b class="mal">Casi.</b> ${H(ch.explicacion)} <span class="lec-reintenta">Prueba otra vez.</span>`;
        jukumari(l.jukumari.fallo, p.jukumari.piensa);
      }
    }));
    cuerpo.querySelector('[data-ant]').addEventListener('click', () => { est.pagina -= 1; guardar(); pintarCamino(); pintarTeoria(); cuerpo.scrollTop = 0; });
    cuerpo.querySelector('[data-sig]').addEventListener('click', () => {
      if (!est.chequeos[i]) return;
      if (ultima) { irA('tarjetas'); return; }
      est.pagina += 1; guardar(); pintarCamino(); pintarTeoria(); cuerpo.scrollTop = 0;
      cuerpo.querySelector('h1')?.focus({ preventScroll: true });
    });
    cuerpo.querySelector('.lec-libro')?.addEventListener('click', () => abrirCuriosos(p));
    if (conInicio) jukumari(l.jukumari.inicio, p.jukumari.piensa);
    else jukumari(p.jukumari.dice, p.jukumari.piensa);
    const hayDibujo = Boolean(visual);
    conConsejos(['¿Te ayudo? Lee el ejemplo amarillo: ahí está la idea con algo de todos los días.',
      hayDibujo ? 'Mira el gráfico de la izquierda: cuenta lo mismo con un dibujo.' : 'Lee el texto despacio, una frase a la vez.',
      est.chequeos[i] ? '¡Ya respondiste! Toca el botón para seguir.' : 'Cuando estés listo, responde “¿Lo entendiste?”.']);
  }

  // "Para curiosos" (y las fuentes de las noticias de la L5)
  function abrirCuriosos(p) {
    const v = document.createElement('dialog');
    v.className = 'panel-apu lec-ventana';
    v.setAttribute('aria-labelledby', 'lec-cur-titulo');
    v.innerHTML = `
      <header><h2 id="lec-cur-titulo">📖 ${p.paraCuriosos ? 'Para curiosos' : 'Fuentes'}</h2>
        <button type="button" class="lec-cerrar" aria-label="Cerrar">✕</button></header>
      <div class="lec-ventana-cuerpo">
        ${p.paraCuriosos ? `<p>${H(p.paraCuriosos)}</p>` : ''}
        ${l.fuentes && est.pagina === 0 ? `<h3>FUENTES DEL EXPEDIENTE</h3><ul>${l.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.texto)}</a></li>`).join('')}</ul>` : ''}
      </div>`;
    raiz.append(v);
    v.querySelector('.lec-cerrar').addEventListener('click', () => v.close());
    v.addEventListener('click', (e) => { if (e.target === v) v.close(); });
    v.addEventListener('close', () => v.remove(), { once: true });
    v.showModal();
  }

  // ── Tarjetas
  function pintarTarjetas() {
    const total = l.tarjetas.length;
    cuerpo.innerHTML = `
      <p class="lec-ceja" data-cont></p>
      <h1 class="lec-titulo" tabindex="-1">Voltea y <em>memoriza</em></h1>
      <div class="lec-mazo">
        <span class="capa c3" aria-hidden="true"></span><span class="capa c2" aria-hidden="true"></span>
        <button type="button" class="lec-carta"></button>
      </div>
      <div class="lec-pie">
        <ol class="lec-puntitos" aria-label="Tarjetas">${l.tarjetas.map((_, i) => `<li><button type="button" data-c="${i}" aria-label="Tarjeta ${i + 1}"></button></li>`).join('')}</ol>
        <span class="lec-pie-der">
          <button type="button" class="btn-apu secundario" data-ant>ANTERIOR</button>
          <button type="button" class="btn-apu" data-sig>SIGUIENTE</button>
        </span>
      </div>`;
    const carta = cuerpo.querySelector('.lec-carta');
    const pintar = (animar) => {
      const t = l.tarjetas[est.carta];
      cuerpo.querySelector('[data-cont]').textContent = `LECCIÓN ${l.numero} · TARJETA ${est.carta + 1} DE ${total}`;
      carta.classList.toggle('volteada', est.volteada);
      carta.setAttribute('aria-label', est.volteada ? `Respuesta: ${sinEtiquetas(rellenar(t.respuesta, m))}. Toca para volver a la pregunta.` : `Pregunta: ${sinEtiquetas(rellenar(t.pregunta, m))}. Toca para voltear.`);
      carta.innerHTML = `
        <span class="cara frente" aria-hidden="true"><span class="lec-ceja">PREGUNTA</span><span class="lec-icono-carta">${esc(t.icono ?? '❄')}</span>
          <span class="lec-carta-texto">${H(t.pregunta)}</span><span class="lec-voltear">↻ Toca para voltear</span></span>
        <span class="cara dorso" aria-hidden="true"><span class="lec-ceja rosa">RESPUESTA</span>
          <span class="lec-carta-texto">${H(t.respuesta)}</span><span class="lec-voltear">↻ Toca para volver</span></span>`;
      if (animar) { const mazo = cuerpo.querySelector('.lec-mazo'); mazo.classList.remove('gira'); void mazo.offsetWidth; mazo.classList.add('gira'); }
      cuerpo.querySelectorAll('.lec-puntitos button').forEach((b, i) => {
        b.className = i === est.carta ? 'actual' : est.vistas.has(i) ? 'vista' : '';
        if (i === est.carta) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      cuerpo.querySelector('[data-ant]').disabled = est.carta === 0;
      cuerpo.querySelector('[data-sig]').textContent = est.carta === total - 1 ? 'IR A LA TRIVIA' : 'SIGUIENTE';
      if (est.volteada) jukumari('¡Eso es! Léela otra vez en voz alta.', '¿La podría explicar con mis palabras?');
      else jukumari('Gira la tarjeta. ¡Te servirá en la trivia!', est.carta < total - 1 ? `Faltan ${total - est.carta - 1} tarjetas más…` : '¡La última! Después, la trivia.');
    };
    const mover = (i) => { est.carta = i; est.volteada = false; est.vistas.add(i); guardar(); pintar(true); };
    carta.addEventListener('click', () => { est.volteada = !est.volteada; pintar(false); });
    cuerpo.querySelector('.lec-puntitos').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) mover(Number(b.dataset.c)); });
    cuerpo.querySelector('[data-ant]').addEventListener('click', () => est.carta > 0 && mover(est.carta - 1));
    cuerpo.querySelector('[data-sig]').addEventListener('click', () => (est.carta < total - 1 ? mover(est.carta + 1) : irA('trivia')));
    est.vistas.add(est.carta);
    pintar(false);
    conConsejos(['Toca la tarjeta para ver la respuesta.', 'Lee la pregunta y trata de responder antes de voltear.']);
  }

  // ── Trivia
  // "juez" necesita la serie real (series.json); si no está, esa pregunta se salta
  const preguntas = () => l.trivia.filter((q) => q.tipo !== 'juez' || d.serie);
  function pintarTrivia() {
    const lista = preguntas(), total = lista.length;
    if (est.pregunta >= total) { irA('meta'); return; }
    const q = lista[est.pregunta];
    let respondida = false;
    cuerpo.innerHTML = `
      <div class="lec-trivia-cabeza">
        <p class="lec-ceja">TRIVIA · PREGUNTA ${est.pregunta + 1} DE ${total}</p>
        <span class="lec-copos" role="img" aria-label="${est.aciertos} aciertos de ${total}">${lista.map((_, i) => `<span class="${i < est.aciertos ? 'lleno' : ''}">❄</span>`).join('')}</span>
      </div>
      <h1 class="lec-titulo chico" tabindex="-1">${H(q.pregunta)}</h1>
      <div class="lec-q"></div>
      <div class="lec-explica-fila">
        <p class="lec-explica" aria-live="polite"></p>
        <span class="lec-pie-der">
          <button type="button" class="btn-apu secundario lec-pista" hidden>💡 PISTA</button>
          <button type="button" class="btn-apu" data-sig hidden>${est.pregunta === total - 1 ? 'VER MI RESULTADO' : 'SIGUIENTE'}</button>
        </span>
      </div>`;
    const zona = cuerpo.querySelector('.lec-q');
    const explica = cuerpo.querySelector('.lec-explica');
    const botonPista = cuerpo.querySelector('.lec-pista');
    const mostrarPista = () => {
      if (!q.pista || explica.querySelector('.lec-pista-texto')) return;
      explica.insertAdjacentHTML('beforeend', ` <span class="lec-pista-texto">💡 Pista: ${H(q.pista)}</span>`);
      botonPista.hidden = true;
      jukumari(l.jukumari.fallo, `Pista: ${q.pista}`);
    };
    botonPista.addEventListener('click', mostrarPista);

    // Al responder: copos, explicación, Jukumari y (si falla) la pista
    const responder = (bien, prefijo = '') => {
      if (respondida) return;
      respondida = true;
      if (bien) { est.aciertos += 1; est.fallosSeguidos = 0; } else est.fallosSeguidos += 1;
      cuerpo.querySelectorAll('.lec-copos span').forEach((c, k) => c.classList.toggle('lleno', k < est.aciertos));
      cuerpo.querySelector('.lec-copos').setAttribute('aria-label', `${est.aciertos} aciertos de ${total}`);
      explica.innerHTML = `<b class="${bien ? 'bien' : 'mal'}">${prefijo || (bien ? '¡Bien!' : 'Casi.')}</b> ${H(q.explicacion)}`;
      const sig = cuerpo.querySelector('[data-sig]');
      sig.hidden = false;
      if (bien) jukumari(l.jukumari.acierto, est.pregunta < total - 1 ? 'Otra más…' : '¡Vamos a ver tu resultado!');
      else {
        jukumari(l.jukumari.fallo, q.pista ? 'Toca “Pista” si quieres una ayuda.' : '¡Así se aprende!');
        if (q.pista) botonPista.hidden = false;
        if (est.fallosSeguidos >= 2) mostrarPista(); // dos fallos seguidos: la pista aparece sola
      }
      est.pregunta += 1; guardar(); est.pregunta -= 1; // si sale ahora, vuelve a la siguiente pregunta
      sig.focus();
    };
    cuerpo.querySelector('[data-sig]').addEventListener('click', () => {
      est.pregunta += 1; guardar();
      if (est.pregunta < total) { pintarTrivia(); cuerpo.scrollTop = 0; cuerpo.querySelector('h1')?.focus({ preventScroll: true }); }
      else irA('meta');
    });

    const TIPOS = { opciones: triviaOpciones, pixeles: triviaOpciones, clasificar: triviaClasificar, ordenar: triviaOrdenar, juez: triviaJuez };
    (TIPOS[q.tipo] ?? triviaOpciones)(q, zona, responder);
    jukumari(est.pregunta === 0 ? 'Si fallas, te explico por qué. ¡Así se aprende!' : '¡Otra más! Tú puedes.', 'Lee todas las opciones antes de tocar…');
    conConsejos(['Lee la pregunta otra vez, despacio.', 'Si dudas, piensa en las tarjetas que volteaste.']);
  }

  function triviaOpciones(q, zona, responder) {
    const pix = q.tipo === 'pixeles' && Array.isArray(q.valores)
      ? `<div class="lec-pixeles" role="img" aria-label="Píxeles: ${q.valores.join(', ')}">${q.valores.map((v) => `<span class="${v > 100 ? 'aviso' : v >= (q.umbral ?? 40) ? 'si' : 'no'}" style="--v:${Math.min(100, v)}">${v}</span>`).join('')}</div>` : '';
    zona.innerHTML = `${pix}<div class="lec-opciones">${q.opciones.map((o, i) => `<button type="button" class="lec-opcion" data-i="${i}"><span class="letra">${LETRAS[i]}</span><span>${H(o)}</span></button>`).join('')}</div>`;
    const ops = [...zona.querySelectorAll('.lec-opcion')];
    ops.forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i), bien = i === q.correcta;
      ops.forEach((x, j) => {
        x.disabled = true;
        if (j === q.correcta) { x.classList.add('correcta'); x.querySelector('.letra').textContent = '✓'; }
        else if (x === b) { x.classList.add('mal'); x.querySelector('.letra').textContent = '✕'; }
      });
      responder(bien);
    }));
  }

  // Clasificar: toca una etiqueta y luego la escena (o el recorte) donde va
  function triviaClasificar(q, zona, responder) {
    const asignadas = q.escenas.map(() => null);
    let elegida = null;
    zona.innerHTML = `
      <p class="lec-instruccion">Toca una etiqueta y luego ${q.escenas[0]?.img ? 'la foto' : 'el recorte'} donde va. Mira la forma, no solo el color.</p>
      <div class="lec-escenas ${q.escenas[0]?.img ? '' : 'textos'}">${q.escenas.map((e, i) => `
        <button type="button" class="lec-escena" data-e="${i}" aria-label="${e.img ? `Escena ${i + 1}` : esc(sinEtiquetas(e.texto))}: sin etiqueta">
          ${e.img ? escena(e.img) : `<span class="lec-recorte-texto">${H(e.texto)}</span>`}
          <span class="lec-escena-pie"><span>${e.img ? `Escena ${i + 1}` : ''}</span><b data-asig></b></span>
        </button>`).join('')}</div>
      <div class="lec-etiquetas" role="radiogroup" aria-label="Etiquetas">${q.etiquetas.map((t) => `<button type="button" role="radio" aria-checked="false" class="lec-etiqueta" data-t="${esc(t)}">${ICONO_ETIQUETA[t] ? `<span aria-hidden="true">${ICONO_ETIQUETA[t]}</span> ` : ''}${esc(t)}</button>`).join('')}</div>
      <div class="lec-pie derecha"><button type="button" class="btn-apu" data-revisar disabled>REVISAR</button></div>`;
    const etiquetas = [...zona.querySelectorAll('.lec-etiqueta')];
    const escenas = [...zona.querySelectorAll('.lec-escena')];
    const revisar = zona.querySelector('[data-revisar]');
    etiquetas.forEach((b) => b.addEventListener('click', () => {
      elegida = b.dataset.t;
      etiquetas.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    }));
    escenas.forEach((b, i) => b.addEventListener('click', () => {
      if (!elegida) { jukumari('Primero toca una etiqueta de abajo.', 'Después, la escena donde va.'); return; }
      asignadas[i] = elegida;
      b.querySelector('[data-asig]').textContent = elegida;
      b.classList.add('con-etiqueta');
      b.setAttribute('aria-label', `${q.escenas[i].img ? `Escena ${i + 1}` : sinEtiquetas(q.escenas[i].texto)}: ${elegida}`);
      revisar.disabled = asignadas.some((x) => !x);
    }));
    revisar.addEventListener('click', () => {
      let ok = 0;
      escenas.forEach((b, i) => {
        const bien = asignadas[i] === q.escenas[i].correcta;
        if (bien) ok += 1;
        b.disabled = true;
        b.classList.add(bien ? 'bien' : 'mal');
        b.querySelector('[data-asig]').textContent = `${bien ? '✓' : '✕'} ${asignadas[i]}${bien ? '' : ` → ${q.escenas[i].correcta}`}`;
      });
      etiquetas.forEach((x) => { x.disabled = true; });
      revisar.hidden = true;
      responder(ok === q.escenas.length, `${ok} de ${q.escenas.length}.`);
    });
  }

  // Ordenar: arrastra (o usa ↑ ↓) y toca "Revisar"
  function triviaOrdenar(q, zona, responder) {
    const correcto = q.pasos;
    let orden = mezclar(correcto.map((_, i) => i));
    if (orden.every((x, i) => x === i)) orden = [...orden.slice(1), orden[0]];
    let arrastrado = null;
    zona.innerHTML = `<p class="lec-instruccion">Arrastra las tarjetas al orden correcto (o usa las flechas) y toca “Revisar”.</p>
      <ol class="lec-orden"></ol><div class="lec-pie derecha"><button type="button" class="btn-apu" data-revisar>REVISAR</button></div>`;
    const ol = zona.querySelector('.lec-orden');
    const pintar = (revisado = false) => {
      ol.innerHTML = orden.map((k, pos) => {
        const bien = k === pos;
        return `<li class="lec-paso-orden ${revisado ? (bien ? 'bien' : 'mal') : ''}" draggable="${!revisado}" data-pos="${pos}">
          <span class="num">${pos + 1}</span><span class="txt">${H(correcto[k])}</span>
          ${revisado ? `<span class="marca">${bien ? '✓' : `va en el ${k + 1}`}</span>`
            : `<span class="flechas"><button type="button" data-sube="${pos}" aria-label="Subir" ${pos === 0 ? 'disabled' : ''}>↑</button><button type="button" data-baja="${pos}" aria-label="Bajar" ${pos === orden.length - 1 ? 'disabled' : ''}>↓</button></span>`}</li>`;
      }).join('');
    };
    const mover = (de, a) => { const [x] = orden.splice(de, 1); orden.splice(a, 0, x); pintar(); };
    // Tras mover, el foco sigue a la tarjeta (en la misma flecha si se puede)
    const enfocar = (pos, prefiere) => {
      const [a, b] = prefiere === 'sube' ? ['sube', 'baja'] : ['baja', 'sube'];
      const boton = [ol.querySelector(`[data-${a}="${pos}"]`), ol.querySelector(`[data-${b}="${pos}"]`)].find((x) => x && !x.disabled);
      boton?.focus();
    };
    ol.addEventListener('click', (e) => {
      const s = e.target.closest('[data-sube]'), b = e.target.closest('[data-baja]');
      if (s) { const p = Number(s.dataset.sube); mover(p, p - 1); enfocar(p - 1, 'sube'); }
      if (b) { const p = Number(b.dataset.baja); mover(p, p + 1); enfocar(p + 1, 'baja'); }
    });
    ol.addEventListener('dragstart', (e) => { const li = e.target.closest('[data-pos]'); if (li) { arrastrado = Number(li.dataset.pos); e.dataTransfer.effectAllowed = 'move'; } });
    ol.addEventListener('dragover', (e) => { if (arrastrado !== null) e.preventDefault(); });
    ol.addEventListener('drop', (e) => {
      e.preventDefault();
      const li = e.target.closest('[data-pos]');
      if (li && arrastrado !== null) mover(arrastrado, Number(li.dataset.pos));
      arrastrado = null;
    });
    pintar();
    zona.querySelector('[data-revisar]').addEventListener('click', (e) => {
      e.currentTarget.hidden = true;
      pintar(true);
      const ok = orden.filter((k, pos) => k === pos).length;
      responder(ok === orden.length, ok === orden.length ? '¡Perfecto!' : `${ok} de ${orden.length}.`);
    });
  }

  // Juez: 5 series de pura suerte (los mismos valores reales, en otro orden) + la real
  function triviaJuez(q, zona, responder) {
    const s = d.serie;
    const real = s.valores.filter(Number.isFinite);
    const suertes = Array.from({ length: 5 }, () => { let v; do v = mezclar(real); while (v.every((x, i) => x === real[i])); return v; });
    const pos = Math.floor(Math.random() * 6);
    const series = [...suertes.slice(0, pos), real, ...suertes.slice(pos)];
    zona.innerHTML = `<p class="lec-instruccion">5 gráficos son suerte (los mismos valores, en otro orden) y 1 es tu serie real de ${s.desde}–${s.hasta}.</p>
      <div class="lec-juez">${series.map((v, i) => `<button type="button" class="lec-mini-juez" data-i="${i}" aria-label="Gráfico ${LETRAS[i]}">${linea(v, 160, 56)}<span>${LETRAS[i]}</span></button>`).join('')}</div>`;
    const bs = [...zona.querySelectorAll('.lec-mini-juez')];
    bs.forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      bs.forEach((x, j) => { x.disabled = true; if (j === pos) x.classList.add('real'); else if (x === b) x.classList.add('mal'); });
      bs[pos].querySelector('span').textContent = `${LETRAS[pos]} · la real`;
      responder(i === pos);
    }));
  }

  // ── Meta
  function pintarMeta() {
    const total = preguntas().length;
    const aprobo = est.aciertos >= Math.ceil(total * APROBAR);
    const ins = l.insignia ? insigniaPorId(l.insignia) : null;
    const medalla = ins?.img
      ? `<img src="${esc(ins.img)}" alt="Insignia ${esc(ins.nombre)}">`
      : `<svg class="lec-sello" viewBox="0 0 200 220" role="img" aria-label="Sello: lección superada"><path d="M100 6 190 58v104l-90 52-90-52V58Z" fill="#0F2150" stroke="var(--dato-lluvia)" stroke-width="8"/><path d="M100 30 168 70v80l-68 40-68-40V70Z" fill="none" stroke="var(--rojo-apu)" stroke-width="4"/><path d="m62 112 26 26 52-56" fill="none" stroke="var(--nieve)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const nombre = ins ? ins.nombre : '¡Lección superada!';
    const ultimo = !siguiente;
    cuerpo.innerHTML = `
      <div class="lec-meta ${aprobo ? '' : 'sin-aprobar'}">
        <p class="lec-ceja">${aprobo ? `LECCIÓN ${l.numero} COMPLETADA` : `LECCIÓN ${l.numero} · NECESITAS ${Math.ceil(total * APROBAR)} DE ${total}`}${bloque ? ` · BLOQUE ${esc(l.bloque)}` : ''}</p>
        <h1 class="lec-titulo grande" tabindex="-1">${aprobo ? '¡MISIÓN CUMPLIDA!' : '¡CASI LO LOGRAS!'}</h1>
        <div class="lec-medalla"><span class="lec-brillo" aria-hidden="true"></span>${medalla}</div>
        <h2 class="lec-medalla-nombre">${esc(nombre)}</h2>
        <p class="lec-puntaje"><span class="lec-copos grandes" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="${i < est.aciertos ? 'lleno' : ''}">❄</span>`).join('')}</span><b>${est.aciertos} de ${total}</b></p>
        ${aprobo ? `<div class="lec-sabes"><p class="lec-ceja verde">AHORA SABES</p><ul>${l.meta.ahoraSabes.map((x) => `<li>${H(x)}</li>`).join('')}</ul></div>` : ''}
        <div class="lec-pie centro">
          ${aprobo
            ? `<button type="button" class="btn-apu secundario" data-repetir>REPETIR TRIVIA</button>
               <button type="button" class="btn-apu" data-seguir>${ultimo ? '¡IR A LOS CASOS!' : `LECCIÓN ${siguiente.numero}: ${esc((siguiente.titulo_corto ?? siguiente.titulo).toUpperCase())}`}</button>`
            : `<button type="button" class="btn-apu secundario" data-teoria>VOLVER A LA TEORÍA</button>
               <button type="button" class="btn-apu" data-repetir>REPETIR TRIVIA</button>`}
        </div>
      </div>`;
    cuerpo.querySelector('[data-repetir]').addEventListener('click', () => irA('trivia'));
    cuerpo.querySelector('[data-teoria]')?.addEventListener('click', () => { est.pagina = 0; irA('teoria'); });
    cuerpo.querySelector('[data-seguir]')?.addEventListener('click', () => ir(ultimo || l.meta.abreCasos ? 'casos' : `leccion/${siguiente.id}`));
    if (aprobo) {
      jukumari(l.jukumari.final, ultimo ? '¡A los casos!' : `Lo que viene: ${siguiente.titulo}`);
      echarConfeti();
      completarLeccion(l.id).catch(() => {});
      if (l.insignia) temporizadores.push(setTimeout(() => { if (vivo) darInsignia(l.insignia); }, 1600));
    } else {
      jukumari(l.jukumari.fallo, '¿Qué parte me costó más? Repaso y vuelvo.');
    }
    conConsejos([]);
  }

  function echarConfeti() {
    const colores = ['var(--bandera-rojo)', 'var(--bandera-amarillo)', 'var(--bandera-verde)', 'var(--dato-lluvia)', 'var(--nieve)'];
    $('.lec-confeti').replaceChildren(...Array.from({ length: 46 }, (_, i) => {
      const s = document.createElement('i');
      const dur = 7 + Math.random() * 7;
      s.style.cssText = `left:${(8 + Math.random() * 62).toFixed(1)}%;background:${colores[i % colores.length]};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--giro:${Math.round(Math.random() * 720 - 360)}deg;--dx:${((Math.random() - 0.5) * 8).toFixed(1)}cqw;width:${(5 + Math.random() * 6).toFixed(0)}px`;
      return s;
    }));
  }

  // Arranque: la fase guardada; al entrar, el Jukumari saluda con jukumari.inicio
  pintarCamino();
  if (est.fase === 'teoria') pintarTeoria(true); else pintarFase();
  listo.then(() => {
    if (!vivo) return;
    // Con los datos y el perfil, se repinta lo que muestra marcas o datos (sin perder la respuesta en curso)
    if (est.fase === 'teoria') { const dice = $('[data-dice]').textContent; pintarTeoria(); $('[data-dice]').textContent = rellenar(dice, m); }
    else if (est.fase === 'tarjetas') pintarTarjetas();
  });
}

export function desmontar() {
  vivo = false;
  temporizadores.forEach(clearTimeout);
  temporizadores = [];
  quitar.forEach((f) => f());
  quitar = [];
}
