// Selector propio de año y mes (estilo HUD). Reemplaza al <select> con la lista larga de meses.
//
//   const s = crearSelectorMes({ etiqueta: 'Mes del dato', clase: 'clima-mes' });
//   contenedor.append(s.campo);
//   s.poner(['2001-01', …, '2025-12'], '2024-05'); // meses con datos (AAAA-MM) y el elegido
//   s.campo.value                                  // 'AAAA-MM' elegido
//   s.campo.addEventListener('change', …);         // se dispara al tocar "Aplicar" (si cambió)
//   s.destruir();
//
// Solo se pueden elegir meses que estén en la lista. El panel flotante va en <body> con
// position: fixed, para que el panel de datos (con scroll) no lo recorte.
import './selector-mes.css';

const CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const clave = (a, m) => `${a}-${String(m + 1).padStart(2, '0')}`;
const MOVIL = '(max-width: 599.98px)';
const SEPARACION = 12; // px entre el campo y el panel (ahí va el triángulo)

const ICONO_CALENDARIO = `
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 8h20v19H6z"/><path d="M6 13h20"/><path d="M11 5v5M21 5v5"/>
    <path d="M10 17.5h3M15 17.5h3M20 17.5h2M10 22h3M15 22h3"/>
  </svg>`;

export function crearSelectorMes({ etiqueta = 'Mes', clase = '' } = {}) {
  const campo = document.createElement('button');
  campo.type = 'button';
  campo.className = `selector-mes-campo ${clase}`.trim();
  campo.setAttribute('aria-haspopup', 'dialog');
  campo.setAttribute('aria-expanded', 'false');
  campo.disabled = true; // hasta que lleguen los meses
  campo.innerHTML = '<span class="sm-campo-texto"></span>';

  let disponibles = new Set();
  let anios = []; // solo años con al menos un mes con datos, ordenados
  let pop = null;
  let borrador = { anio: 0, mes: 0 };
  const hay = (a, m) => disponibles.has(clave(a, m));

  function pintarCampo() {
    const [a, m] = campo.value.split('-').map(Number);
    const texto = campo.value ? `${LARGOS[m - 1]} ${a}` : '';
    campo.querySelector('.sm-campo-texto').textContent = texto;
    campo.setAttribute('aria-label', `${etiqueta}: ${texto || 'sin datos'}`);
  }

  function poner(meses, elegido) {
    if (pop) cerrar(false);
    disponibles = new Set(meses);
    anios = [...new Set(meses.map((m) => Number(m.slice(0, 4))))].sort((a, b) => a - b);
    campo.value = disponibles.has(elegido) ? elegido : (meses[meses.length - 1] ?? '');
    campo.disabled = !campo.value;
    pintarCampo();
  }

  // El mes con datos más cercano a m dentro del año a
  function masCercano(a, m) {
    for (let d = 0; d < 12; d++) {
      if (m - d >= 0 && hay(a, m - d)) return m - d;
      if (m + d <= 11 && hay(a, m + d)) return m + d;
    }
    return m;
  }

  // ---------------------------------------------------------------
  // Panel flotante
  // ---------------------------------------------------------------
  function abrir() {
    if (pop || campo.disabled) return;
    const [a, m] = campo.value.split('-').map(Number);
    borrador = { anio: a, mes: m - 1 };
    pop = document.createElement('div');
    pop.className = 'sm-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', `Elegir ${etiqueta.toLowerCase()}`);
    pop.innerHTML = `
      <div class="sm-caja sm-corte">
        <span class="sm-rayas" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <div class="sm-fila">
          <div class="sm-icono sm-corte" aria-hidden="true">${ICONO_CALENDARIO}</div>
          <div class="sm-bloque sm-anio sm-corte" role="group" aria-label="Año">
            <p class="sm-titulo" aria-hidden="true">Año</p>
            <div class="sm-anio-fila">
              <button type="button" class="sm-paso" data-paso="-1" aria-label="Año anterior">◀</button>
              <output class="sm-anio-valor" aria-live="polite"></output>
              <button type="button" class="sm-paso" data-paso="1" aria-label="Año siguiente">▶</button>
            </div>
          </div>
          <div class="sm-bloque sm-meses sm-corte" role="group" aria-label="Mes">
            <p class="sm-titulo" aria-hidden="true">Mes</p>
            <div class="sm-rejilla">
              ${CORTOS.map((c, i) => `<button type="button" class="sm-mes sm-corte" data-mes="${i}">${c}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="sm-acciones">
          <button type="button" class="sm-btn sm-cancelar sm-corte">✕ Cancelar</button>
          <button type="button" class="sm-btn sm-aplicar sm-corte">✓ Aplicar</button>
        </div>
      </div>
      <svg class="sm-flecha" viewBox="0 0 20 11" aria-hidden="true"><path d="M0 11 L10 1 L20 11"/></svg>`;
    document.body.append(pop);

    pop.querySelectorAll('.sm-paso').forEach((b) => b.addEventListener('click', () => cambiarAnio(Number(b.dataset.paso))));
    pop.querySelectorAll('.sm-mes').forEach((b) => b.addEventListener('click', () => {
      borrador.mes = Number(b.dataset.mes);
      pintar();
      b.focus();
    }));
    pop.querySelector('.sm-cancelar').addEventListener('click', () => cerrar(true));
    pop.querySelector('.sm-aplicar').addEventListener('click', aplicar);
    pop.addEventListener('keydown', teclado);
    document.addEventListener('pointerdown', fuera, true);
    window.addEventListener('resize', colocar);
    window.addEventListener('scroll', colocar, true);

    campo.setAttribute('aria-expanded', 'true');
    pintar();
    colocar();
    mesElegido().focus();
  }

  function cerrar(devolverFoco) {
    if (!pop) return;
    document.removeEventListener('pointerdown', fuera, true);
    window.removeEventListener('resize', colocar);
    window.removeEventListener('scroll', colocar, true);
    pop.remove();
    pop = null;
    campo.setAttribute('aria-expanded', 'false');
    if (devolverFoco) campo.focus();
  }

  function aplicar() {
    const nuevo = clave(borrador.anio, borrador.mes);
    const cambio = nuevo !== campo.value && disponibles.has(nuevo);
    if (cambio) { campo.value = nuevo; pintarCampo(); }
    cerrar(true);
    if (cambio) campo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const mesElegido = () => pop.querySelector(`.sm-mes[data-mes="${borrador.mes}"]`);

  function pintar() {
    const { anio, mes } = borrador;
    pop.querySelector('.sm-anio-valor').textContent = String(anio);
    const [antes, despues] = pop.querySelectorAll('.sm-paso');
    antes.disabled = anio <= anios[0];
    despues.disabled = anio >= anios[anios.length - 1];
    pop.querySelectorAll('.sm-mes').forEach((b) => {
      const i = Number(b.dataset.mes);
      const conDato = hay(anio, i);
      b.disabled = !conDato;
      b.setAttribute('aria-pressed', String(i === mes));
      b.tabIndex = i === mes ? 0 : -1;
      b.setAttribute('aria-label', `${LARGOS[i]} ${anio}${conDato ? '' : ', sin datos'}`);
      if (conDato) { b.removeAttribute('title'); b.removeAttribute('aria-disabled'); }
      else { b.title = 'Sin datos de NASA para este mes'; b.setAttribute('aria-disabled', 'true'); }
    });
  }

  function cambiarAnio(paso) {
    const nuevo = anios[anios.indexOf(borrador.anio) + paso];
    if (nuevo === undefined) return;
    borrador = { anio: nuevo, mes: masCercano(nuevo, borrador.mes) };
    pintar();
    // Si el botón que se tocó quedó desactivado (primer/último año), el foco pasa al mes
    if (document.activeElement?.disabled || !pop.contains(document.activeElement)) mesElegido().focus();
  }

  // Flechas entre meses: salta los meses sin datos y pasa de año en los bordes
  function moverMes(paso) {
    let { anio: a, mes: m } = borrador;
    for (let vueltas = 0; vueltas < 600; vueltas++) {
      m += paso;
      if (m < 0 || m > 11) {
        const otro = anios[anios.indexOf(a) + (m < 0 ? -1 : 1)];
        if (otro === undefined) return;
        a = otro;
        m += m < 0 ? 12 : -12;
      }
      if (hay(a, m)) { borrador = { anio: a, mes: m }; pintar(); mesElegido().focus(); return; }
    }
  }

  function teclado(e) {
    const enMes = e.target.classList?.contains('sm-mes');
    const pasos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(true); }
    else if (e.key === 'Enter' && (enMes || e.target.classList?.contains('sm-aplicar'))) { e.preventDefault(); aplicar(); }
    else if (enMes && e.key in pasos) { e.preventDefault(); moverMes(pasos[e.key]); }
    else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); cambiarAnio(e.key === 'PageUp' ? -1 : 1); }
    else if (e.key === 'Tab') {
      // El foco se queda dentro del panel mientras está abierto
      const lista = [...pop.querySelectorAll('button')].filter((b) => !b.disabled && b.tabIndex >= 0);
      const i = lista.indexOf(document.activeElement);
      const j = e.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : (i === lista.length - 1 ? 0 : i + 1);
      e.preventDefault();
      lista[j].focus();
    }
  }

  function fuera(e) {
    if (pop.contains(e.target) || campo.contains(e.target)) return;
    cerrar(false);
  }

  // Debajo del campo (o encima si no cabe), centrado en él y sin salirse de la pantalla
  function colocar() {
    if (!pop) return;
    const r = campo.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const movil = window.matchMedia(MOVIL).matches;
    const margen = movil ? 8 : 12;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const centro = r.left + r.width / 2;
    const left = movil ? (vw - w) / 2 : Math.min(Math.max(margen, centro - w / 2), vw - w - margen);
    let top = r.bottom + SEPARACION;
    const arriba = top + h > vh - 8 && r.top - SEPARACION - h >= 8;
    if (arriba) top = r.top - SEPARACION - h;
    pop.classList.toggle('sm-arriba', arriba);
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(Math.max(8, top))}px`;
    pop.style.setProperty('--flecha-x', `${Math.round(Math.min(Math.max(centro - left, 26), w - 26))}px`);
  }

  campo.addEventListener('click', () => (pop ? cerrar(false) : abrir()));

  return {
    campo,
    poner,
    destruir() { cerrar(false); campo.remove(); }
  };
}
