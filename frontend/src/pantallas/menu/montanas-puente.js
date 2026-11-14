// Puente entre el menú y la montaña 3D de Jhoel (componentes/montanas3d.js).
//
//   const m = await abrirMontana({ raiz, glaciar, region, globo, alCambiarVariable }); // region: <id>.json del glaciar
//   m.cerrar();
//
// Al tocar "Ver montaña en 3D" se muestra:
//   · en el espacio del planeta, un recuadro .hud: lo de Jhoel si crearMontanas3d(viewer, glaciar)
//     devuelve { salir() }; si no, "Vista 3D de la montaña · En proceso" con la barra a rayas;
//   · a la derecha, el panel con los datos de NASA (pestañas Nieve/Lluvia, periodos, tarjetas,
//     gráfico con franjas por año, Nevada/Lluvia con el valor real del mes);
//   · debajo del panel, la máquina del tiempo (⏮ ▶/⏸ y el año).
// El visor 3D es solo para la montaña y el análisis del satélite; los números y la comparación año a año
// van solo en el panel (gráfico de líneas + franjas por año).
// Un solo año actual (estado.anioActual) lo comparten el gráfico del panel y la nieve de la montaña: tocar
// un año en el gráfico o en las franjas, mover el deslizador o reproducir cambia los dos (ponerAnio).
// La nieve de cada año: servicios/nieve-anual.js (el día despejado de MODIS Terra NDSI de ese año) y, en
// modo "Cambio", servicios/cambio-nieve.js (ese año frente a su promedio del mismo día).
// El 3D de la montaña es de Jhoel (componentes/montanas3d.js).
import { crearMontanas3d } from '../../componentes/montanas3d.js';
import { darInsignia } from '../../componentes/nueva-insignia.js';
import { fechaNieveDeAnio, precargarAnios } from '../../servicios/nieve-anual.js';
import { crearCambioNieve } from '../../servicios/cambio-nieve.js';
import { fechaBonita } from '../../servicios/nasa-gibs.js';

