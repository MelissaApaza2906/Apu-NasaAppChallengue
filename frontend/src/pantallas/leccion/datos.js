// Datos reales de las lecciones. Nada se inventa: si un JSON falta, su parte queda en null y
// la pantalla muestra una ilustración (con la etiqueta "ilustración") y las marcas como "—".
//   public/datos/cordillera-real.json   → nombre de la región y lluvia mensual GPM IMERG (L2 p2)
//   public/datos/lecciones/mensual.json → % de nieve por mes (L7 p1)
//   public/datos/lecciones/series.json  → serie de agosto–septiembre, pendiente y p (L8 p4, L9, L10)
//   public/datos/lecciones/pruebas.json → las pruebas con semáforo (L10)
//   public/datos/lecciones/dias_ejemplo.json → 61 días de un año (L8 p1)
// Los JSON de lecciones/ los escribe backend/scripts/generar_lecciones.py.
import { cargarRegion } from '../../servicios/datos.js';

const REGION = 'cordillera-real';
let cache = null;

async function leerJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(ruta);
  return r.json(); // si el servidor devuelve index.html, esto lanza y el dato queda null
}
const intentar = (p) => p.catch(() => null);
const numero = (v) => (Number.isFinite(v) ? v : null);

// Promedio de cada mes (ene…dic) a partir de los valores mensuales reales
function promedioPorMes(meses, valores) {
  if (!Array.isArray(meses) || !Array.isArray(valores)) return null;
  const suma = Array(12).fill(0), n = Array(12).fill(0);
  meses.forEach((m, i) => {
    const k = Number(String(m).slice(5, 7)) - 1, v = valores[i];
    if (k >= 0 && k < 12 && Number.isFinite(v)) { suma[k] += v; n[k] += 1; }
  });
  return n.every((x) => x > 0) ? suma.map((s, i) => s / n[i]) : null;
}

export function cargarDatos() {
  if (cache) return cache;
  cache = (async () => {
    const [region, mensual, series, pruebas, dias] = await Promise.all([
      intentar(cargarRegion(REGION)),
      intentar(leerJSON('/datos/lecciones/mensual.json')),
      intentar(leerJSON('/datos/lecciones/series.json')),
      intentar(leerJSON('/datos/lecciones/pruebas.json')),
      intentar(leerJSON('/datos/lecciones/dias_ejemplo.json'))
    ]);
    const d = { region: region?.nombre ?? null };

    // L2 p2: lluvia promedio de cada mes (GPM IMERG)
    const ll = region?.variables?.lluvia;
    const lluvia = promedioPorMes(ll?.meses, ll?.valores);
    d.lluvia = lluvia ? { meses: lluvia, desde: String(ll.desde ?? '').slice(0, 4), hasta: String(ll.hasta ?? '').slice(0, 4), fuente: ll.fuente ?? 'GPM IMERG (NASA)' } : null;

    // L7 p1: % de nieve por mes
    const pm = mensual?.promedio_por_mes;
    d.mensual = Array.isArray(pm) && pm.length === 12 && pm.every((x) => Number.isFinite(x?.nieve))
      ? { meses: pm.map((x) => x.nieve), fuente: mensual.fuente } : null;

    // Serie base de agosto–septiembre
    const base = series?.combinaciones?.[series?.base];
    const anual = Array.isArray(base?.anual) ? base.anual.filter((f) => Number.isFinite(f?.anio)) : [];
    const st = base?.estadistica;
    if (anual.some((f) => Number.isFinite(f.nieve)) && st) {
      const conDato = anual.filter((f) => Number.isFinite(f.nieve));
      d.serie = {
        anios: anual.map((f) => f.anio),
        valores: anual.map((f) => numero(f.nieve)), // null = año sin días útiles (vacío, no cero)
        pendienteAnio: numero(st.pendiente_por_anio), intercepto: numero(st.intercepto),
        pendienteDecada: numero(st.pendiente_por_decada), p: numero(st.p),
        veredicto: st.veredicto ?? null, fuente: series.fuente, unidad: series.unidad,
        desde: conDato[0].anio, hasta: conDato[conDato.length - 1].anio
      };
    } else d.serie = null;

    // Pruebas con semáforo
    d.pruebas = Array.isArray(pruebas?.pruebas)
      ? { lista: pruebas.pruebas.map((p) => ({ nombre: String(p.nombre ?? ''), semaforo: String(p.semaforo ?? '') })), nOk: numero(pruebas.n_ok), n: numero(pruebas.n_pruebas), sugerido: pruebas.veredicto_sugerido ?? null }
      : null;

    // 61 días de ejemplo
    d.dias = Array.isArray(dias?.dias) && dias.dias.length
      ? { anio: dias.anio, lista: dias.dias.map((x) => ({ nieve: numero(x.nieve) ?? 0, sinNieve: numero(x.sin_nieve) ?? 0, nube: numero(x.nube) ?? 0 })) }
      : null;
    return d;
  })();
  return cache;
}

const fmt = (v, dec) => v.toFixed(dec).replace('.', ',');
const conSigno = (v, dec) => `${v < 0 ? '−' : v > 0 ? '+' : ''}${fmt(Math.abs(v), dec)}`;

// Las marcas {p}, {pendiente_decada}… como texto plano. null → la pantalla escribe "—".
export function marcas(d, perfil = {}) {
  const s = d?.serie;
  const hip = String(perfil.hipotesis ?? '').split('|')[0] || null;
  return {
    apodo: String(perfil.apodo ?? '').trim() || null,
    region: d?.region ?? null,
    p: s?.p != null ? (s.p < 0.01 ? '< 0,01' : fmt(s.p, 2)) : null,
    pendiente_decada: s?.pendienteDecada != null ? conSigno(s.pendienteDecada, Math.abs(s.pendienteDecada) >= 10 ? 1 : 2) : null,
    desde: s?.desde ?? null,
    hasta: s?.hasta ?? null,
    n_ok: d?.pruebas?.nOk ?? null,
    n_pruebas: d?.pruebas?.n ?? null,
    hipotesis: hip
  };
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Rellena las marcas. Con html=true el texto trae <b>/<em> de lecciones.js y solo se escapan los valores.
export const rellenar = (t, m, html = false) =>
  String(t ?? '').replace(/\{(\w+)\}/g, (_, k) => (m?.[k] == null || m[k] === '' ? '—' : html ? esc(m[k]) : String(m[k])));
export { esc };
