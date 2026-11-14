// Estadística de tendencias (la misma de backend/scripts/generar_lecciones.py):
//   pendiente de Sen (mediana de las pendientes entre todos los pares de años)
//   prueba de Mann-Kendall (S, varianza con empates, p de dos colas con la aproximación normal)
// Los años sin dato (null) no entran: nunca se cuentan como 0.

// p de dos colas de una normal: erfc(|z| / √2)
function erfc(x) {
  // Aproximación de Numerical Recipes (error < 1,2e-7)
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806
    + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? y : 2 - y;
}

const mediana = (v) => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

// t: años (o meses corridos), x: valores. Devuelve null si hay menos de 4 puntos con dato.
export function tendencia(t, x) {
  const pares = t.map((ti, i) => [ti, x[i]]).filter(([ti, xi]) => Number.isFinite(ti) && Number.isFinite(xi));
  const n = pares.length;
  if (n < 4) return null;
  const T = pares.map((p) => p[0]), X = pares.map((p) => p[1]);
  let s = 0, subio = 0, bajo = 0;
  const pend = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = X[j] - X[i];
      if (d > 0) { s += 1; subio += 1; } else if (d < 0) { s -= 1; bajo += 1; }
      if (T[j] !== T[i]) pend.push(d / (T[j] - T[i]));
    }
  }
  // Varianza de S con corrección por empates
  const grupos = new Map();
  X.forEach((v) => grupos.set(v, (grupos.get(v) ?? 0) + 1));
  let empates = 0;
  grupos.forEach((g) => { empates += g * (g - 1) * (2 * g + 5); });
  const varS = (n * (n - 1) * (2 * n + 5) - empates) / 18;
  const z = varS > 0 && s !== 0 ? (s > 0 ? (s - 1) : (s + 1)) / Math.sqrt(varS) : 0;
  const p = s === 0 || varS <= 0 ? 1 : erfc(Math.abs(z) / Math.SQRT2);
  const sen = mediana(pend);
  const intercepto = mediana(X.map((xi, i) => xi - sen * T[i]));
  return {
    n, s, subio, bajo, z, p,
    pendientePorAnio: sen,
    pendientePorDecada: sen * 10,
    intercepto,
    veredicto: p < 0.05 ? 'real' : 'todavia_no_se_sabe',
    rumbo: sen < 0 ? 'bajó' : sen > 0 ? 'subió' : 'no cambió'
  };
}

// Promedio por año de los meses de la ventana (p. ej. [8, 9]) a partir de una serie mensual 'AAAA-MM'
export function seriePorAnio(meses, valores, ventana = [8, 9]) {
  const porAnio = new Map();
  meses.forEach((m, i) => {
    const a = Number(String(m).slice(0, 4)), mes = Number(String(m).slice(5, 7)), v = valores[i];
    if (!ventana.includes(mes)) return;
    if (!porAnio.has(a)) porAnio.set(a, []);
    if (Number.isFinite(v)) porAnio.get(a).push(v);
  });
  const anios = [...porAnio.keys()].sort((a, b) => a - b);
  return {
    anios,
    valores: anios.map((a) => { const v = porAnio.get(a); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; })
  };
}
