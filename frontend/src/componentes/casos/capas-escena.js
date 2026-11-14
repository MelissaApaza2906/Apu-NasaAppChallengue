// Capas de la pista Escena sobre la montaña 3D (el viewer compartido de servicios/escena3d.js; no crea otro):
//   el recuadro GRANDE (punteado blanco), el MEDIO (ámbar) y los contornos GLIMS (GeoJSON de
//   backend/earth_engine/glims_contornos.js → public/datos/glims/<id>.geojson).
import * as Cesium from 'cesium';

// [oeste, sur, este, norte]
export const CAJAS = {
  'cordillera-real': {
    grande: [-68.70, -16.80, -67.60, -15.70],
    medio: [-68.35, -16.35, -68.05, -16.05] // Huayna Potosí a Tuni-Condoriri
  }
};

const color = (css) => Cesium.Color.fromCssColorString(css);

// Borde pegado al relieve (los rectángulos con outline no se ven sobre terreno 3D)
export function dibujarBorde(viewer, [o, s, e, n], css, id, punteado = false) {
  const anterior = viewer.entities.getById(id);
  if (anterior) viewer.entities.remove(anterior);
  return viewer.entities.add({
    id,
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([o, s, e, s, e, n, o, n, o, s]),
      width: punteado ? 2.5 : 4,
      clampToGround: true,
      material: punteado
        ? new Cesium.PolylineDashMaterialProperty({ color: color(css), dashLength: 16 })
        : new Cesium.PolylineGlowMaterialProperty({ color: color(css), glowPower: 0.25 })
    }
  });
}

// Contornos de glaciares (GeoJSON exportado de GLIMS). Devuelve null si el archivo no existe.
let glimsActual = null;
export async function dibujarGlims(viewer, idRegion) {
  if (glimsActual) { viewer.dataSources.remove(glimsActual, true); glimsActual = null; }
  const url = `${import.meta.env.BASE_URL}datos/glims/${idRegion}.geojson`;
  const r = await fetch(url, { method: 'HEAD' }).catch(() => null);
  // En desarrollo, Vite responde index.html (200) a un archivo que no existe: tiene que ser JSON
  const tipo = r?.headers.get('content-type') ?? '';
  if (!r || !r.ok || /html/i.test(tipo)) return null;
  try {
    const capa = await Cesium.GeoJsonDataSource.load(url, {
      clampToGround: true,
      fill: color('#4FB0FF').withAlpha(0.35),
      stroke: color('#9FD3FF'),
      strokeWidth: 2
    });
    if (viewer.isDestroyed()) return null;
    glimsActual = capa;
    await viewer.dataSources.add(glimsActual);
    return glimsActual;
  } catch (e) {
    console.warn('APU: no se pudieron leer los contornos GLIMS de', idRegion, e?.message ?? e);
    return null;
  }
}

export function limpiarEscena(viewer) {
  ['caja-grande', 'caja-medio'].forEach((id) => {
    const e = viewer.entities.getById(id);
    if (e) viewer.entities.remove(e);
  });
  if (glimsActual) { viewer.dataSources.remove(glimsActual, true); glimsActual = null; }
}
