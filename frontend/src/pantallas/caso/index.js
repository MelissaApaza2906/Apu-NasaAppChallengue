// Pantalla: un caso · #/caso/<id>[/<pista>|/resuelto|/informe]. Mockups: docs/mockups/casos/
//   #/caso/<id>           constelación de 7 pistas (casoG-1): Expediente → Evidencia → Escena → Tiempo → Huellas
//                         → Interrogatorio → Veredicto (pasos 1–5 del Dr. Aker). ✓ hecha · roja que late · gris punteada
//   #/caso/<id>/0 … /6    cada pista (paso-0 … paso-6): pasos.js
//   #/caso/<id>/resuelto  la animación del caso cerrado (casoV-2) · #/caso/<id>/informe  el informe (casoV-3): final.js
// Al resolver una pista se vuelve a la constelación y se enciende la línea hasta la siguiente estrella.
// Progreso: usuarios/{uid}.casos[id] = { pista, elecciones, veredicto, resuelto } (servicios/progreso.js).
// 3D: servicios/escena3d.js (un solo Cesium para todas las pantallas de los casos).
import './caso.css';
import { ir } from '../../router.js';
import { CASOS, casoPorId, PISTAS } from '../../contenido/casos.js';
import { LECCIONES } from '../../contenido/lecciones.js';
import { leerProgreso, estadoCaso, guardarCaso, guardarHipotesis } from '../../servicios/progreso.js';
import { cargarDatosCaso } from '../../servicios/casos-datos.js';
import { estadosCasos } from '../casos/index.js';
import { esc, logo, crearJukumari, ICONO_RUMBO } from './comun.js';
import { PASOS } from './pasos.js';
import { pintarResuelto, pintarInforme } from './final.js';

let vivo = false;
let limpiezas = [];
let escena = null;
const CLAVE_ENCIENDE = 'apu-caso-enciende'; // "id:n": la línea que se enciende al volver a la constelación

export function montar(contenedor, params = []) {
  vivo = true;
  const caso = casoPorId(params[0]);
  const sub = params[1] ?? null;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-caso';
  contenedor.append(raiz);
  if (!caso) { ir('casos'); return; }
  raiz.innerHTML = '<p class="caso-cuerpo caso-sub">Abriendo el expediente…</p>';

  Promise.all([
    leerProgreso().catch(() => ({})),
    cargarDatosCaso(caso),
    import('../../servicios/escena3d.js').then((m) => m.api).catch(() => null)
  ]).then(([p, datos, api]) => {
    if (!vivo) return;
    escena = api;
    // Solo se entra a un caso abierto y con datos
    const i = CASOS.indexOf(caso);
    const estado = estadosCasos(p, CASOS.map((c) => (c === caso ? Boolean(datos) : undefined)))[i];
    if (!datos || estado === 'clasificado' || estado === 'camino') { ir('casos'); return; }
    const est = estadoCaso(p, caso.id) ?? { pista: 0, elecciones: {} };
    est.elecciones = est.elecciones ?? {};
    const l5 = LECCIONES.find((l) => l.hipotesis);
    const ctx = {
      caso, datos, perfil: p, est, raiz, escena,
      apodo: String(p.apodo || '').trim() || 'detective',
      opcionesHipotesis: l5?.hipotesis?.opciones ?? ['bajó', 'no cambió', 'subió'],
      limites: LECCIONES.find((l) => l.limites)?.limites ?? [],
      get sospecha() { return String(this.perfil.hipotesis ?? '').split('|')[0] || null; },
      cambiarSospecha(op) {
        const conf = String(this.perfil.hipotesis ?? '').split('|')[1] ?? '';
        this.perfil = { ...this.perfil, hipotesis: [op, conf].filter(Boolean).join('|') };
        guardarHipotesis(op, conf).catch(() => {});
      },
      guardar: (cambios) => { Object.assign(est, cambios, { elecciones: { ...est.elecciones, ...(cambios.elecciones ?? {}) } }); return guardarCaso(caso.id, cambios).catch(() => {}); },
      // Pista k resuelta: se guarda y se vuelve a la constelación con la línea que se enciende
      completar(k, elecciones = {}) {
        const nueva = Math.max(est.pista ?? 0, k + 1);
        if (nueva > (est.pista ?? 0)) { try { sessionStorage.setItem(CLAVE_ENCIENDE, `${caso.id}:${nueva}`); } catch { /* modo privado */ } }
        ctx.guardar({ pista: nueva, elecciones });
        ir(`caso/${caso.id}`);
      },
      alSalir: (fn) => limpiezas.push(fn),
      vivo: () => vivo
    };
    raiz.innerHTML = '';
    if (sub === 'resuelto' || sub === 'informe') {
      if (!est.resuelto) { ir(`caso/${caso.id}`); return; }
      (sub === 'resuelto' ? pintarResuelto : pintarInforme)(ctx);
      return;
    }
    if (sub !== null) {
      const k = Number(sub);
      if (!Number.isInteger(k) || k < 0 || k > 6 || k > (est.pista ?? 0)) { ir(`caso/${caso.id}`); return; }
      pintarPista(ctx, k);
      return;
    }
    pintarConstelacion(ctx);
  }).catch((e) => { console.error(e); if (vivo) ir('casos'); });
}

