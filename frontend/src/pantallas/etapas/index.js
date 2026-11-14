// Pantalla: etapas de aprendizaje · #/etapas · Responsable: Luis
// Maqueta: docs/mockups/apu-etapas-v2.png. El mundo girando (con el pin rojo que late sobre Bolivia) y,
// en su arco, las 10 lecciones de contenido/lecciones.js (agrupadas en los bloques A, B y C de BLOQUES)
// + la meta "Caso de la nieve".
// El estado de cada nodo sale del id de cada lección terminada (servicios/progreso.js), no de la cantidad:
//   hecha (✓ verde, arco verde hasta ahí) · siguiente (la primera sin terminar: grande, roja, con brillo) · bloqueada.
// Cada nodo muestra la insignia de la lección (gris hasta ganarla) o, si no tiene dibujo, un ícono.
import './etapas.css';
import '../carga/carga.css'; // la barra rayada (.barra .pista .relleno)
import { ir } from '../../router.js';
import { leerProgreso } from '../../servicios/progreso.js';
import { LECCIONES, BLOQUES } from '../../contenido/lecciones.js';
import { CASOS } from '../../contenido/casos.js';
import { insigniaPorId } from '../../contenido/insignias.js';

const TOTAL = LECCIONES.length; // 10
// Ícono del nodo cuando la lección no tiene insignia con dibujo
const ICONOS = { tierra: '🌎', lluvia: '🌧', ojos: '🛰', ndsi: '❄', caso: '📰', region: '🏔', periodo: '📅', serie: '🧹', significancia: '🎲', veredicto: '⚖' };
// Cada lección dice su bloque: "Bloque A · Las variables"
const pasoDe = (l) => `Bloque ${l.bloque} · ${BLOQUES[l.bloque]?.nombre ?? ''}`;
const META = { id: 'meta', titulo: 'Caso de la nieve', paso: 'Etapa 2 · Detective' };

