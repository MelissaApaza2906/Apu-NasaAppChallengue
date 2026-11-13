// Lo visual de cada lección (docs/mockups/lecciones/leccion-N-*.png): título con la palabra clave,
// "QUÉ SIGNIFICA", "CÓMO SE USA", lo que dice y piensa el Jukumari, el ícono de cada tarjeta y el dibujo propio.
// Los textos de la lección (teoría, tarjetas, trivia…) siguen en contenido/lecciones.js.
// Regla: los dibujos son ILUSTRACIÓN (llevan esa etiqueta) o salen de datos reales (d = datos de la lección,
// ver index.js). Nunca se inventan cifras: si un dato falta, se muestra "—".
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Una línea quebrada SVG a partir de valores (se ajusta a la caja ancho × alto)
export function trazo(vals, ancho, alto, margen = 6) {
  const lim = vals.filter((v) => Number.isFinite(v));
  if (lim.length < 2) return '';
  const min = Math.min(...lim), max = Math.max(...lim), r = max - min || 1;
  return vals.map((v, i) => {
    const x = margen + (i / (vals.length - 1)) * (ancho - 2 * margen);
    const y = margen + (1 - (v - min) / r) * (alto - 2 * margen);
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

// Números pseudoaleatorios con semilla (los dibujos de ilustración salen siempre iguales)
function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const etiquetaIlus = '<span class="lec-ilus">ilustración</span>';

// ── Dibujos por lección ──────────────────────────────────────────────
function v1() {
  const r = azar(7);
  const baja = Array.from({ length: 25 }, (_, i) => 80 - i * 2.2 + (r() - 0.5) * 18);
  const ruido = Array.from({ length: 22 }, () => 50 + (r() - 0.5) * 40);
  const ciclo = Array.from({ length: 49 }, (_, i) => 50 + 40 * Math.sin((i / 48) * Math.PI * 10));
  const W = 400, H = 160;
  const area = trazo(baja, W, H, 8);
  return `
    <div class="lec-graf3">
      <article class="lec-tarjeta lec-graf-grande">
        <header><b>📉 Baja poco a poco</b><span class="lec-chip rojo">TENDENCIA</span></header>
        <p>Sube y baja, pero el rumbo general va hacia abajo.</p>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="lecArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--dato-lluvia)" stop-opacity=".45"/><stop offset="1" stop-color="var(--dato-lluvia)" stop-opacity="0"/></linearGradient></defs>
          <path d="${area} L${W - 8} ${H} L8 ${H} Z" fill="url(#lecArea)"/>
          <path d="${area}" fill="none" stroke="var(--dato-lluvia)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
          <path d="M8 ${H * 0.12} L${W - 8} ${H * 0.86}" stroke="var(--nieve)" stroke-width="2" stroke-dasharray="6 6" vector-effect="non-scaling-stroke"/>
        </svg>
        <footer><span>antes</span><span>después</span></footer>
      </article>
      <article class="lec-tarjeta">
        <header><b>🎲 Pura suerte</b><span class="lec-chip">RUIDO</span></header>
        <p>Sube y baja sin rumbo.</p>
        <svg viewBox="0 0 260 70" preserveAspectRatio="none" aria-hidden="true"><path d="${trazo(ruido, 260, 70)}" fill="none" stroke="var(--nieve-sombra)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
      </article>
      <article class="lec-tarjeta">
        <header><b>🔁 Se repite</b><span class="lec-chip amarillo">ESTACIONES</span></header>
        <p>Lluvias y época seca, cada año.</p>
        <svg viewBox="0 0 260 70" preserveAspectRatio="none" aria-hidden="true"><path d="${trazo(ciclo, 260, 70)}" fill="none" stroke="var(--dato-tendencia)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>
      </article>
    </div>${etiquetaIlus}`;
}

function v2(l) {
  // Los recortes salen de las tarjetas de la teoría, agrupados por su caja
  const cajas = [
    { t: 'DATO', c: 'verde', k: 'Dato' },
    { t: 'HAY QUE ACLARAR', c: 'amarillo', k: 'Hay que aclarar' },
    { t: 'SUPOSICIÓN', c: 'rosa', k: 'Suposición' }
  ];
  return `
    <div class="lec-cajas">
      ${cajas.map((c) => `
        <article class="lec-tarjeta lec-caja ${c.c}">
          <span class="lec-chip ${c.c}">${c.t}</span>
          ${l.teoria.tarjetas.filter((t) => t.titulo === c.k).map((t, i) => `<p class="lec-recorte" style="--giro:${i % 2 ? '.6deg' : '-.8deg'}">${esc(t.texto)}</p>`).join('')}
        </article>`).join('')}
    </div>`;
}

function v3(l) {
  const colores = ['verde', 'azul', 'rosa'];
  return `
    <div class="lec-cajas">
      ${l.teoria.tarjetas.map((t, i) => `
        <article class="lec-tarjeta lec-satelite ${colores[i]}">
          <span class="lec-icono-redondo" aria-hidden="true">${t.icono}</span>
          <h3>${esc(t.titulo.split('·').pop().trim())}</h3>
          <p>${esc(t.texto)}</p>
          ${t.etiqueta ? `<span class="lec-chip ${colores[i]}">${esc(t.etiqueta.toUpperCase())}</span>` : ''}
        </article>`).join('')}
    </div>`;
}

function v4() {
  return `
    <div class="lec-dos">
      <article class="lec-tarjeta lec-mapa">
        <svg viewBox="0 0 400 240" aria-hidden="true">
          <rect width="400" height="240" rx="10" fill="#4A4636"/>
          <path d="M0 240 L70 150 L120 190 L190 70 L250 150 L300 80 L360 170 L400 130 L400 240 Z" fill="#7A6A55"/>
          <ellipse cx="65" cy="175" rx="55" ry="30" fill="#3E6E8E" opacity=".75"/>
          <path d="M175 95 L190 70 L205 95 Z M290 100 L300 80 L312 100 Z" fill="#F2F4F8"/>
          <path d="M235 75 L262 50 L288 75 Z M170 110 L190 88 L212 110 Z" fill="#F2F4F8" stroke="var(--dato-lluvia)" stroke-width="3"/>
          <rect x="18" y="14" width="364" height="210" fill="none" stroke="#F2F4F8" stroke-width="2.5" stroke-dasharray="10 7"/>
          <rect x="160" y="42" width="145" height="100" fill="none" stroke="var(--dato-tendencia)" stroke-width="2.5"/>
          <text x="26" y="34" fill="#F2F4F8" font-size="12" font-weight="700">GRANDE</text>
          <text x="166" y="60" fill="var(--dato-tendencia)" font-size="11" font-weight="700">MEDIO</text>
          <text x="210" y="128" fill="var(--dato-nieve)" font-size="10" font-weight="700">SOLO GLACIARES</text>
        </svg>
      </article>
      <article class="lec-tarjeta lec-barras-cual">
        <h4 class="lec-ceja">¿CUÁNTO SE NOTA EL CAMBIO?</h4>
        ${[['Grande', 'poco', 22, 'nieve'], ['Medio', 'más', 55, 'amarillo'], ['Solo glaciares', 'mucho', 90, 'azul']].map(([n, q, w, c]) => `
          <div class="lec-barra-cual ${c}"><span>${n}</span><span>${q}</span><i style="--w:${w}%"></i></div>`).join('')}
        <p class="lec-nota">La roca y los lagos no cambian y “aguan” la señal.</p>
      </article>
    </div>${etiquetaIlus}`;
}

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const LLUVIAS = new Set([0, 1, 2, 3, 10, 11]); // nov–abr: época de lluvias en el Altiplano
function v5(l, d) {
  // Barras REALES: % de nieve promedio de cada mes (MODIS, datos de la región); sin datos, barras vacías y "—"
  const m = d.mensual;
  const max = m ? Math.max(...m.filter(Number.isFinite)) : 1;
  return `
    <article class="lec-tarjeta lec-meses">
      <header><h4 class="lec-ceja">NIEVE DURANTE EL AÑO</h4>
        <span class="lec-leyenda"><i class="azul"></i>Lluvias <i class="amarillo"></i>Época seca <i class="ventana"></i><em>Nuestra ventana</em></span></header>
      <div class="lec-meses-barras" role="group" aria-label="Nieve promedio de cada mes">
        ${MESES.map((n, i) => {
          const v = m?.[i];
          const h = Number.isFinite(v) ? Math.max(4, (v / max) * 100) : 0;
          return `<button type="button" class="lec-mes ${LLUVIAS.has(i) ? 'azul' : 'amarillo'} ${i === 7 || i === 8 ? 'ventana' : ''}" data-mes="${i}"
            aria-label="${NOMBRES_MES[i]}: ${Number.isFinite(v) ? v.toFixed(1).replace('.', ',') : '—'}"><i style="height:${h}%"></i><span>${n}</span></button>`;
        }).join('')}
      </div>
      <p class="lec-nota" data-mes-valor>${m ? 'Toca un mes para ver su valor.' : 'Datos de nieve: —'}</p>
    </article>
    <span class="lec-ilus">${m ? `datos reales · ${esc(d.fuente)} · ${esc(d.desde)}–${esc(d.hasta)}` : 'ilustración'}</span>`;
}
export function alTocarMes(raiz, d) {
  raiz.querySelectorAll('.lec-mes').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.mes), v = d.mensual?.[i];
    raiz.querySelectorAll('.lec-mes').forEach((x) => x.classList.toggle('elegido', x === b));
    const p = raiz.querySelector('[data-mes-valor]');
    if (p) p.textContent = `${NOMBRES_MES[i][0].toUpperCase() + NOMBRES_MES[i].slice(1)}: ${Number.isFinite(v) ? v.toFixed(1).replace('.', ',') : '—'} (${d.unidad || 'índice de nieve'}, promedio ${d.desde}–${d.hasta})`;
  }));
}

