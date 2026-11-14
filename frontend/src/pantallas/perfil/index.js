// Pantalla: perfil del detective · #/perfil (el ícono "perfil" del riel del menú lleva aquí)
// Izquierda: el avatar de cuerpo entero, el apodo, "Animal · detective desde <fecha>" y CAMBIAR EN AJUSTES.
// Derecha: el avance (lecciones X/10, casos X/3, insignias X/12), las 6 últimas insignias (→ #/insignias)
// y el siguiente paso pendiente (MIS CASOS → #/casos, CONTINUAR → la lección o el caso que toca).
// El Jukumari dice cuánto falta. Solo estilos existentes: fondo, vidrio, paneles, chips y botón de
// etapas.css; barras de carga.css; medallas de insignias.css; figura del avatar de nueva-insignia.css.
import '../etapas/etapas.css';
import '../carga/carga.css';            // la barra rayada (.barra .pista .relleno)
import '../insignias/insignias.css';    // medallas (.insignia .medalla .pildora .chip) y medidas de la barra
import '../../componentes/nueva-insignia.css'; // la figura del avatar de cuerpo entero
import './perfil.css';
import { ir } from '../../router.js';
import { leerProgreso, casosResueltos } from '../../servicios/progreso.js';
import { usuarioActual } from '../../servicios/auth.js';
import { avatarPorId } from '../../contenido/avatares.js';
import { INSIGNIAS, insigniaPorId } from '../../contenido/insignias.js';
import { LECCIONES, BLOQUES, CASOS } from '../../contenido/lecciones.js';
import { medalla } from '../insignias/index.js';

const TOTAL_LECCIONES = LECCIONES.length;   // 10 (firestore.rules guarda hasta 10)
const TOTAL_CASOS = CASOS.length;           // 3
const TOTAL_INSIGNIAS = INSIGNIAS.length;   // 12
const FECHA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
let vivo = false;

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Una barra rayada "Rótulo · X / total"
const barra = (clase, rotulo, total) => `
  <span class="rotulo">${rotulo}</span>
  <div class="barra ${clase}" role="progressbar" aria-label="${rotulo}" aria-valuemin="0" aria-valuemax="${total}">
    <div class="pista"><div class="relleno" style="width:0%"></div></div>
    <span class="porcentaje">0 / ${total}</span>
  </div>`;

// El siguiente paso: la primera lección sin terminar; si están todas, el primer caso; si no, nada
function siguientePaso(p) {
  const l = LECCIONES.find((x) => !p.lecciones.includes(x.id));
  if (l) return { titulo: `Bloque ${l.bloque} · ${BLOQUES[l.bloque]?.nombre ?? ''}`, texto: `Lección ${LECCIONES.indexOf(l) + 1}: ${l.nombre ?? l.titulo}`, ruta: `leccion/${l.id}` };
  const resueltos = casosResueltos(p);
  const c = CASOS.find((x) => !resueltos.has(x.id));
  if (c) return { titulo: 'Etapa 2 · Detective', texto: `${c.nombre} (${c.ayuda})`, ruta: `caso/${c.id}` };
  return null;
}

