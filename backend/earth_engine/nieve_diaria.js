// APU · Nieve diaria de MODIS (NASA) para las lecciones 4 a 8. Cordillera Real, 2001–2025.
// Cuenta cada día cuántos píxeles hay con nieve, sin nieve y con nube, en 3 recuadros:
//   grande    = toda la caja de la Cordillera Real (la misma de nieve_modis.js)
//   medio     = Huayna Potosí a Tuni-Condoriri
//   glaciares = solo dentro de los contornos de glaciar de GLIMS
// Umbrales de nieve (NDSI): 30, 40 y 50. Un píxel cuenta como "nieve" si su valor es >= umbral.
// En Earth Engine la banda NDSI_Snow_Cover solo trae 0–100 (lo demás viene enmascarado).
// Los códigos están en la banda NDSI_Snow_Cover_Class: 250 = nube · 211 = noche · 200/201 = sin dato · 237 = agua.
//
// Uso: pegar en https://code.earthengine.google.com, Run, y en la pestaña Tasks darle RUN a
// "nieve_diaria_cordillera_real". Tarda unos minutos. El CSV llega a tu Google Drive.

var caja = ee.Geometry.Rectangle([-68.7, -16.8, -67.6, -15.7]);
var medio = ee.Geometry.Rectangle([-68.35, -16.35, -68.05, -16.05]);
// GLIMS trae varios contornos por glaciar (de distintos años). Se pintan todos los de tipo glaciar:
// la región es la mayor extensión conocida del hielo, así entra también el hielo que ya se perdió.
var glims = ee.FeatureCollection('GLIMS/20230607').filterBounds(caja)
  .filter(ee.Filter.eq('line_type', 'glac_bound'));
print('Contornos de glaciar GLIMS en la caja:', glims.size());
Map.centerObject(caja, 9);
Map.addLayer(caja, { color: 'white' }, 'grande');
Map.addLayer(medio, { color: 'yellow' }, 'medio');
Map.addLayer(glims, { color: '4FB0FF' }, 'glaciares');

var regiones = {
  grande: ee.Image(1),
  medio: ee.Image(0).paint(medio, 1),
  glaciares: ee.Image(0).paint(glims, 1)
};
var nombres = ['grande', 'medio', 'glaciares'];
var umbrales = [30, 40, 50];
var bandas = ['total', 'validos', 'nubes', 'noche', 'nieve30', 'nieve40', 'nieve50'];

function conteos(img) {
  var v = img.select('NDSI_Snow_Cover').unmask(255);        // 255 = no visible ese día
  var clase = img.select('NDSI_Snow_Cover_Class').unmask(0);
  var lista = [
    ee.Image(1).rename('total'),
    v.lte(100).rename('validos'),
    clase.eq(250).rename('nubes'),
    clase.eq(211).rename('noche')
  ];
  umbrales.forEach(function (u) { lista.push(v.gte(u).and(v.lte(100)).rename('nieve' + u)); });
  var base = ee.Image.cat(lista);
  var partes = nombres.map(function (r) {
    return base.multiply(regiones[r]).rename(bandas.map(function (b) { return r + '_' + b; }));
  });
  var suma = ee.Image.cat(partes).reduceRegion({
    reducer: ee.Reducer.sum(), geometry: caja, scale: 500, maxPixels: 1e9
  });
  return ee.Feature(null, suma).set('fecha', img.date().format('YYYY-MM-dd'));
}

var modis = ee.ImageCollection('MODIS/061/MOD10A1')
  .filterDate('2001-01-01', '2026-01-01')
  .select(['NDSI_Snow_Cover', 'NDSI_Snow_Cover_Class']);

// Prueba rápida con un solo día (mira la consola antes de exportar):
print('Ejemplo 2024-08-15:', conteos(modis.filterDate('2024-08-15', '2024-08-16').first()));

var columnas = ['fecha'];
nombres.forEach(function (r) { bandas.forEach(function (b) { columnas.push(r + '_' + b); }); });

Export.table.toDrive({
  collection: modis.map(conteos),
  description: 'nieve_diaria_cordillera_real',
  fileFormat: 'CSV',
  selectors: columnas
});