// Cabecera con la mini-constelación (hecha ✓, actual roja, el resto apagado) + Jukumari con la ayuda del caso
function pintarPista(ctx, k) {
  const { caso, est, raiz } = ctx;
  raiz.innerHTML = `
    <header class="caso-cabeza"><nav aria-label="Pistas del caso"><ol class="caso-pasos">${PISTAS.map((p, i) => {
      const hecha = i < (est.pista ?? 0) && i !== k, actual = i === k;
      return `${i ? `<li class="caso-une ${i <= (est.pista ?? 0) ? 'hecha' : ''}" aria-hidden="true"></li>` : ''}<li><button type="button" class="caso-paso ${hecha ? 'hecho' : ''} ${actual ? 'actual' : ''}" data-k="${i}"
        ${i <= (est.pista ?? 0) && !actual ? '' : 'disabled'} ${actual ? 'aria-current="step"' : ''} aria-label="${p.nombre}${hecha ? ', hecha' : ''}"><span class="bola" aria-hidden="true">${p.icono}</span>${p.corto}</button></li>`;
    }).join('')}</ol></nav></header>
    <main class="caso-cuerpo con-pasos"></main>`;
  raiz.querySelector('.caso-cabeza').prepend(logo(`caso/${caso.id}`, 'Volver a la constelación'));
  raiz.querySelector('.caso-pasos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (b && !b.disabled) ir(`caso/${caso.id}/${b.dataset.k}`);
  });
  const juku = crearJukumari(raiz, {
    ayuda: caso.ayuda, pistasUsadas: est.elecciones.pistas ?? 0,
    alUsarPista: (n) => ctx.guardar({ elecciones: { pistas: n } })
  });
  ctx.juku = juku;
  ctx.cuerpo = raiz.querySelector('.caso-cuerpo');
  ctx.ceja = (titulo) => `CASO ${caso.exp} · ${caso.nombre.toUpperCase()} · ${titulo}`;
  ctx.pie = (siguiente) => `<div class="caso-pie">
      <button type="button" class="btn-apu secundario" data-constelacion>‹ CONSTELACIÓN</button>
      <button type="button" class="btn-apu" data-sig>${siguiente} ›</button></div>`;
  ctx.conectarPie = (alSeguir) => {
    ctx.cuerpo.querySelector('[data-constelacion]').addEventListener('click', () => ir(`caso/${caso.id}`));
    ctx.cuerpo.querySelector('[data-sig]').addEventListener('click', alSeguir);
  };
  PASOS[k](ctx);
  ctx.cuerpo.querySelector('h1')?.focus({ preventScroll: true });
}

