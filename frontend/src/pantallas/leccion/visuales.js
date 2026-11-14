// Lo visual de cada página de teoría (docs/mockups/lecciones-v3/nuevo-lN-pM.jpg): SVG y HTML simples.
// VISUALES[id][i](ctx) → HTML, con ctx = { d: datos reales (datos.js), m: marcas, l: la lección, perfil }.
// Si una página necesita moverse (tocar meses, elegir hipótesis…) exporta además MONTAR[id][i](caja, ctx).
// Regla: lo que no sale de un JSON real es una ilustración y lo dice ("ilustración", en pequeño).
import { esc, rellenar } from './datos.js';

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fmt = (v, d = 0) => v.toFixed(d).replace('.', ',');
const ilus = (texto = 'ilustración') => `<span class="lv-ilus">${esc(texto)}</span>`;
const caja = (html, clase = '') => `<div class="lv ${clase}">${html}</div>`;
// Cuadritos con ícono, título y texto (L2 p3, L4 p4, L10 p3…)
const cuadros = (lista, clase = '') => `<div class="lv-cuadros ${clase}">${lista.map(([icono, titulo, texto, color = '']) =>
  `<div class="lv-cuadro ${color}"><span class="lv-cuadro-ico" aria-hidden="true">${icono}</span><b>${esc(titulo)}</b><span>${esc(texto)}</span></div>`).join('')}</div>`;

// Escenas vistas desde el espacio (L1 p3 y la trivia "clasificar" de la L1)
export function escena(id) {
  const fondo = {
    'escena-nieve': '<rect width="200" height="120" fill="#8A7A62"/><path d="M0 120 L120 0 H200 V120Z" fill="#F2F4F8"/><path d="M70 120 L190 0 H200 V120Z" fill="#C9D6EA"/>',
    'escena-nube': '<rect width="200" height="120" fill="#5B6B86"/><circle cx="70" cy="58" r="56" fill="#D7DEEA"/><circle cx="70" cy="58" r="34" fill="#FFFFFF"/>',
    'escena-salar': '<defs><linearGradient id="lvSal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4EFE2"/><stop offset="1" stop-color="#E4DCCB"/></linearGradient></defs><rect width="200" height="120" fill="url(#lvSal)"/>',
    'escena-lago': '<rect width="200" height="120" fill="#1E4E7A"/><path d="M0 80 Q100 70 200 84 V120 H0Z" fill="#1A4570"/>'
  }[id] ?? '<rect width="200" height="120" fill="#1F416C"/>';
  return `<svg class="lv-escena" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fondo}</svg>`;
}

// Línea de una serie (minigráficos de la trivia "juez" y L9 p1)
export function linea(valores, ancho = 160, alto = 48, color = 'currentColor') {
  const v = valores.map((x, i) => [i, x]).filter(([, x]) => Number.isFinite(x));
  if (v.length < 2) return '';
  const xs = valores.length - 1, min = Math.min(...v.map((p) => p[1])), max = Math.max(...v.map((p) => p[1])), r = max - min || 1;
  const d = v.map(([i, x], k) => `${k ? 'L' : 'M'}${(4 + i / xs * (ancho - 8)).toFixed(1)} ${(alto - 4 - (x - min) / r * (alto - 8)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Barras verticales con etiquetas (meses, valores…)
function barras(valores, { etiquetas = [], colores = [], numeros = false, dec = 0, max = null, alto = 200, linea: lineaY = null } = {}) {
  const n = valores.length, M = max ?? Math.max(...valores.filter(Number.isFinite), 1);
  const w = 400 / n, pad = Math.min(8, w * 0.18);
  const cols = valores.map((v, i) => {
    const x = i * w + pad, bw = w - 2 * pad;
    if (!Number.isFinite(v)) return `<rect x="${x.toFixed(1)}" y="${(alto * 0.25).toFixed(1)}" width="${bw.toFixed(1)}" height="${(alto * 0.75).toFixed(1)}" rx="3" fill="none" stroke="#F07A86" stroke-dasharray="3 3"/>`;
    const h = Math.max(2, v / M * (alto - (numeros ? 18 : 4)));
    return `<rect x="${x.toFixed(1)}" y="${(alto - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${colores[i] ?? 'var(--dato-lluvia)'}"/>
      ${numeros ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(alto - h - 5).toFixed(1)}" text-anchor="middle" class="lv-num">${fmt(v, dec)}</text>` : ''}`;
  }).join('');
  const ejes = etiquetas.length ? etiquetas.map((e, i) => `<text x="${(i * w + w / 2).toFixed(1)}" y="${alto + 16}" text-anchor="middle" class="lv-eje">${esc(e)}</text>`).join('') : '';
  const ly = lineaY != null ? `<line x1="0" x2="400" y1="${(alto - lineaY / M * (alto - 4)).toFixed(1)}" y2="${(alto - lineaY / M * (alto - 4)).toFixed(1)}" stroke="var(--dato-tendencia)" stroke-width="2.5" stroke-dasharray="7 5"/>` : '';
  return `<svg class="lv-barras" viewBox="0 0 400 ${alto + (ejes ? 22 : 2)}" role="img">${cols}${ly}${ejes}</svg>`;
}

