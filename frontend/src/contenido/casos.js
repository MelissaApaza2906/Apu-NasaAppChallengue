// Casos: las 11 cordilleras (etapa 2 · detective). ayuda: 'con' (01) | 'poca' (02–04) | 'sin' (05–11).
// Desbloqueo: el 01 al terminar las 10 lecciones; resolver un caso abre los 2 siguientes.
// corto: nombre corto para los avisos de bloqueo.
const c = (numero, id, nombre, lugar, ayuda) => ({ id, numero, nombre, lugar, ayuda, corto: `Caso ${String(numero).padStart(2, '0')} · ${nombre}` });

export const CASOS = [
  c(1, 'cordillera-real', 'Cordillera Real', 'Bolivia', 'con'),
  c(2, 'cordillera-blanca', 'Cordillera Blanca', 'Perú', 'poca'),
  c(3, 'kilimanjaro', 'Kilimanjaro', 'Tanzania', 'poca'),
  c(4, 'patagonia', 'Patagonia', 'Chile y Argentina', 'poca'),
  c(5, 'alpes', 'Alpes', 'Suiza', 'sin'),
  c(6, 'alaska', 'Alaska', 'Estados Unidos', 'sin'),
  c(7, 'vatnajokull', 'Vatnajökull', 'Islandia', 'sin'),
  c(8, 'groenlandia', 'Groenlandia', 'Dinamarca', 'sin'),
  c(9, 'himalaya', 'Himalaya', 'Nepal y China', 'sin'),
  c(10, 'karakorum', 'Karakórum', 'Pakistán y China', 'sin'),
  c(11, 'antartida', 'Antártida', 'Península Antártica', 'sin')
];
