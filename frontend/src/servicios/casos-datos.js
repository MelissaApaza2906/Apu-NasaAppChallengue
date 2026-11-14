// Datos reales de cada caso. Nada se inventa: lo que falta queda en null ("—" o "datos en camino").
//   Caso 01: public/datos/cordillera-real.json (MODIS MOD10A1 y GPM IMERG de NASA, 2001–2025), recuadro GRANDE.
//            Serie del caso = por año, promedio de los meses de la ventana (ago y sep) de variables.nieve.valores.
//            Si existen datos/lecciones/cordillera-real/{series,pruebas}.json, suman "medio", "solo glaciares"
//            y las pruebas de umbral, años que se copian y El Niño.
//   Otros:   datos/lecciones/<id>/series.json y pruebas.json (nieve_regiones.js + generar_lecciones.py).
//            Sin series.json el caso no tiene datos: "DATOS EN CAMINO".
// Pendiente de Sen ×10 y p de Mann-Kendall: servicios/estadistica.js (se calculan aquí, en el navegador).
import { tendencia, seriePorAnio } from './estadistica.js';
import { cargarRegion } from './datos.js';
import { MESES_NOMBRES } from '../contenido/casos.js';

const cache = new Map();

async function leerJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(ruta);
  return r.json(); // si el servidor devuelve index.html, lanza: el dato queda null
}
const intentar = (p) => p.catch(() => null);

// "agosto y septiembre" → [8, 9]
function mesesDeTexto(t) {
  const ms = String(t ?? '').toLowerCase().split(/\s*(?:,|y)\s*/).map((x) => MESES_NOMBRES.indexOf(x.trim()) + 1).filter((m) => m > 0);
  return ms.length ? ms : null;
}

// Píxeles de 500 m que caben en una caja [oeste, sur, este, norte] (geometría, no un dato medido)
export function pixelesDeCaja([o, s, e, n]) {
  const latMedia = ((s + n) / 2) * Math.PI / 180;
  const ancho = (e - o) * 111.32 * Math.cos(latMedia), alto = (n - s) * 110.57;
  return Math.round((ancho * 2) * (alto * 2) / 100) * 100;
}

function serieDeCombo(combo) {
  const anual = Array.isArray(combo?.anual) ? combo.anual.filter((f) => Number.isFinite(f?.anio)) : [];
  if (!anual.some((f) => Number.isFinite(f.nieve))) return null;
  return { anios: anual.map((f) => f.anio), valores: anual.map((f) => (Number.isFinite(f.nieve) ? f.nieve : null)) };
}

const conStats = (s) => (s ? { ...s, stats: tendencia(s.anios, s.valores) } : null);

// Estado de una prueba: misma dirección y p < 0,05 → verde; misma dirección pero p entre 0,05 y 0,10 → amarillo
function estadoPrueba(base, pendiente, p) {
  if (!Number.isFinite(pendiente) || !Number.isFinite(p)) return 'camino';
  const misma = Math.sign(pendiente) === Math.sign(base.pendientePorAnio);
  if (!misma || p >= 0.10) return 'rojo';
  return p < 0.05 ? 'verde' : 'amarillo';
}
const peor = (a, b) => ['rojo', 'amarillo', 'verde'].find((x) => x === a || x === b) ?? 'camino';