// La constelación (casoG-1)
const POS = [[9, 33], [30, 20], [52, 31], [75, 20], [79, 57], [60, 80], [42, 61]]; // % de la caja (1000 × 700)
function pintarConstelacion(ctx) {
  const { caso, est, raiz, escena: es } = ctx;
  const pista = Math.min(7, est.pista ?? 0);
  let enciende = null;
  try {
    const v = sessionStorage.getItem(CLAVE_ENCIENDE);
    if (v && v.startsWith(`${caso.id}:`)) enciende = Number(v.split(':')[1]);
    sessionStorage.removeItem(CLAVE_ENCIENDE);
  } catch { /* modo privado */ }
  const sig = PISTAS[pista];
  raiz.innerHTML = `
    <header class="caso-cabeza"></header>
    <main class="caso-cuerpo">
      <p class="caso-ceja">CASO ${caso.exp} · ${esc(caso.nombre.toUpperCase())} · ${pista} DE 7 PISTAS</p>
      <h1 class="caso-titulo" tabindex="-1">Constelación de <em>pistas</em></h1>
    </main>
    <div class="constelacion">
      <svg class="lineas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${POS.slice(1).map(([x, y], i) => {
        const [x0, y0] = POS[i], n = i + 1;
        const clase = n <= pista ? (enciende === n ? 'linea enciende' : 'linea luz') : 'linea';
        return `<line class="${clase}" x1="${x0}" y1="${y0}" x2="${x}" y2="${y}" vector-effect="non-scaling-stroke" pathLength="1200"/>`;
      }).join('')}</svg>
      ${PISTAS.map((p, i) => {
        const estado = i < pista ? 'hecha' : i === pista ? 'actual' : 'bloqueada';
        return `<button type="button" class="caso-estrella ${estado}" data-k="${i}" style="left:${POS[i][0]}%;top:${POS[i][1]}%" ${estado === 'bloqueada' ? 'disabled' : ''}
          aria-label="${p.nombre}: ${p.pregunta}${estado === 'hecha' ? ', resuelta' : estado === 'actual' ? ', la siguiente' : ', bloqueada'}">
          <span class="bola" aria-hidden="true">${p.icono}</span>
          <span class="paso">${p.paso ? `Paso ${p.paso} · ` : ''}${p.nombre}</span><b>${p.pregunta}</b></button>`;
      }).join('')}
    </div>
    <div class="constelacion-pregunta">
      <div class="vidrio-caso">
        <p class="caso-ceja">CASO ${caso.exp} · LA PREGUNTA</p>
        <h2>${esc(caso.pregunta)}</h2>
        <p class="caso-nota">Tu sospecha: ${ctx.sospecha ? `${ICONO_RUMBO[ctx.sospecha] ?? ''} <b class="amarillo">${esc(ctx.sospecha)}</b>` : '— (la eliges en el expediente)'}</p>
      </div>
      <button type="button" class="btn-apu" data-seguir>${pista >= 7 ? (est.resuelto ? 'VER EL INFORME' : 'VER EL VEREDICTO') : `CONTINUAR: ${sig.pregunta.toUpperCase()}`}</button>
    </div>`;
  raiz.querySelector('.caso-cabeza').append(logo('casos', 'Volver al archivo de casos'));
  raiz.querySelector('.constelacion').addEventListener('click', (e) => {
    const b = e.target.closest('.caso-estrella');
    if (b && !b.disabled) ir(`caso/${caso.id}/${b.dataset.k}`);
  });
  raiz.querySelector('[data-seguir]').addEventListener('click', () => ir(pista >= 7 ? `caso/${caso.id}/${est.resuelto ? 'informe' : '6'}` : `caso/${caso.id}/${pista}`));
  const juku = crearJukumari(raiz, { ayuda: 'con' });
  if (pista === 0) juku.decir(`¡Un caso nuevo, ${ctx.apodo}! Empieza por el expediente.`, 'Cada pista enciende una estrella…');
  else if (pista >= 7) juku.decir('¡Las 7 estrellas brillan! El caso está cerrado.', '¿Vemos el informe?');
  else juku.decir(`Toca la estrella roja: ${sig.pregunta.toLowerCase()}`, 'Cada pista enciende una estrella…');
  es?.montana(caso, { girar: true, clase: 'oscura' });
  raiz.querySelector('h1')?.focus({ preventScroll: true });
}

export function desmontar() {
  vivo = false;
  limpiezas.forEach((f) => { try { f(); } catch { /* nada */ } });
  limpiezas = [];
  document.body.classList.remove('escena3d-interactiva');
  // Si no se va a otra pantalla de casos, la escena 3D se esconde (no se destruye: se reutiliza)
  const es = escena;
  setTimeout(() => { if (!/^#\/casos?(\/|$)/.test(location.hash)) es?.ocultar(); }, 0);
}