// Geometría del arco (la de siempre): centro, radio del mundo y del arco
// El arco empieza debajo del título (en pantallas bajas, un poco más abajo)
const CX = '6cqw', CY = 50, RM = 34, RA = 44, A1 = 62;
const bajo = window.matchMedia('(max-height: 560px)');
const ANG = (i) => { const a0 = bajo.matches ? -36 : -48; return a0 + (A1 - a0) * i / TOTAL; }; // 11 nodos: 0…9 lecciones, 10 la meta
const CANDADO = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let raf = 0;
let alCambiarAlto = null;
let observador = null;
let vivo = false;

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas';
  raiz.innerHTML = `
    <div class="etapas-fondo" aria-hidden="true"></div>
    <div class="etapas-velo" aria-hidden="true"></div>
    <div class="etapas-nieve" aria-hidden="true"></div>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;top:1.4cqh;border-right:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;top:1.4cqh;border-left:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;bottom:1.4cqh;border-right:none;border-top:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;bottom:1.4cqh;border-left:none;border-top:none"></span>

    <div class="etapas-orbita" aria-hidden="true" style="left:calc(${CX} - ${RA}cqh);top:${CY - RA}cqh;width:${2 * RA}cqh;height:${2 * RA}cqh"></div>
    <div class="etapas-mundo" style="left:calc(${CX} - ${RM}cqh);top:${CY - RM}cqh;width:${2 * RM}cqh;height:${2 * RM}cqh">
      <canvas aria-label="El mundo en 3D girando. Un pin rojo late sobre Bolivia (Cordillera Real)."></canvas>
    </div>
    <svg class="etapas-verde" aria-hidden="true" viewBox="-100 -100 200 200" style="left:calc(${CX} - ${RA}cqh);top:${CY - RA}cqh;width:${2 * RA}cqh;height:${2 * RA}cqh"><path d=""/></svg>

    <div class="etapas-cabeza">
      <span class="eyebrow">ETAPA 1</span>
      <h1>ENTRENAMIENTO</h1>
      <div class="etapas-avance">
        <div class="barra" role="progressbar" aria-label="Lecciones terminadas" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="0">
          <div class="pista"><div class="relleno" style="width:0%"></div></div>
        </div>
        <b class="hechas">0 / ${TOTAL}</b><span>lecciones</span>
      </div>
    </div>

    <div class="etapas-arco"></div>

    <button type="button" class="etapas-volver vidrio" aria-label="Volver al menú">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="etapas-logo" src="/img/logo-apu.png" alt="APU">

    <aside class="etapas-panel vidrio" aria-live="polite"></aside>
    <div class="etapas-juku">
      <p class="etapas-dice" aria-live="polite"><b>JUKUMARI</b><span></span></p>
      <img src="/img/jukumari-cuerpo.webp" alt="El Jukumari, tu guía">
    </div>`;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  $('.etapas-volver').addEventListener('click', () => ir('menu'));

  // Nieve
  const nieve = $('.etapas-nieve');
  for (let i = 0; i < 42; i++) {
    const t = 1.5 + Math.random() * 3.5, dur = 9 + Math.random() * 12, c = document.createElement('span');
    c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    nieve.append(c);
  }

  // Avance: QUÉ lecciones están hechas (por id), no cuántas
  let hechas = new Set(), ganadas = new Set(), apodo = 'detective', sel = 0;
  const siguiente = () => LECCIONES.findIndex((l) => !hechas.has(l.id)); // -1 = todas hechas
  const todas = () => siguiente() === -1;
  const estado = (i) => {
    if (i === TOTAL) return todas() ? 'siguiente meta' : 'bloqueada meta';
    if (hechas.has(LECCIONES[i].id)) return 'hecha';
    return i === siguiente() ? 'siguiente' : 'bloqueada';
  };
  const pos = (i) => {
    const a = ANG(i) * Math.PI / 180;
    return { x: `calc(${CX} + ${(RA * Math.cos(a)).toFixed(2)}cqh)`, y: `${(CY + RA * Math.sin(a)).toFixed(2)}cqh` };
  };
  const medallaDe = (l, conColor) => {
    const ins = l.insignia ? insigniaPorId(l.insignia) : null;
    return ins?.img
      ? `<img class="${conColor ? '' : 'gris'}" src="${esc(ins.img)}" alt="">`
      : `<span class="icono" aria-hidden="true">${ICONOS[l.id] ?? '❄'}</span>`;
  };

  function pintarArco() {
    const nodos = [...LECCIONES, META];
    $('.etapas-arco').innerHTML = nodos.map((l, i) => {
      const { x, y } = pos(i), est = estado(i), meta = i === TOTAL;
      const hecha = est === 'hecha', sig = est.startsWith('siguiente'), bloq = est.startsWith('bloqueada');
      // La insignia se ve a color si ya la ganó; la de la lección siguiente también, como adelanto (igual que la maqueta)
      const color = !meta && (ganadas.has(l.insignia) || sig);
      const linea = meta ? META.paso : hecha ? `✓ Hecha · ${pasoDe(l)}` : sig ? `● Siguiente · ${pasoDe(l)}` : pasoDe(l);
      const contenido = meta ? '<span class="icono" aria-hidden="true">🏁</span>' : medallaDe(l, color);
      return `
        <button type="button" class="etapa ${est}${sel === i ? ' elegida' : ''}" data-i="${i}" aria-pressed="${sel === i}"
          aria-label="${esc(l.titulo)}, ${esc(meta ? META.paso : pasoDe(l))}, ${hecha ? 'hecha' : sig ? 'siguiente' : 'bloqueada'}" style="left:${x};top:${y};animation-delay:${(0.1 + i * 0.06).toFixed(2)}s">
          <span class="bola">${contenido}${hecha ? '<span class="marca" aria-hidden="true">✓</span>' : ''}</span>
          <span class="textos"><span class="nombre">${esc(l.titulo.toUpperCase())}</span><span class="paso">${esc(linea)}</span></span>
        </button>`;
    }).join('');
    // Arco verde: desde el primer nodo hasta la última lección hecha seguida (o hasta la siguiente)
    const s = siguiente(), hasta = s === -1 ? TOTAL : s;
    const p = (i) => { const a = ANG(i) * Math.PI / 180; return `${(100 * Math.cos(a)).toFixed(2)} ${(100 * Math.sin(a)).toFixed(2)}`; };
    $('.etapas-verde path').setAttribute('d', hasta > 0 ? `M${p(0)} A100 100 0 0 1 ${p(hasta)}` : '');
  }

  function pintarPanel() {
    const panel = $('.etapas-panel');
    const est = estado(sel);
    if (sel === TOTAL) {
      const caso = CASOS[0];
      panel.innerHTML = `
        <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>META · ETAPA 2</span>
        <h2>CASO DE LA NIEVE</h2>
        <p class="pregunta">${esc(caso?.corto ?? '')}. Con todo lo aprendido, investigas la nieve de la Cordillera Real con datos reales de NASA.</p>
        <div class="pie">${todas()
          ? '<button type="button" class="btn-empezar" data-ir="casos">MIS CASOS</button>'
          : `<div class="bloqueo">${CANDADO}Termina las ${TOTAL} lecciones para abrirlo</div>`}</div>`;
    } else {
      const l = LECCIONES[sel], ins = l.insignia ? insigniaPorId(l.insignia) : null;
      const colores = ['verde', 'azul', 'rojo'];
      const premio = ins
        ? `<span class="medalla">${ins.img ? `<img src="${esc(ins.img)}" alt="">` : '<span class="hex">?</span>'}</span>
           <span><span class="rotulo">${ganadas.has(ins.id) ? 'YA GANASTE LA INSIGNIA' : 'GANAS LA INSIGNIA'}</span><b>${esc(ins.img ? ins.nombre : `${ins.nombre} (dibujo pendiente)`)}</b></span>`
        : `<span class="medalla"><span class="hex sello">✓</span></span><span><span class="rotulo">GANAS EL SELLO</span><b>¡Paso superado!</b></span>`;
      panel.innerHTML = `
        <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>LECCIÓN ${l.numero} DE ${TOTAL} · ${esc(pasoDe(l).toUpperCase())}</span>
        <h2>${esc(l.titulo.toUpperCase())}</h2>
        <p class="pregunta">${esc(l.pregunta)} ${esc(l.jukumari.inicio.replace('{apodo}', apodo))}</p>
        <div class="fichas">${(l.conceptos ?? []).slice(0, 3).map((c, i) => `
          <div class="ficha ${colores[i]}"><span class="ficha-icono" aria-hidden="true">${esc(l.tarjetas[i]?.icono ?? '❄')}</span>
            <b>${esc(c)}</b></div>`).join('')}
        </div>
        <p class="datos-leccion">📖 ${l.paginas.length} páginas · 🃏 ${l.tarjetas.length} tarjetas · ❓ ${l.trivia.length} preguntas</p>
        <div class="premio">${premio}</div>
        <div class="pie">${est === 'bloqueada'
          ? `<div class="bloqueo">${CANDADO}Termina la lección ${LECCIONES[siguiente()]?.numero ?? sel} para abrirla</div>`
          : `<button type="button" class="btn-empezar" data-ir="leccion/${l.id}">${est === 'hecha' ? 'REPASAR' : 'EMPEZAR'}</button>`}</div>`;
    }
    panel.classList.remove('nuevo'); void panel.offsetWidth; panel.classList.add('nuevo');
    panel.querySelector('[data-ir]')?.addEventListener('click', (e) => ir(e.currentTarget.dataset.ir));
  }

  function pintarJukumari() {
    const s = siguiente();
    const t = hechas.size === 0 ? `¡Hola, ${apodo}! Empecemos por la ${LECCIONES[0].titulo}.`
      : s === -1 ? '¡Terminaste el entrenamiento! El caso de la nieve te espera.'
        : `¡Vas muy bien! Ahora sigue: ${LECCIONES[s].titulo}.`;
    $('.etapas-dice span').textContent = t;
  }

  $('.etapas-arco').addEventListener('click', (ev) => {
    const b = ev.target.closest('.etapa'); if (!b) return;
    sel = Number(b.dataset.i); pintarArco(); pintarPanel();
  });

  const pintarTodo = () => {
    const n = LECCIONES.filter((l) => hechas.has(l.id)).length;
    $('.hechas').textContent = `${n} / ${TOTAL}`;
    $('.etapas-avance .relleno').style.width = `${(n / TOTAL) * 100}%`;
    $('.etapas-avance .barra').setAttribute('aria-valuenow', String(n));
    pintarArco(); pintarPanel(); pintarJukumari();
  };
  pintarTodo();
  alCambiarAlto = () => { if (vivo) pintarArco(); };
  bajo.addEventListener('change', alCambiarAlto);
  leerProgreso().then((p) => {
    if (!vivo) return;
    hechas = new Set(p.lecciones ?? []);
    ganadas = new Set(p.insignias ?? []);
    apodo = String(p.apodo || '').trim() || 'detective';
    sel = todas() ? TOTAL : siguiente();
    pintarTodo();
  }).catch(() => {});

  iniciarMundo($('.etapas-mundo canvas'));
}