function v6() {
  const r = azar(11);
  const celdas = Array.from({ length: 40 }, () => { const x = r(); return x < 0.45 ? 'nube' : x < 0.88 ? 'nieve' : 'roca'; });
  return `
    <div class="lec-dos">
      <article class="lec-tarjeta">
        <h4 class="lec-ceja">40 DÍAS DE AGOSTO</h4>
        <div class="lec-dias" aria-hidden="true">${celdas.map((c) => `<i class="${c}">${c === 'nube' ? '×' : ''}</i>`).join('')}</div>
        <p class="lec-leyenda"><i class="azul"></i>Nieve <i class="cafe"></i>Sin nieve <i class="gris"></i>Nube × Descartado</p>
      </article>
      <article class="lec-tarjeta">
        <h4 class="lec-ceja">¿QUÉ TAN BLANCO ES NIEVE?</h4>
        <div class="lec-umbrales" role="radiogroup" aria-label="Umbral">
          ${[10, 30, 40, 60, 90].map((u) => `<button type="button" role="radio" aria-checked="${u === 40}" class="lec-umbral ${u === 40 ? 'elegido' : ''}" data-u="${u}">
            <i style="--b:${u}%"></i><span>${u}</span></button>`).join('')}
        </div>
        <p class="lec-nota" data-umbral-texto>Tu <b class="rojo">umbral</b>: desde 40 cuenta como nieve. Si lo subes, cuentan menos cuadritos.</p>
      </article>
    </div>${etiquetaIlus}`;
}
export function alTocarUmbral(raiz) {
  raiz.querySelectorAll('.lec-umbral').forEach((b) => b.addEventListener('click', () => {
    raiz.querySelectorAll('.lec-umbral').forEach((x) => { x.classList.toggle('elegido', x === b); x.setAttribute('aria-checked', String(x === b)); });
    const t = raiz.querySelector('[data-umbral-texto]');
    if (t) t.innerHTML = `Tu <b class="rojo">umbral</b>: desde ${b.dataset.u} cuenta como nieve. Si lo subes, cuentan menos cuadritos.`;
  }));
}

