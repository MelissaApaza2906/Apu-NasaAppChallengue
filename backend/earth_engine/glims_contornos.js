// APU · Contornos de glaciares (GLIMS) en GeoJSON para dibujarlos en la montaña 3D.
// Uso: code.earthengine.google.com → pegar → Run → Tasks → RUN. Guardar el archivo que llega a Drive como
// frontend/public/datos/glims/<id>.geojson
var REGIONES = {
  'cordillera-real':   [-68.70, -16.80, -67.60, -15.70],
  'cordillera-blanca': [-77.90, -10.00, -77.10,  -8.60],
  'kilimanjaro':       [37.25, -3.15, 37.45, -3.00]
};
Object.keys(REGIONES).forEach(function (id) {
  var caja = ee.Geometry.Rectangle(REGIONES[id]);
  var g = ee.FeatureCollection('GLIMS/20230607').filterBounds(caja)
    .filter(ee.Filter.eq('line_type', 'glac_bound'))
    .map(function (f) { return ee.Feature(f.geometry().simplify(30)).set('nombre', f.get('glac_name')); });
  print(id + ' · contornos:', g.size());
  Export.table.toDrive({ collection: g, description: 'glims_' + id.replace(/-/g, '_'), fileFormat: 'GeoJSON' });
});
