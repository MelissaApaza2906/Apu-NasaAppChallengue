// APU · Nieve (MODIS) y lluvia (GPM IMERG) mensuales, 2001–2024, de 9 glaciares. Exporta apu_9_glaciares.csv.
var R = function (id, caja) { return ee.Feature(ee.Geometry.Rectangle(caja), {id: id}); };
var REGIONES = ee.FeatureCollection([
  R('cordillera-blanca', [-77.80, -9.60, -77.20, -8.60]),
  R('patagonia',         [-74.00, -51.50, -72.80, -48.30]),
  R('alaska',            [-148.00, 60.80, -146.00, 61.60]),
  R('groenlandia',       [-51.00, 68.90, -48.00, 69.40]),
  R('vatnajokull',       [-18.30, 63.90, -15.20, 64.80]),
  R('alpes',             [7.90, 46.35, 8.20, 46.60]),
  R('kilimanjaro',       [37.25, -3.15, 37.45, -3.00]),
  R('karakorum',         [76.00, 35.50, 76.90, 35.95]),
  R('himalaya',          [86.70, 27.85, 87.10, 28.10])
]);
var modis = ee.ImageCollection('MODIS/061/MOD10A1').select('NDSI_Snow_Cover');
var gpm   = ee.ImageCollection('NASA/GPM_L3/IMERG_MONTHLY_V07').select('precipitation');
var inicio = ee.Date('2001-01-01');
var filas = ee.FeatureCollection(ee.List.sequence(0, 287).map(function (m) {
  var d0 = inicio.advance(m, 'month'), d1 = d0.advance(1, 'month');
  var nieve = modis.filterDate(d0, d1).map(function (i) { return i.updateMask(i.lte(100)); }).mean().rename('nieve');
  var lluvia = gpm.filterDate(d0, d1).mean().multiply(d1.difference(d0, 'hour')).rename('lluvia');
  return nieve.addBands(lluvia)
    .reduceRegions({collection: REGIONES, reducer: ee.Reducer.mean(), scale: 500, tileScale: 8})
    .map(function (f) { return f.set('fecha', d0.format('YYYY-MM-01')); });
})).flatten();
Export.table.toDrive({collection: filas, description: 'apu_9_glaciares', fileFormat: 'CSV', selectors: ['id', 'fecha', 'nieve', 'lluvia']});
