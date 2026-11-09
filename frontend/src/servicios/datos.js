// Lee los resultados reales que genera el backend (frontend/public/datos/*.json).
const cache = new Map();

export async function cargarRegion(id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Región no válida');
  if (!cache.has(id)) {
    cache.set(id, fetch(`/datos/${id}.json`).then((r) => {
      if (!r.ok) throw new Error(`No hay datos para ${id}`);
      return r.json();
    }));
  }
  return cache.get(id);
}
