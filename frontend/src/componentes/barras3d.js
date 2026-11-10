// Barras 3D del dato anual sobre la Cordillera Real (datos reales de cordillera-real.json).
//
//   const barras = crearBarras(viewer, { anios, valores, destacado: 2016, decimales: 2 });
//   barras.destacar(2020);
//   barras.destruir();
//
// Una columna por año, en fila a lo largo de la cordillera: del Illampu (noroeste, primer año)
// al Illimani (sureste, último año). Altura proporcional al valor (el más alto mide altoMaximo).
// El año destacado va en rojo. Al tocar una columna aparece su año y su valor.
import * as Cesium from 'cesium';

export const LINEA_BARRAS = {
  desde: { lat: -15.82, lon: -68.57 }, // Illampu
  hasta: { lat: -16.64, lon: -67.79 }  // Illimani
};

const POR_DEFECTO = {
  ...LINEA_BARRAS,
  altoMaximo: 45_000, // metros de la columna con el valor más alto
  radio: 1_900,       // metros
  verHasta: 2_500_000, // metros de la cámara a la columna
  destacado: null,
  decimales: 2,
  unidad: ''
};

const CELESTE = Cesium.Color.fromCssColorString('#8FDBFF').withAlpha(0.92); // --dato-nieve
const ROJO = Cesium.Color.fromCssColorString('#D12021');                    // --rojo-apu
const coma = (x, d) => x.toFixed(d).replace('.', ',');

export function crearBarras(viewer, opciones = {}) {
  const op = { ...POR_DEFECTO, ...opciones };
  const { anios = [], valores = [] } = op;
  if (!viewer || !anios.length) return { destacar() {}, destruir() {} };

  const fuente = new Cesium.CustomDataSource('apu-barras');
  viewer.dataSources.add(fuente);
  const n = anios.length;
  const mayor = Math.max(...valores);
  const columnas = new Map();
  const texto = (anio) => ({
    text: String(anio),
    font: '600 13px Inter, sans-serif',
    fillColor: Cesium.Color.fromCssColorString('#F2F4F8'),
    outlineColor: Cesium.Color.fromCssColorString('#081230'),
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    pixelOffset: new Cesium.Cartesian2(0, -6),
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, op.verHasta),
    disableDepthTestDistance: Number.POSITIVE_INFINITY
  });

  anios.forEach((anio, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const lat = op.desde.lat + (op.hasta.lat - op.desde.lat) * t;
    const lon = op.desde.lon + (op.hasta.lon - op.desde.lon) * t;
    const alto = Math.max(500, (valores[i] / mayor) * op.altoMaximo);
    const e = fuente.entities.add({
      id: `apu-barra-${anio}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, alto / 2),
      cylinder: {
        length: alto,
        topRadius: op.radio,
        bottomRadius: op.radio,
        material: CELESTE,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, op.verHasta)
      },
      properties: { anio, valor: valores[i] }
    });
    columnas.set(anio, e);
    // Año escrito encima de la primera y la última columna
    if (i === 0 || i === n - 1) {
      fuente.entities.add({ position: Cesium.Cartesian3.fromDegrees(lon, lat, alto), label: texto(anio) });
    }
  });

  // Etiqueta del año destacado (encima de su columna) y del que se toca
  const marca = fuente.entities.add({ position: Cesium.Cartesian3.ZERO, label: { ...texto(''), show: false } });
  function etiquetar(anio) {
    const e = columnas.get(anio);
    if (!e) { marca.label.show = false; return; }
    const { valor } = e.properties.getValue(Cesium.JulianDate.now());
    const c = Cesium.Cartographic.fromCartesian(e.position.getValue(Cesium.JulianDate.now()));
    marca.position = Cesium.Cartesian3.fromRadians(c.longitude, c.latitude, c.height * 2);
    marca.label.text = `${anio} · ${coma(valor, op.decimales)}${op.unidad}`;
    marca.label.show = true;
  }

  let destacado = null;
  function destacar(anio) {
    columnas.get(destacado)?.cylinder && (columnas.get(destacado).cylinder.material = CELESTE);
    destacado = columnas.has(anio) ? anio : null;
    if (destacado !== null) columnas.get(destacado).cylinder.material = ROJO;
    etiquetar(destacado);
    viewer.scene.requestRender();
  }
  destacar(op.destacado);

  // Toque: muestra año y valor de esa columna (se acepta hasta 22 px alrededor: la columna es fina)
  const manejador = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  manejador.setInputAction((clic) => {
    for (const [dx, dy] of [[0, 0], [-11, 0], [11, 0], [0, -11], [0, 11], [-22, 0], [22, 0], [0, -22], [0, 22]]) {
      const p = viewer.scene.pick(new Cesium.Cartesian2(clic.position.x + dx, clic.position.y + dy));
      const anio = p?.id?.properties?.anio?.getValue();
      if (anio !== undefined && columnas.get(anio) === p.id) { destacar(anio); return; }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  viewer.scene.requestRender();
  return {
    destacar,
    destruir() {
      manejador.destroy();
      if (!viewer.isDestroyed()) { viewer.dataSources.remove(fuente, true); viewer.scene.requestRender(); }
    }
  };
}
