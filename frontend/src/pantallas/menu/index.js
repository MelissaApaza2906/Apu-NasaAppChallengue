// Pantalla: menu
// Responsable: Melissa
// Qué hace: Monitoreo glaciar: globo 3D, barra de 5 botones y panel con los datos reales de NASA.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 2 · Monitoreo glaciar)
import './menu.css';
import { ir } from '../../router.js';
import { crearGlobo } from '../../componentes/globo3d.js';
import { graficoAnual, barraComparaciones } from '../../componentes/grafico.js';
import { cargarRegion } from '../../servicios/datos.js';
import { FRASES } from '../../contenido/frases-jukumari.js';
import { PICOS_CORDILLERA_REAL } from '../../contenido/picos.js';

const ICONO = {
  monitoreo: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/>',
  etapas: '<path d="M4 19h4v-4h4v-4h4V7h4"/><circle cx="20" cy="5" r="1.6"/>',
  casos: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  insignias: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1.5 8 5-2.5 5 2.5-1.5-8"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'
};

const BOTONES = [
  { ruta: 'menu', nombre: 'Monitoreo glaciar', icono: ICONO.monitoreo },
  { ruta: 'etapas', nombre: 'Etapas', icono: ICONO.etapas },
  { ruta: 'casos', nombre: 'Casos', icono: ICONO.casos },
  { ruta: 'insignias', nombre: 'Insignias', icono: ICONO.insignias },
  { ruta: 'ajustes', nombre: 'Ajustes', icono: ICONO.ajustes }
];

let globo = null;

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-menu cielo-apu';
  raiz.innerHTML = `
    ${'<span class="estrella-apu" aria-hidden="true"></span>'.repeat(6)}
    <svg class="menu-orbita" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="50" cy="50" rx="48" ry="44" fill="none"
        stroke="rgba(169,200,255,.55)" stroke-width=".35" stroke-dasharray="1 1.4" />
    </svg>
    <div class="menu-globo"></div>

    <nav class="menu-barra" aria-label="Secciones de APU">
      ${BOTONES.map((b) => `
        <button type="button" class="btn-redondo${b.ruta === 'menu' ? ' activo' : ''}" data-ruta="${b.ruta}"
          aria-label="${b.nombre}" title="${b.nombre}"${b.ruta === 'menu' ? ' aria-current="page"' : ''}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${b.icono}</svg>
        </button>`).join('')}
    </nav>

    <aside class="menu-panel panel-apu" aria-labelledby="menu-titulo">
      <header>
        <h1 id="menu-titulo" class="titulo-apu">MONITOREO GLACIAR</h1>
        <p class="lugar">Cordillera Real · Bolivia</p>
      </header>
      <p class="guia">${FRASES.menu}</p>
      <div class="resultados" aria-live="polite"><p class="linea">Cargando datos de NASA…</p></div>
    </aside>

    <!-- TEMPORAL: para probar elegirPico / verPlaneta hasta que exista el carrusel de picos -->
    <div class="menu-prueba-picos" role="group" aria-label="Probar picos">
      ${PICOS_CORDILLERA_REAL.map((p, i) => `<button type="button" data-pico="${i}">${p.n}</button>`).join('')}
      <button type="button" data-planeta>Ver planeta</button>
    </div>
  `;

  raiz.querySelector('.menu-prueba-picos').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !globo) return;
    if (b.dataset.pico) globo.elegirPico(Number(b.dataset.pico));
    else globo.verPlaneta();
  });

  raiz.querySelector('.menu-barra').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ruta]');
    if (b && b.dataset.ruta !== 'menu') ir(b.dataset.ruta);
  });

  contenedor.append(raiz);
  globo = crearGlobo(raiz.querySelector('.menu-globo'), { tamano: 0.95, picos: PICOS_CORDILLERA_REAL });
  window.apuGlobo = globo; // para probar irA() / estado() desde la consola

  mostrarDatos(raiz.querySelector('.resultados'));
}

async function mostrarDatos(caja) {
  try {
    const d = await cargarRegion('cordillera-real');
    const partes = [];
    if (d.variables.nieve) partes.push(tarjeta('Nieve', d.variables.nieve, '#8FDBFF'));   // --dato-nieve
    if (d.variables.lluvia) partes.push(tarjeta('Lluvia', d.variables.lluvia, '#4F8DFF')); // --dato-lluvia
    caja.innerHTML = partes.join('');
  } catch (e) {
    console.error('APU: error leyendo los datos de la Cordillera Real', e);
    caja.innerHTML = '<p class="linea">No se pudieron leer los datos de esta región.</p>';
  }
}

// Tarjeta de una variable con los números reales del JSON (mismo texto que el prototipo)
function tarjeta(nombre, v, color) {
  const real = v.veredicto === 'real';
  const minimo = Math.min(...v.anual);
  const anioMin = v.anios[v.anual.indexOf(minimo)];
  const p = v.p < 0.001 ? '< 0.001' : v.p.toFixed(v.p < 0.01 ? 3 : 2);
  const signo = v.tendencia_por_decada > 0 ? '+' : '';
  const total = v.bajo + v.subio + (v.empate || 0);
  return `<section class="resultado">
    <header><h2>${nombre}</h2><span class="veredicto ${real ? 'real' : 'nose'}">${real ? 'TENDENCIA REAL' : 'TODAVÍA NO SE SABE'}</span></header>
    ${graficoAnual(v.anios, v.anual, { color, destacar: anioMin })}
    ${barraComparaciones(v.bajo, v.subio)}
    <p class="linea">De <b>${total}</b> comparaciones entre años, bajó <b>${v.bajo}</b> y subió <b>${v.subio}</b>. Valor p = <b>${p}</b>${real ? ' (menor que 0.05).' : ' (mayor que 0.05).'}</p>
    <p class="linea">Tendencia: <b>${signo}${v.tendencia_por_decada} ${v.unidad_tendencia}</b> por década. Año más bajo: <b>${anioMin}</b>.</p>
    <p class="linea fuente">Fuente: ${v.fuente} · ${v.anios[0]}–${v.anios[v.anios.length - 1]}</p>
  </section>`;
}

export function desmontar() {
  globo?.destruir();
  globo = null;
  delete window.apuGlobo;
}