function v7(l, d) {
  // 5 series al azar (hechas aquí) y 1 real (la nieve anual de la región), en orden fijo por sesión
  const r = azar(Date.now() % 100000);
  const series = Array.from({ length: 5 }, () => ({ real: false, v: Array.from({ length: 25 }, () => r()) }));
  if (d.anual?.length > 2) series.splice(Math.floor(r() * 6), 0, { real: true, v: d.anual });
  return `
    <div class="lec-seis" data-hay-real="${d.anual ? 1 : 0}">
      ${series.map((s, i) => `
        <button type="button" class="lec-tarjeta lec-mini" data-real="${s.real ? 1 : 0}" aria-pressed="false" aria-label="Gráfico ${i + 1}">
          <svg viewBox="0 0 220 70" preserveAspectRatio="none" aria-hidden="true"><path d="${trazo(s.v, 220, 70)}" fill="none" stroke="var(--dato-lluvia)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
          <span class="lec-mini-pie"><span data-estado>Tocar</span><span data-p>p = ?</span></span>
        </button>`).join('')}
    </div>
    <div class="lec-fila-fin"><button type="button" class="btn-apu secundario lec-chico" data-descubrir disabled>DESCUBRIR</button>
    <span class="lec-ilus">${d.anual ? 'ilustración · 1 de los 6 es tu serie real' : 'ilustración'}</span></div>`;
}
export function alTocarMinis(raiz, d, fmt) {
  const minis = [...raiz.querySelectorAll('.lec-mini')];
  const btn = raiz.querySelector('[data-descubrir]');
  minis.forEach((m) => m.addEventListener('click', () => {
    if (m.classList.contains('revelado')) return;
    const on = m.getAttribute('aria-pressed') !== 'true';
    m.setAttribute('aria-pressed', String(on));
    m.classList.toggle('elegido', on);
    m.querySelector('[data-estado]').textContent = on ? '✓ Elegido' : 'Tocar';
    if (btn) btn.disabled = !minis.some((x) => x.classList.contains('elegido'));
  }));
  btn?.addEventListener('click', () => {
    minis.forEach((m) => {
      m.classList.add('revelado');
      const real = m.dataset.real === '1';
      m.classList.toggle('real', real);
      m.querySelector('[data-estado]').textContent = real ? '★ Tu serie real' : 'Azar';
      m.querySelector('[data-p]').textContent = real ? `p = ${fmt.p}` : '';
    });
    btn.disabled = true;
  });
}

