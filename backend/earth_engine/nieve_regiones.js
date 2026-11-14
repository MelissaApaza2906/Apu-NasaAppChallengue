// APU · Nieve de MODIS (NASA) para los 11 casos (cordilleras del mundo), 2001–2025.
// Crea UNA tarea de exportación por región: nieve_<id>.csv con los días de la ventana de cada región.
// Columnas iguales a nieve_agosep_cordillera_real.csv para que generar_lecciones.py las lea:
//   grande = recuadro completo · medio = el mismo recuadro (solo la Cordillera Real tiene recuadro medio)
//   glaciares = contornos GLIMS (si GLIMS no tiene contornos en el recuadro, usa el recuadro).
// Uso: code.earthengine.google.com → pegar → Run → Tasks → RUN en cada tarea. Los CSV llegan a Google Drive.
// Ventana = fin de la temporada de deshielo de cada región (los mismos meses todos los años).

var REGIONES = {
  'cordillera-real':   { caja: [-68.70, -16.80, -67.60, -15.70], meses: [8, 9] },
  'cordillera-blanca': { caja: [-77.90, -10.00, -77.10,  -8.60], meses: [8, 9] },
  'patagonia':         { caja: [-74.00, -51.00, -72.80, -49.50], meses: [2, 3] },
  'alaska':            { caja: [-147.60, 60.90, -146.60, 61.40], meses: [8, 9] },
  'groenlandia':       { caja: [-50.50, 68.80, -48.50, 69.40],   meses: [8, 9] },
  'vatnajokull':       { caja: [-18.00, 63.90, -15.30, 64.80],   meses: [8, 9] },
  'alpes':             { caja: [7.80, 46.35, 8.25, 46.60],       meses: [8, 9] },
  'kilimanjaro':       { caja: [37.25, -3.15, 37.45, -3.00],     meses: [8, 9] },
  'karakorum':         { caja: [76.00, 35.50, 76.80, 36.00],     meses: [8, 9] },
  'himalaya':          { caja: [86.60, 27.80, 87.10, 28.10],     meses: [10, 11] },
  'antartida':         { caja: [-64.00, -65.50, -58.00, -63.50], meses: [2, 3] }
};
// Para exportar solo algunas, deja aquí sus id (vacío = todas):
var SOLO = [];

var umbrales = [30, 40, 50];
var bandas = ['total', 'validos', 'nubes', 'noche', 'nieve30', 'nieve40', 'nieve50'];
var nombres = ['grande', 'medio', 'glaciares'];
var proj = ee.Projection('EPSG:4326').atScale(500);
var modis = ee.ImageCollection('MODIS/061/MOD10A1').filterDate('2001-01-01', '2026-01-01')
  .select(['NDSI_Snow_Cover', 'NDSI_Snow_Cover_Class']);

function capas(img) {
  var v = img.select('NDSI_Snow_Cover').unmask(255);
  var clase = img.select('NDSI_Snow_Cover_Class').unmask(0);
  var lista = [ee.Image(1).rename('total'), v.lte(100).rename('validos'),
    clase.eq(250).rename('nubes'), clase.eq(211).rename('noche')];
  umbrales.forEach(function (u) { lista.push(v.gte(u).and(v.lte(100)).rename('nieve' + u)); });
  return ee.Image.cat(lista);
}

var columnas = ['fecha'];
nombres.forEach(function (r) { bandas.forEach(function (b) { columnas.push(r + '_' + b); }); });

Object.keys(REGIONES).forEach(function (id) {
  if (SOLO.length && SOLO.indexOf(id) < 0) return;
  var cfg = REGIONES[id];
  var caja = ee.Geometry.Rectangle(cfg.caja);
  var glims = ee.FeatureCollection('GLIMS/20230607').filterBounds(caja)
    .filter(ee.Filter.eq('line_type', 'glac_bound'));
  var mGlac = ee.Image(ee.Algorithms.If(glims.size().gt(0),
    ee.Image(0).paint(glims, 1), ee.Image(1))).reproject(proj).clip(caja);
  var regiones = { grande: ee.Image(1), medio: ee.Image(1), glaciares: mGlac };

  function conteos(img) {
    var base = capas(img);
    var partes = nombres.map(function (r) {
      return base.multiply(regiones[r]).rename(bandas.map(function (b) { return r + '_' + b; }));
    });
    var suma = ee.Image.cat(partes).reduceRegion({
      reducer: ee.Reducer.sum(), geometry: caja, crs: proj, maxPixels: 1e9, tileScale: 2
    });
    return ee.Feature(null, suma).set('fecha', img.date().format('YYYY-MM-dd'));
  }
  var col = modis.filterBounds(caja)
    .filter(ee.Filter.calendarRange(cfg.meses[0], cfg.meses[1], 'month'));
  print(id + ' · días en la ventana:', col.size(), '· contornos GLIMS:', glims.size());
  Export.table.toDrive({
    collection: col.map(conteos),
    description: 'nieve_' + id.replace(/-/g, '_'),
    fileFormat: 'CSV',
    selectors: columnas
  });
});
