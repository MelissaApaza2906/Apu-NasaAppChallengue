// Las 8 regiones con glaciares que brillan en el globo.
// caja: rectángulo de búsqueda (grados). diaComparar: el mismo día de cada año
// para comparar entre años; elegimos el final de la época seca o del verano,
// cuando queda la nieve que dura todo el año.
export const GLACIARES = [
  {
    id: 'cordillera-real', nombre: 'Cordillera Real', pais: 'Bolivia', principal: true,
    lat: -16.2, lon: -68.2, caja: { oeste: -68.7, sur: -16.8, este: -67.6, norte: -15.7 },
    diaComparar: '08-15', datos: 'datos/cordillera-real.json',
    texto: 'Este es nuestro caso: los glaciares junto a La Paz y El Alto. Parte del agua de la ciudad viene de aquí.'
  },
  {
    id: 'cordillera-blanca', nombre: 'Cordillera Blanca', pais: 'Perú',
    lat: -9.3, lon: -77.5, caja: { oeste: -77.9, sur: -10.0, este: -77.1, norte: -8.6 },
    diaComparar: '07-15', datos: null,
    texto: 'La cordillera tropical con más glaciares del mundo.'
  },
  {
    id: 'campos-de-hielo', nombre: 'Campos de Hielo Patagónicos', pais: 'Chile y Argentina',
    lat: -49.0, lon: -73.5, caja: { oeste: -74.2, sur: -51.5, este: -72.8, norte: -46.5 },
    diaComparar: '03-01', datos: null,
    texto: 'La mayor masa de hielo de América del Sur.'
  },
  {
    id: 'himalaya', nombre: 'Himalaya', pais: 'Nepal, India y China',
    lat: 28.6, lon: 84.0, caja: { oeste: 83.0, sur: 27.8, este: 88.2, norte: 29.0 },
    diaComparar: '10-01', datos: null,
    texto: 'Aquí está el Everest. Sus glaciares alimentan ríos para cientos de millones de personas.'
  },
  {
    id: 'karakoram', nombre: 'Karakoram', pais: 'Pakistán, India y China',
    lat: 35.8, lon: 76.5, caja: { oeste: 74.5, sur: 35.0, este: 77.8, norte: 36.6 },
    diaComparar: '09-15', datos: null,
    texto: 'Una rareza: aquí algunos glaciares se mantuvieron estables o crecieron.'
  },
  {
    id: 'tibet', nombre: 'Meseta del Tíbet', pais: 'China',
    lat: 31.0, lon: 90.0, caja: { oeste: 88.0, sur: 29.5, este: 92.5, norte: 32.5 },
    diaComparar: '09-15', datos: null,
    texto: 'El "techo del mundo", la meseta más alta de la Tierra.'
  },
  {
    id: 'alpes', nombre: 'Alpes', pais: 'Europa',
    lat: 46.5, lon: 9.0, caja: { oeste: 6.5, sur: 45.6, este: 11.5, norte: 47.2 },
    diaComparar: '09-01', datos: null,
    texto: 'Los glaciares mejor estudiados del mundo, con mediciones de más de 100 años.'
  },
  {
    id: 'alaska', nombre: 'Cordillera de Alaska', pais: 'Estados Unidos',
    lat: 61.0, lon: -147.0, caja: { oeste: -150.0, sur: 60.0, este: -142.0, norte: 62.0 },
    diaComparar: '09-01', datos: null,
    texto: 'Glaciares enormes que llegan hasta el mar.'
  }
];