export function cargarDatosCaso(caso) {
  if (!caso) return Promise.resolve(null);
  if (cache.has(caso.id)) return cache.get(caso.id);
  const prom = (async () => {
    const [region, series, pruebasJ] = await Promise.all([
      intentar(cargarRegion(caso.id)),
      intentar(leerJSON(`/datos/lecciones/${caso.id}/series.json`)),
      intentar(leerJSON(`/datos/lecciones/${caso.id}/pruebas.json`))
    ]);
    const nieve = region?.variables?.nieve;
    const combos = series?.combinaciones ?? {};
    const comboDe = (r) => combos[`${r}_40_50`] ?? Object.values(combos).find((x) => x?.region === r && x?.umbral === 40) ?? null;

    // Serie base (recuadro grande)
    let base = null, fuente = null, unidad = null;
    const ventana = mesesDeTexto(series?.ventana) ?? caso.meses;
    if (caso.id === 'cordillera-real' && Array.isArray(nieve?.meses) && Array.isArray(nieve?.valores)) {
      base = seriePorAnio(nieve.meses, nieve.valores, caso.meses);
      fuente = 'MODIS MOD10A1 (NASA)';
      unidad = 'índice de nieve promedio';
    } else if (series) {
      base = serieDeCombo(comboDe('grande') ?? combos[series.base]);
      fuente = series.fuente ?? 'MODIS MOD10A1 (NASA)';
      unidad = series.unidad ?? '% de píxeles visibles con nieve';
    }
    if (!base || base.valores.filter(Number.isFinite).length < 4) return null; // sin datos: DATOS EN CAMINO
    const stats = tendencia(base.anios, base.valores);

    // Las 3 escenas: grande siempre; medio y solo glaciares cuando series.json las trae
    const escenas = {
      grande: { ...base, stats, pixeles: pixelesDeCaja(caso.caja) },
      medio: series ? conStats(serieDeCombo(comboDe('medio'))) : null,
      glaciares: series ? conStats(serieDeCombo(comboDe('glaciares'))) : null
    };
    // Si la región tiene caja medio la decide la pista Escena (componentes/casos/capas-escena.js → CAJAS);
    // aquí solo se dice si series.json trae la serie. (No se importa capas-escena: cargaría Cesium en las lecciones.)
    const tieneMedio = Boolean(escenas.medio);

    // Las 5 pruebas
    const pr = new Map((Array.isArray(pruebasJ?.pruebas) ? pruebasJ.pruebas : []).map((p) => [p.id, p]));
    const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d).replace('.', ',').replace('-', '−') : '—');
    const pruebas = [];
    // 1. Todo el año (todos los meses, no solo la ventana)
    if (nieve && Number.isFinite(nieve.tendencia_por_decada) && Number.isFinite(nieve.p)) {
      pruebas.push({ id: 'todo', nombre: `Todo el año: ${fmt(nieve.tendencia_por_decada, 2)} · p = ${fmt(nieve.p, 3)}`, estado: estadoPrueba(stats, nieve.tendencia_por_decada, nieve.p), nota: '' });
    } else pruebas.push({ id: 'todo', nombre: 'Todo el año', estado: 'camino' });
    // 2. Lluvia GPM: si la lluvia no cambió de forma clara, la falta de lluvia no explica la baja
    const ll = region?.variables?.lluvia;
    if (ll && Number.isFinite(ll.p) && Number.isFinite(ll.tendencia_por_decada)) {
      const explica = ll.p < 0.05 && Math.sign(ll.tendencia_por_decada) === Math.sign(stats.pendientePorAnio);
      pruebas.push({ id: 'lluvia', nombre: `Lluvia GPM: p = ${fmt(ll.p, 2)}`, estado: explica ? 'amarillo' : 'verde', nota: explica ? 'la lluvia también cambió' : 'no lo explica', lluvia: { pendiente: ll.tendencia_por_decada, p: ll.p } });
    } else pruebas.push({ id: 'lluvia', nombre: 'Lluvia GPM', estado: 'camino' });
    // 3–5: de pruebas.json
    const u30 = pr.get('umbral30'), u50 = pr.get('umbral50');
    pruebas.push(u30 || u50 ? { id: 'umbral', nombre: 'Umbral 30 y 50', estado: peor(u30?.semaforo, u50?.semaforo) } : { id: 'umbral', nombre: 'Umbral 30 y 50', estado: 'camino' });
    const auto = pr.get('autocorrelacion');
    pruebas.push(auto ? { id: 'autocorrelacion', nombre: 'Años que se copian', estado: auto.semaforo } : { id: 'autocorrelacion', nombre: 'Años que se copian', estado: 'camino' });
    const nino = pr.get('sin_nino');
    pruebas.push(nino ? { id: 'nino', nombre: 'Sin El Niño fuerte', estado: nino.semaforo } : { id: 'nino', nombre: 'Sin El Niño fuerte', estado: 'camino' });
    pruebas.forEach((p) => { if (!['verde', 'amarillo', 'rojo'].includes(p.estado)) p.estado = 'camino'; });
    const listas = pruebas.filter((p) => p.estado !== 'camino');

    return {
      caso, fuente, unidad, ventana, region: region?.nombre ?? caso.nombre,
      serie: base, stats, escenas, tieneMedio, pruebas,
      nPruebas: listas.length, nOk: listas.filter((p) => p.estado !== 'rojo').length,
      meses: nieve && Number.isFinite(nieve.bajo) && Array.isArray(nieve.meses) ? { bajaron: nieve.bajo, total: nieve.meses.length } : null,
      anios: base.valores.filter(Number.isFinite).length,
      desde: base.anios[0], hasta: base.anios[base.anios.length - 1]
    };
  })().catch((e) => { console.warn('APU: no se pudieron leer los datos del caso', caso.id, e); return null; });
  cache.set(caso.id, prom);
  return prom;
}
