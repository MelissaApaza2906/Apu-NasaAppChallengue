// Gráficos pequeños del panel, dibujados con SVG a partir del JSON real.

// Pendiente de Sen + punto de corte, para dibujar la línea de tendencia
function lineaSen(x, y) {
  const pend = [];
  for (let i = 0; i < x.length; i++) {
    for (let j = i + 1; j < x.length; j++) pend.push((y[j] - y[i]) / (x[j] - x[i]));
  }
  pend.sort((a, b) => a - b);
  const m = mediana(pend);
  const b = mediana(x.map((xi, i) => y[i] - m * xi));
  return { m, b };
}

function mediana(v) {
  const s = [...v].sort((a, b) => a - b);
  const k = s.length;
  return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2;
}

// Línea de valores anuales + línea de tendencia + año destacado
export function graficoAnual(anios, valores, { color = '#7FD0FF', destacar = null } = {}) {
  const W = 300, H = 120, mx = 34, my = 14;
  const min = Math.min(...valores), max = Math.max(...valores);
  const rango = max - min || 1;
  const X = (a) => mx + (a - anios[0]) / (anios[anios.length - 1] - anios[0]) * (W - mx - 8);
  const Y = (v) => H - my - (v - min) / rango * (H - 2 * my);

  const puntos = anios.map((a, i) => `${X(a).toFixed(1)},${Y(valores[i]).toFixed(1)}`).join(' ');
  const { m, b } = lineaSen(anios, valores);
  const a0 = anios[0], a1 = anios[anios.length - 1];

  let extra = '';
  if (destacar !== null && anios.includes(destacar)) {
    const v = valores[anios.indexOf(destacar)];
    extra = `<circle cx="${X(destacar)}" cy="${Y(v)}" r="4.5" fill="#FF8A2A" stroke="#060B26" stroke-width="1.5"/>
      <text x="${X(destacar)}" y="${Y(v) - 9}" fill="#FFB37A" font-size="10" text-anchor="middle" font-family="JetBrains Mono, monospace">${destacar}</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Valor de cada año de ${a0} a ${a1}, con su línea de tendencia" class="grafico">
    <line x1="${mx}" y1="${my}" x2="${W - 8}" y2="${my}" stroke="rgba(63,180,255,.15)"/>
    <line x1="${mx}" y1="${H - my}" x2="${W - 8}" y2="${H - my}" stroke="rgba(63,180,255,.15)"/>
    <text x="${mx - 6}" y="${my + 4}" fill="#A9BEE8" font-size="10" text-anchor="end" font-family="Inter, sans-serif">${redondear(max)}</text>
    <text x="${mx - 6}" y="${H - my + 4}" fill="#A9BEE8" font-size="10" text-anchor="end" font-family="Inter, sans-serif">${redondear(min)}</text>
    <text x="${mx}" y="${H}" fill="#A9BEE8" font-size="10" font-family="Inter, sans-serif">${a0}</text>
    <text x="${W - 8}" y="${H}" fill="#A9BEE8" font-size="10" text-anchor="end" font-family="Inter, sans-serif">${a1}</text>
    <polyline points="${puntos}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
    <line x1="${X(a0)}" y1="${Y(m * a0 + b)}" x2="${X(a1)}" y2="${Y(m * a1 + b)}" stroke="#FF8A2A" stroke-width="3" stroke-linecap="round"/>
    ${extra}
  </svg>`;
}

// Barra "bajó / subió"
export function barraComparaciones(bajo, subio) {
  const total = bajo + subio || 1;
  const pb = (bajo / total * 100).toFixed(1);
  return `<div class="barra-comp" role="img" aria-label="Bajó ${bajo} veces y subió ${subio} veces">
    <span class="bajo" style="width:${pb}%">bajó ${bajo}</span>
    <span class="subio">subió ${subio}</span>
  </div>`;
}

function redondear(v) {
  return Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1);
}
