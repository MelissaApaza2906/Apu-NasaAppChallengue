// Barras 3D del dato anual junto a la montaña (datos reales del JSON de la región: variables.<v>.anios / anual).
//
//   const barras = crearBarras(viewer, { anios, valores, desde, hasta, relieveListo, alElegir: (anio) => … });
//   barras.destacar(2020);   // la barra de ese año en rojo, sube con animación; null: ninguna
//   barras.mostrar(false);   // oculta / muestra la fila
//   barras.destruir();
//
// Una barra por año, en fila de `desde` (primer año) a `hasta` (último año), paradas sobre el suelo
// (se mide la altura del terreno bajo cada barra; sin relieve, sobre el elipsoide).
// Altura proporcional al valor (el más alto mide altoMaximo). Azul si el valor está sobre el promedio
// de todos los años, gris-rojo si está debajo. El año va escrito bajo cada barra.
// Al tocar una barra (o su año) se llama alElegir(anio).
//
// Cada barra es un Cesium.Primitive (una caja de 1 m escalada con su modelMatrix) y no una entidad:
// así el color y el alto cambian al instante, sin rehacer la geometría (con entidades, cada cambio
// mandaba a rehacer la caja a un worker y en la reproducción de 1 año por segundo no llegaba a verse).
import * as Cesium from 'cesium';

const POR_DEFECTO = {
  altoMaximo: 700,   // metros de la barra con el valor más alto
  radio: 45,         // metros (media anchura de la barra)
  verHasta: 60_000,  // metros de la cámara a la etiqueta del año
  alElegir: null
};

const AZUL = Cesium.Color.fromCssColorString('#4F8DFF');      // sobre el promedio
const GRIS_ROJO = Cesium.Color.fromCssColorString('#9C7A7E'); // debajo del promedio
const ROJO = Cesium.Color.fromCssColorString('#FF2D2E');      // año actual (--rojo-apu, iluminado)
const SUBIDA_MS = 650;

