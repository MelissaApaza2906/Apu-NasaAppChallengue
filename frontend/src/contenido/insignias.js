// Catálogo de insignias (12): { id, nombre, familia, img, como }.
// img: imagen en public/img/insignias/; si es null, la pantalla muestra un hexágono con "?".
// Las ganadas se guardan con ganarInsignia(id) (servicios/progreso.js).
// "caminante" tiene contador (glaciares visitados, en localStorage): meta = cuántos hacen falta.
const img = (nombre) => (nombre ? `/img/insignias/${nombre}.png` : null);

export const FAMILIAS = [
  { id: 'aprendizaje', nombre: 'APRENDIZAJE' },
  { id: 'casos', nombre: 'CASOS' },
  { id: 'especiales', nombre: 'ESPECIALES' }
];

export const INSIGNIAS = [
  // Aprendizaje: una por lección
  { id: 'variable', nombre: 'Variable', familia: 'aprendizaje', img: img('termometro'), como: 'Termina la lección 1: Variable.' },
  { id: 'region', nombre: 'Región', familia: 'aprendizaje', img: img('montana-pin'), como: 'Termina la lección 2: Región.' },
  { id: 'periodo', nombre: 'Periodo', familia: 'aprendizaje', img: img(null), como: 'Termina la lección 3: Periodo.' },
  { id: 'serie', nombre: 'Serie de tiempo', familia: 'aprendizaje', img: img('grafico'), como: 'Termina la lección 4: Serie de tiempo.' },
  { id: 'significancia', nombre: 'Significancia', familia: 'aprendizaje', img: img('lupa'), como: 'Termina la lección 5: Significancia.' },
  // Casos
  { id: 'caso-nieve', nombre: 'Caso de la nieve', familia: 'casos', img: img('copo'), como: 'Resuelve el Caso 01: Cordillera Real.' },
  { id: 'caso-lluvia', nombre: 'Caso de la lluvia', familia: 'casos', img: img('gota'), como: 'Resuelve el Caso 02: la lluvia.' },
  { id: 'caso-final', nombre: 'Caso final', familia: 'casos', img: img(null), como: 'Resuelve el caso final, sin ayuda.' },
  // Especiales
  { id: 'explorador', nombre: 'Explorador', familia: 'especiales', img: img('montanas-oro'), como: 'Abre la montaña en 3D de un glaciar.' },
  { id: 'capas', nombre: 'Capas', familia: 'especiales', img: img('capas-oro'), como: 'Mira el planeta con una capa de datos de NASA.' },
  { id: 'ojo-terra', nombre: 'Ojo de Terra', familia: 'especiales', img: img('satelite-oro'), como: 'Sigue al satélite Terra en vivo.' },
  { id: 'caminante', nombre: 'Caminante', familia: 'especiales', img: img('globo'), como: 'Visita 7 de los 11 glaciares del planeta.', meta: 7, total: 11 }
];

export const insigniaPorId = (id) => INSIGNIAS.find((i) => i.id === id) ?? null;
