// Casos: las 11 cordilleras (etapa 2 · detective). Mockups: docs/mockups/casos/.
//   ayuda: 'con' (01) habla en cada pista · 'poca' (02–04) solo con "💡 Pistas" (máx. 3) · 'sin' (05–11) en silencio
//   glaciar: id de contenido/glaciares.js (el pin del globo y la montaña 3D de montanas3d.js)
//   caja y meses: el recuadro GRANDE y la ventana de cada región (backend/earth_engine/nieve_regiones.js)
//   recortes: el expediente (solo los que tienen fuente; si un caso no tiene, el paso se salta la clasificación)
// Desbloqueo: el 01 al terminar las 10 lecciones; resolver un caso abre los 2 siguientes.
// Los números (serie, pendiente, p, pruebas) se LEEN de los JSON reales (servicios/casos-datos.js).

const c = (numero, id, nombre, lugar, ayuda, glaciar, caja, meses, extra = {}) => ({
  id, numero, nombre, lugar, ayuda, glaciar, caja, meses,
  exp: String(numero).padStart(2, '0'),
  corto: `Caso ${String(numero).padStart(2, '0')} · ${nombre}`,
  pregunta: `¿Cambió la nieve de ${extra.de ?? nombre} entre 2001 y 2025?`,
  insignia: `Guardián de ${extra.de ?? nombre}`,
  ...extra
});

export const CASOS = [
  c(1, 'cordillera-real', 'Cordillera Real', 'Bolivia', 'con', 'cordillera-real', [-68.70, -16.80, -67.60, -15.70], [8, 9], {
    de: 'la Cordillera Real',
    titulo: 'el agua de La Paz',
    informe: 'El agua de la Cordillera Real',
    // Los recortes de la lección 5, con su fuente. tipo: 'dato' | 'aclarar' | 'suposicion'
    recortes: [
      { cuando: '2016', texto: 'La Paz tuvo racionamiento de agua', fuente: 'Los Tiempos', url: 'https://www.lostiempos.com/actualidad/local/20161112/semapa-racionara-agua-mes-mas-crisis-llega-paz', tipo: 'dato' },
      { cuando: 'Ago 2026', texto: 'Alerta roja, pero represas “óptimas”', fuente: 'eju.tv', url: 'https://eju.tv/?p=5060524', tipo: 'aclarar' },
      { cuando: '2015', texto: 'Hasta ~27 % del agua en época seca viene del deshielo', fuente: 'Soruco y otros', tipo: 'dato' },
      { cuando: 'Redes', texto: '“Ya no hay agua para La Paz”', fuente: 'sin fuente', tipo: 'suposicion' }
    ],
    // Qué se pierde: el texto final del veredicto
    consecuencia: 'una pérdida de agua para La Paz'
  }),
  c(2, 'cordillera-blanca', 'Cordillera Blanca', 'Perú', 'poca', 'cordillera-blanca', [-77.90, -10.00, -77.10, -8.60], [8, 9], { de: 'la Cordillera Blanca' }),
  c(3, 'kilimanjaro', 'Kilimanjaro', 'Tanzania', 'poca', 'kilimanjaro', [37.25, -3.15, 37.45, -3.00], [8, 9], { de: 'el Kilimanjaro' }),
  c(4, 'patagonia', 'Patagonia', 'Chile y Argentina', 'poca', 'campos-de-hielo', [-74.00, -51.00, -72.80, -49.50], [2, 3], { de: 'la Patagonia' }),
  c(5, 'alpes', 'Alpes', 'Suiza', 'sin', 'alpes', [7.80, 46.35, 8.25, 46.60], [8, 9], { de: 'los Alpes' }),
  c(6, 'alaska', 'Alaska', 'Estados Unidos', 'sin', 'alaska', [-147.60, 60.90, -146.60, 61.40], [8, 9]),
  c(7, 'vatnajokull', 'Vatnajökull', 'Islandia', 'sin', 'vatnajokull', [-18.00, 63.90, -15.30, 64.80], [8, 9], { de: 'el Vatnajökull' }),
  c(8, 'groenlandia', 'Groenlandia', 'Dinamarca', 'sin', 'groenlandia', [-50.50, 68.80, -48.50, 69.40], [8, 9]),
  c(9, 'himalaya', 'Himalaya', 'Nepal y China', 'sin', 'himalaya', [86.60, 27.80, 87.10, 28.10], [10, 11], { de: 'el Himalaya' }),
  c(10, 'karakorum', 'Karakórum', 'Pakistán y China', 'sin', 'karakoram', [76.00, 35.50, 76.80, 36.00], [8, 9], { de: 'el Karakórum' }),
  c(11, 'antartida', 'Antártida', 'Península Antártica', 'sin', 'peninsula-antartica', [-64.00, -65.50, -58.00, -63.50], [2, 3], { de: 'la Península Antártica' })
];

export const casoPorId = (id) => CASOS.find((x) => x.id === id) ?? null;

// Las 7 estrellas de la constelación (pasos 1–5 del Dr. Aker: variable, región, periodo, serie, ¿real?)
export const PISTAS = [
  { id: 'expediente', nombre: 'Expediente', corto: 'EXPEDIENTE', pregunta: 'Recortes', icono: '📁' },
  { id: 'evidencia', nombre: 'Evidencia', corto: 'EVIDENCIA', paso: 1, pregunta: '¿Qué medimos?', icono: '🛰' },
  { id: 'escena', nombre: 'Escena', corto: 'ESCENA', paso: 2, pregunta: '¿Dónde?', icono: '📍' },
  { id: 'tiempo', nombre: 'Tiempo', corto: 'TIEMPO', paso: 3, pregunta: '¿Cuándo?', icono: '📅' },
  { id: 'huellas', nombre: 'Huellas', corto: 'HUELLAS', paso: 4, pregunta: 'La serie', icono: '👣' },
  { id: 'interrogatorio', nombre: 'Interrogatorio', corto: 'INTERROG.', paso: 5, pregunta: '¿Real o suerte?', icono: '🗣' },
  { id: 'veredicto', nombre: 'Veredicto', corto: 'VEREDICTO', pregunta: 'Tu informe', icono: '⚖' }
];

export const MESES_CORTOS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const MESES_NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