export function montar(contenedor) {
  vivo = true;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas pantalla-insignias pantalla-perfil';
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

    <section class="etapas-panel vidrio perfil-detective" aria-labelledby="perfil-apodo">
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>DETECTIVE</span>
      <div class="nueva-insignia-figuras perfil-figura"><img class="nueva-insignia-avatar" src="" alt="" hidden></div>
      <h2 id="perfil-apodo">…</h2>
      <div class="chips"><span class="perfil-desde">Detective</span></div>
      <div class="pie">
        <button type="button" class="btn-apu secundario" data-ajustes>CAMBIAR EN AJUSTES</button>
      </div>
    </section>

    <aside class="etapas-panel vidrio perfil-avance" aria-label="Mi avance">
      <span class="etiqueta"><span class="barras" aria-hidden="true">//</span>MI AVANCE</span>
      ${barra('lecciones', 'LECCIONES', TOTAL_LECCIONES)}
      ${barra('casos', 'CASOS', TOTAL_CASOS)}
      ${barra('insignias', 'INSIGNIAS', TOTAL_INSIGNIAS)}
      <span class="rotulo">ÚLTIMAS INSIGNIAS</span>
      <div class="insignias-grilla perfil-insignias"></div>
      <span class="rotulo">SIGUIENTE PASO</span>
      <p class="pregunta perfil-paso">…</p>
      <div class="pie">
        <button type="button" class="btn-apu secundario" data-casos>MIS CASOS</button>
        <button type="button" class="btn-empezar" data-continuar>CONTINUAR</button>
      </div>
    </aside>
  `;
  contenedor.append(raiz);
  const $ = (s) => raiz.querySelector(s);

  $('.etapas-volver').addEventListener('click', () => ir('menu'));
  $('[data-ajustes]').addEventListener('click', () => ir('ajustes'));
  $('[data-casos]').addEventListener('click', () => ir('casos'));
  $('.perfil-insignias').addEventListener('click', (e) => { if (e.target.closest('.insignia')) ir('insignias'); });

  // Nieve (igual que etapas e insignias)
  const nieve = $('.etapas-nieve');
  for (let i = 0; i < 42; i++) {
    const t = 1.5 + Math.random() * 3.5, dur = 9 + Math.random() * 12, c = document.createElement('span');
    c.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    nieve.append(c);
  }

  const ponerBarra = (clase, n, total) => {
    const b = $(`.barra.${clase}`);
    const x = Math.min(n, total);
    b.querySelector('.relleno').style.width = `${(x / total) * 100}%`;
    b.querySelector('.porcentaje').textContent = `${x} / ${total}`;
    b.setAttribute('aria-valuenow', String(x));
  };

  leerProgreso().then((p) => {
    if (!vivo) return;
    // Izquierda: avatar, apodo y "Animal · detective desde <fecha>"
    const apodo = String(p.apodo || 'Detective').trim();
    $('#perfil-apodo').textContent = apodo;
    const a = avatarPorId(p.avatar);
    const img = $('.nueva-insignia-avatar');
    if (a) { img.src = a.cuerpo; img.alt = `${a.nombre}, el avatar de ${apodo}`; img.hidden = false; }
    const creado = usuarioActual()?.metadata?.creationTime;
    const desde = creado && !Number.isNaN(Date.parse(creado)) ? ` desde ${FECHA.format(new Date(creado))}` : '';
    $('.perfil-desde').textContent = `${a?.nombre ?? 'Detective'} · detective${desde}`;

    // Derecha: barras
    const lecciones = LECCIONES.filter((l) => p.lecciones.includes(l.id)).length, casos = casosResueltos(p).size;
    const ganadas = p.insignias.filter((id) => insigniaPorId(id));
    ponerBarra('lecciones', lecciones, TOTAL_LECCIONES);
    ponerBarra('casos', casos, TOTAL_CASOS);
    ponerBarra('insignias', ganadas.length, TOTAL_INSIGNIAS);

    // Las 6 últimas insignias ganadas (la más reciente primero)
    const ultimas = ganadas.slice(-6).reverse().map(insigniaPorId);
    $('.perfil-insignias').innerHTML = ultimas.length
      ? ultimas.map((ins) => `
          <button type="button" class="insignia ganada" aria-label="${escapar(ins.nombre)}, ganada. Ver mis insignias">
            <span class="medalla">${medalla(ins)}<span class="pildora">✓</span></span>
            <span class="chip">${escapar(ins.nombre)}</span>
          </button>`).join('')
      : '<p class="pregunta">Todavía no ganas insignias. ¡La primera está a un paso!</p>';

    // Siguiente paso pendiente
    const paso = siguientePaso(p);
    const continuar = $('[data-continuar]');
    if (paso) {
      $('.perfil-paso').textContent = `${paso.titulo} — ${paso.texto}`;
      continuar.addEventListener('click', () => ir(paso.ruta));
    } else {
      $('.perfil-paso').textContent = '¡Terminaste las lecciones y los casos! Repasa tus insignias.';
      continuar.addEventListener('click', () => ir('insignias'));
    }

    // El Jukumari dice cuánto falta
    const faltan = [
      Math.max(0, TOTAL_LECCIONES - lecciones) && plural(TOTAL_LECCIONES - lecciones, 'lección', 'lecciones'),
      Math.max(0, TOTAL_CASOS - casos) && plural(TOTAL_CASOS - casos, 'caso', 'casos'),
      Math.max(0, TOTAL_INSIGNIAS - ganadas.length) && plural(TOTAL_INSIGNIAS - ganadas.length, 'insignia', 'insignias')
    ].filter(Boolean);
    const frase = faltan.length
      ? `¡Vas muy bien, ${apodo}! Te ${faltan.length === 1 && /^1 /.test(faltan[0]) ? 'falta' : 'faltan'} ${faltan.length > 1 ? `${faltan.slice(0, -1).join(', ')} y ${faltan.at(-1)}` : faltan[0]}.`
      : `¡Lo lograste todo, ${apodo}! Eres un detective completo.`;
    // En pantallas altas abre su panel para decirlo; en las bajas (celular horizontal) taparía el avance:
    // ahí solo late la nube y la frase sale al tocarlo
    window.dispatchEvent(new CustomEvent('apu:jukumari', { detail: { texto: frase, abrir: innerHeight > 500 } }));
  }).catch(() => {});
}

export function desmontar() {
  vivo = false;
}
