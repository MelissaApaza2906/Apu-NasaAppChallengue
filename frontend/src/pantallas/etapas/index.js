// Pantalla: etapas de aprendizaje · Responsable: Luis
// Copia fiel de la maqueta "APU · Diseño visual del juego" → Pantalla 3 (ApuEntrenamiento).
// Fondo del Illimani con nieve, el mundo girando en el círculo y las 6 etapas en arco.
// El avance (qué lección está abierta) sale de servicios/progreso.js.
import './etapas.css';
import { ir } from '../../router.js';
import { leerProgreso } from '../../servicios/progreso.js';
import { LECCIONES } from '../../contenido/lecciones.js';

// Textos de cada etapa (t = cantidad de actividades, pastilla roja)
const ETAPAS = [
  { id: 'variable', p: 'Nieve, lluvia o temperatura: cada una cuenta una parte de la historia del agua.', t: 8, j: '¡Empecemos por aquí! Primero aprendemos qué vamos a medir.' },
  { id: 'region', p: 'En el globo solo brillan los glaciares del mundo. Aprendes a elegir uno.', t: 7, j: 'Termina la lección 1 y te llevo a volar sobre los glaciares.' },
  { id: 'periodo', p: 'Con pocos años, un año raro puede engañarte. Aprendes a elegir el periodo.', t: 6, j: 'El clima se mide en muchos años, no en una semana.' },
  { id: 'serie', p: 'Un gráfico con un dato por mes desde 2001. Aprendes a leerlo.', t: 9, j: '¡Aquí verás los datos reales de NASA!' },
  { id: 'significancia', p: '¿El cambio es real o es casualidad? Contamos cuántas veces bajó y cuántas subió.', t: 8, j: 'El último paso del detective: comprobar con evidencia.' }
].map((e) => {
  const l = LECCIONES.find((x) => x.id === e.id);
  return { ...e, n: l.nombre, s: l.paso, c: l.conceptos };
});
ETAPAS.push({
  id: 'casos', n: 'CASOS', s: 'Etapa 2 · Detective', t: 3,
  p: 'Investigas glaciares reales con datos de NASA. Se abre al terminar las 5 lecciones.',
  c: ['Caso 01: Cordillera Real (con ayuda)', 'Caso 02: la lluvia (poca ayuda)', 'Caso final: sin ayuda'],
  j: 'Cuando termines el entrenamiento, resolveremos casos juntos.'
});

// Geometría del arco (igual que la maqueta): centro, radio del mundo y del arco
const CX = '6cqw', CY = 50, RM = 34, RA = 44, A0 = -54, A1 = 54;
const CANDADO = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

let raf = 0;
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
      <canvas aria-label="El mundo en 3D girando. La Cordillera Real de Bolivia late en rojo."></canvas>
    </div>

    <div class="etapas-titulo">
      <span class="eyebrow">ETAPA 1</span>
      <h1>ENTRENA&shy;MIENTO</h1>
      <div class="linea" aria-hidden="true"></div>
      <span class="sub">Conceptos básicos y los 5 pasos del detective</span>
      <div class="avance"><b class="hechas">0/5</b><span>lecciones</span></div>
    </div>

    <div class="etapas-arco"></div>

    <button type="button" class="etapas-volver vidrio" aria-label="Volver al menú">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="etapas-logo" src="/img/logo-apu.png" alt="APU">

    <aside class="etapas-panel vidrio" aria-live="polite"></aside>`;
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

  // Arco + panel según el avance
  let hechas = 0, sel = 0;
  const abierta = (i) => (i < 5 ? i <= hechas : hechas >= 5);
  const actual = () => Math.min(hechas, 5);

  function pintarArco() {
    const n = ETAPAS.length;
    $('.etapas-arco').innerHTML = ETAPAS.map((e, i) => {
      const ang = (A0 + (A1 - A0) * i / (n - 1)) * Math.PI / 180;
      const x = `calc(${CX} + ${(RA * Math.cos(ang)).toFixed(2)}cqh)`, y = `${(CY + RA * Math.sin(ang)).toFixed(2)}cqh`;
      const ab = abierta(i), esActual = i === actual(), hecha = i < 5 && i < hechas;
      const clases = ['bola', esActual ? 'actual' : '', ab ? 'abierta' : 'bloqueada', hecha ? 'hecha' : '', sel === i ? 'elegida' : ''].join(' ');
      const pildora = i < n - 1 ? `<span class="pildora">${hecha ? '✓' : e.t}</span>` : '';
      return `
        <button type="button" class="etapa${sel === i ? ' elegida' : ''}" data-i="${i}" aria-pressed="${sel === i}"
          aria-label="${e.n}, ${e.s}, ${ab ? 'disponible' : 'bloqueada'}" style="left:${x};top:${y};animation-delay:${(0.1 + i * 0.08).toFixed(2)}s">
          <span class="${clases}">${pildora}${ab ? `<span class="num">${i + 1}</span>` : CANDADO}</span>
          <span class="textos"><span class="nombre">${e.n}</span><span class="paso">${e.s}</span></span>
        </button>`;
    }).join('');
  }

  function pintarPanel() {
    const e = ETAPAS[sel], casos = sel === ETAPAS.length - 1, ab = abierta(sel);
    const panel = $('.etapas-panel');
    panel.innerHTML = `
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>${casos ? (ab ? 'ETAPA 2 · DETECTIVE' : 'ETAPA 2 · BLOQUEADA') : `LECCIÓN ${sel + 1} DE 5`}</span>
      <h2>${e.n}</h2>
      <p class="pregunta">${e.p}</p>
      <div class="conceptos">
        <span class="rotulo">VAS A APRENDER</span>
        ${e.c.map((c) => `<div class="concepto"><span class="punto" aria-hidden="true"></span>${c}</div>`).join('')}
      </div>
      <div class="chips"><span>Teoría</span><span>Tarjetas</span><span>Trivia</span></div>
      <div class="pie">
        ${ab
          ? '<button type="button" class="btn-empezar">EMPEZAR</button>'
          : `<div class="bloqueo">${CANDADO}${casos ? 'Termina las 5 lecciones' : `Termina la lección ${sel} para abrirla`}</div>`}
        <div class="jukumari"><img src="/img/avatares/jukumari-cara.webp" alt="El Jukumari, tu guía"><p>${e.j}</p></div>
      </div>`;
    panel.classList.remove('nuevo'); void panel.offsetWidth; panel.classList.add('nuevo');
    panel.querySelector('.btn-empezar')?.addEventListener('click', () => ir(casos ? 'casos' : `leccion/${e.id}`));
  }

  $('.etapas-arco').addEventListener('click', (ev) => {
    const b = ev.target.closest('.etapa'); if (!b) return;
    sel = Number(b.dataset.i); pintarArco(); pintarPanel();
  });

  const pintarTodo = () => {
    $('.hechas').textContent = `${Math.min(hechas, 5)}/5`;
    pintarArco(); pintarPanel();
  };
  pintarTodo();
  leerProgreso().then((p) => {
    if (!vivo) return;
    hechas = LECCIONES.filter((l) => p.lecciones.includes(l.id)).length;
    sel = actual();
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
        ctx.beginPath(); ctx.arc(X, Y, Math.max(4, Rg * 0.022), 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
    }
    if (vivo) raf = requestAnimationFrame(dibujar);
  };
  raf = requestAnimationFrame(dibujar);
}

export function desmontar() {
  vivo = false;
  cancelAnimationFrame(raf);
  observador?.disconnect();
  observador = null;
}