const PRUEBAS = ['Otro umbral (30)', 'Otro umbral (50)', 'Más cielo despejado', 'Años que se copian', 'Sin El Niño fuerte'];
function v8(l) {
  const [verde, amarillo, rojo] = l.teoria.tarjetas;
  return `
    <div class="lec-dos">
      <article class="lec-tarjeta lec-pruebas">
        ${PRUEBAS.map((p, i) => `<div class="lec-prueba"><i class="lec-semaforo" data-i="${i}"></i><span>${p}</span>
          <button type="button" class="btn-apu secundario lec-chico" data-probar="${i}">PROBAR</button></div>`).join('')}
      </article>
      <article class="lec-tarjeta lec-semaforos">
        <p><i class="lec-semaforo verde"></i>${esc(verde.texto)}</p>
        <p><i class="lec-semaforo amarillo"></i>${esc(amarillo.texto)}</p>
        <p><i class="lec-semaforo rojo"></i>${esc(rojo.texto)}</p>
        <p class="lec-nota" data-pruebas-nota hidden></p>
      </article>
    </div>${etiquetaIlus}`;
}
export function alProbar(raiz, d) {
  raiz.querySelectorAll('[data-probar]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.probar);
    const r = d.pruebas?.[i];
    const luz = raiz.querySelector(`.lec-semaforo[data-i="${i}"]`);
    const nota = raiz.querySelector('[data-pruebas-nota]');
    if (r && ['verde', 'amarillo', 'rojo'].includes(r)) { luz.className = `lec-semaforo ${r}`; }
    else if (nota) { nota.hidden = false; nota.textContent = 'Resultado de la prueba: — (todavía no hay datos de esta prueba).'; }
  }));
}