export function crearBarras(viewer, opciones = {}) {
  const op = { ...POR_DEFECTO, ...opciones };
  const { anios = [], valores = [], desde, hasta } = op;
  const nada = { destacar() {}, mostrar() {}, destruir() {} };
  if (!viewer || viewer.isDestroyed() || !anios.length || !desde || !hasta) return nada;

  const scene = viewer.scene;
  const fuente = new Cesium.CustomDataSource('apu-barras'); // las etiquetas de los años
  viewer.dataSources.add(fuente);
  const cajas = scene.primitives.add(new Cesium.PrimitiveCollection());
  const n = anios.length;
  const mayor = Math.max(...valores);
  const promedio = valores.reduce((s, x) => s + x, 0) / n;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ver = new Cesium.DistanceDisplayCondition(0, op.verHasta);
  const barras = new Map(); // anio → { primitiva, alto, color, factor, lon, lat, suelo }
  const unidad = Cesium.BoxGeometry.fromDimensions({
    dimensions: new Cesium.Cartesian3(1, 1, 1),
    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
  });

  anios.forEach((anio, i) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const lat = desde.lat + (hasta.lat - desde.lat) * t;
    const lon = desde.lon + (hasta.lon - desde.lon) * t;
    const alto = Math.max(20, (valores[i] / mayor) * op.altoMaximo);
    const color = valores[i] >= promedio ? AZUL : GRIS_ROJO;
    const b = { alto, color, factor: 1, lon, lat, suelo: 0, id: { apuBarra: anio } };
    b.primitiva = cajas.add(new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: unidad,
        id: b.id,
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(color) }
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: false, closed: true }),
      asynchronous: false,
      modelMatrix: matriz(b, 1)
    }));
    // Año bajo la barra (pegado al suelo, el texto debajo del pie)
    fuente.entities.add({
      id: `apu-barra-${anio}`,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      label: {
        text: String(anio),
        font: '600 11px Inter, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#F2F4F8'),
        outlineColor: Cesium.Color.fromCssColorString('#081230'),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 4),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        distanceDisplayCondition: ver,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      properties: { anio, valor: valores[i] }
    });
    barras.set(anio, b);
  });

  // Caja de 1 m → barra: pie en el suelo, ancho 2·radio, alto = alto · factor
  function matriz(b, factor) {
    const h = Math.max(1, b.alto * factor);
    const base = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(b.lon, b.lat, b.suelo));
    const local = Cesium.Matrix4.fromTranslationRotationScale(new Cesium.TranslationRotationScale(
      new Cesium.Cartesian3(0, 0, h / 2), Cesium.Quaternion.IDENTITY, new Cesium.Cartesian3(op.radio * 2, op.radio * 2, h)));
    return Cesium.Matrix4.multiply(base, local, new Cesium.Matrix4());
  }
  function ponerAlto(b, factor) {
    b.factor = factor;
    b.primitiva.modelMatrix = matriz(b, factor);
  }
  function ponerColor(b, color) {
    try { b.primitiva.getGeometryInstanceAttributes(b.id).color = Cesium.ColorGeometryInstanceAttribute.toValue(color); }
    catch { /* la primitiva todavía no se dibujó: se reintenta en el siguiente cuadro */ requestAnimationFrame(() => { if (vivo) { try { b.primitiva.getGeometryInstanceAttributes(b.id).color = Cesium.ColorGeometryInstanceAttribute.toValue(color); scene.requestRender(); } catch { /* nada */ } } }); }
  }

  // Suelo bajo cada barra (con la exageración del relieve, si la hay)
  let vivo = true;
  // (op.relieveListo: promesa de la vista de la montaña; el relieve de Cesium ion llega después de crearla)
  Promise.resolve(op.relieveListo).catch(() => {}).then(() => {
    if (!vivo || viewer.isDestroyed() || !(scene.terrainProvider instanceof Cesium.CesiumTerrainProvider)) return;
    const lista = [...barras.values()];
    return Cesium.sampleTerrainMostDetailed(scene.terrainProvider, lista.map((b) => Cesium.Cartographic.fromDegrees(b.lon, b.lat)))
      .then((cs) => {
        if (!vivo || viewer.isDestroyed()) return;
        const ex = scene.verticalExaggeration ?? 1;
        cs.forEach((c, i) => { if (Number.isFinite(c?.height)) { lista[i].suelo = c.height * ex; ponerAlto(lista[i], lista[i].factor); } });
        scene.requestRender();
      });
  }).catch(() => {});

  let destacado = null;
  let animacion = 0;
  function destacar(anio) {
    cancelAnimationFrame(animacion);
    const antes = barras.get(destacado);
    if (antes) { ponerColor(antes, antes.color); ponerAlto(antes, 1); }
    destacado = barras.has(anio) ? anio : null;
    const b = barras.get(destacado);
    if (b) {
      ponerColor(b, ROJO);
      if (sinMovimiento.matches) ponerAlto(b, 1);
      else {
        const inicio = performance.now();
        const paso = (ahora) => {
          const k = Math.min(1, (ahora - inicio) / SUBIDA_MS);
          ponerAlto(b, 1 - (1 - k) ** 3); // sale rápido y frena arriba
          if (!viewer.isDestroyed()) scene.requestRender();
          if (k < 1) animacion = requestAnimationFrame(paso);
        };
        ponerAlto(b, 0);
        animacion = requestAnimationFrame(paso);
      }
    }
    if (!viewer.isDestroyed()) scene.requestRender();
  }

  // Toque: la barra (o su año) elige ese año. Se acepta hasta 12 px alrededor: la barra es fina.
  const manejador = new Cesium.ScreenSpaceEventHandler(scene.canvas);
  manejador.setInputAction((clic) => {
    for (const [dx, dy] of [[0, 0], [-6, 0], [6, 0], [0, -6], [0, 6], [-12, 0], [12, 0]]) {
      const p = scene.pick(new Cesium.Cartesian2(clic.position.x + dx, clic.position.y + dy));
      const anio = p?.id?.apuBarra ?? (fuente.entities.contains(p?.id) ? p.id.properties?.anio?.getValue() : undefined);
      if (anio !== undefined && barras.has(anio)) { op.alElegir?.(anio); return; }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  scene.requestRender();
  return {
    destacar,
    mostrar(si) { fuente.show = cajas.show = Boolean(si); if (!viewer.isDestroyed()) scene.requestRender(); },
    destruir() {
      vivo = false;
      cancelAnimationFrame(animacion);
      manejador.destroy();
      if (!viewer.isDestroyed()) { viewer.dataSources.remove(fuente, true); scene.primitives.remove(cajas); scene.requestRender(); }
    }
  };
}
