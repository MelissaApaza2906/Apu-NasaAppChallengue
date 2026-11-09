// APU · Nieve de MODIS (NASA) en la Cordillera Real, un valor por mes, 2001–2025
// Pegar en https://code.earthengine.google.com y darle Run. El CSV se descarga desde el gráfico (Download CSV).
var caja = ee.Geometry.Rectangle([-68.7, -16.8, -67.6, -15.7]); // la misma zona que la lluvia
var nieve = ee.ImageCollection('MODIS/061/MOD10A1').select('NDSI_Snow_Cover');

var inicio = ee.Date('2001-01-01');
var meses = ee.List.sequence(0, 12 * 25 - 1); // 300 meses

var serie = ee.FeatureCollection(meses.map(function (m) {
  var desde = inicio.advance(m, 'month');
  var hasta = desde.advance(1, 'month');
  // promedio del mes, usando solo días sin nubes (valores de 0 a 100)
  var imagen = nieve.filterDate(desde, hasta)
    .map(function (img) { return img.updateMask(img.lte(100)); })
    .mean();
  var valor = imagen.reduceRegion({
    reducer: ee.Reducer.mean(), geometry: caja, scale: 500, maxPixels: 1e9
  }).get('NDSI_Snow_Cover');
  return ee.Feature(null, { fecha: desde.format('YYYY-MM-01'), valor: valor });
}));

print(ui.Chart.feature.byFeature(serie, 'fecha', 'valor')
  .setOptions({ title: 'Nieve MODIS · Cordillera Real', vAxis: { title: 'Índice de nieve (0–100)' } }));

Export.table.toDrive({
  collection: serie, description: 'nieve_cordillera_real',
  fileFormat: 'CSV', selectors: ['fecha', 'valor']
});