function v9(l, d, fmt) {
  const limites = (l.teoria.tarjetas[2]?.texto ?? '').replace(/\.$/, '').split(' · ');
  return `
    <div class="lec-versus">
      <article class="lec-tarjeta">
        <h4 class="lec-ceja">LO QUE CREÍAS</h4>
        <span class="lec-emoji" aria-hidden="true">💭</span>
        <p class="lec-grande">“${esc(fmt.hipotesisCorta)}”</p>
      </article>
      <span class="lec-flechas" aria-hidden="true">⇄</span>
      <article class="lec-tarjeta azul">
        <h4 class="lec-ceja azul">LO QUE DICEN LOS DATOS</h4>
        <span class="lec-emoji" aria-hidden="true">📊</span>
        <p class="lec-grande">${esc(fmt.pendiente_decada)} por década · p = ${esc(fmt.p)}</p>
        <small>${fmt.hayDatos ? `${esc(d.fuente)} · ${esc(fmt.region)} · ${esc(fmt.desde)}–${esc(fmt.hasta)}` : 'se llena con los datos reales'}</small>
      </article>
    </div>
    <p class="lec-tarjeta lec-limites"><b>LÍMITES:</b>${limites.map((t) => `<span>☑ ${esc(t)}</span>`).join('')}</p>`;
}

