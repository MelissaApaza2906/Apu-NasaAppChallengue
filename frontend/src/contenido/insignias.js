// Catálogo de insignias (13): { id, nombre, familia, img, como }.
// img: imagen en public/img/insignias/; si es null, la pantalla muestra un hexágono con "?".
// Las ganadas se guardan con ganarInsignia(id) (servicios/progreso.js).
// "caminante" tiene contador (glaciares visitados, en localStorage): meta = cuántos hacen falta.
import { CASOS } from './casos.js';

const img = (nombre) => (nombre ? `/img/insignias/${nombre}.png` : null);

export const FAMILIAS = [
  { id: 'aprendizaje', nombre: 'APRENDIZAJE' },
  { id: 'casos', nombre: 'CASOS' },
  { id: 'especiales', nombre: 'ESPECIALES' }
];

export const INSIGNIAS = [
  // Aprendizaje: una por lección
  { id: 'aprendiz', nombre: 'Aprendiz de campo', familia: 'aprendizaje', img: img('satelite-oro'), como: 'Termina la lección 1: Academia del detective.' },
  { id: 'variable', nombre: 'Variable', familia: 'aprendizaje', img: img('termometro'), como: 'Termina la lección 1: Variable.' },
  { id: 'region', nombre: 'Región', familia: 'aprendizaje', img: img('montana-pin'), como: 'Termina la lección 2: Región.' },
  { id: 'periodo', nombre: 'Periodo', familia: 'aprendizaje', img: img(null), como: 'Termina la lección 3: Periodo.' },
  { id: 'serie', nombre: 'Serie de tiempo', familia: 'aprendizaje', img: img('grafico'), como: 'Termina la lección 4: Serie de tiempo.' },
  { id: 'significancia', nombre: 'Significancia', familia: 'aprendizaje', img: img('lupa'), como: 'Termina la lección 5: Significancia.' },
  // Aprendizaje: una por bloque de la ruta de 10 lecciones (contenido/lecciones.js → BLOQUES)
  { id: 'explorador-planeta', nombre: 'Explorador del planeta', familia: 'aprendizaje', img: img('montana-pin'), como: 'Termina el bloque A (lección 2: la lluvia).' },
  { id: 'inspector-pixeles', nombre: 'Inspector de píxeles', familia: 'aprendizaje', img: img('lupa'), como: 'Termina el bloque B (lección 4: el índice de nieve).' },
  { id: 'analista-tendencias', nombre: 'Analista de tendencias', familia: 'aprendizaje', img: img('grafico'), como: 'Termina el bloque C (lección 10: el veredicto).' },
  // Casos
  { id: 'caso-nieve', nombre: 'Caso de la nieve', familia: 'casos', img: img('copo'), como: 'Resuelve el Caso 01: Cordillera Real.' },
  { id: 'caso-lluvia', nombre: 'Caso de la lluvia', familia: 'casos', img: img('gota'), como: 'Resuelve el Caso 02: la lluvia.' },
  { id: 'caso-final', nombre: 'Caso final', familia: 'casos', img: img(null), como: 'Resuelve el caso final, sin ayuda.' },
  // Casos: una por cordillera ("Guardián de …"), se gana al firmar el veredicto (imagen provisoria hasta que Karen dibuje las propias)
  ...CASOS.map((c) => ({ id: `guardian-${c.id}`, nombre: c.insignia, familia: 'casos', img: img('montanas-oro'), como: `Resuelve el caso ${c.exp}: ${c.nombre}.` })),
  // Especiales
  { id: 'explorador', nombre: 'Explorador', familia: 'especiales', img: img('montanas-oro'), como: 'Abre la montaña en 3D de un glaciar.' },
  { id: 'capas', nombre: 'Capas', familia: 'especiales', img: img('capas-oro'), como: 'Mira el planeta con una capa de datos de NASA.' },
  { id: 'ojo-terra', nombre: 'Ojo de Terra', familia: 'especiales', img: img('satelite-oro'), como: 'Sigue al satélite Terra en vivo.' },
  { id: 'caminante', nombre: 'Caminante', familia: 'especiales', img: img('globo'), como: 'Visita los 11 glaciares del planeta.', meta: 11, total: 11 }
];

export const insigniaPorId = (id) => INSIGNIAS.find((i) => i.id === id) ?? null;
