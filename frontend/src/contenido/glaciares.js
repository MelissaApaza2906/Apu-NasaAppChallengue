// Los 11 glaciares que brillan en el globo del menú.
// caja: rectángulo de búsqueda (grados). diaComparar: el mismo día de cada año
// para comparar entre años; elegimos el final de la época seca o del verano,
// cuando queda la nieve que dura todo el año.
// datos: solo la Cordillera Real tiene el análisis de 25 años (backend/). Los demás: null.
// Pestaña de historia del menú (vacíos = "En preparación"; solo cifras con fuente):
//   linea: [{ cuando, texto, destacado? }] · línea de tiempo
//   datoGrande: { numero, unidad, texto, fuente } · el dato grande
//   jukumari: lo que dice el Jukumari al elegir el glaciar
export const GLACIARES = [
  {
    id: 'cordillera-real', nombre: 'Cordillera Real', pais: 'Bolivia', principal: true,
    lat: -16.2, lon: -68.2, caja: { oeste: -68.7, sur: -16.8, este: -67.6, norte: -15.7 },
    diaComparar: '08-15', datos: 'datos/cordillera-real.json',
    linea: [
      { cuando: 'Hace siglos', texto: 'Los aimaras veneran al Illimani: protege a La Paz.' },
      { cuando: '1898', texto: 'Primera cima registrada del Illimani.' },
      { cuando: '2009', texto: 'Desaparece el glaciar del Chacaltaya, de unos 18 000 años. Tenía la pista de esquí más alta del mundo.', destacado: true }
    ],
    datoGrande: { numero: 27, unidad: '%', texto: 'del agua de La Paz viene de los glaciares en la época seca.', fuente: 'Soruco et al., 2015' },
    jukumari: '¡Esta es mi casa! ¿Vamos a ver cuánta nieve le queda?'
  },
  {
    id: 'cordillera-blanca', nombre: 'Cordillera Blanca', pais: 'Perú',
    lat: -9.3, lon: -77.5, caja: { oeste: -77.9, sur: -10.0, este: -77.1, norte: -8.6 },
    diaComparar: '07-15', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'campos-de-hielo', nombre: 'Campos de Hielo Patagónicos', pais: 'Chile y Argentina',
    lat: -49.0, lon: -73.5, caja: { oeste: -74.2, sur: -51.5, este: -72.8, norte: -46.5 },
    diaComparar: '03-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'alaska', nombre: 'Alaska', pais: 'EE. UU.',
    lat: 61.0, lon: -147.0, caja: { oeste: -150.0, sur: 60.0, este: -142.0, norte: 62.0 },
    diaComparar: '09-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'groenlandia', nombre: 'Groenlandia', pais: 'Groenlandia',
    lat: 72.0, lon: -40.0, caja: { oeste: -50.0, sur: 68.0, este: -30.0, norte: 76.0 },
    diaComparar: '09-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'vatnajokull', nombre: 'Vatnajökull', pais: 'Islandia',
    lat: 64.4, lon: -16.8, caja: { oeste: -18.5, sur: 63.9, este: -15.2, norte: 64.9 },
    diaComparar: '09-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'alpes', nombre: 'Alpes', pais: 'Suiza',
    lat: 46.5, lon: 8.0, caja: { oeste: 6.5, sur: 45.6, este: 10.5, norte: 47.0 },
    diaComparar: '09-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'kilimanjaro', nombre: 'Kilimanjaro', pais: 'Tanzania',
    lat: -3.07, lon: 37.35, caja: { oeste: 37.2, sur: -3.2, este: 37.5, norte: -2.95 },
    diaComparar: '09-15', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'karakoram', nombre: 'Karakórum', pais: 'Pakistán',
    lat: 35.8, lon: 76.5, caja: { oeste: 74.5, sur: 35.0, este: 77.8, norte: 36.6 },
    diaComparar: '09-15', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'himalaya', nombre: 'Himalaya', pais: 'Nepal y China',
    lat: 28.0, lon: 86.9, caja: { oeste: 85.5, sur: 27.3, este: 88.3, norte: 28.7 },
    diaComparar: '10-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  },
  {
    id: 'peninsula-antartica', nombre: 'Península Antártica', pais: 'Antártida',
    lat: -65.0, lon: -62.0, caja: { oeste: -66.0, sur: -68.0, este: -57.0, norte: -62.0 },
    diaComparar: '03-01', datos: null,
    linea: [], datoGrande: null, jukumari: '' // en preparación
  }
];