// Generador fijo (mismo dibujo cada vez) para las ilustraciones con "ruido"
function azar(semilla) { let s = semilla; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

const leyenda = (items) => `<p class="lv-leyenda">${items.map(([color, t]) => `<span><i style="background:${color}"></i>${esc(t)}</span>`).join('')}</p>`;

export const VISUALES = {
  // ── L1 · La Tierra vista desde arriba
  tierra: [
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="Montaña con glaciar arriba y nieve de temporada más abajo">
      <path d="M0 260 L120 150 L170 175 L250 60 L330 160 L400 120 V260Z" fill="#7A6450"/>
      <path d="M210 118 L250 60 L292 118 L272 108 L252 122 L232 106Z" fill="#9FD7FF"/>
      <path d="M172 175 L210 118 L232 106 L252 122 L272 108 L292 118 L318 150 L295 140 L272 152 L250 138 L226 152 L200 142Z" fill="#B9C2CF"/>
      <line x1="262" y1="88" x2="320" y2="62" stroke="#8FDBFF" stroke-width="1.5"/><text x="324" y="58" class="lv-rot azul">Glaciar</text><text x="324" y="74" class="lv-rot chico">todo el año</text>
      <line x1="262" y1="146" x2="320" y2="170" stroke="#F2F4F8" stroke-width="1.5"/><text x="324" y="172" class="lv-rot">Nieve</text><text x="324" y="188" class="lv-rot chico">de temporada</text></svg>`),
    () => caja(`${[['Nieve fresca', 'Esponjosa, llena de aire', '1 año', 0.12, '#F2F4F8'], ['Firn', 'Granulada, más apretada', 'varios años', 0.45, '#D6E4F5'], ['Hielo glaciar', 'Muy duro, sin aire, azulado', 'décadas', 0.9, '#7FC0F0']]
      .map(([t, s, a, f, c], i) => `${i ? '<p class="lv-flecha">↓ peso de la nieve nueva</p>' : ''}<div class="lv-capa"><span class="lv-capa-muestra" style="background:${c}"></span><span><b>${t}</b><small>${s}</small><i class="lv-medidor"><i style="width:${f * 100}%"></i></i></span><small>${a}</small></div>`).join('')}
      <p class="lv-nota">barra = qué tan apretado está</p>`),
    () => caja(`<div class="lv-escenas">${[['escena-nieve', 'Nieve', 'En las montañas altas, con las sombras del relieve.', true], ['escena-nube', 'Nube', 'Blanca y borrosa, tapa todo, se mueve de un día a otro.'], ['escena-salar', 'Salar de Uyuni', 'Muy blanco y plano, pero es sal, no nieve.'], ['escena-lago', 'Lago', 'Agua: se ve oscura, no blanca.']]
      .map(([img, t, s, si]) => `<figure class="lv-escena-fig">${escena(img)}<span class="lv-sello ${si ? 'si' : ''}">¿NIEVE? ${si ? 'SÍ' : 'NO'}</span><figcaption><b>${t}</b>${s}</figcaption></figure>`).join('')}</div>${ilus()}`),
    () => caja(`${[['👁', 'OBSERVACIÓN', 'Lo que ves.', '“En esta foto la montaña se ve menos blanca.”', ''], ['📊', 'DATO', 'Una medida con fuente, lugar y fecha.', '“MODIS · 16,2° S, 68,2° O · 15/08/2024 · índice 40”', 'azul'], ['💭', 'INTERPRETACIÓN', 'Lo que concluyes. Hay que comprobarla.', '“Quizás la nieve está bajando.”', 'rosa']]
      .map(([i, t, s, e, c], k) => `${k ? '<p class="lv-flecha centro">↓</p>' : ''}<div class="lv-paso ${c}"><span class="lv-cuadro-ico" aria-hidden="true">${i}</span><span><b>${t}</b><small>${s}</small><em>${e}</em></span></div>`).join('')}`)
  ],

  // ── L2 · La lluvia que alimenta la montaña
  lluvia: [
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="Nubes: abajo cae lluvia y arriba, en la montaña, nieve">
      <ellipse cx="110" cy="50" rx="70" ry="26" fill="#D7E6F7"/><ellipse cx="160" cy="38" rx="50" ry="22" fill="#D7E6F7"/><ellipse cx="290" cy="52" rx="70" ry="24" fill="#D7E6F7"/>
      ${Array.from({ length: 9 }, (_, i) => `<line x1="${70 + i * 18}" y1="${92 + (i % 2) * 8}" x2="${64 + i * 18}" y2="${112 + (i % 2) * 8}" stroke="#4F8DFF" stroke-width="3" stroke-linecap="round"/>`).join('')}
      ${Array.from({ length: 6 }, (_, i) => `<text x="${250 + i * 20}" y="${100 + (i % 3) * 12}" class="lv-copo">❄</text>`).join('')}
      <path d="M40 260 L250 160 L300 135 L400 190 V260Z" fill="#7A6450"/><path d="M262 154 L300 135 L340 158 L318 152 L300 160 L282 150Z" fill="#F2F4F8"/>
      <text x="96" y="150" class="lv-rot azul">Lluvia (abajo)</text><text x="300" y="120" class="lv-rot">Nieve (arriba)</text>
      <rect x="40" y="200" width="34" height="46" rx="3" fill="none" stroke="#F8AE05" stroke-width="2.5"/><rect x="42" y="226" width="30" height="18" fill="#4F8DFF"/><text x="82" y="240" class="lv-rot amarillo">1 mm</text></svg>`),
    ({ d }) => {
      const ll = d.lluvia;
      const lluvias = [0, 1, 2, 11];
      if (!ll) return caja(`${ilus('ilustración (sin el JSON de lluvia)')}${barras([9, 8, 7, 3, 2, 1, 1, 2, 2, 4, 5, 8], { etiquetas: MESES, colores: MESES.map((_, i) => lluvias.includes(i) ? 'var(--dato-lluvia)' : 'var(--dato-tendencia)') })}${leyenda([['var(--dato-lluvia)', 'Época de lluvias'], ['var(--dato-tendencia)', 'Época seca']])}`);
      return caja(`<p class="lv-cabeza verde">DATOS REALES · ${esc(ll.fuente.replace(/ mensual/i, ''))} · ${esc(ll.desde)}–${esc(ll.hasta)}</p>
        <p class="lv-sub">Lluvia promedio de cada mes, en mm · ${esc(d.region ?? 'Cordillera Real')}</p>
        ${barras(ll.meses, { etiquetas: MESES, numeros: true, colores: MESES.map((_, i) => lluvias.includes(i) ? 'var(--dato-lluvia)' : 'var(--dato-tendencia)') }).replace('role="img"', `role="img" aria-label="Lluvia promedio por mes: ${ll.meses.map((v, i) => `${MESES_LARGOS[i]} ${Math.round(v)} mm`).join(', ')}"`)}
        ${leyenda([['var(--dato-lluvia)', 'Época de lluvias'], ['var(--dato-tendencia)', 'Época seca']])}`);
    },
    () => caja(cuadros([['🌨', '1. Época de lluvias', 'Arriba cae nieve nueva sobre el glaciar.', 'azul'], ['🏔', '2. El glaciar guarda', 'La nieve se acumula y con los años se vuelve hielo.', 'blanco'], ['☀', '3. Época seca', 'El hielo se derrite poco a poco y baja como agua.', 'amarillo'], ['🚰', '4. La ciudad', 'Parte de esa agua llega a ríos y represas de La Paz.', 'verde']])),
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="Varios satélites sobre la Tierra; IMERG junta lo que ven en cuadros de unos 10 km">
      <path d="M0 260 Q200 120 400 260Z" fill="#1F4E8A"/>
      ${[[90, 50], [200, 30], [320, 60], [140, 100], [270, 110]].map(([x, y]) => `<g><rect x="${x - 14}" y="${y - 5}" width="28" height="10" fill="#DCE6F4"/><rect x="${x - 32}" y="${y - 4}" width="16" height="8" fill="#4F8DFF"/><rect x="${x + 16}" y="${y - 4}" width="16" height="8" fill="#4F8DFF"/><line x1="${x}" y1="${y + 6}" x2="200" y2="190" stroke="#8FDBFF" stroke-dasharray="3 4" opacity=".6"/></g>`).join('')}
      <rect x="150" y="168" width="100" height="36" rx="6" fill="#D12021"/><text x="200" y="186" text-anchor="middle" class="lv-rot">IMERG</text><text x="200" y="199" text-anchor="middle" class="lv-rot chico">junta todo</text>
      ${Array.from({ length: 18 }, (_, i) => `<rect x="${152 + (i % 6) * 16}" y="${214 + Math.floor(i / 6) * 13}" width="14" height="11" fill="${i % 4 ? '#5BA0FF' : '#8FDBFF'}" opacity=".85"/>`).join('')}
      <text x="262" y="236" class="lv-rot chico">cuadros de ~10 km</text></svg>`)
  ],

  // ── L3 · Ojos en el espacio
  ojos: [
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="El satélite Terra lleva el instrumento MODIS, que mira la Tierra">
      <path d="M0 260 Q200 130 400 260Z" fill="#1F4E8A"/>
      <rect x="60" y="74" width="110" height="34" fill="#2F6FC4" stroke="#8FDBFF"/><rect x="230" y="74" width="110" height="34" fill="#2F6FC4" stroke="#8FDBFF"/>
      <rect x="170" y="62" width="60" height="56" rx="6" fill="#DCE6F4"/><circle cx="200" cy="128" r="12" fill="#D12021" stroke="#F2F4F8" stroke-width="3"/>
      <path d="M200 140 L150 240 M200 140 L250 240" stroke="#8FDBFF" stroke-width="1.2" opacity=".7"/>
      <line x1="232" y1="66" x2="268" y2="44" stroke="#F2F4F8"/><text x="272" y="40" class="lv-rot azul">Terra</text><text x="272" y="54" class="lv-rot chico">el satélite</text>
      <line x1="210" y1="132" x2="272" y2="162" stroke="#F2F4F8"/><text x="276" y="166" class="lv-rot">MODIS</text><text x="276" y="180" class="lv-rot chico">el instrumento</text></svg>`),
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="Franjas que MODIS ve en un día sobre la Tierra">
      <circle cx="200" cy="130" r="112" fill="none" stroke="#8FDBFF" stroke-dasharray="5 6" opacity=".7"/><circle cx="200" cy="130" r="84" fill="#2A5FA8"/>
      <clipPath id="lvTierra"><circle cx="200" cy="130" r="84"/></clipPath>
      <g clip-path="url(#lvTierra)">${Array.from({ length: 6 }, (_, i) => `<rect x="${130 + i * 24}" y="30" width="12" height="210" fill="#C9A227" opacity=".85" transform="rotate(12 200 130)"/>`).join('')}</g>
      <text x="40" y="28" class="lv-rot amarillo">Franjas que ve en un día</text>
      <rect x="20" y="206" width="132" height="40" rx="6" fill="#0B192E" stroke="#8FDBFF"/><text x="30" y="222" class="lv-rot azul">Terra: mañana</text><text x="30" y="238" class="lv-rot chico">~10:30 hora local</text>
      <rect x="248" y="206" width="132" height="40" rx="6" fill="#0B192E" stroke="#F07A86"/><text x="258" y="222" class="lv-rot rosa">Aqua: tarde</text><text x="258" y="238" class="lv-rot chico">~13:30 hora local</text></svg>`),
    () => caja(`${ilus()}<svg viewBox="0 0 400 260" role="img" aria-label="Cuadrícula de píxeles de 500 m; uno mezcla nieve y roca">
      ${Array.from({ length: 15 }, (_, i) => { const c = i % 5, f = Math.floor(i / 5); const color = c === 2 ? '#EAF3FF' : (c + f) % 2 ? '#8E8E8E' : '#7A6450'; return `<rect x="${40 + c * 64}" y="${20 + f * 64}" width="64" height="64" fill="${color}" stroke="#F8AE05" stroke-width="1"/>`; }).join('')}
      <path d="M140 84 L168 40 L196 84Z" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="168" y="148" width="64" height="64" fill="none" stroke="#D12021" stroke-width="4"/>
      <text x="300" y="44" class="lv-rot amarillo">1 cuadrito</text><text x="300" y="60" class="lv-rot chico">= 500 m × 500 m</text>
      <text x="40" y="240" class="lv-rot rosa">Píxel mixto: nieve + roca</text></svg>`),
    () => caja(`<p class="lv-sub">Cuánta luz rebota ${ilus('(ilustración)')}</p>
      <svg viewBox="0 0 400 220" role="img" aria-label="La nieve refleja mucha luz verde y poca infrarroja; la nube refleja mucha de las dos">
      <rect x="80" y="20" width="44" height="160" rx="3" fill="#2BC56B"/><rect x="128" y="160" width="44" height="20" rx="3" fill="#D12021"/>
      <rect x="230" y="20" width="44" height="160" rx="3" fill="#2BC56B"/><rect x="278" y="60" width="44" height="120" rx="3" fill="#D12021"/>
      <text x="126" y="204" text-anchor="middle" class="lv-rot">Nieve</text><text x="276" y="204" text-anchor="middle" class="lv-rot">Nube</text></svg>
      ${leyenda([['#2BC56B', 'Luz verde (banda 4)'], ['#D12021', 'Infrarrojo SWIR (banda 6)']])}`)
  ],

  // ── L4 · Cómo MODIS reconoce la nieve
  ndsi: [
    () => caja(`<div class="lv-formula"><b>NDSI =</b> <span class="verde">(verde − SWIR)</span> ÷ <span class="amarillo">(verde + SWIR)</span></div>
      <p class="lv-fichas"><span>verde = <b>0,60</b></span><span>SWIR = <b>0,20</b></span></p>
      <p class="lv-cuenta"><span class="verde">0,60 − 0,20 = 0,40</span> · <span class="amarillo">0,60 + 0,20 = 0,80</span></p>
      <p class="lv-resultado">0,40 ÷ 0,80 = <em>0,50</em></p>`, 'centro'),
    () => caja(`<p class="lv-sub">Valor de NDSI_Snow_Cover (0 a 100)</p>
      <svg viewBox="0 0 400 230" role="img" aria-label="Barras de 0 a 100; desde 40 cuenta como nieve">
      <defs><linearGradient id="lvBlanco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2F4F8"/><stop offset="1" stop-color="#8FB5E0"/></linearGradient></defs>
      ${[0, 20, 40, 60, 80, 100].map((v, i) => { const h = 12 + v * 1.7; return `<rect x="${6 + i * 66}" y="${190 - h}" width="56" height="${h}" rx="4" fill="${v < 40 ? '#3B4C6E' : 'url(#lvBlanco)'}" opacity="${0.55 + v / 250}"/><text x="${34 + i * 66}" y="210" text-anchor="middle" class="lv-rot">${v}</text>`; }).join('')}
      <line x1="138" y1="198" x2="138" y2="228" stroke="#F07A86" stroke-width="2.5" stroke-dasharray="4 3"/><text x="146" y="226" class="lv-rot rosa">umbral: desde 40 cuenta como nieve</text></svg>`),
    () => caja(`<div class="lv-codigos">${[['0–100', 'Índice de nieve', 'azul'], ['200', 'Falta el dato'], ['201', 'Sin decisión'], ['211', 'Noche'], ['237', 'Lago o río'], ['239', 'Océano'], ['250', 'Nube'], ['254', 'Sensor saturado', 'amarillo'], ['255', 'Relleno']]
      .map(([n, t, c = '']) => `<div class="lv-codigo ${c}"><b>${n}</b><span>${t}</span></div>`).join('')}</div>`),
    () => caja(cuadros([['🌊', 'Agua y lagos', 'También dan NDSI alto. Por eso el producto los marca con un aviso.', 'rosa'], ['🌑', 'Sombras', 'En laderas oscuras la nieve puede no verse.', 'rosa'], ['☁', 'Nubes de hielo', 'Algunas nubes muy frías confunden al índice.', 'rosa'], ['🏔', 'Nieve ≠ glaciar', 'NDSI alto dice “parece nieve”, no “aquí hay un glaciar”.', 'rosa']]))
  ],

  // ── L5 · El caso y tu pregunta
  caso: [
    () => caja(`<div class="lv-recortes">${[['RECORTE 1 · 2016', 'La Paz con racionamiento de agua', 'Los Tiempos', -1.2], ['RECORTE 2 · AGOSTO 2026', 'Alerta roja… pero represas “en niveles óptimos”', 'eju.tv', 1], ['RECORTE 3 · 2022', 'Glaciares andinos perdieron 42 %', 'EFE', -0.6]]
      .map(([c, t, f, g]) => `<article class="lv-recorte" style="--giro:${g}deg"><small>${c}</small><b>${esc(t)}</b><span>Fuente: ${esc(f)}</span></article>`).join('')}</div>`),
    () => caja(`<div class="lv-columnas tres">${[['✅ Dato', 'verde', ['Racionamiento 2016']], ['🔎 Hay que aclarar', 'amarillo', ['42 % de pérdida', 'Alerta roja']], ['💭 Suposición', 'rosa', ['“Ya no hay agua”']]]
      .map(([t, c, items]) => `<div class="lv-columna ${c}"><b>${t}</b>${items.map((x) => `<span class="lv-papelito">${esc(x)}</span>`).join('')}</div>`).join('')}</div>`),
    () => caja(`<div class="lv-columnas">${[['🛰 MODIS SÍ ve', 'verde', ['❄ Dónde hay nieve', '📅 Día a día desde 2000', '📉 Cómo cambia con los años']], ['🚫 MODIS NO mide', 'rosa', ['💧 Litros de agua', '⚖ Peso del hielo', '❓ Por qué cambió']]]
      .map(([t, c, items]) => `<div class="lv-columna ${c}"><b>${t}</b><ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>`),
    // Tu hipótesis: se elige aquí y se guarda en el perfil (la usa la lección 10)
    ({ l }) => {
      const h = l.hipotesis;
      const iconos = ['📉', '➖', '📈'];
      return caja(`<p class="lv-sub">${esc(h.pregunta)}</p>
        <div class="lv-hipotesis" role="radiogroup" aria-label="Tu hipótesis">${h.opciones.map((o, i) => `<button type="button" role="radio" aria-checked="false" data-hip="${esc(o)}"><span aria-hidden="true">${iconos[i] ?? '•'}</span>${esc(o)}</button>`).join('')}</div>
        <p class="lv-sub">¿Qué tan seguro estás?</p>
        <div class="lv-confianza" role="radiogroup" aria-label="Qué tan seguro estás">${h.confianza.map((c) => `<button type="button" role="radio" aria-checked="false" data-conf="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <p class="lv-nota" data-hip-estado aria-live="polite">Elige tu hipótesis: la comparamos con los datos en la lección 10.</p>`);
    }
  ],

  // ── L6 · ¿Dónde? La región
  region: [
    () => caja(`<svg viewBox="0 0 400 250" role="img" aria-label="Tres recuadros: grande, medio y solo glaciares">
      <rect x="40" y="16" width="320" height="214" fill="none" stroke="#F2F4F8" stroke-width="2" stroke-dasharray="6 5"/><text x="48" y="36" class="lv-rot">GRANDE</text>
      <rect x="110" y="56" width="130" height="100" fill="none" stroke="#F8AE05" stroke-width="2.5"/><text x="116" y="174" class="lv-rot amarillo">MEDIO</text>
      ${[[120, 66], [150, 92], [180, 86], [212, 118], [240, 96], [262, 150], [290, 140]].map(([x, y]) => `<path d="M${x - 14} ${y + 16} L${x} ${y - 6} L${x + 14} ${y + 16}Z" fill="#DCE6F4"/>`).join('')}
      <path d="M140 82 L175 78 L300 150 L280 170 L150 104Z" fill="#5BA0FF" opacity=".55" stroke="#8FDBFF"/><text x="244" y="196" class="lv-rot azul">SOLO GLACIARES</text>
      <ellipse cx="80" cy="190" rx="22" ry="10" fill="#2F6FA0"/><text x="70" y="214" class="lv-rot chico">lago</text></svg>${ilus()}`),
    () => caja(`${[['Grande', '≈ 57 000', 0.97, 0.08, ''], ['Medio', '≈ 4300', 0.32, 0.25, 'amarillo'], ['Glaciares', 'pocos, casi todos hielo', 0.12, 0.85, 'azul']]
      .map(([t, n, w, hielo, c]) => `<div class="lv-fila-barra ${c}"><b>${t}</b><span class="lv-barra-h" style="--w:${w * 100}%;--hielo:${hielo * 100}%"><i></i></span><small>${n}</small></div>`).join('')}
      ${leyenda([['var(--dato-lluvia)', 'píxeles con hielo'], ['#8A6A48', 'roca, pasto, lagos (proporción ilustrativa)']])}`),
    () => caja(`${ilus()}<svg viewBox="0 0 400 240" role="img" aria-label="Un vaso de jugo y el mismo jugo en un balde de agua: el sabor se diluye">
      <path d="M70 40 L160 40 L152 200 L78 200Z" fill="none" stroke="#F2F4F8" stroke-width="3"/><path d="M74 70 L156 70 L152 198 L78 198Z" fill="#E0A82E"/>
      <text x="200" y="128" text-anchor="middle" class="lv-flecha-svg">→</text>
      <path d="M232 30 L362 30 L350 200 L244 200Z" fill="none" stroke="#F2F4F8" stroke-width="3"/><path d="M236 52 L358 52 L350 198 L244 198Z" fill="#5A5636"/>
      <text x="80" y="222" class="lv-rot amarillo">recuadro chico</text><text x="80" y="236" class="lv-rot chico">sabor fuerte</text>
      <text x="244" y="222" class="lv-rot amarillo">recuadro grande</text><text x="244" y="236" class="lv-rot chico">mismo jugo, más agua</text></svg>`),
    () => caja(`<svg viewBox="0 0 400 240" role="img" aria-label="Bordes antiguos de un glaciar (GLIMS) y el hielo de hoy, más chico">
      <text x="24" y="28" class="lv-rot azul chico">- - - bordes antiguos (GLIMS)</text><rect x="24" y="38" width="10" height="10" fill="#DCE6F4"/><text x="40" y="48" class="lv-rot chico">hielo de hoy</text>
      <path d="M110 90 Q200 40 330 130 L310 160 Q220 200 150 190 Q110 170 110 90Z" fill="none" stroke="#8FDBFF" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="M118 96 Q205 54 318 134 L300 156 Q220 192 156 184 Q118 166 118 96Z" fill="none" stroke="#5BA0FF" stroke-width="2"/>
      <path d="M140 130 Q190 100 280 150 Q220 180 160 176 Q138 160 140 130Z" fill="#DCE6F4"/></svg>${ilus()}`)
  ],

  // ── L7 · ¿Cuándo? El periodo
  periodo: [
    ({ d }) => {
      const ms = d.mensual;
      const valores = ms ? ms.meses : [95, 98, 92, 78, 62, 52, 48, 44, 42, 50, 70, 86];
      return caja(`<div class="lv-meses" data-meses>${valores.map((v, i) => `<button type="button" class="lv-mes" data-mes="${i}" aria-label="${MESES_LARGOS[i]}${ms ? `: ${fmt(v, 1)} % de nieve` : ''}"><i style="height:${Math.max(4, v / Math.max(...valores) * 100)}%"></i><span>${MESES[i]}</span></button>`).join('')}</div>
        <p class="lv-sub" data-mes-texto aria-live="polite">${ms ? `% de nieve por mes · ${esc(ms.fuente)} · toca un mes` : '% de nieve por mes'}</p>
        ${ms ? '' : ilus('ilustración: la app usa mensual.json')}`);
    },
    () => caja(`<svg viewBox="0 0 400 230" role="img" aria-label="Marzo de un año contra septiembre de otro: la diferencia es la estación">
      <rect x="90" y="16" width="100" height="164" rx="6" fill="var(--dato-lluvia)"/><rect x="210" y="110" width="100" height="70" rx="6" fill="var(--dato-tendencia)"/>
      <text x="140" y="198" text-anchor="middle" class="lv-rot">Marzo 2001</text><text x="140" y="212" text-anchor="middle" class="lv-rot chico">época de lluvias</text>
      <text x="260" y="198" text-anchor="middle" class="lv-rot">Sept. 2024</text><text x="260" y="212" text-anchor="middle" class="lv-rot chico">época seca</text></svg>
      <p class="lv-alerta">⚠ ¡TRAMPA! Es la estación</p>${ilus()}`),
    () => caja(`<div class="lv-calendario" role="img" aria-label="Agosto y septiembre marcados en todos los años, de 2001 a 2025">
      <span></span>${MESES.map((m) => `<b>${m}</b>`).join('')}
      ${['2001', '2002', '2003', '…', '2024', '2025'].map((a) => `<small>${a}</small>${MESES.map((_, i) => `<i class="${i === 7 || i === 8 ? 'si' : ''}"></i>`).join('')}`).join('')}</div>
      <p class="lv-nota amarillo">▮ Agosto y septiembre: la misma ventana cada año</p>`),
    () => caja(`<div class="lv-anios">${Array.from({ length: 25 }, (_, i) => `<span>${String(i + 1).padStart(2, '0')}</span>`).join('')}</div>
      <p class="lv-tramo"><b>2001</b><em>25 años</em><b>2025</b></p><p class="lv-nota rosa">Con menos de 10 años, un año raro puede engañarte.</p>`)
  ],

  // ── L8 · Limpiar los datos
  serie: [
    ({ d }) => {
      const real = d.dias;
      const r = azar(7);
      const lista = real ? real.lista.slice(0, 61).map((x) => (x.nube >= 50 ? 'nube' : x.nieve >= x.sinNieve ? 'nieve' : 'roca'))
        : Array.from({ length: 61 }, () => { const v = r(); return v < 0.36 ? 'nieve' : v < 0.68 ? 'roca' : 'nube'; });
      return caja(`<div class="lv-dias" role="img" aria-label="${lista.length} días: ${lista.filter((x) => x === 'nieve').length} con nieve, ${lista.filter((x) => x === 'roca').length} sin nieve y ${lista.filter((x) => x === 'nube').length} tapados por nubes">${lista.map((x) => `<i class="${x}"></i>`).join('')}</div>
        ${leyenda([['var(--dato-lluvia)', 'nieve'], ['#8A6A48', 'sin nieve'], ['#9AA3B5', 'nube (descartar)']])}
        ${real ? `<p class="lv-nota">${lista.length} días de agosto y septiembre de ${esc(real.anio)} · MODIS</p>` : ilus('61 días, ilustración')}`);
    },
    () => caja(`${[['30 % de cielo despejado', 'entran días dudosos', 'amarillo'], ['50 % de cielo despejado', 'equilibrio ✓', 'verde'], ['70 % de cielo despejado', 'quedan pocos días', 'rosa']]
      .map(([t, s, c]) => `<div class="lv-umbral ${c}"><span><b>${t}</b><small>${s}</small></span><i></i></div>`).join('')}
      <p class="lv-nota">Mínimo <b class="verde">10 días útiles</b> por año</p>`),
    () => caja(`${barras([15, 28, 35, 42, 58, 71, 90], { etiquetas: ['15', '28', '35', '42', '58', '71', '90'], colores: [15, 28, 35, 42, 58, 71, 90].map((v) => (v >= 40 ? 'var(--dato-lluvia)' : '#284A7A')), max: 100, linea: 40 })}
      <p class="lv-nota amarillo">umbral 40 → desde aquí es nieve</p>${ilus()}`),
    ({ d }) => {
      const s = d.serie;
      if (!s) {
        const r = azar(11);
        const v = Array.from({ length: 25 }, (_, i) => (i === 5 || i === 14 ? null : 70 - i * 1.1 + (r() - 0.5) * 14));
        return caja(`${barras(v, { colores: v.map(() => 'var(--dato-lluvia)'), max: 90 })}<p class="lv-tramo chico"><b>2001</b><span class="rosa">▯ sin dato ≠ 0</span><b>2025</b></p>${ilus()}`);
      }
      return caja(`<p class="lv-sub">${esc(s.unidad)} · agosto y septiembre</p>${barras(s.valores, { colores: s.valores.map(() => 'var(--dato-lluvia)') }).replace('role="img"', `role="img" aria-label="Serie de ${s.anios[0]} a ${s.anios[s.anios.length - 1]}; los años sin días útiles quedan vacíos"`)}
        <p class="lv-tramo chico"><b>${s.anios[0]}</b><span class="rosa">▯ sin dato ≠ 0</span><b>${s.anios[s.anios.length - 1]}</b></p><p class="lv-nota">${esc(s.fuente)}</p>`);
    }
  ],

  // ── L9 · ¿Real o casualidad?
  significancia: [
    () => {
      const r = azar(3);
      const tendencia = Array.from({ length: 22 }, (_, i) => 10 - i * 0.35 + (r() - 0.5) * 1.6);
      const ruido = Array.from({ length: 22 }, () => r() * 6);
      const raro = Array.from({ length: 22 }, (_, i) => (i === 12 ? 1 : 6 + (r() - 0.5) * 0.8));
      return caja(`${[[tendencia, 'Tendencia: baja como escalera', 'var(--dato-lluvia)', 'azul'], [ruido, 'Puro ruido: sube y baja sin rumbo', '#C9D2E3', ''], [raro, 'Un solo año raro: no es tendencia', '#F07A86', 'rosa']]
        .map(([v, t, c, k]) => `<figure class="lv-mini">${linea(v, 200, 40, c)}<figcaption class="${k}">${t}</figcaption></figure>`).join('')}${ilus()}`, 'centro');
    },
    ({ d, m }) => {
      const s = d.serie;
      let puntos, rumbo, real = false;
      if (s && s.pendienteAnio != null && s.intercepto != null) {
        real = true;
        puntos = s.anios.map((a, i) => [a, s.valores[i]]).filter(([, v]) => Number.isFinite(v));
        rumbo = (a) => s.intercepto + s.pendienteAnio * a;
      } else {
        const r = azar(5);
        puntos = Array.from({ length: 25 }, (_, i) => [2001 + i, 60 - i * 0.9 + (r() - 0.5) * 12]);
        rumbo = (a) => 60 - (a - 2001) * 0.9;
      }
      const a0 = puntos[0][0], a1 = puntos[puntos.length - 1][0];
      const ys = puntos.map((p) => p[1]).concat([rumbo(a0), rumbo(a1)]);
      const min = Math.min(...ys), max = Math.max(...ys), rg = max - min || 1;
      const X = (a) => 20 + (a - a0) / (a1 - a0 || 1) * 360, Y = (v) => 210 - (v - min) / rg * 170;
      return caja(`<svg viewBox="0 0 400 230" role="img" aria-label="Cada punto es un año; la línea punteada muestra el rumbo${real ? `: ${esc(m.pendiente_decada ?? '—')} por década` : ''}">
        ${puntos.map(([a, v]) => `<circle cx="${X(a).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="5" fill="var(--dato-lluvia)"/>`).join('')}
        <line x1="${X(a0)}" y1="${Y(rumbo(a0)).toFixed(1)}" x2="${X(a1)}" y2="${Y(rumbo(a1)).toFixed(1)}" stroke="var(--dato-tendencia)" stroke-width="3" stroke-dasharray="8 6"/>
        <text x="390" y="22" text-anchor="end" class="lv-rot amarillo">pendiente: ${esc(m.pendiente_decada ?? '—')} por década</text>
        ${real ? `<text x="20" y="228" class="lv-rot chico">${a0}</text><text x="380" y="228" text-anchor="end" class="lv-rot chico">${a1}</text>` : ''}</svg>
        ${real ? `<p class="lv-nota">${esc(s.fuente)}</p>` : ilus()}`);
    },
    () => caja(`<div class="lv-moneda" aria-hidden="true">🪙</div>
      <div class="lv-tiros" role="img" aria-label="10 tiros de moneda: 7 caras">${['C', 'C', 'X', 'C', 'C', 'X', 'C', 'C', 'X', 'C'].map((t) => `<span class="${t === 'C' ? 'cara' : ''}">${t}</span>`).join('')}</div>
      <p class="lv-grande">7 caras de 10</p><p class="lv-nota">¿Trucada? No necesariamente: la suerte también hace rachas.</p>`, 'centro'),
    ({ d, m }) => {
      const p = d.serie?.p;
      const pos = p != null ? Math.min(100, Math.max(0, p * 100)) : null;
      return caja(`<div class="lv-pbarra"><i class="verde"></i><i class="amarillo"></i>${pos != null ? `<b style="left:${pos}%" aria-hidden="true"></b>` : ''}</div>
        <p class="lv-tramo chico"><span>0</span><span class="verde">0,05</span><span>1</span></p>
        <div class="lv-columnas"><div class="lv-columna verde chica"><b>p menor que 0,05</b><span>Muy difícil que sea solo suerte</span></div><div class="lv-columna chica"><b>p mayor</b><span>Todavía no se sabe</span></div></div>
        <p class="lv-grande azul">Tu serie: p = ${esc(m.p ?? '—')}</p>`);
    }
  ],

  // ── L10 · ¿Podemos confiar? Veredicto
  veredicto: [
    ({ d }) => {
      const pr = d.pruebas;
      const lista = pr ? pr.lista : ['Umbral 30', 'Umbral 50', 'Cielo despejado 70 %', 'Años que se copian', 'Sin El Niño fuerte'].map((nombre) => ({ nombre, semaforo: '' }));
      return caja(`<ul class="lv-pruebas">${lista.map((x) => `<li><i class="lv-luz ${esc(x.semaforo)}" aria-hidden="true"></i>${esc(x.nombre)}${x.semaforo ? `<span class="lv-oculto">: ${esc(x.semaforo)}</span>` : (pr ? '<small class="lv-camino">datos en camino</small>' : '')}</li>`).join('')}</ul>
        ${pr ? '' : ilus('ilustración: la app pinta el semáforo con pruebas.json')}`);
    },
    () => caja(`<div class="lv-cuadros">${[['🍦', 'Más helados', 'amarillo'], ['🔥', 'Más quemaduras', 'rosa']].map(([i, t, c]) => `<div class="lv-cuadro ${c} centro"><span class="lv-cuadro-ico grande" aria-hidden="true">${i}</span><b>${t}</b></div>`).join('')}</div>
      <div class="lv-causa"><span aria-hidden="true">☀</span><b>La causa común: el sol</b></div>`),
    ({ l }) => {
      const iconos = ['🛰', '🔲', '💧', '1️⃣'];
      const textos = ['MODIS ve superficie blanca.', 'Glaciares chicos se mezclan.', 'No medimos litros.', 'Solo MODIS para la nieve.'];
      return caja(cuadros((l.limites ?? []).map((t, i) => [iconos[i] ?? '•', t, textos[i] ?? '', 'amarillo'])));
    },
    // El veredicto: la plantilla con las marcas llenas y [a / b / c] como listas para elegir
    ({ l, m }) => {
      let k = 0;
      const texto = rellenar(esc(l.plantilla ?? ''), m, true)
        .replace(/\[([^\]]+)\]/g, (_, ops) => `<select data-v="${k++}" aria-label="Elige">${ops.split('/').map((o) => `<option>${o.trim()}</option>`).join('')}</select>`)
        .replace(/\{(\w+)\}/g, '—');
      return caja(`<article class="lv-veredicto"><small>VEREDICTO DEL DETECTIVE</small><p>${texto}</p><p class="lv-firma">✍ Firmado: ${esc(m.apodo ?? 'tu apodo')}</p></article>`);
    }
  ]
};

// Páginas que se mueven
export const MONTAR = {
  caso: {
    3: (el, ctx) => {
      const est = { hip: null, conf: null };
      const previa = String(ctx.perfil?.hipotesis ?? '').split('|');
      const marcar = (sel, valor, attr) => el.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-checked', String(b.dataset[attr] === valor)));
      const pintar = () => {
        marcar('[data-hip]', est.hip, 'hip');
        marcar('[data-conf]', est.conf, 'conf');
        el.querySelector('[data-hip-estado]').textContent = est.hip
          ? `Tu hipótesis: la nieve ${est.hip}${est.conf ? ` · ${est.conf}` : ''}. ¡Guardada para la lección 10!`
          : 'Elige tu hipótesis: la comparamos con los datos en la lección 10.';
      };
      if (ctx.l.hipotesis.opciones.includes(previa[0])) { est.hip = previa[0]; est.conf = ctx.l.hipotesis.confianza.includes(previa[1]) ? previa[1] : null; }
      const guardar = () => { if (est.hip) ctx.guardarHipotesis(est.hip, est.conf); pintar(); };
      el.querySelectorAll('[data-hip]').forEach((b) => b.addEventListener('click', () => { est.hip = b.dataset.hip; guardar(); }));
      el.querySelectorAll('[data-conf]').forEach((b) => b.addEventListener('click', () => { est.conf = b.dataset.conf; guardar(); }));
      pintar();
    }
  },
  periodo: {
    0: (el, ctx) => {
      const ms = ctx.d.mensual;
      const texto = el.querySelector('[data-mes-texto]');
      el.querySelectorAll('[data-mes]').forEach((b) => b.addEventListener('click', () => {
        el.querySelectorAll('[data-mes]').forEach((x) => x.classList.toggle('elegido', x === b));
        const i = Number(b.dataset.mes);
        texto.textContent = ms ? `${MESES_LARGOS[i][0].toUpperCase()}${MESES_LARGOS[i].slice(1)}: ${fmt(ms.meses[i], 1)} % de nieve, en promedio` : `${MESES_LARGOS[i][0].toUpperCase()}${MESES_LARGOS[i].slice(1)} (ilustración)`;
      }));
    }
  }
};
