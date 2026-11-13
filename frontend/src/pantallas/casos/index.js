// Pantalla: mis casos · #/casos (sesión). Entradas: Perfil (MIS CASOS) y #/etapas (etapa CASOS).
// Responsable: Luis
// 3 tarjetas (contenido/lecciones.js → CASOS): Caso 1 · Nieve, Caso 2 · Lluvia y Caso final. Estados:
//   Resuelto ✓  veredicto, tendencia y p LEÍDOS del JSON del backend (public/datos/<region>.json) + VER INFORME
//   En curso    abierto y sin resolver: barra de avance + CONTINUAR (→ #/caso/<id>)
//   Bloqueado   borde punteado y 🔒: el Caso 1 se abre con las 5 lecciones; cada caso, con el anterior resuelto
// VER INFORME: ventana con hipótesis, resultado (del JSON), límites y fuente (del JSON).
// Los casos resueltos se guardan como "id|fecha" (servicios/progreso.js → completarCaso / casosResueltos).
// Solo estilos existentes: fondo, marco, paneles, chips, barra, bloqueo y botones de etapas.css, carga.css
// e insignias.css (la ventana); casos.css solo coloca y mide.
import '../etapas/etapas.css';
import '../carga/carga.css';            // la barra rayada (.barra .pista .relleno)
import '../insignias/insignias.css';    // la ventana (.expediente-ventana) y medidas de la barra
import './casos.css';
import { ir } from '../../router.js';
import { leerProgreso, casosResueltos } from '../../servicios/progreso.js';
import { cargarRegion } from '../../servicios/datos.js';
import { LECCIONES, CASOS } from '../../contenido/lecciones.js';

