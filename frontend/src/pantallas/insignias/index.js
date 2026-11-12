// Pantalla: insignias ("Mi expediente" del riel del menú) · #/insignias
// Responsable: Karen
// Arriba, la tarjeta del detective (cara, apodo y "Cerrar sesión"); debajo, la barra "X / 12 insignias"
// y las 3 familias (contenido/insignias.js). Estados: ganada (✓ verde), bloqueada (gris + candado,
// chip punteado) y en progreso (contador). Al tocar una insignia, su detalle sale en el panel derecho.
// Reusa los estilos de etapas (fondo, nieve, vidrio, panel, chips, bloqueo) y la barra rayada de carga.
// No hay correo ni contraseña en ninguna parte: "Cerrar sesión" borra el progreso y la cuenta anónima.
import '../etapas/etapas.css';
import '../carga/carga.css'; // la barra rayada (.barra .pista .relleno)
import './insignias.css';
import { ir } from '../../router.js';
import { leerProgreso, glaciaresVistos } from '../../servicios/progreso.js';
import { cerrarSesion } from '../../servicios/auth.js';
import { avatarPorId } from '../../contenido/avatares.js';
import { FAMILIAS, INSIGNIAS } from '../../contenido/insignias.js';

const FRASE_ADIOS = '¡Hasta pronto, detective!';
const CANDADO = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
let vivo = false;

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// La medalla: la imagen o, si no hay, un hexágono con "?"
export const medalla = (ins) => ins.img
  ? `<img src="${ins.img}" alt="" draggable="false">`
  : '<span class="hexagono" aria-hidden="true">?</span>';

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas pantalla-insignias';
  raiz.innerHTML = `
    <div class="etapas-fondo" aria-hidden="true"></div>
    <div class="etapas-velo" aria-hidden="true"></div>
    <div class="etapas-nieve" aria-hidden="true"></div>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;top:1.4cqh;border-right:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;top:1.4cqh;border-left:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;bottom:1.4cqh;border-right:none;border-top:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;bottom:1.4cqh;border-left:none;border-top:none"></span>

    <button type="button" class="etapas-volver vidrio" aria-label="Volver al menú">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="etapas-logo" src="/img/logo-apu.png" alt="APU">

    <div class="insignias-principal">
      <div class="expediente-perfil vidrio">
        <img class="expediente-cara" src="" alt="" width="72" height="72" hidden>
        <div class="expediente-nombre">
          <span class="expediente-etiqueta">DETECTIVE</span>
          <strong class="expediente-apodo">…</strong>
        </div>
        <button type="button" class="btn-apu secundario expediente-salir">CERRAR SESIÓN</button>
      </div>

      <h1 class="insignias-titulo"><span class="barras" aria-hidden="true">//</span> MIS INSIGNIAS</h1>
      <div class="barra" role="progressbar" aria-label="Insignias ganadas" aria-valuemin="0" aria-valuemax="${INSIGNIAS.length}">
        <div class="pista"><div class="relleno"></div></div>
        <span class="porcentaje"></span>
      </div>

      ${FAMILIAS.map((f) => `
        <section class="insignias-familia" aria-labelledby="familia-${f.id}">
          <h2 class="rotulo" id="familia-${f.id}">${f.nombre}</h2>
          <div class="insignias-grilla" data-familia="${f.id}"></div>
        </section>`).join('')}
    </div>

    <aside class="etapas-panel vidrio" aria-live="polite"></aside>

    <dialog class="expediente-ventana vidrio" aria-labelledby="salir-titulo" aria-describedby="salir-texto">
      <h2 id="salir-titulo">CERRAR SESIÓN</h2>
      <p id="salir-texto">Si sales, tus insignias y tu progreso se borran de este dispositivo. ¿Seguro?</p>
      <p class="expediente-error" role="alert"></p>
      <div class="expediente-acciones">
        <button type="button" class="btn-apu secundario" data-cancelar autofocus>CANCELAR</button>
        <button type="button" class="btn-apu" data-salir>SALIR</button>
      </div>
    </dialog>
  `;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  $('.etapas-volver').addEventListener('click', () => ir('menu'));

  // Nieve (igual que etapas)
  const nieve = $('.etapas-nieve');
  for (let i = 0; i < 42; i++) {
    const t = 1.5 + Math.random() * 3.5, dur = 9 + Math.random() * 12, c = document.createElement('span');
    c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    nieve.append(c);
  }

  // ---------- Insignias ----------
  let ganadas = new Set();
  let sel = INSIGNIAS[0].id;
  const vistos = () => glaciaresVistos().length;
  const estado = (ins) => {
    if (ganadas.has(ins.id)) return 'ganada';
    if (ins.meta && vistos() > 0) return 'progreso';
    return 'bloqueada';
  };
  const contador = (ins) => `${Math.min(vistos(), ins.meta)}/${ins.meta}`;

  function pintarGrillas() {
    for (const f of FAMILIAS) {
      raiz.querySelector(`[data-familia="${f.id}"]`).innerHTML = INSIGNIAS.filter((i) => i.familia === f.id).map((ins) => {
        const e = estado(ins);
        const marca = e === 'ganada' ? '✓' : e === 'progreso' ? contador(ins) : CANDADO;
        const leer = e === 'ganada' ? 'ganada' : e === 'progreso' ? `en progreso, ${contador(ins)}` : 'bloqueada';
        return `
          <button type="button" class="insignia ${e}${sel === ins.id ? ' elegida' : ''}" data-id="${ins.id}" aria-pressed="${sel === ins.id}" aria-label="${ins.nombre}, ${leer}">
            <span class="medalla">${medalla(ins)}<span class="pildora">${marca}</span></span>
            <span class="chip">${ins.nombre}</span>
          </button>`;
      }).join('');
    }
    const n = INSIGNIAS.filter((i) => ganadas.has(i.id)).length;
    const barra = $('.barra');
    barra.querySelector('.relleno').style.width = `${(n / INSIGNIAS.length) * 100}%`;
    barra.querySelector('.porcentaje').textContent = `${n} / ${INSIGNIAS.length} insignias`;
    barra.setAttribute('aria-valuenow', String(n));
  }

  function pintarPanel() {
    const ins = INSIGNIAS.find((i) => i.id === sel);
    const e = estado(ins);
    const familia = FAMILIAS.find((f) => f.id === ins.familia).nombre;
    const panel = $('.etapas-panel');
    panel.innerHTML = `
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>${familia} · ${e === 'ganada' ? 'GANADA' : e === 'progreso' ? 'EN PROGRESO' : 'BLOQUEADA'}</span>
      <h2>${ins.nombre.toUpperCase()}</h2>
      <div class="insignia-grande ${e}">${medalla(ins)}</div>
      <span class="rotulo">CÓMO SE GANA</span>
      <p class="pregunta">${ins.como}</p>
      <div class="pie">
        ${e === 'ganada'
          ? '<div class="chips"><span class="ganada">✓ Ganada</span></div>'
          : e === 'progreso'
            ? `<div class="barra"><div class="pista"><div class="relleno" style="width:${(Math.min(vistos(), ins.meta) / ins.meta) * 100}%"></div></div><span class="porcentaje">${contador(ins)}</span></div>
               <span class="rotulo">${vistos()} de ${ins.total} glaciares visitados</span>`
            : `<div class="bloqueo">${CANDADO}Todavía no la ganas</div>`}
      </div>`;
    panel.classList.remove('nuevo'); void panel.offsetWidth; panel.classList.add('nuevo');
  }

  raiz.querySelector('.insignias-principal').addEventListener('click', (ev) => {
    const b = ev.target.closest('.insignia'); if (!b) return;
    sel = b.dataset.id; pintarGrillas(); pintarPanel();
  });

  pintarGrillas(); pintarPanel();
  leerProgreso().then((p) => {
    if (!vivo) return;
    ganadas = new Set(p.insignias);
    pintarGrillas(); pintarPanel();
    // Tarjeta: cara del avatar + apodo
    $('.expediente-apodo').innerHTML = escapar(String(p.apodo || 'Detective').trim());
    const a = avatarPorId(p.avatar);
    if (a) {
      const cara = $('.expediente-cara');
      cara.src = a.cara; cara.alt = a.nombre; cara.hidden = false;
    }
  }).catch(() => {});

  // ---------- Cerrar sesión: ventana propia (no confirm()) ----------
  const ventana = $('.expediente-ventana');
  const salir = $('[data-salir]');
  const cancelar = $('[data-cancelar]');
  const error = $('.expediente-error');
  let saliendo = false;

  $('.expediente-salir').addEventListener('click', () => { error.textContent = ''; ventana.showModal(); });
  cancelar.addEventListener('click', () => ventana.close());
  ventana.addEventListener('cancel', (e) => { if (saliendo) e.preventDefault(); }); // Esc no corta la salida
  ventana.addEventListener('click', (e) => { if (e.target === ventana && !saliendo) ventana.close(); }); // toque fuera

  salir.addEventListener('click', async () => {
    saliendo = true;
    salir.disabled = cancelar.disabled = true;
    salir.textContent = 'SALIENDO…';
    try {
      await cerrarSesion();
    } catch (e) {
      console.warn('APU: no se pudo cerrar la sesión.', e);
      saliendo = false;
      salir.disabled = cancelar.disabled = false;
      salir.textContent = 'SALIR';
      error.textContent = 'No se pudo cerrar la sesión. Revisa tu conexión e inténtalo otra vez.';
      return;
    }
    ventana.close();
    // Al llegar al planeta, el Jukumari se despide (como al volver del registro)
    window.addEventListener('hashchange', () => setTimeout(() => window.dispatchEvent(
      new CustomEvent('apu:jukumari', { detail: { texto: FRASE_ADIOS, abrir: true } }))), { once: true });
    ir('menu');
  });
}

export function desmontar() {
  vivo = false;
}
