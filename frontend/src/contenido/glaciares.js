// Los 11 glaciares que brillan en el globo del menú.
// caja: rectángulo de búsqueda (grados). diaComparar: el mismo día de cada año
// para comparar entre años; elegimos el final de la época seca o del verano,
// cuando queda la nieve que dura todo el año.
// datos: solo la Cordillera Real tiene el análisis de 25 años (backend/). Los demás: null.
// foto: portada de la pestaña (Wikimedia Commons, licencia libre; créditos en docs/creditos-fotos.md).
// La historia de cada glaciar (pestaña del menú) está en HISTORIAS, más abajo; historiaDe(g) la une.
export const GLACIARES = [
  {
    id: 'cordillera-real', nombre: 'Cordillera Real', pais: 'Bolivia', principal: true,
    lat: -16.2, lon: -68.2, caja: { oeste: -68.7, sur: -16.8, este: -67.6, norte: -15.7 },
    diaComparar: '08-15', datos: 'datos/cordillera-real.json',
    foto: { src: '/img/glaciares/cordillera-real.webp', autor: 'EEJCC', licencia: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Illimani_La_Paz.jpg' }
  },
  {
    id: 'cordillera-blanca', nombre: 'Cordillera Blanca', pais: 'Perú',
    lat: -9.3, lon: -77.5, caja: { oeste: -77.9, sur: -10.0, este: -77.1, norte: -8.6 },
    diaComparar: '07-15', datos: null,
    foto: { src: '/img/glaciares/cordillera-blanca.webp', autor: 'Maurice Chédel', licencia: 'Dominio público', url: 'https://commons.wikimedia.org/wiki/File:Nevado_Huascaran.jpg' }
  },
  {
    id: 'campos-de-hielo', nombre: 'Campos de Hielo Patagónicos', pais: 'Chile y Argentina',
    lat: -49.0, lon: -73.5, caja: { oeste: -74.2, sur: -51.5, este: -72.8, norte: -46.5 },
    diaComparar: '03-01', datos: null,
    foto: { src: '/img/glaciares/campos-de-hielo.webp', autor: 'Prissantenbär', licencia: 'Dominio público', url: 'https://commons.wikimedia.org/wiki/File:Fitz_Roy_2.jpg' }
  },
  {
    id: 'alaska', nombre: 'Alaska', pais: 'EE. UU.',
    lat: 61.0, lon: -147.0, caja: { oeste: -150.0, sur: 60.0, este: -142.0, norte: 62.0 },
    diaComparar: '09-01', datos: null,
    foto: { src: '/img/glaciares/alaska.webp', autor: 'USDA Forest Service, Alaska Region', licencia: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Mount_Marcus_Baker_and_College_Fiord.jpg' }
  },
  {
    id: 'groenlandia', nombre: 'Groenlandia', pais: 'Groenlandia',
    lat: 72.0, lon: -40.0, caja: { oeste: -50.0, sur: 68.0, este: -30.0, norte: 76.0 },
    diaComparar: '09-01', datos: null,
    foto: { src: '/img/glaciares/groenlandia.webp', autor: 'NASA ICE', licencia: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Mt._Gunnbj%C3%B8rn,_Greenland.jpg' }
  },
  {
    id: 'vatnajokull', nombre: 'Vatnajökull', pais: 'Islandia',
    lat: 64.4, lon: -16.8, caja: { oeste: -18.5, sur: 63.9, este: -15.2, norte: 64.9 },
    diaComparar: '09-01', datos: null,
    foto: { src: '/img/glaciares/vatnajokull.webp', autor: 'Kristinn Stefánsson', licencia: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Hvannadalshn%C3%BAkur_in_%C3%96r%C3%A6faj%C3%B6kull_seen_from_Skaftafell.jpg' }
  },
  {
    id: 'alpes', nombre: 'Alpes', pais: 'Suiza',
    lat: 46.5, lon: 8.0, caja: { oeste: 6.5, sur: 45.6, este: 10.5, norte: 47.0 },
    diaComparar: '09-01', datos: null,
    foto: { src: '/img/glaciares/alpes.webp', autor: 'Mike Peel', licencia: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Aletsch_Glacier.jpg' }
  },
  {
    id: 'kilimanjaro', nombre: 'Kilimanjaro', pais: 'Tanzania',
    lat: -3.07, lon: 37.35, caja: { oeste: 37.2, sur: -3.2, este: 37.5, norte: -2.95 },
    diaComparar: '09-15', datos: null,
    foto: { src: '/img/glaciares/kilimanjaro.webp', autor: 'Matt Kieffer', licencia: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Kilimanjaro_(2965011512).jpg' }
  },
  {
    id: 'karakoram', nombre: 'Karakórum', pais: 'Pakistán',
    lat: 35.8, lon: 76.5, caja: { oeste: 74.5, sur: 35.0, este: 77.8, norte: 36.6 },
    diaComparar: '09-15', datos: null,
    foto: { src: '/img/glaciares/karakoram.webp', autor: 'Zacharie Grossen', licencia: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Chogori.jpg' }
  },
  {
    id: 'himalaya', nombre: 'Himalaya', pais: 'Nepal y China',
    lat: 28.0, lon: 86.9, caja: { oeste: 85.5, sur: 27.3, este: 88.3, norte: 28.7 },
    diaComparar: '10-01', datos: null,
    foto: { src: '/img/glaciares/himalaya.webp', autor: 'Luca Galuzzi', licencia: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg' }
  },
  {
    id: 'peninsula-antartica', nombre: 'Península Antártica', pais: 'Antártida',
    lat: -65.0, lon: -62.0, caja: { oeste: -66.0, sur: -68.0, este: -57.0, norte: -62.0 },
    diaComparar: '03-01', datos: null,
    foto: { src: '/img/glaciares/peninsula-antartica.webp', autor: 'Christian Stangl', licencia: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Mount_Vinson_from_NW_at_Vinson_Plateau_by_Christian_Stangl_(flickr).jpg' }
  }
];

// Historia de cada glaciar para la pestaña del menú: línea de tiempo (cada hito con su fuente, si
// la tiene), el dato grande con su fuente y lo que dice el Jukumari. Solo cifras con fuente.
export const HISTORIAS = {
  'cordillera-real': {
    linea: [
      { cuando: 'Hace siglos', texto: 'Los aimaras veneran al Illimani: protege a La Paz.' },
      { cuando: '1898', texto: 'Primera cima registrada del Illimani.', fuente: 'Conway, Alpine Journal 1899' },
      { cuando: '2009', texto: 'Desaparece el glaciar del Chacaltaya, de unos 18 000 años. Tenía la pista de esquí más alta del mundo.', fuente: 'Inside Climate News, 2009', destacado: true }
    ],
    datoGrande: { numero: 27, unidad: '%', texto: 'del agua de La Paz viene de los glaciares en la época seca.', fuente: 'Soruco et al., 2015' },
    jukumari: '¡Esta es mi casa! ¿Vamos a ver cuánta nieve le queda?'
  },
  'cordillera-blanca': {
    linea: [
      { cuando: 'Hoy', texto: 'Aquí está el Huascarán, la montaña más alta del Perú.' },
      { cuando: '1970', texto: 'Un terremoto desprendió hielo y roca del Huascarán. La avalancha sepultó el pueblo de Yungay.', fuente: 'Avalancha del Huascarán (1970)', destacado: true }
    ],
    datoGrande: { numero: 6768, unidad: 'm', texto: 'mide el Huascarán, la cumbre más alta del Perú.', fuente: 'Avalancha del Huascarán (1970)' },
    jukumari: 'La montaña más alta del Perú tiene mucho que contar.'
  },
  patagonia: {
    linea: [
      { cuando: 'Por décadas', texto: 'El glaciar Perito Moreno fue de los pocos estables de Patagonia.' },
      { cuando: 'Hoy', texto: 'Los científicos dicen que ahora retrocede rápido. Lo visitan cerca de 700 000 personas al año.', fuente: 'Univ. de Aberystwyth, 2025', destacado: true }
    ],
    datoGrande: { numero: 90, unidad: '%', texto: 'de los glaciares de Patagonia se están achicando.', fuente: 'Univ. de Aberystwyth, 2025' },
    jukumari: 'Hasta el glaciar más fuerte de Patagonia empezó a cambiar.'
  },
  alaska: {
    linea: [
      { cuando: 'Antes de 1980', texto: 'El glaciar Columbia llegaba cerca de la isla Heather, en el mar.' },
      { cuando: '1980', texto: 'Empezó a retroceder muy rápido.', fuente: 'NASA Earth Observatory' },
      { cuando: '2011', texto: 'Ya había retrocedido más de 20 km.', fuente: 'NASA Earth Observatory', destacado: true }
    ],
    datoGrande: { numero: 20, unidad: 'km', texto: 'retrocedió el glaciar Columbia desde 1980.', fuente: 'NASA Earth Observatory' },
    jukumari: '¡Más de 20 kilómetros! Los satélites de NASA lo vieron.'
  },
  groenlandia: {
    linea: [
      { cuando: 'Hoy', texto: 'Una capa de hielo cubre cerca del 80 % de Groenlandia.', fuente: 'NSIDC' }
    ],
    datoGrande: { numero: 7.4, unidad: 'm', texto: 'subiría el mar si se derritiera todo el hielo de Groenlandia.', fuente: 'NSIDC' },
    jukumari: 'Aquí hay tanto hielo que podría cambiar las playas de todo el mundo.'
  },
  vatnajokull: {
    linea: [
      { cuando: 'Hoy', texto: 'Es el casquete de hielo más grande de Islandia, encima de volcanes activos.' },
      { cuando: '2019', texto: 'Su parque nacional es Patrimonio Mundial de la UNESCO.', fuente: 'UICN', destacado: true }
    ],
    datoGrande: { numero: 8, unidad: 'de 10', texto: 'volcanes centrales de la zona están bajo el hielo.', fuente: 'UICN' },
    jukumari: '¡Un glaciar encima de volcanes! Fuego y hielo juntos.'
  },
  alpes: {
    linea: [
      { cuando: 'Hoy', texto: 'El Aletsch es el glaciar más grande y largo de Europa.' },
      { cuando: '2001', texto: 'Es Patrimonio Mundial de la UNESCO.', fuente: 'UICN', destacado: true }
    ],
    datoGrande: { numero: 22, unidad: 'km', texto: 'de largo mide el glaciar Aletsch.', fuente: 'UICN' },
    jukumari: 'El gigante de hielo de Europa.'
  },
  kilimanjaro: {
    linea: [
      { cuando: '1912', texto: 'Primer registro del hielo de su cumbre.' },
      { cuando: '2007', texto: 'Ya había perdido la mayor parte de ese hielo.', fuente: 'Thompson et al., 2009', destacado: true }
    ],
    datoGrande: { numero: 85, unidad: '%', texto: 'del hielo del Kilimanjaro se perdió entre 1912 y 2007.', fuente: 'Thompson et al., 2009' },
    jukumari: 'Es tropical como la Cordillera Real. ¿Le pasará lo mismo?'
  },
  karakorum: {
    linea: [
      { cuando: '1954', texto: 'Lino Lacedelli y Achille Compagnoni llegan por primera vez a la cima del K2.', fuente: 'Guinness World Records' },
      { cuando: 'Hoy', texto: 'Un misterio: mientras casi todos los glaciares se achican, varios del Karakórum avanzan.', fuente: 'NASA Earth Observatory', destacado: true }
    ],
    datoGrande: { numero: 8611, unidad: 'm', texto: 'mide el K2, la segunda montaña más alta del mundo.', fuente: 'Britannica' },
    jukumari: '¡Un misterio! Aquí algunos glaciares crecen.'
  },
  himalaya: {
    linea: [
      { cuando: '1953', texto: 'Edmund Hillary y Tenzing Norgay llegan por primera vez a la cima del Everest.', fuente: 'Guinness World Records' },
      { cuando: '2020', texto: 'Nepal y China miden juntos su nueva altura oficial.', fuente: 'National Geographic, 2020', destacado: true }
    ],
    datoGrande: { numero: 8848.86, unidad: 'm', texto: 'mide el Everest, la montaña más alta del mundo.', fuente: 'National Geographic, 2020' },
    jukumari: 'El techo del mundo también tiene glaciares que vigilar.'
  },
  antartida: {
    linea: [
      { cuando: 'Hoy', texto: 'La península Antártica es la parte de la Antártida más cercana a Sudamérica.' },
      { cuando: '2002', texto: 'La plataforma de hielo Larsen B se rompió en poco más de un mes. Los satélites de NASA lo vieron.', fuente: 'NASA Earth Observatory', destacado: true }
    ],
    datoGrande: { numero: 3250, unidad: 'km²', texto: 'de hielo de Larsen B se rompieron en 2002.', fuente: 'NASA Earth Observatory' },
    jukumari: '¡Un trozo de hielo más grande que una ciudad se rompió en un mes!'
  }
};

// Une la historia con su glaciar: primero por id; si no coincide, por nombre. Se comparan las
// palabras sin tildes; basta con que empiecen igual (6 letras), porque algunas claves son más
// cortas o distintas: 'patagonia' ↔ "Campos de Hielo Patagónicos", 'antartida' ↔ "Península
// Antártica", 'karakorum' ↔ "Karakórum". Sin historia: null (la pestaña dice "En preparación").
const sinTildes = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const palabras = (s) => sinTildes(s).split(/[^a-z0-9]+/).filter((p) => p.length >= 4);
const parecidas = (a, b) => a === b || (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6));
export function historiaDe(glaciar) {
  if (!glaciar) return null;
  if (HISTORIAS[glaciar.id]) return HISTORIAS[glaciar.id];
  const delGlaciar = [...palabras(glaciar.nombre), ...palabras(glaciar.id)];
  const clave = Object.keys(HISTORIAS).find((k) => palabras(k).some((p) => delGlaciar.some((q) => parecidas(p, q))));
  return clave ? HISTORIAS[clave] : null;
}