// El mundo 3D: la imagen del planeta se proyecta sobre una esfera y gira de un lado a otro
function iniciarMundo(c) {
  const ctx = c.getContext('2d');
  let tex = null, TW = 0, prep = null;
  const img = new Image();
  img.onload = () => {
    const t = document.createElement('canvas'); t.width = img.naturalWidth; t.height = img.naturalHeight;
    const tc = t.getContext('2d'); tc.drawImage(img, 0, 0);
    tex = tc.getImageData(0, 0, t.width, t.height).data; TW = t.width;
  };
  img.src = '/img/planeta.webp';

  const medir = () => {
    const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    const lado = Math.min(560, Math.round(Math.min(r.width, r.height) * d)); // resolución limitada: fluido en celular
    c.width = Math.max(1, lado); c.height = Math.max(1, lado); prep = null;
  };
  medir();
  if (window.ResizeObserver) { observador = new ResizeObserver(medir); observador.observe(c); }
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dibujar = (ahora) => {
    const S = c.width;
    if (tex && S > 1) {
      const Rg = S / 2 * 0.86, cx = S / 2;
      if (!prep || prep.S !== S) {
        const n = S * S, DX = new Float32Array(n), DY = new Float32Array(n), Z = new Float32Array(n), D = new Uint8Array(n);
        for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
          const k = py * S + px, dx = (px - cx) / Rg, dy = (py - cx) / Rg, d2 = dx * dx + dy * dy;
          if (d2 <= 1) { D[k] = 1; DX[k] = dx; DY[k] = dy; Z[k] = Math.sqrt(1 - d2); }
        }
        prep = { S, DX, DY, Z, D, img: ctx.createImageData(S, S) };
      }
      const out = prep.img.data, tc = TW / 2, tr = TW / 2 * 0.985;
      const A = quieto ? 0 : 0.42 * Math.sin(ahora * 0.00022), ca = Math.cos(A), sa = Math.sin(A);
      for (let k = 0, n2 = S * S; k < n2; k++) {
        const o = k * 4;
        if (!prep.D[k]) { out[o + 3] = 0; continue; }
        const x = prep.DX[k], y = prep.DY[k], z = prep.Z[k];
        const xs = x * ca + z * sa, zs = -x * sa + z * ca, luz = 0.55 + 0.45 * z;
        if (zs <= 0.02) { out[o] = 10 * luz; out[o + 1] = 34 * luz; out[o + 2] = 78 * luz; out[o + 3] = 255; continue; }
        const si = (((tc + y * tr) | 0) * TW + ((tc + xs * tr) | 0)) * 4;
        out[o] = tex[si]; out[o + 1] = tex[si + 1]; out[o + 2] = tex[si + 2]; out[o + 3] = 255;
      }
      ctx.putImageData(prep.img, 0, 0);
      // atmósfera azul en el borde
      const at = ctx.createRadialGradient(cx, cx, Rg * 0.9, cx, cx, Rg * 1.1);
      at.addColorStop(0, 'rgba(91,160,255,0)'); at.addColorStop(0.45, 'rgba(91,160,255,0.55)'); at.addColorStop(1, 'rgba(91,160,255,0)');
      ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cx, Rg * 1.1, 0, 2 * Math.PI); ctx.fill();
      // la Cordillera Real: punto rojo con ondas, gira junto con la Tierra
      const mx = (0.54 * TW - tc) / tr, my = (0.495 * TW - tc) / tr, mz = Math.sqrt(Math.max(0, 1 - mx * mx - my * my));
      const ox = mx * ca - mz * sa, oz = mx * sa + mz * ca;
      if (oz > 0.05) {
        const X = cx + ox * Rg, Y = cx + my * Rg;
        for (let r = 0; r < 2; r++) {
          const f = ((ahora / 2200) + r * 0.5) % 1;
          ctx.globalAlpha = (1 - f) * 0.8; ctx.strokeStyle = '#D12021'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(X, Y, 4 + f * Rg * 0.18, 0, 2 * Math.PI); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = '#D12021'; ctx.strokeStyle = '#F2F4F8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X, Y, Math.max(4, Rg * 0.022), 0, 2 * Math.PI); ctx.fill(); ctx.stroke();      }
    }
    if (vivo) raf = requestAnimationFrame(dibujar);
  };
  raf = requestAnimationFrame(dibujar);
}

export function desmontar() {
  vivo = false;
  if (alCambiarAlto) bajo.removeEventListener('change', alCambiarAlto);
  alCambiarAlto = null;
  cancelAnimationFrame(raf);
  observador?.disconnect();
  observador = null;
}