const PERIODOS = [[2001, 2005, 2021, 2025], [2006, 2010, 2016, 2020]];
const ANIOS = [2001, 2025];
const PASO_PLAY = 1000; // ms por año al reproducir (1 año por segundo)
const SIN_DATOS = 'El análisis de 25 años de este glaciar todavía no está en APU.';
const VARIABLES = {
  nieve: {
    pestana: '❄ Nieve', titulo: 'Nieve de la cordillera', cambio: 'Índice de nieve',
    intro: 'Explora la nieve de la Cordillera Real y analiza su evolución con datos reales del satélite MODIS de NASA.',
    grafico: 'Índice de nieve por año', fuente: 'Línea amarilla: tendencia · Fuente: NASA MODIS (MOD10A1), Cordillera Real',
    color: '#8FDBFF', area: '#5BA0FF', decimales: 2, unidad: '', escala: [1.2, 3.0]
  },
  lluvia: {
    pestana: '☂ Lluvia', titulo: 'Lluvia en la cordillera', cambio: 'Lluvia',
    intro: 'Mira cuánta lluvia cayó cada año en la Cordillera Real, con datos reales del satélite GPM (IMERG) de NASA.',
    grafico: 'Lluvia por año (mm por año)', fuente: 'Línea amarilla: tendencia · Fuente: NASA GPM IMERG (mensual), Cordillera Real',
    color: '#4F8DFF', area: '#4F8DFF', decimales: 0, unidad: ' mm', escala: null
  }
};
// Regiones sin nieve con masa de hielo (variables.masa, GRACE): una sola pestaña, sin máquina del
// tiempo ni Nevada/Lluvia.
const MASA = {
  pestana: 'Hielo', titulo: 'Masa de hielo (GRACE)', unidad: 'gigatoneladas (mil millones de toneladas)',
  grafico: 'Cambio de la masa de hielo, cada mes', color: '#8FDBFF', area: '#5BA0FF'
};
const HUECO_MESES = 6; // más meses seguidos sin dato que esto: el gráfico corta la línea y marca el hueco
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const nombreMes = (m) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`; // '2018-01' → 'Enero 2018'
const fmt = (v, d) => v.toFixed(d).replace('.', ',');
const conSigno = (v, d = 0) => `${v < 0 ? '−' : ''}${fmt(Math.abs(v), d)}`; // signo menos tipográfico
const numMes = (m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1; // '2002-04' → meses corridos
const mesDe = (t) => `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`;

export async function abrirMontana({ raiz, glaciar, region, globo, alCambiarVariable }) {
  const $ = (s) => raiz.querySelector(s);
  const conDatos = Boolean(glaciar?.datos) || glaciar?.tipo === 'pico';
  const esMasa = Boolean(region?.variables?.masa && !region?.variables?.nieve);
  // Los textos de VARIABLES están escritos para la Cordillera Real; para otro glaciar, su nombre.
  // La escala fija del índice de nieve (1,2–3,0) es solo de la Cordillera Real; los demás, la de sus datos.
  const esCordilleraReal = () => (region?.id ?? glaciar?.id) === 'cordillera-real';
  const delLugar = (texto) => (esCordilleraReal() || !region?.nombre ? texto
    : texto.replace('la Cordillera Real', region.nombre).replace('Cordillera Real', region.nombre));
  // Lluvia en revisión (variables.lluvia.revisar): solo se muestra la nieve
  const lluviaEnRevision = () => Boolean(region?.variables?.lluvia?.revisar);
  const estado = { variable: 'nieve', periodo: 0, anioActual: null, clima: null };
  const limpiar = [];
  let vivo = true; // false al cerrar: las respuestas tardías de NASA se ignoran

  // ---------------------------------------------------------------
  // Recuadro en el espacio del planeta
  // ---------------------------------------------------------------
  const recuadro = document.createElement('div');
  recuadro.className = 'mp-recuadro hud';
  recuadro.setAttribute('role', 'region');
  recuadro.setAttribute('aria-label', `Vista 3D de ${glaciar?.nombre ?? 'la montaña'}`);
  recuadro.innerHTML = `
    <div class="mp-proceso">
      <p>Vista 3D de la montaña · En proceso</p>
      <div class="mp-barra" role="progressbar" aria-label="Vista 3D en proceso"><div class="relleno"></div></div>
    </div>`;
  raiz.append(recuadro);
  // TODO: migrar a body.modo-montana (prompt 3). Hoy montanas3d.js ya pone body.modo-montana;
  // mantenemos raiz.con-montana hasta que el CSS cuelgue solo de body.modo-montana.
  raiz.classList.add('con-montana');

  // Lo de Jhoel: si devuelve { salir() }, su vista ocupa el recuadro
  let jhoel = null;
  try {
    const r = await crearMontanas3d(globo?.viewer ?? null, glaciar);
    if (r && typeof r.salir === 'function') jhoel = r;
  } catch (e) {
    console.info('APU: la montaña 3D todavía no está lista.', e?.message ?? e);
  }
  if (jhoel) {
    recuadro.classList.add('con-3d'); // sin texto ni barra: se ve la vista de Jhoel
    darInsignia('explorador'); // insignia "Explorador": la montaña en 3D se abrió de verdad
  }
  else if (globo?.viewer) globo.viewer.useDefaultRenderLoop = false; // el planeta está tapado: no se dibuja

  // ---------------------------------------------------------------
  // Panel de datos (mismos estilos que el panel del menú)
  // ---------------------------------------------------------------
  const panel = document.createElement('aside');
  panel.className = 'menu-panel hud mp-datos';
  panel.setAttribute('aria-label', 'Datos de NASA');
  panel.innerHTML = esMasa ? `
    <div class="mp-pestanas" role="tablist" aria-label="Variable">
      <button type="button" role="tab" data-v="masa" aria-selected="true">${MASA.pestana}</button>
    </div>
    <div>
      <h2><span class="barras" aria-hidden="true">//</span><span class="titulo-texto">${MASA.titulo}</span></h2>
      <p class="intro"></p>
    </div>
    <div class="linea" aria-hidden="true"></div>
    <div class="con-datos">
      <div class="tarjetas"></div>
      <figure class="grafico">
        <figcaption><span class="titulo-graf"></span> · <span class="rango"></span></figcaption>
        <svg role="img" viewBox="0 0 300 110"></svg>
        <span class="nota">Unidad: ${MASA.unidad}</span>
        <span class="nota nota-hueco"></span>
        <span class="nota fuente-graf"></span>
      </figure>
    </div>` : conDatos ? `
    <div class="mp-pestanas" role="tablist" aria-label="Variable">
      ${Object.entries(VARIABLES).map(([k, v]) => `<button type="button" role="tab" data-v="${k}" aria-selected="${k === 'nieve'}">${v.pestana}</button>`).join('')}
    </div>
    <div>
      <h2><span class="barras" aria-hidden="true">//</span><span class="titulo-texto"></span></h2>
      <p class="intro"></p>
    </div>
    <div class="linea" aria-hidden="true"></div>
    <div class="con-datos">
      <div class="comparar">
        <label for="mp-periodo">Comparar periodo
          <select id="mp-periodo">${PERIODOS.map((_, i) => `<option value="${i}"></option>`).join('')}</select>
        </label>
        <div class="cambio"><b class="cambio-valor">…</b><span class="cambio-etiqueta"></span></div>
      </div>
      <span class="nota nota-periodo" hidden></span>
      <div class="clima" role="group" aria-label="Nevada y lluvia: valor real de cada mes">
        <div class="clima-fila">
          <button type="button" data-clima="nieve" aria-pressed="false">❄ Nevada</button>
          <button type="button" data-clima="lluvia" aria-pressed="false">☂ Lluvia</button>
          <select class="clima-mes" aria-label="Mes del dato"></select>
        </div>
        <p class="clima-valor" aria-live="polite" hidden></p>
      </div>
      <div class="tarjetas"></div>
      <figure class="grafico">
        <figcaption><span class="titulo-graf"></span> · <span class="rango"></span></figcaption>
        <p class="dato-activo" hidden><b class="dato-anio"></b><span class="dato-valor"></span></p>
        <svg role="img" viewBox="0 0 300 110"></svg>
        <svg class="franjas" role="group" viewBox="0 0 300 22" aria-label="Un rectángulo por año: su color dice si estuvo sobre o bajo el promedio"></svg>
        <span class="nota nota-franjas"></span>
        <span class="nota fuente-graf"></span>
      </figure>
    </div>` : `
    <div>
      <h2><span class="barras" aria-hidden="true">//</span><span class="titulo-texto">${glaciar?.nombre ?? ''}</span></h2>
      <p class="intro">${glaciar?.pais ?? ''}</p>
    </div>
    <div class="linea" aria-hidden="true"></div>
    <p class="sin-datos">${SIN_DATOS}</p>`;
  raiz.append(panel);
  raiz.classList.add('con-datos-montana');

  // Máquina del tiempo debajo del panel
  const fechas = document.createElement('div');
  fechas.className = 'menu-fechas';
  fechas.setAttribute('role', 'group');
  fechas.setAttribute('aria-label', 'Máquina del tiempo: el valor de cada año');
  fechas.innerHTML = `
    <button type="button" class="reciente" aria-pressed="true">Más reciente</button>
    <button type="button" class="inicio" aria-label="Volver al primer año" title="Volver al primer año">⏮</button>
    <button type="button" class="play" aria-pressed="false" aria-label="Reproducir los años" title="Reproducir: 1 año por segundo">▶</button>
    <input type="range" class="anio" min="${ANIOS[0]}" max="${ANIOS[1]}" step="1" value="${ANIOS[0]}" aria-label="Año">
    <output class="anio-valor" aria-live="polite"></output>`;
  if (conDatos && !esMasa) { raiz.append(fechas); raiz.classList.add('con-fechas'); }


  const q = (s) => panel.querySelector(s);

  // ---------------------------------------------------------------
  // Datos (cordillera-real.json)
  // ---------------------------------------------------------------
  function pintarVariable() {
    const V = VARIABLES[estado.variable];
    q('.titulo-texto').textContent = V.titulo;
    q('.intro').textContent = delLugar(V.intro);
    panel.querySelectorAll('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === estado.variable)));
    if (!region) { q('.tarjetas').innerHTML = '<p class="nota">No se pudieron cargar los datos de NASA de este glaciar.</p>'; return; }
    const v = region.variables[estado.variable];
    const anios = v.anios, valores = v.anual, n = valores.length;
    const ultimo = anios[n - 1];
    const lluvia = estado.variable === 'lluvia';
    const real = v.veredicto === 'real';

    // Cambio entre periodos (el segundo periodo llega hasta el último año con datos)
    const promedio = (a, b) => { const s = anios.map((x, i) => (x >= a && x <= b ? valores[i] : null)).filter((x) => x !== null); return s.reduce((t, x) => t + x, 0) / s.length; };
    const periodo = (p) => [p[0], p[1], p[2], Math.min(p[3], ultimo)];
    const etiquetaPer = (p) => `${p[0]}–${String(p[1]).slice(2)} / ${p[2]}–${String(p[3]).slice(2)}`;
    [...q('#mp-periodo').options].forEach((o, i) => { o.textContent = etiquetaPer(periodo(PERIODOS[i])); });
    q('#mp-periodo').value = String(estado.periodo);
    const per = periodo(PERIODOS[estado.periodo]);
    const cambio = (promedio(per[2], per[3]) - promedio(per[0], per[1])) / promedio(per[0], per[1]) * 100;
    q('.cambio-valor').textContent = `${cambio < 0 ? '↓ −' : '↑ +'}${fmt(Math.abs(cambio), Math.abs(cambio) < 1 ? 1 : 0)} %`; // menos de 1 %: con un decimal (no "−0 %")
    q('.cambio-etiqueta').textContent = V.cambio;
    q('.cambio').classList.toggle('duda', !real); // sin tendencia real: amarillo, no rojo
    const falta = PERIODOS[estado.periodo][3];
    q('.nota-periodo').hidden = falta <= ultimo;
    q('.nota-periodo').textContent = `${falta} no entra porque aún no tiene todos sus meses`;

    // Tarjetas
    const iMin = valores.indexOf(Math.min(...valores));
    q('.tarjetas').innerHTML = [
      lluvia ? ['☂', `Lluvia ${ultimo}`, `${fmt(valores[n - 1], 0)} mm por año`, ''] : ['❄', `Índice de nieve ${ultimo}`, `${fmt(valores[n - 1], 2)} / 100`, ''],
      ['▲', lluvia ? 'Año con menos lluvia' : 'Año con menos nieve', String(anios[iMin]), ''],
      ['↘', 'Cambio por década', lluvia ? `${fmt(v.tendencia_por_decada, 1)} mm por año` : fmt(v.tendencia_por_decada, 2), ''],
      [real ? '✓' : '?', 'Tendencia', `${real ? 'Real' : 'Todavía no se sabe'} · p = ${fmt(v.p, 2)}`, real ? ' alerta' : ' duda']
    ].map(([ic, et, val, cl]) => `<div class="tarjeta${cl}"><span class="icono" aria-hidden="true">${ic}</span><span class="texto"><span>${et}</span><b>${val}</b></span></div>`).join('');

    // Gráfico: valores anuales + línea de tendencia (pendiente real por década) + año marcado
    const escala = esCordilleraReal() ? V.escala : null;
    const [min, max] = escala ?? [Math.min(...valores) * 0.95, Math.max(...valores) * 1.05];
    // Eje x por año (si falta un año, como 2020 en Groenlandia, queda su hueco)
    const X = (i) => 12 + (anios[i] - anios[0]) * (284 / Math.max(1, ultimo - anios[0]));
    const Y = (x) => 96 - (x - min) / (max - min) * 84;
    const linea = valores.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(x).toFixed(1)}`).join(' ');
    const pend = v.tendencia_por_decada / 10;
    const med = [...valores].sort((a, b) => a - b)[Math.floor(n / 2)];
    const mitad = (n - 1) / 2;
    q('.titulo-graf').textContent = V.grafico;
    q('.fuente-graf').textContent = delLugar(V.fuente);
    q('.rango').textContent = `${anios[0]}–${ultimo}`;
    const iMarca = estado.anioActual === null ? -1 : anios.indexOf(estado.anioActual);
    const svg = q('.grafico svg');
    const que = lluvia ? 'Lluvia por año' : 'Índice de nieve';
    svg.setAttribute('aria-label', `${que} de ${esCordilleraReal() ? 'la Cordillera Real' : region.nombre} de ${anios[0]} a ${ultimo}: empieza en ${fmt(valores[0], V.decimales)} y termina en ${fmt(valores[n - 1], V.decimales)}, ${real ? 'con tendencia a la baja' : 'sin una tendencia segura todavía'}.`
      + (iMarca >= 0 ? ` Año marcado: ${estado.anioActual}, ${fmt(valores[iMarca], V.decimales)}${V.unidad}.` : ''));
    const marca = () => {
      if (iMarca < 0) return '';
      const x = X(iMarca), y = Y(valores[iMarca]);
      const ancla = x > 210 ? 'end' : x < 90 ? 'start' : 'middle';
      return `<line x1="${x.toFixed(1)}" y1="10" x2="${x.toFixed(1)}" y2="96" stroke="#F2F4F8" stroke-opacity=".55" stroke-dasharray="2 2"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#F2F4F8" stroke="#0B192E" stroke-width="1.5"/>
        <text x="${x.toFixed(1)}" y="8" fill="#F2F4F8" font-size="9.5" font-weight="700" text-anchor="${ancla}" font-family="Inter, sans-serif">${anios[iMarca]} · ${fmt(valores[iMarca], V.decimales)}</text>`;
    };
    svg.innerHTML = `
      <defs><linearGradient id="mpArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V.area}" stop-opacity=".55"/><stop offset="1" stop-color="${V.area}" stop-opacity="0"/></linearGradient></defs>
      <line x1="12" y1="96" x2="296" y2="96" stroke="rgba(242,244,248,.4)"/>
      <line x1="12" y1="10" x2="12" y2="96" stroke="rgba(242,244,248,.4)"/>
      <path d="${linea} L296 96 L12 96 Z" fill="url(#mpArea)"/>
      <path class="linea-graf" d="${linea}" fill="none" stroke="${V.color}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M12 ${Y(med - pend * mitad).toFixed(1)} L296 ${Y(med + pend * mitad).toFixed(1)}" fill="none" stroke="#F9C80E" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round"/>
      <circle cx="12" cy="${Y(valores[0]).toFixed(1)}" r="3.4" fill="${V.color}"/>
      <circle cx="296" cy="${Y(valores[n - 1]).toFixed(1)}" r="4.6" fill="#0B192E" stroke="#D12021" stroke-width="2.4"/>
      <text x="16" y="${(Y(valores[0]) - 5).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" font-family="Inter, sans-serif">${fmt(valores[0], V.decimales)}</text>
      <text x="292" y="${(Y(valores[n - 1]) - 9).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" text-anchor="end" font-family="Inter, sans-serif">${fmt(valores[n - 1], V.decimales)}</text>
      <text x="12" y="108" fill="#A9B4CC" font-size="9" font-family="Inter, sans-serif">${anios[0]}</text>
      <text x="296" y="108" fill="#A9B4CC" font-size="9" text-anchor="end" font-family="Inter, sans-serif">${ultimo}</text>
      ${marca()}`;
    pintarFranjas(anios, valores, X, V, lluvia);
    pintarAnio();
  }

  // Franjas por año (estilo "warming stripes"): el color dice cuánto se separó cada año del promedio de
  // todos (diverge en gris). Nieve: azul más, rojo menos. Lluvia: verde azulado más, marrón menos.
  // Mismo eje x que el gráfico de arriba; el año actual va con borde blanco. Tocar una elige ese año.
  function pintarFranjas(anios, valores, X, V, lluvia) {
    const svg = q('.franjas');
    if (!svg) return;
    const n = valores.length;
    const prom = valores.reduce((t, x) => t + x, 0) / n;
    const lejos = Math.max(...valores.map((x) => Math.abs(x - prom))) || 1;
    const [mas, menos] = lluvia ? [[31, 165, 160], [168, 116, 58]] : [[47, 116, 255], [229, 57, 53]];
    const gris = [138, 147, 166];
    const mezcla = (a, b, t) => `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * t)).join(',')})`;
    const ancho = 284 / Math.max(1, anios[n - 1] - anios[0]);
    svg.innerHTML = anios.map((a, i) => {
      const d = valores[i] - prom;
      const color = mezcla(gris, d >= 0 ? mas : menos, Math.min(1, Math.abs(d) / lejos));
      const x = X(i) - ancho / 2 + 0.75;
      const actual = a === estado.anioActual;
      const texto = `${a}: ${fmt(valores[i], V.decimales)}${V.unidad}, ${d >= 0 ? 'sobre' : 'bajo'} el promedio (${fmt(prom, V.decimales)}${V.unidad})`;
      return `<rect data-anio="${a}" role="button" tabindex="0" aria-label="${texto}" x="${x.toFixed(2)}" y="2" width="${(ancho - 1.5).toFixed(2)}" height="18" rx="2" fill="${color}"${actual ? ' stroke="#F2F4F8" stroke-width="2"' : ''}><title>${texto}</title></rect>`;
    }).join('');
    q('.nota-franjas').textContent = lluvia
      ? 'Cada franja es un año · verde azulado: más lluvia que el promedio · marrón: menos'
      : 'Cada franja es un año · azul: más nieve que el promedio · rojo: menos';
  }

  // ---------------------------------------------------------------
  // Masa de hielo (GRACE): valores mensuales, con el hueco entre GRACE y GRACE-FO
  // ---------------------------------------------------------------
  function pintarMasa() {
    const v = region.variables.masa;
    const t = v.meses.map(numMes), y = v.valores, n = y.length;
    const real = v.veredicto === 'real';
    const porAnio = v.tendencia_por_decada / 10;
    const oficial = v.tendencia_oficial_nasa;
    q('.intro').textContent = `Cuánto hielo ganó o perdió ${region.nombre} cada mes desde ${nombreMes(v.meses[0]).toLowerCase()}, pesado por los satélites GRACE y GRACE-FO de NASA.`;

    // Tarjetas: la grande (tendencia por año + dato oficial de NASA) y el veredicto con p
    const textoP = v.p < 0.01 ? 'p < 0,01' : `p = ${fmt(v.p, 2)}`;
    q('.tarjetas').innerHTML = `
      <div class="tarjeta grande${real ? ' alerta' : ' duda'}"><span class="icono" aria-hidden="true">${porAnio < 0 ? '↘' : '↗'}</span><span class="texto">
        <span>Cambio del hielo</span><b>${conSigno(porAnio)} Gt por año</b>
        ${oficial ? `<span class="oficial">Dato oficial de NASA: ${conSigno(oficial.valor)} ± ${fmt(oficial.error, 0)} Gt/año</span>` : ''}
      </span></div>
      <div class="tarjeta${real ? ' alerta' : ' duda'}"><span class="icono" aria-hidden="true">${real ? '✓' : '?'}</span><span class="texto"><span>Tendencia</span><b>${real ? 'Real' : 'Todavía no se sabe'} · ${textoP}</b></span></div>`;

    // Gráfico mensual: la línea se corta donde faltan más de HUECO_MESES meses seguidos
    const min = Math.min(...y), max = Math.max(...y), pad = (max - min) * 0.06 || 1;
    const X = (tt) => 12 + (tt - t[0]) * (284 / Math.max(1, t[n - 1] - t[0]));
    const Y = (x) => 96 - (x - (min - pad)) / (max - min + 2 * pad) * 84;
    const tramos = [[0]];
    const huecos = [];
    for (let i = 1; i < n; i++) {
      if (t[i] - t[i - 1] > HUECO_MESES) { huecos.push([i - 1, i]); tramos.push([i]); } else tramos[tramos.length - 1].push(i);
    }
    const camino = (ix) => ix.map((i, k) => `${k ? 'L' : 'M'}${X(t[i]).toFixed(1)} ${Y(y[i]).toFixed(1)}`).join(' ');
    const areas = tramos.map((ix) => `<path d="${camino(ix)} L${X(t[ix[ix.length - 1]]).toFixed(1)} 96 L${X(t[ix[0]]).toFixed(1)} 96 Z" fill="url(#mpAreaMasa)"/>`).join('');
    const lineas = tramos.map((ix) => `<path class="linea-graf" d="${camino(ix)}" fill="none" stroke="${MASA.color}" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
    const marcasHueco = huecos.map(([a, b]) => {
      const x1 = X(t[a]) + 1, x2 = X(t[b]) - 1;
      return `<rect x="${x1.toFixed(1)}" y="10" width="${Math.max(1, x2 - x1).toFixed(1)}" height="86" fill="rgba(242,244,248,.07)" stroke="rgba(242,244,248,.45)" stroke-dasharray="2 2"/>
        <text x="${((x1 + x2) / 2).toFixed(1)}" y="20" fill="#D7DEEA" font-size="8" text-anchor="middle" font-family="Inter, sans-serif">sin datos</text>`;
    }).join('');
    // Tendencia: pendiente del JSON (por mes), pasando por la mediana de los datos
    const pend = v.tendencia_por_decada / 120;
    const tMed = [...t].sort((a, b) => a - b)[Math.floor(n / 2)];
    const yMed = [...y].sort((a, b) => a - b)[Math.floor(n / 2)];
    const yT = (tt) => Y(yMed + pend * (tt - tMed));
    const desdeHueco = huecos.map(([a, b]) => `${nombreMes(mesDe(t[a] + 1)).toLowerCase()} y ${nombreMes(mesDe(t[b] - 1)).toLowerCase()}`);

    q('.titulo-graf').textContent = MASA.grafico;
    q('.rango').textContent = `${v.meses[0].slice(0, 4)}–${v.meses[n - 1].slice(0, 4)}`;
    q('.nota-hueco').textContent = v.nota ?? '';
    q('.fuente-graf').textContent = `Línea amarilla: tendencia · Fuente: ${v.fuente}`;
    if (v.cita) q('.fuente-graf').title = v.cita;
    const svg = q('.grafico svg');
    svg.setAttribute('aria-label', `Masa de hielo de ${region.nombre}, cada mes de ${nombreMes(v.meses[0]).toLowerCase()} a ${nombreMes(v.meses[n - 1]).toLowerCase()}: empieza en ${conSigno(y[0])} y termina en ${conSigno(y[n - 1])} gigatoneladas, ${real ? 'con tendencia a la baja' : 'sin una tendencia segura todavía'}.`
      + (desdeHueco.length ? ` Sin datos entre ${desdeHueco.join(', y entre ')}.` : ''));
    svg.innerHTML = `
      <defs><linearGradient id="mpAreaMasa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MASA.area}" stop-opacity=".45"/><stop offset="1" stop-color="${MASA.area}" stop-opacity="0"/></linearGradient></defs>
      <line x1="12" y1="96" x2="296" y2="96" stroke="rgba(242,244,248,.4)"/>
      <line x1="12" y1="10" x2="12" y2="96" stroke="rgba(242,244,248,.4)"/>
      ${areas}${marcasHueco}${lineas}
      <path d="M12 ${yT(t[0]).toFixed(1)} L296 ${yT(t[n - 1]).toFixed(1)}" fill="none" stroke="#F9C80E" stroke-width="2.2" stroke-dasharray="5 4" stroke-linecap="round"/>
      <circle cx="296" cy="${Y(y[n - 1]).toFixed(1)}" r="4.2" fill="#0B192E" stroke="#D12021" stroke-width="2.2"/>
      <text x="16" y="${(Y(y[0]) - 5).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" font-family="Inter, sans-serif">${conSigno(y[0])} Gt</text>
      <text x="292" y="${(Y(y[n - 1]) - 9).toFixed(1)}" fill="#F2F4F8" font-size="10" font-weight="700" text-anchor="end" font-family="Inter, sans-serif">${conSigno(y[n - 1])} Gt</text>
      <text x="12" y="108" fill="#A9B4CC" font-size="9" font-family="Inter, sans-serif">${v.meses[0].slice(0, 4)}</text>
      <text x="296" y="108" fill="#A9B4CC" font-size="9" text-anchor="end" font-family="Inter, sans-serif">${v.meses[n - 1].slice(0, 4)}</text>`;
  }

  // ---------------------------------------------------------------
  // Año actual compartido: gráfico y franjas del panel + nieve de la montaña
  // ---------------------------------------------------------------
  const deslizador = fechas.querySelector('.anio');
  const botonPlay = fechas.querySelector('.play');

  const datosVar = () => region?.variables?.[estado.variable] ?? null;
  const aniosVar = () => datosVar()?.anios ?? [];
  let reloj = 0;
  let cambio = null;      // servicios/cambio-nieve.js: mapa de cambio de la nieve (se calcula al abrir)
  let modoElegido = false; // el usuario ya eligió la capa de nieve: no se la cambiamos
  let ultimaNieve = null; // la fecha MODIS que muestra la montaña (para dejarla si un año no tiene imagen limpia)
  let pedidoNieve = 0;

  // El deslizador va del primer al último año con datos de la variable elegida
  function ajustarDeslizador() {
    const a = aniosVar();
    if (!a.length) return;
    deslizador.min = String(a[0]);
    deslizador.max = String(a[a.length - 1]);
  }

  function pintarAnio() {
    fechas.querySelector('.reciente').setAttribute('aria-pressed', String(estado.anioActual === null));
    deslizador.classList.toggle('activo', estado.anioActual !== null);
    const salida = fechas.querySelector('.anio-valor');
    const dato = panel.querySelector('.dato-activo');
    if (estado.anioActual === null || !region) { salida.textContent = 'Último año'; if (dato) dato.hidden = true; return; }
    const v = datosVar();
    const i = v.anios.indexOf(estado.anioActual);
    const V = VARIABLES[estado.variable];
    salida.textContent = i < 0 ? `${estado.anioActual}: sin dato` : `${estado.anioActual} · ${fmt(v.anual[i], V.decimales)}${V.unidad}`;
    // El dato activo, en grande, en la tarjeta del gráfico
    if (dato) {
      dato.hidden = false;
      dato.querySelector('.dato-anio').textContent = String(estado.anioActual);
      dato.querySelector('.dato-valor').textContent = i < 0 ? 'sin dato' : `${fmt(v.anual[i], V.decimales)}${V.unidad || (estado.variable === 'nieve' ? ' / 100' : '')}`;
    }
  }

  // Nieve de la montaña: el día despejado de MODIS Terra de ese año (servicios/nieve-anual.js).
  // La fecha usada la escribe la leyenda "Cobertura de nieve"; aquí solo los avisos (buscando, sin imagen)
  const avisoNieve = (t) => jhoel?.avisoNieve?.(t);
  async function ponerNieve(anio) {
    if (!jhoel) return;
    const pedido = ++pedidoNieve;
    if (anio === null) { ultimaNieve = null; avisoNieve(null); jhoel.ponerCambio?.(null); jhoel.verAnio?.(null); return; }
    if (!modoElegido && jhoel.modo !== 'cambio') jhoel.modoNieve?.('cambio'); // al elegir un año: "Cambio" (si el usuario no eligió otra capa)
    avisoNieve(`Buscando la imagen de ${anio}…`);
    const r = await fechaNieveDeAnio(glaciar, anio);
    if (pedido !== pedidoNieve || !vivo) return; // ya se pidió otro año
    if (r.fecha) {
      ultimaNieve = r.fecha;
      jhoel.verFechaNieve?.(r.fecha, { encender: true });
      avisoNieve(null);
      ponerCambio(anio);
      return;
    }
    jhoel.ponerCambio?.(null);
    const motivo = r.estado === 'error' ? `NASA no respondió para ${anio}` : `Sin imagen despejada de ${anio}`;
    avisoNieve(`${motivo}` + (ultimaNieve ? `; se ve la del ${fechaBonita(ultimaNieve)}.` : '; no se muestra nieve.'));
  }

  // Mapa de cambio de ese año (cuando el promedio está listo; mientras, la capa de cobertura)
  async function ponerCambio(anio) {
    if (!cambio) return;
    const pedido = pedidoNieve;
    const r = await cambio.imagen(anio);
    if (pedido !== pedidoNieve || !vivo || estado.anioActual !== anio) return;
    jhoel.ponerCambio?.(r);
  }

  // Cambia el año actual: lo usan el gráfico, las franjas, el deslizador y la reproducción
  function ponerAnio(anio) {
    estado.anioActual = anio;
    if (anio !== null) deslizador.value = String(anio);
    pintarVariable();
    ponerNieve(anio);
  }

  function parar() {
    clearInterval(reloj);
    reloj = 0;
    panel.querySelector('.grafico')?.classList.remove('en-vivo');
    botonPlay.setAttribute('aria-pressed', 'false');
    botonPlay.textContent = '▶';
    botonPlay.setAttribute('aria-label', 'Reproducir los años');
  }
  // Al terminar, el Jukumari dice la tendencia real del JSON (cambio por década y p)
  function decirTendencia() {
    const v = datosVar();
    if (!v) return;
    const V = VARIABLES[estado.variable];
    const lugar = esCordilleraReal() ? 'la Cordillera Real' : region.nombre;
    const lluvia = estado.variable === 'lluvia';
    const cambio = `${conSigno(v.tendencia_por_decada, lluvia ? 1 : 2)}${lluvia ? ' mm por año' : ''}`;
    const textoP = v.p < 0.01 ? 'p < 0,01' : `p = ${fmt(v.p, 2)}`;
    const sentido = v.tendencia_por_decada < 0 ? 'bajada' : 'subida';
    const veredicto = v.veredicto === 'real'
      ? `Como p es menor que 0,05, la ${sentido} es real.`
      : 'Como p no es menor que 0,05, todavía no se puede decir que sea una tendencia real.';
    window.dispatchEvent(new CustomEvent('apu:jukumari', { detail: {
      texto: `${V.cambio} de ${lugar}, ${v.anios[0]}–${v.anios[v.anios.length - 1]}: cambia ${cambio} por década (${textoP}). ${veredicto}`,
      abrir: true
    } }));
  }
  function reproducir() {
    const a = aniosVar();
    if (!a.length) return;
    const ultimo = a[a.length - 1];
    let anio = estado.anioActual === null || estado.anioActual >= ultimo ? a[0] : estado.anioActual;
    ponerAnio(anio);
    botonPlay.setAttribute('aria-pressed', 'true');
    botonPlay.textContent = '⏸';
    botonPlay.setAttribute('aria-label', 'Pausar');
    // La tarjeta del gráfico se ilumina y se pone a la vista (el panel tiene scroll)
    const tarjetaGraf = panel.querySelector('.grafico');
    tarjetaGraf?.classList.add('en-vivo');
    tarjetaGraf?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    reloj = setInterval(() => {
      anio += 1;
      if (anio > ultimo) { parar(); decirTendencia(); return; }
      ponerAnio(anio);
    }, PASO_PLAY);
  }
  botonPlay.addEventListener('click', () => { if (reloj) parar(); else reproducir(); });
  fechas.querySelector('.inicio').addEventListener('click', () => {
    const a = aniosVar();
    if (!a.length) return;
    const sonando = Boolean(reloj);
    parar();
    ponerAnio(a[0]);
    if (sonando) reproducir();
  });
  deslizador.addEventListener('input', () => { parar(); ponerAnio(Number(deslizador.value)); });
  fechas.querySelector('.reciente').addEventListener('click', () => { parar(); ponerAnio(null); });

  // Tocar el gráfico del panel: el año más cercano a donde se tocó
  function anioDelGrafico(e) {
    const svg = e.currentTarget;
    const a = aniosVar();
    if (!a.length) return null;
    const caja = svg.getBoundingClientRect();
    const x = ((e.clientX - caja.left) / caja.width) * 300; // viewBox de 300 de ancho
    const ultimo = a[a.length - 1];
    const anio = Math.round(a[0] + ((x - 12) / 284) * Math.max(1, ultimo - a[0]));
    return Math.min(ultimo, Math.max(a[0], anio));
  }
  limpiar.push(() => { parar(); pedidoNieve++; cambio?.destruir(); cambio = null; });

  // ---------------------------------------------------------------
  // Nevada / Lluvia: solo el valor real del mes (el efecto se dibujará con la vista 3D)
  // ---------------------------------------------------------------
  function llenarMeses(tipo) {
    const selMes = q('.clima-mes');
    const v = region.variables[tipo];
    const anterior = selMes.value;
    const porAnio = new Map();
    v.meses.forEach((m) => { const a = m.slice(0, 4); if (!porAnio.has(a)) porAnio.set(a, []); porAnio.get(a).push(m); });
    selMes.innerHTML = [...porAnio].reverse().map(([a, ms]) => `<optgroup label="${a}">${ms.slice().reverse().map((m) => `<option value="${m}">${nombreMes(m)}</option>`).join('')}</optgroup>`).join('');
    selMes.value = v.meses.includes(anterior) ? anterior : v.meses[v.meses.length - 1];
  }
  function pintarClima() {
    panel.querySelectorAll('.clima [data-clima]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.clima === estado.clima)));
    const valor = q('.clima-valor');
    valor.hidden = !estado.clima;
    if (!estado.clima) return;
    if (!region) { valor.textContent = 'No se pudieron cargar los datos.'; return; }
    const v = region.variables[estado.clima];
    const i = v.meses.indexOf(q('.clima-mes').value);
    if (i < 0) { valor.textContent = 'Ese mes no tiene dato.'; return; }
    const x = v.valores[i];
    valor.textContent = `${nombreMes(v.meses[i])} · ${estado.clima === 'lluvia' ? `${Math.round(x)} mm` : `índice de nieve ${fmt(x, 2)}`}`;
  }

  function aplicarRevision() {
    const oculta = lluviaEnRevision();
    const pestanaLluvia = panel.querySelector('[role="tab"][data-v="lluvia"]');
    const climaLluvia = panel.querySelector('.clima [data-clima="lluvia"]');
    if (pestanaLluvia) pestanaLluvia.hidden = oculta;
    if (climaLluvia) climaLluvia.hidden = oculta;
    if (oculta && estado.variable === 'lluvia') { estado.variable = 'nieve'; alCambiarVariable?.('nieve'); }
    if (oculta && estado.clima === 'lluvia') estado.clima = null;
  }

  if (esMasa) {
    pintarMasa();
  } else if (conDatos) {
    aplicarRevision();
    panel.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener('click', () => {
      if (estado.variable === b.dataset.v) return;
      parar();
      estado.variable = b.dataset.v;
      ajustarDeslizador();
      // Si el año actual no está en la otra variable (lluvia hasta 2024), se queda en su último año
      const a = aniosVar();
      if (estado.anioActual !== null && a.length && !a.includes(estado.anioActual)) estado.anioActual = a[a.length - 1];
      ponerAnio(estado.anioActual);
      alCambiarVariable?.(estado.variable);
    }));
    // Gráfico del panel: tocar un año lo pone como año actual
    const svgGraf = q('.grafico svg');
    svgGraf.classList.add('elegible');
    svgGraf.addEventListener('click', (e) => { const anio = anioDelGrafico(e); if (anio !== null) { parar(); ponerAnio(anio); } });
    // Franjas: tocar una elige ese año
    q('.franjas').addEventListener('click', (e) => {
      const f = e.target.closest('[data-anio]');
      if (f) { parar(); ponerAnio(Number(f.dataset.anio)); }
    });
    q('.franjas').addEventListener('keydown', (e) => {
      const f = e.target.closest('[data-anio]');
      if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); parar(); ponerAnio(Number(f.dataset.anio)); }
    });
    if (jhoel && region?.variables?.nieve?.anios) {
      const aniosNieve = region.variables.nieve.anios;
      // Fechas despejadas de la nieve de cada año, por adelantado (la reproducción no espera a NASA)
      precargarAnios(glaciar, aniosNieve);
      // Mapa de cambio: lee los 25 años de MODIS y calcula el promedio de cada punto (unos segundos)
      jhoel.alCambiarModo = (m) => { modoElegido = true; if (m === 'cambio' && cambio && estado.anioActual !== null) ponerCambio(estado.anioActual); };
      cambio = crearCambioNieve(glaciar, aniosNieve, {
        alAvanzar: (h, t) => { if (vivo && jhoel.modo === 'cambio' && h < t) avisoNieve(`Calculando el promedio de cada punto… ${h}/${t} años`); }
      });
      cambio.listo.then((ok) => {
        if (!vivo) return;
        if (!ok) { if (jhoel.modo === 'cambio') avisoNieve('No se pudo calcular el cambio (NASA no respondió).'); return; }
        if (jhoel.modo === 'cambio') avisoNieve(null);
        if (estado.anioActual !== null) ponerCambio(estado.anioActual);
      });
    }
    q('#mp-periodo').addEventListener('change', (e) => { estado.periodo = Number(e.target.value); pintarVariable(); });
    panel.querySelectorAll('.clima [data-clima]').forEach((b) => b.addEventListener('click', () => {
      estado.clima = estado.clima === b.dataset.clima ? null : b.dataset.clima;
      if (estado.clima && region) llenarMeses(estado.clima);
      pintarClima();
    }));
    q('.clima-mes').addEventListener('change', pintarClima);
    if (region) llenarMeses('nieve');
    ajustarDeslizador();
    pintarVariable();
  }

  return {
    async cerrar() {
      vivo = false;
      limpiar.forEach((fn) => fn());
      // Orden crítico para que .menu-planeta transicione ANTES de que el viewer
      // haga el resize dentro de jhoel.salir():
      //   a) quitar clases de raíz (destapa la pestaña y restaura la geometría del planeta)
      //   b) esperar a que la vista de montaña restaure el viewer y la cámara
      //   c) desmontar HTML del puente
      raiz.classList.remove('con-montana', 'con-datos-montana', 'con-fechas');
      if (globo?.viewer && !globo.viewer.isDestroyed()) {
        globo.viewer.useDefaultRenderLoop = true;
      }
      try { await jhoel?.salir(); } catch (e) { console.error(e); }
      recuadro.remove();
      panel.remove();
      fechas.remove();
      alCambiarVariable?.('nieve');
    }
  };
}