// ── Configuración de cada lección (textos de las maquetas) ───────────
export const VISUAL = {
  academia: {
    titulo: ['¿Es una ', 'tendencia', ' o no?'],
    significa: '<b>Tendencia:</b> un cambio que dura muchos años, por encima de las subidas y bajadas normales.',
    como: ['Mira los 3 gráficos', 'Toca 📖 si tienes dudas', 'Practica con tarjetas'],
    dice: '¡Mira la línea punteada! Así se ve una escalera que baja.',
    piensa: '¿Y si fuera solo un año raro…?',
    iconos: ['📈', '📅', '🕵', '🛰', '🔁'],
    dibujo: v1
  },
  caso: {
    titulo: ['¿Qué ', 'sabemos', ' y qué suponemos?'],
    significa: '<b>Dato:</b> algo que se puede comprobar y tiene fuente.<br><b>Suposición:</b> algo que alguien cree, pero todavía no está probado.',
    como: ['Lee cada recorte', 'Ponlo en su caja', 'Elige tu hipótesis'],
    piensa: '42 %… ¿de qué? ¿hielo o agua?',
    iconos: ['💡', '📰', '🧊', '🔎', '🚰'],
    dibujo: v2
  },
  variable: {
    titulo: ['¿Qué vamos a ', 'medir', '?'],
    significa: '<b>Variable:</b> algo de la naturaleza que se puede medir y que cambia con el tiempo, como la nieve o la lluvia.',
    como: ['Mira qué mide cada satélite', 'Clasifícalo en su caja', 'Elige la variable principal'],
    dice: 'Usaremos la nieve de MODIS. La lluvia de GPM será la testigo.',
    piensa: '¿Cabe la cordillera en una mancha de 300 km?',
    iconos: ['📏', '❄', '💧', '🛰', '⬜'],
    dibujo: v3
  },
  region: {
    titulo: ['¿', 'Dónde', ' miramos?'],
    significa: '<b>Región:</b> el pedazo de mapa que analizas. Si es muy grande, entra roca y lagos sin hielo y el cambio se nota menos.',
    como: ['Elige un recuadro', 'Mira cuánto cambia la nieve', 'Quédate con el mejor'],
    dice: 'La escena del crimen importa. ¡Mira dónde está el hielo!',
    piensa: '¿Cuántos cuadritos de mi recuadro tienen hielo?',
    iconos: ['🗺', '🧃', '🧊', '📍', '🔭'],
    dibujo: v4
  },
  periodo: {
    titulo: ['¿', 'Cuándo', ' comparamos?'],
    significa: '<b>Periodo:</b> los meses y años que comparas. Lo justo es comparar <b>los mismos meses</b> cada año, porque la montaña cambia con las estaciones.',
    como: ['Toca los meses', 'Mira cuándo hay más nieve', 'Elige la ventana justa'],
    dice: 'Agosto y septiembre: fin de la época seca. Ahí vemos el hielo que dura.',
    piensa: '¿Comparar marzo con septiembre sería justo?',
    iconos: ['🌨', '⚖', '📅', '☀', '🚫'],
    dibujo: v5, alMontar: (raiz, d) => alTocarMes(raiz, d)
  },
  serie: {
    titulo: ['¿Son ', 'buenos', ' mis datos?'],
    significa: '<b>Serie:</b> la lista de medidas día a día. Hay que sacar los días nublados y decidir desde cuándo un cuadrito cuenta como nieve (<b>umbral</b>).',
    como: ['Mira los días nublados', 'Elige cuántas nubes aceptas', 'Elige tu umbral'],
    dice: 'El satélite no ve a través de las nubes. ¡Tú decides!',
    piensa: 'Si exijo mucho cielo despejado… ¿quedarán días?',
    iconos: ['☁', '🎚', '⬆', '✅', '🔢'],
    dibujo: v6, alMontar: (raiz) => alTocarUmbral(raiz)
  },
  significancia: {
    titulo: ['¿Real o ', 'casualidad', '?'],
    significa: '<b>Valor p:</b> qué tan raro sería ver ese dibujo por pura suerte. Si es menor que 0,05 (menos de 5 en 100), es muy difícil que sea suerte.',
    como: ['5 gráficos son suerte, 1 es real', 'Toca los que creas reales', 'Descubre el valor p'],
    dice: '¡Cuidado! La suerte también dibuja subidas y bajadas.',
    piensa: '¿Cuál será mi serie de verdad…?',
    iconos: ['⚖', '🎯', '📏', '📉', '❔'],
    dibujo: v7, alMontar: (raiz, d, fmt) => alTocarMinis(raiz, d, fmt)
  },
  validacion: {
    titulo: ['¿Tu resultado ', 'resiste', '?'],
    significa: '<b>Validar:</b> poner a prueba tu resultado cambiando las reglas. Si sigue igual, es fuerte. Si cambia, lo escribes como límite.',
    como: ['Toca “Probar” en cada prueba', 'Mira el color del semáforo', 'Cuenta cuántas pasaron'],
    dice: 'Un buen detective desconfía de su propio resultado.',
    piensa: '¿Y si la culpa fue solo de El Niño?',
    iconos: ['🎚', '🌊', '🌡', '🍦', '🧩'],
    dibujo: v8, alMontar: (raiz, d) => alProbar(raiz, d)
  },
  veredicto: {
    titulo: ['¿Qué podemos ', 'afirmar', '?'],
    significa: '<b>Veredicto:</b> lo que puedes decir con tus datos, con palabras justas y sus límites. Si los datos no alcanzan, también se dice.',
    como: ['Compara tu idea con los datos', 'Elige palabras honestas', 'Marca los límites'],
    piensa: '“Demuestra” es una palabra muy fuerte…',
    iconos: ['⚖', '🚫', '⚠', '🔬', '🏔'],
    dibujo: v9
  }
};