const CANDADO = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const CLAVE_AVANCE = 'apu-casos-avance'; // { id: 0..100 } que escribe la pantalla del caso; si no hay, 0
const FECHA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
let vivo = false;

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Números como en el panel de la montaña (montanas-puente.js): coma decimal y signo menos tipográfico
const fmt = (v, d) => v.toFixed(d).replace('.', ',');
const conSigno = (v, d = 0) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmt(Math.abs(v), d)}`;
const decimales = (v) => (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);

function avanceDe(id) {
  try { const a = JSON.parse(localStorage.getItem(CLAVE_AVANCE) || '{}')[id]; return Number.isFinite(a) ? Math.max(0, Math.min(100, a)) : 0; } catch { return 0; }
}

// Lo que se muestra de un resultado, todo sacado de la variable del JSON (v)
function leerResultado(caso, v, region) {
  const real = v.veredicto === 'real';
  const porAnio = caso.tendencia === 'anio';
  const t = porAnio ? v.tendencia_por_decada / 10 : v.tendencia_por_decada;
  const unidad = porAnio ? v.unidad_tendencia : `${v.unidad_tendencia} por década`;
  return {
    veredicto: real ? 'Real' : 'Todavía no se sabe',
    real,
    tendencia: `${conSigno(t, decimales(t))} ${unidad}`,
    p: v.p < 0.01 ? 'p < 0,01' : `p = ${fmt(v.p, 2)}`,
    meses: `De ${v.subio + v.bajo + (v.empate ?? 0)} meses comparados, en ${v.bajo} bajó y en ${v.subio} subió.`,
    fuente: `${v.fuente} · ${region.nombre} · ${v.desde} a ${v.hasta}${v.cita ? `. ${v.cita}` : ''}`,
    nota: v.nota ?? ''
  };
}

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas pantalla-insignias pantalla-casos';
  raiz.innerHTML = `
    <div class="etapas-fondo" aria-hidden="true"></div>
    <div class="etapas-velo" aria-hidden="true"></div>
    <div class="etapas-nieve" aria-hidden="true"></div>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;top:1.4cqh;border-right:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;top:1.4cqh;border-left:none;border-bottom:none"></span>
    <span class="esq" aria-hidden="true" style="left:1.4cqh;bottom:1.4cqh;border-right:none;border-top:none"></span>
    <span class="esq" aria-hidden="true" style="right:1.4cqh;bottom:1.4cqh;border-left:none;border-top:none"></span>

    <button type="button" class="etapas-volver vidrio" aria-label="Volver">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <img class="etapas-logo" src="/img/logo-apu.png" alt="APU">

    <h1 class="insignias-titulo casos-titulo"><span class="barras" aria-hidden="true">//</span> MIS CASOS</h1>
    <div class="casos-grilla">
      ${CASOS.map((c) => `<article class="etapas-panel vidrio caso-tarjeta" data-caso="${c.id}" aria-labelledby="caso-${c.id}"></article>`).join('')}
    </div>

    <dialog class="expediente-ventana vidrio casos-informe" aria-labelledby="informe-titulo">
      <h2 id="informe-titulo"></h2>
      <div class="informe-cuerpo"></div>
      <div class="expediente-acciones">
        <button type="button" class="btn-apu secundario" data-cerrar autofocus>CERRAR</button>
      </div>
    </dialog>
  `;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);
  // Volver: a donde se vino (perfil o etapas); si se entró directo, al menú
  $('.etapas-volver').addEventListener('click', () => (history.length > 1 ? history.back() : ir('menu')));

  // Nieve (igual que etapas, insignias y perfil)
  const nieve = $('.etapas-nieve');
  for (let i = 0; i < 42; i++) {
    const t = 1.5 + Math.random() * 3.5, dur = 9 + Math.random() * 12, c = document.createElement('span');
    c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    nieve.append(c);
  }

  // ---------- Informe ----------
  const ventana = $('.casos-informe');
  $('[data-cerrar]').addEventListener('click', () => ventana.close());
  ventana.addEventListener('click', (e) => { if (e.target === ventana) ventana.close(); });
  const informes = new Map(); // id → HTML del informe
  function abrirInforme(caso) {
    $('#informe-titulo').textContent = `INFORME · ${caso.corto.toUpperCase()}`;
    $('.informe-cuerpo').innerHTML = informes.get(caso.id) ?? '<p>No se pudo leer el resultado.</p>';
    ventana.showModal();
  }

  // ---------- Tarjetas ----------
  function pintar(caso, i, estado, extra = {}) {
    const t = $(`[data-caso="${caso.id}"]`);
    t.classList.toggle('bloqueado', estado === 'bloqueado');
    const etiqueta = { resuelto: 'RESUELTO', curso: 'EN CURSO', bloqueado: 'BLOQUEADO' }[estado];
    const r = extra.resultado;
    t.innerHTML = `
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>${caso.corto.toUpperCase()} · ${etiqueta}</span>
      <h2 id="caso-${caso.id}">${escapar(caso.nombre)}</h2>
      <p class="pregunta">${escapar(caso.hipotesis)}</p>
      <div class="chips"><span>${escapar(extra.lugar ?? '')}</span><span>${escapar(caso.ayuda)}</span></div>
      ${estado === 'resuelto' ? `
        <div class="chips"><span class="ganada">✓ Resuelto${extra.fecha ? ` · ${FECHA.format(new Date(`${extra.fecha}T00:00:00Z`))}` : ''}</span></div>
        ${r ? `
          <span class="rotulo">VEREDICTO</span><p class="pregunta caso-dato">${r.veredicto} · ${r.p}</p>
          <span class="rotulo">TENDENCIA</span><p class="pregunta caso-dato">${escapar(r.tendencia)}</p>`
        : '<p class="pregunta">No se pudo leer el resultado.</p>'}
        <div class="pie"><button type="button" class="btn-apu secundario" data-informe>VER INFORME</button></div>`
      : estado === 'curso' ? `
        <span class="rotulo">AVANCE</span>
        <div class="barra" role="progressbar" aria-label="Avance del caso" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${extra.avance}">
          <div class="pista"><div class="relleno" style="width:${extra.avance}%"></div></div>
          <span class="porcentaje">${extra.avance ? `${extra.avance} %` : 'Sin empezar'}</span>
        </div>
        <div class="pie"><button type="button" class="btn-empezar" data-continuar>CONTINUAR</button></div>`
      : `<div class="pie"><div class="bloqueo">${CANDADO}${i === 0 ? `Termina las ${LECCIONES.length} lecciones` : `Resuelve el ${escapar(CASOS[i - 1].corto)}`}</div></div>`}`;
    t.querySelector('[data-informe]')?.addEventListener('click', () => abrirInforme(caso));
    t.querySelector('[data-continuar]')?.addEventListener('click', () => ir(`caso/${caso.id}`));
  }

  // Primero, todo bloqueado; luego, con el progreso y los JSON, cada uno en su estado
  CASOS.forEach((c, i) => pintar(c, i, 'bloqueado'));
  leerProgreso().then(async (p) => {
    if (!vivo) return;
    const resueltos = casosResueltos(p);
    const leccionesHechas = LECCIONES.every((l) => p.lecciones.includes(l.id));
    for (const [i, caso] of CASOS.entries()) {
      const abierto = i === 0 ? leccionesHechas : resueltos.has(CASOS[i - 1].id);
      let region = null;
      try { region = await cargarRegion(caso.datos.region); } catch (e) { console.warn(`APU: no se pudieron leer los datos de ${caso.datos.region}.`, e); }
      if (!vivo) return;
      const v = region?.variables?.[caso.datos.variable];
      const lugar = region?.nombre ?? '';
      if (resueltos.has(caso.id)) {
        const resultado = v ? leerResultado(caso, v, region) : null;
        if (resultado) {
          informes.set(caso.id, `
            <span class="rotulo">HIPÓTESIS</span><p>${escapar(caso.hipotesis)}</p>
            <span class="rotulo">RESULTADO</span><p>${resultado.real ? 'El cambio es real' : 'Todavía no se sabe si el cambio es real'}: ${escapar(resultado.tendencia)} (${resultado.p}). ${escapar(resultado.meses)}</p>
            <span class="rotulo">LÍMITES</span><p>${escapar(caso.limites)}${resultado.nota ? ` ${escapar(resultado.nota)}` : ''}</p>
            <span class="rotulo">FUENTE</span><p>${escapar(resultado.fuente)}</p>`);
        }
        pintar(caso, i, 'resuelto', { fecha: resueltos.get(caso.id), resultado, lugar });
      } else if (abierto) {
        pintar(caso, i, 'curso', { avance: avanceDe(caso.id), lugar });
      } else {
        pintar(caso, i, 'bloqueado', { lugar });
      }
    }
  }).catch(() => {});
}

export function desmontar() {
  vivo = false;
}
