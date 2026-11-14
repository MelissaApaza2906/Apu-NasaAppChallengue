// APU · Ruta de aprendizaje (10 lecciones). Generado por lecciones_data.py — no editar a mano.
// Base: módulos de Diana + ruta de Darwin. Público: desde 12 años. Sin temperatura.
// Cada lección: 4 páginas (texto, imagen, ejemplo, ¿lo entendiste?) → 5 tarjetas → 5 trivia → meta.
// {marcas}: la app las llena con los JSON de datos; si faltan, muestra "—".

export const BLOQUES = {
 "A": {
  "nombre": "Las variables",
  "insignia": {
   "id": "explorador-planeta",
   "nombre": "Explorador del planeta",
   "img": "montana-pin"
  }
 },
 "B": {
  "nombre": "Las herramientas",
  "insignia": {
   "id": "inspector-pixeles",
   "nombre": "Inspector de píxeles",
   "img": "lupa"
  }
 },
 "C": {
  "nombre": "El método del detective",
  "insignia": {
   "id": "analista-tendencias",
   "nombre": "Analista de tendencias",
   "img": "grafico"
  }
 }
};

export const LECCIONES = [
 {
  "id": "tierra",
  "numero": 1,
  "bloque": "A",
  "titulo": "La Tierra vista desde arriba",
  "titulo_corto": "La Tierra",
  "pregunta": "¿Qué estamos mirando en la montaña?",
  "paginas": [
   {
    "titulo": "¿Qué es un <em>glaciar</em>?",
    "texto": "Un <b>glaciar</b> es una gran masa de hielo que se forma en tierra firme con la nieve de <b>muchos años</b> y que baja muy despacio por su propio peso. La <b>nieve de temporada</b> es distinta: cae en la época de lluvias y se derrite en pocos meses.",
    "ejemplo": "En el <b>Huayna Potosí</b>, la parte alta tiene glaciar todo el año. En febrero la nieve baja mucho más, pero en agosto esa nieve nueva ya se derritió.",
    "chequeo": {
     "pregunta": "Nieve que cae en febrero y desaparece en mayo es…",
     "opciones": [
      "Glaciar",
      "Nieve de temporada"
     ],
     "correcta": 1,
     "explicacion": "Se va en pocos meses: es nieve de temporada. El glaciar dura muchos años."
    },
    "jukumari": {
     "dice": "Primero lo básico: ¿qué estamos mirando en la montaña?",
     "piensa": "Si se va en meses, no es glaciar…"
    }
   },
   {
    "titulo": "De <em>nieve</em> a hielo",
    "texto": "Cada año cae nieve nueva encima de la anterior. El <b>peso</b> aprieta la nieve de abajo y le saca el aire: primero se vuelve <b>firn</b> (nieve granulada) y, después de muchos años, <b>hielo glaciar</b>. Por eso un glaciar es como un libro con capas de años.",
    "ejemplo": "Es como apretar una bola de nieve con las manos: sale el aire y se vuelve dura. El glaciar hace lo mismo, pero con su propio peso y durante <b>décadas</b>.",
    "chequeo": {
     "pregunta": "¿Qué convierte la nieve en hielo glaciar?",
     "opciones": [
      "El sol",
      "El peso y el tiempo"
     ],
     "correcta": 1,
     "explicacion": "El peso de la nieve nueva aprieta la de abajo durante muchos años."
    },
    "jukumari": {
     "dice": "¡Un glaciar guarda la nieve de muchísimos años!",
     "piensa": "¿Y si deja de caer nieve arriba…?"
    }
   },
   {
    "titulo": "Lo blanco no siempre es <em>nieve</em>",
    "texto": "Desde el espacio, varias cosas se ven blancas: <b>nieve</b>, <b>nubes</b> y hasta un <b>salar</b>. El ojo se confunde fácil. Por eso los satélites usan luz que nosotros no vemos para separarlas (lo verás en la lección 3).",
    "ejemplo": "En una foto de Bolivia, el <b>Salar de Uyuni</b> brilla tanto como la nieve del Illimani. Si solo miras el color, dirías que es nieve… ¡y te equivocarías!",
    "chequeo": {
     "pregunta": "El Salar de Uyuni se ve blanco desde el espacio. ¿Es nieve?",
     "opciones": [
      "Sí, todo lo blanco es nieve",
      "No, es sal"
     ],
     "correcta": 1,
     "explicacion": "Es sal. El color solo no alcanza para saber qué es."
    },
    "jukumari": {
     "dice": "¡Ojo de detective! No te fíes solo del color.",
     "piensa": "¿Cómo hará el satélite para no confundirse…?"
    }
   },
   {
    "titulo": "Ver, medir y <em>concluir</em>",
    "texto": "Un detective separa tres cosas: lo que <b>observa</b>, lo que <b>mide</b> y lo que <b>concluye</b>. Un dato siempre dice <b>dónde</b> (latitud y longitud), <b>cuándo</b> (fecha) y <b>quién lo midió</b>. Una interpretación sin datos es solo una idea.",
    "ejemplo": "La <b>latitud</b> dice qué tan al norte o al sur está un lugar; la <b>longitud</b>, qué tan al este u oeste. La Cordillera Real está en <b>16,2° S y 68,2° O</b>.",
    "chequeo": {
     "pregunta": "“La nieve está bajando por el cambio climático” es…",
     "opciones": [
      "Un dato",
      "Una interpretación"
     ],
     "correcta": 1,
     "explicacion": "Es una conclusión que habría que comprobar. Un dato tiene lugar, fecha y fuente."
    },
    "jukumari": {
     "dice": "Ahora ya sabes qué miramos. ¡Vamos a practicar!",
     "piensa": "Siguiente: la lluvia que alimenta la montaña…"
    }
   }
  ],
  "tarjetas": [
   {
    "icono": "🏔",
    "pregunta": "¿Qué es un glaciar?",
    "respuesta": "Una gran masa de hielo en tierra firme, hecha con nieve de muchos años, que baja despacio por su peso."
   },
   {
    "icono": "🧊",
    "pregunta": "¿Qué es el firn?",
    "respuesta": "Nieve granulada y apretada, de más de un año. Es el paso entre la nieve y el hielo."
   },
   {
    "icono": "🧂",
    "pregunta": "¿Todo lo blanco que ve un satélite es nieve?",
    "respuesta": "No. Las nubes y los salares también se ven blancos."
   },
   {
    "icono": "📍",
    "pregunta": "¿Qué necesita un dato?",
    "respuesta": "Lugar (latitud y longitud), fecha y quién lo midió."
   },
   {
    "icono": "💭",
    "pregunta": "¿Qué es una interpretación?",
    "respuesta": "Lo que concluyes a partir de lo que ves o mides. Hay que comprobarla."
   }
  ],
  "trivia": [
   {
    "tipo": "clasificar",
    "pregunta": "Clasifica cada escena: ¿nieve, nube, sal o agua?",
    "etiquetas": [
     "Nieve",
     "Nube",
     "Sal",
     "Agua"
    ],
    "escenas": [
     {
      "img": "escena-nieve",
      "correcta": "Nieve"
     },
     {
      "img": "escena-nube",
      "correcta": "Nube"
     },
     {
      "img": "escena-salar",
      "correcta": "Sal"
     },
     {
      "img": "escena-lago",
      "correcta": "Agua"
     }
    ],
    "explicacion": "La nieve sigue la forma de la montaña; la nube es borrosa y tapa todo; el salar es plano; el agua se ve oscura.",
    "pista": "Mira la forma, no solo el color."
   },
   {
    "tipo": "opciones",
    "pregunta": "Nieve que cae en febrero y se derrite en mayo es…",
    "opciones": [
     "Glaciar",
     "Nieve de temporada",
     "Firn",
     "Hielo azul"
    ],
    "correcta": 1,
    "explicacion": "Dura pocos meses: es nieve de temporada.",
    "pista": "¿Cuánto tiempo dura?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Qué saca el aire de la nieve para volverla hielo?",
    "opciones": [
     "El viento",
     "El peso de la nieve nueva",
     "La lluvia",
     "El sol"
    ],
    "correcta": 1,
    "explicacion": "El peso aprieta las capas de abajo durante años.",
    "pista": "Piensa en la bola de nieve."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuál es un dato?",
    "opciones": [
     "“Parece que hay menos nieve”",
     "“MODIS, 15/08/2024, 16,2° S 68,2° O, índice 40”",
     "“Es culpa del calor”",
     "“Se ve bonito”"
    ],
    "correcta": 1,
    "explicacion": "Tiene instrumento, fecha, lugar y valor.",
    "pista": "Un dato dice dónde, cuándo y quién."
   },
   {
    "tipo": "opciones",
    "pregunta": "La Cordillera Real está a 16,2° S. ¿Qué nos dice esa S?",
    "opciones": [
     "Que está al sur del ecuador",
     "Que es soleada",
     "Que es pequeña",
     "Que está al este"
    ],
    "correcta": 0,
    "explicacion": "S = sur. Bolivia está al sur del ecuador.",
    "pista": "S de…"
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Qué es un glaciar y qué es nieve de temporada",
    "Cómo la nieve se vuelve firn y luego hielo",
    "Que lo blanco no siempre es nieve",
    "La diferencia entre observación, dato e interpretación"
   ]
  },
  "jukumari": {
   "inicio": "¡Hola, detective! Antes de investigar, aprendamos qué es lo que vamos a mirar.",
   "acierto": "¡Bien visto!",
   "fallo": "Casi. Lee la explicación: ¡así se aprende!",
   "final": "¡Primera lección lista! Ya sabes qué hay en la montaña."
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-1-p1.png",
   "img/lecciones/leccion-1-p2.png",
   "img/lecciones/leccion-1-p3.png",
   "img/lecciones/leccion-1-p4.png"
  ],
  "nombre": "La Tierra",
  "conceptos": [
   "¿Qué es un glaciar?",
   "De nieve a hielo",
   "Lo blanco no siempre es nieve",
   "Ver, medir y concluir"
  ],
  "datos": null
 },
 {
  "id": "lluvia",
  "numero": 2,
  "bloque": "A",
  "titulo": "La lluvia que alimenta la montaña",
  "titulo_corto": "La lluvia",
  "pregunta": "¿De dónde sale la nieve y el agua de la montaña?",
  "paginas": [
   {
    "titulo": "¿Qué es la <em>precipitación</em>?",
    "texto": "<b>Precipitación</b> es toda el agua que cae del cielo: <b>lluvia</b>, <b>nieve</b> o granizo. En la parte baja cae como lluvia; en lo alto de la cordillera, donde hace más frío, cae como <b>nieve</b>. Se mide en <b>milímetros (mm)</b>.",
    "ejemplo": "<b>1 mm</b> de lluvia es como echar <b>1 litro de agua</b> sobre un cuadrado de 1 metro por 1 metro. Si llueven 20 mm, ¡son 20 litros en ese cuadrado!",
    "chequeo": {
     "pregunta": "La nieve que cae en la cordillera, ¿es precipitación?",
     "opciones": [
      "No, solo la lluvia",
      "Sí, también es agua que cae"
     ],
     "correcta": 1,
     "explicacion": "Lluvia, nieve y granizo: todo es precipitación."
    },
    "jukumari": {
     "dice": "¡La montaña también necesita agua para tener nieve!",
     "piensa": "¿Cuándo llueve más en La Paz…?"
    }
   },
   {
    "titulo": "La <em>época de lluvias</em>",
    "texto": "En la Cordillera Real el año tiene dos caras. De <b>diciembre a marzo</b> llueve mucho: es la <b>época de lluvias</b>. De <b>mayo a agosto</b> casi no llueve: es la <b>época seca</b>. En esos 4 meses de lluvias cae <b>más de la mitad</b> del agua de todo el año.",
    "ejemplo": "En <b>enero</b> caen en promedio <b>186 mm</b>; en <b>julio</b>, solo <b>24 mm</b>. ¡Casi 8 veces menos! Son datos reales de NASA (GPM IMERG, 2001–2025).",
    "chequeo": {
     "pregunta": "¿En qué meses llueve más en la Cordillera Real?",
     "opciones": [
      "Diciembre a marzo",
      "Junio a agosto"
     ],
     "correcta": 0,
     "explicacion": "Es la época de lluvias: el verano del hemisferio sur."
    },
    "jukumari": {
     "dice": "¡Mira! Estos son datos reales de NASA.",
     "piensa": "Si casi no llueve en julio… ¿de dónde sale el agua?"
    }
   },
   {
    "titulo": "La montaña es una <em>alcancía</em>",
    "texto": "La lluvia y la nieve están conectadas. En la época de lluvias, la cordillera <b>guarda</b> agua en forma de nieve y hielo. En la época seca, ese hielo se derrite despacio y <b>suelta</b> agua. Por eso a las montañas con glaciares se les llama <b>torres de agua</b>.",
    "ejemplo": "En la época seca, cuando casi no llueve, parte del agua de La Paz viene del <b>deshielo de los glaciares</b>. Un estudio calculó que puede llegar a cerca de <b>27 %</b> (Soruco y otros, 2015).",
    "chequeo": {
     "pregunta": "¿Cuándo “guarda” agua la montaña?",
     "opciones": [
      "En la época de lluvias",
      "En la época seca"
     ],
     "correcta": 0,
     "explicacion": "Guarda en la época de lluvias y suelta en la seca."
    },
    "jukumari": {
     "dice": "La montaña guarda agua como una alcancía.",
     "piensa": "Si llueve menos, ¿se llenará menos la alcancía…?"
    }
   },
   {
    "titulo": "¿Cómo se mide la lluvia <em>desde el espacio</em>?",
    "texto": "La misión <b>GPM</b> de NASA y Japón usa un satélite principal y otros satélites que pasan sobre la Tierra. El producto <b>IMERG</b> junta lo que ven todos y calcula cuánta lluvia cae en cuadros de unos <b>10 km</b>, cada <b>media hora</b>.",
    "ejemplo": "Para la Cordillera Real usamos <b>GPM IMERG</b> mes a mes, desde 2001. Un cuadro de 10 km es grande: sirve para la <b>región</b>, no para una sola montaña.",
    "chequeo": {
     "pregunta": "¿Qué hace IMERG?",
     "opciones": [
      "Junta datos de varios satélites",
      "Mide la nieve en el suelo"
     ],
     "correcta": 0,
     "explicacion": "Combina lo que miden muchos satélites para estimar la lluvia."
    },
    "jukumari": {
     "dice": "¡Ya conoces nuestras dos variables: nieve y lluvia!",
     "piensa": "Siguiente: los ojos que miran desde el espacio."
    }
   }
  ],
  "tarjetas": [
   {
    "icono": "🌧",
    "pregunta": "¿Qué es la precipitación?",
    "respuesta": "Toda el agua que cae del cielo: lluvia, nieve o granizo."
   },
   {
    "icono": "🪣",
    "pregunta": "¿Qué significa que llovieron 10 mm?",
    "respuesta": "Que cayeron 10 litros de agua en cada metro cuadrado."
   },
   {
    "icono": "📅",
    "pregunta": "¿Cuándo es la época de lluvias en la Cordillera Real?",
    "respuesta": "De diciembre a marzo. La época seca, de mayo a agosto."
   },
   {
    "icono": "🏔",
    "pregunta": "¿Por qué se dice que las montañas son torres de agua?",
    "respuesta": "Porque guardan agua como nieve y hielo y la sueltan en la época seca."
   },
   {
    "icono": "🛰",
    "pregunta": "¿Qué es GPM IMERG?",
    "respuesta": "Un producto de NASA que junta varios satélites para medir la lluvia cada media hora, en cuadros de unos 10 km."
   }
  ],
  "trivia": [
   {
    "tipo": "ordenar",
    "pregunta": "Ordena el viaje del agua en la montaña",
    "pasos": [
     "Cae nieve en la época de lluvias",
     "El glaciar guarda la nieve",
     "El hielo se derrite en la época seca",
     "El agua llega a la ciudad"
    ],
    "explicacion": "Primero se guarda, después se derrite y recién entonces el agua baja a la ciudad.",
    "pista": "El agua no llega antes de derretirse."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuántos litros cayeron en 1 m² si llovieron 5 mm?",
    "opciones": [
     "5 litros",
     "50 litros",
     "0,5 litros",
     "500 litros"
    ],
    "correcta": 0,
    "explicacion": "1 mm = 1 litro por metro cuadrado.",
    "pista": "1 mm = 1 litro."
   },
   {
    "tipo": "opciones",
    "pregunta": "En la parte más alta de la cordillera, la precipitación cae sobre todo como…",
    "opciones": [
     "Nieve",
     "Lluvia caliente",
     "Arena",
     "Nada"
    ],
    "correcta": 0,
    "explicacion": "Arriba hace frío: cae nieve.",
    "pista": "¿Hace frío o calor allá arriba?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿En qué mes llueve menos en la Cordillera Real?",
    "opciones": [
     "Enero",
     "Julio",
     "Febrero",
     "Diciembre"
    ],
    "correcta": 1,
    "explicacion": "Julio está en plena época seca: unos 24 mm en promedio.",
    "pista": "Busca la época seca."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Para qué sirve un dato de lluvia en cuadros de 10 km?",
    "opciones": [
     "Para ver la región",
     "Para medir una sola piedra",
     "Para ver un glaciar pequeño",
     "Para medir la nieve"
    ],
    "correcta": 0,
    "explicacion": "10 km es grande: sirve para la región.",
    "pista": "Piensa en el tamaño del cuadro."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Qué es la precipitación y cómo se mide en mm",
    "Cuándo es la época de lluvias y la época seca",
    "Por qué las montañas son torres de agua",
    "Cómo GPM IMERG mide la lluvia desde el espacio"
   ]
  },
  "jukumari": {
   "inicio": "Sin lluvia no hay nieve. ¡Veamos de dónde sale el agua!",
   "acierto": "¡Eso es!",
   "fallo": "Casi. Fíjate en la explicación.",
   "final": "¡Bloque A completo! Ya conoces nuestras dos variables: nieve y lluvia."
  },
  "insignia": "explorador-planeta",
  "imagenes": [
   "img/lecciones/leccion-2-p1.png",
   "img/lecciones/leccion-2-p2.png",
   "img/lecciones/leccion-2-p3.png",
   "img/lecciones/leccion-2-p4.png"
  ],
  "nombre": "La lluvia",
  "conceptos": [
   "¿Qué es la precipitación?",
   "La época de lluvias",
   "La montaña es una alcancía",
   "¿Cómo se mide la lluvia desde el espacio?"
  ],
  "datos": null
 },
 {
  "id": "ojos",
  "numero": 3,
  "bloque": "B",
  "titulo": "Ojos en el espacio",
  "titulo_corto": "MODIS",
  "pregunta": "¿Quién mira la nieve desde el espacio?",
  "paginas": [
   {
    "titulo": "MODIS <em>no es</em> un satélite",
    "texto": "<b>MODIS</b> es un <b>instrumento</b>: una cámara muy especial que mide la luz que rebota en la Tierra. Viaja a bordo de dos satélites de NASA: <b>Terra</b> (lanzado en 1999) y <b>Aqua</b> (en 2002).",
    "ejemplo": "Piensa en un <b>celular</b> y su <b>cámara</b>: el celular sería el satélite Terra y la cámara sería MODIS. Hay dos “celulares” con la misma cámara: Terra y Aqua.",
    "chequeo": {
     "pregunta": "MODIS es…",
     "opciones": [
      "Un satélite",
      "Un instrumento que va en un satélite"
     ],
     "correcta": 1,
     "explicacion": "MODIS es el instrumento; Terra y Aqua son los satélites."
    },
    "jukumari": {
     "dice": "¡Conozcamos los ojos que miran la nieve!",
     "piensa": "¿Cada cuánto pasará por Bolivia…?"
    },
    "paraCuriosos": "MODIS significa, en inglés, “espectrorradiómetro de imágenes de resolución moderada”."
   },
   {
    "titulo": "¿Cada cuánto <em>mira</em>?",
    "texto": "Terra y Aqua dan vueltas a la Tierra de polo a polo. En cada vuelta MODIS ve una <b>franja</b> de unos 2300 km de ancho. Juntando franjas, cubre <b>toda la Tierra en 1 o 2 días</b>. Terra pasa por la <b>mañana</b> y Aqua por la <b>tarde</b>.",
    "ejemplo": "En APU, el chip <b>“Terra en vivo”</b> muestra dónde está Terra ahora mismo. Pasa sobre Bolivia casi todos los días a media mañana.",
    "chequeo": {
     "pregunta": "¿Cada cuánto MODIS cubre toda la Tierra?",
     "opciones": [
      "Cada 1 o 2 días",
      "Una vez al año"
     ],
     "correcta": 0,
     "explicacion": "Por eso hay datos de casi todos los días desde el año 2000."
    },
    "jukumari": {
     "dice": "¡Por eso hay datos de casi todos los días!",
     "piensa": "Muchas fotos… pero ¿qué tan detalladas?"
    }
   },
   {
    "titulo": "Una foto hecha de <em>cuadritos</em>",
    "texto": "Las imágenes de satélite están hechas de <b>píxeles</b>: cuadritos que tienen un solo valor. En el producto de nieve de MODIS cada píxel mide <b>500 m × 500 m</b>. Si en un cuadrito hay nieve y roca a la vez, es un <b>píxel mixto</b>.",
    "ejemplo": "Un píxel de 500 m es tan grande como <b>unas 35 canchas de fútbol</b>. Un glaciar más chico que eso queda mezclado con la roca. Por eso MODIS sirve para <b>regiones</b>, no para glaciares pequeños.",
    "chequeo": {
     "pregunta": "Un glaciar de 200 m de ancho, ¿se ve bien con MODIS?",
     "opciones": [
      "Sí, perfecto",
      "No, es más chico que un píxel"
     ],
     "correcta": 1,
     "explicacion": "Queda dentro de un solo píxel, mezclado con roca."
    },
    "jukumari": {
     "dice": "¡Cada cuadrito es como una pieza de rompecabezas!",
     "piensa": "¿Cómo sabe si el cuadrito es blanco por nieve o por nube…?"
    },
    "paraCuriosos": "MODIS tiene píxeles de 250, 500 y 1000 m según la banda. El producto de nieve usa 500 m."
   },
   {
    "titulo": "Luz que <em>no vemos</em>",
    "texto": "MODIS mide la luz en <b>36 bandas</b>: colores que vemos (como el <b>verde</b>) y otros invisibles, como el <b>infrarrojo</b>. La nieve y las nubes son blancas a la vista, pero en el <b>infrarrojo de onda corta (SWIR)</b> la nieve se ve <b>oscura</b> y la nube sigue <b>brillante</b>.",
    "ejemplo": "Es como unos <b>lentes mágicos</b>: sin ellos, nieve y nube se ven iguales; con el infrarrojo, la nieve “se apaga” y la nube no. ¡Así se separan!",
    "chequeo": {
     "pregunta": "En el infrarrojo SWIR, ¿cómo se ve la nieve?",
     "opciones": [
      "Oscura",
      "Muy brillante"
     ],
     "correcta": 0,
     "explicacion": "La nieve absorbe el SWIR; la nube lo refleja."
    },
    "jukumari": {
     "dice": "¡Ahora conoces el truco de MODIS!",
     "piensa": "Con verde y SWIR… ¿se podrá calcular algo?"
    },
    "paraCuriosos": "Bandas de MODIS: 1 rojo, 2 infrarrojo cercano, 4 verde, 6 SWIR (1,6 µm)."
   }
  ],
  "tarjetas": [
   {
    "icono": "📷",
    "pregunta": "¿MODIS es un satélite?",
    "respuesta": "No. Es un instrumento que viaja en los satélites Terra y Aqua."
   },
   {
    "icono": "🌍",
    "pregunta": "¿Cada cuánto cubre MODIS toda la Tierra?",
    "respuesta": "Cada 1 o 2 días."
   },
   {
    "icono": "🔲",
    "pregunta": "¿Qué es un píxel mixto?",
    "respuesta": "Un cuadrito con nieve y roca a la vez. MODIS le da un solo valor."
   },
   {
    "icono": "⚽",
    "pregunta": "¿Qué tan grande es un píxel de nieve de MODIS?",
    "respuesta": "500 m × 500 m: como unas 35 canchas de fútbol."
   },
   {
    "icono": "🕶",
    "pregunta": "¿Cómo separa MODIS la nieve de las nubes?",
    "respuesta": "Con el infrarrojo SWIR: la nieve se ve oscura y la nube brillante."
   }
  ],
  "trivia": [
   {
    "tipo": "opciones",
    "pregunta": "¿En qué satélites viaja MODIS?",
    "opciones": [
     "Terra y Aqua",
     "GPM y GRACE",
     "Landsat",
     "Solo en la Estación Espacial"
    ],
    "correcta": 0,
    "explicacion": "GPM mide la lluvia y GRACE el peso del hielo. MODIS va en Terra (1999) y Aqua (2002).",
    "pista": "Uno es “tierra” y el otro “agua” en latín."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Qué satélite pasa por la mañana?",
    "opciones": [
     "Aqua",
     "Terra",
     "Ninguno",
     "Los dos a medianoche"
    ],
    "correcta": 1,
    "explicacion": "Terra cruza a media mañana; Aqua, después del mediodía.",
    "pista": "Terra es el primero."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Por qué MODIS sirve para regiones y no para glaciares chicos?",
    "opciones": [
     "Porque sus píxeles miden 500 m",
     "Porque es muy viejo",
     "Porque solo ve de noche",
     "Porque no es de NASA"
    ],
    "correcta": 0,
    "explicacion": "Lo que es más chico que un píxel se mezcla con lo de alrededor.",
    "pista": "Piensa en el tamaño del cuadrito."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuántas bandas de luz mide MODIS?",
    "opciones": [
     "3",
     "36",
     "1",
     "100"
    ],
    "correcta": 1,
    "explicacion": "36 bandas, desde la luz visible hasta el infrarrojo.",
    "pista": "Más de 30."
   },
   {
    "tipo": "opciones",
    "pregunta": "La nieve y una nube se ven iguales a la vista. ¿Qué las separa?",
    "opciones": [
     "El infrarrojo SWIR",
     "El sonido",
     "El color verde solo",
     "Nada"
    ],
    "correcta": 0,
    "explicacion": "En el SWIR la nieve se ve oscura y la nube brillante.",
    "pista": "Los lentes mágicos…"
   }
  ],
  "meta": {
   "ahoraSabes": [
    "MODIS es un instrumento que viaja en Terra y Aqua",
    "Cubre toda la Tierra en 1 o 2 días",
    "Qué es un píxel de 500 m y un píxel mixto",
    "El infrarrojo separa la nieve de las nubes"
   ]
  },
  "jukumari": {
   "inicio": "¡Hora de conocer los ojos que miran la nieve desde el espacio!",
   "acierto": "¡Ojo de satélite!",
   "fallo": "Casi. Revisa la explicación.",
   "final": "¡Ya conoces a MODIS! Ahora, su fórmula secreta."
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-3-p1.png",
   "img/lecciones/leccion-3-p2.png",
   "img/lecciones/leccion-3-p3.png",
   "img/lecciones/leccion-3-p4.png"
  ],
  "nombre": "MODIS",
  "conceptos": [
   "MODIS no es un satélite",
   "¿Cada cuánto mira?",
   "Una foto hecha de cuadritos",
   "Luz que no vemos"
  ],
  "datos": null
 },
 {
  "id": "ndsi",
  "numero": 4,
  "bloque": "B",
  "titulo": "Cómo MODIS reconoce la nieve",
  "titulo_corto": "El índice de nieve",
  "pregunta": "¿Cómo sabe MODIS que algo es nieve?",
  "paginas": [
   {
    "titulo": "La fórmula de la <em>nieve</em>",
    "texto": "MODIS compara la luz <b>verde</b> con la del <b>infrarrojo SWIR</b>. Con esa comparación calcula el <b>NDSI</b> (índice de nieve). La nieve refleja mucho verde y poco SWIR, así que su NDSI sale <b>alto</b>. Una nube o la roca dan un NDSI <b>bajo</b>.",
    "ejemplo": "Un píxel con verde <b>0,60</b> y SWIR <b>0,20</b>: (0,60 − 0,20) ÷ (0,60 + 0,20) = 0,40 ÷ 0,80 = <b>0,50</b>. Parece nieve.",
    "chequeo": {
     "pregunta": "Si verde = 0,80 y SWIR = 0,20, el NDSI es…",
     "opciones": [
      "0,60",
      "0,25"
     ],
     "correcta": 0,
     "explicacion": "(0,80 − 0,20) ÷ (0,80 + 0,20) = 0,60 ÷ 1,00 = 0,60."
    },
    "jukumari": {
     "dice": "¡Hagamos matemáticas de detective!",
     "piensa": "Si verde y SWIR son iguales… ¿cuánto da?"
    },
    "paraCuriosos": "NDSI = (verde − SWIR) / (verde + SWIR), con las bandas 4 y 6 de MODIS."
   },
   {
    "titulo": "De índice a <em>número</em>",
    "texto": "En el producto de nieve <b>MOD10A1</b>, MODIS guarda el NDSI multiplicado por 100: un número de <b>0 a 100</b> para cada píxel. Más alto = más parecido a nieve. Tú eliges el <b>umbral</b>: desde qué número dices “aquí hay nieve”.",
    "ejemplo": "NDSI 0,50 → se guarda como <b>50</b>. Si tu umbral es <b>40</b>, ese píxel cuenta como nieve. Con umbral <b>60</b>, ya no.",
    "chequeo": {
     "pregunta": "Con umbral 40, un píxel con valor 35, ¿cuenta como nieve?",
     "opciones": [
      "Sí",
      "No"
     ],
     "correcta": 1,
     "explicacion": "35 es menor que 40: no llega al umbral."
    },
    "jukumari": {
     "dice": "¡Tú decides el límite, como un juez!",
     "piensa": "¿Y si el número es mayor que 100…?"
    },
    "paraCuriosos": "MOD10A1 versión 6.1, banda NDSI_Snow_Cover, píxeles de 500 m, un dato por día."
   },
   {
    "titulo": "Números que son <em>avisos</em>",
    "texto": "Solo los valores de <b>0 a 100</b> hablan de nieve. Los números más grandes son <b>avisos</b>: el satélite dice “aquí no pude ver” (nube, noche) o “esto es agua”. Un aviso <b>no</b> significa “no hay nieve”: significa “no sé”.",
    "ejemplo": "Si un día de agosto el píxel dice <b>250</b> (nube), no sabemos si había nieve debajo. Lo correcto es <b>no usar</b> ese día, no contarlo como cero.",
    "chequeo": {
     "pregunta": "Un píxel dice 250. ¿Qué significa?",
     "opciones": [
      "No hay nieve",
      "Hay una nube, no se sabe"
     ],
     "correcta": 1,
     "explicacion": "250 = nube. No sabemos qué hay debajo."
    },
    "jukumari": {
     "dice": "¡Leer los avisos es clave!",
     "piensa": "Si hay muchas nubes… ¿quedarán datos suficientes?"
    },
    "paraCuriosos": "Avisos de MOD10A1: 200 falta el dato · 201 sin decisión · 211 noche · 237 agua de lagos · 239 océano · 250 nube · 254 sensor saturado · 255 relleno."
   },
   {
    "titulo": "Las <em>trampas</em> del índice",
    "texto": "El NDSI es muy útil, pero <b>no es perfecto</b>. El algoritmo oficial de NASA hace más pruebas para no equivocarse, y aun así hay casos difíciles: agua, sombras y algunas nubes de hielo. Un buen detective sabe dónde puede fallar su herramienta.",
    "ejemplo": "Ver nieve en agosto en un píxel no prueba que ahí haya un glaciar: podría ser nieve de una nevada reciente. Por eso hablamos de <b>“cobertura de nieve”</b>, no de “glaciar”.",
    "chequeo": {
     "pregunta": "Un NDSI alto, ¿prueba que hay un glaciar?",
     "opciones": [
      "Sí",
      "No, solo que parece nieve"
     ],
     "correcta": 1,
     "explicacion": "NDSI alto dice “parece nieve”, no “aquí hay un glaciar”."
    },
    "jukumari": {
     "dice": "¡Ya sabes leer los datos como un científico!",
     "piensa": "Siguiente: ¡el caso del agua de La Paz!"
    }
   }
  ],
  "tarjetas": [
   {
    "icono": "🧮",
    "pregunta": "¿Cómo se calcula el NDSI?",
    "respuesta": "(verde − SWIR) ÷ (verde + SWIR). Nieve: verde alto y SWIR bajo → NDSI alto."
   },
   {
    "icono": "💯",
    "pregunta": "¿Qué valores de MOD10A1 hablan de nieve?",
    "respuesta": "De 0 a 100. 0 = sin nieve."
   },
   {
    "icono": "🎚",
    "pregunta": "¿Qué es el umbral?",
    "respuesta": "El número desde el cual decides que un píxel tiene nieve."
   },
   {
    "icono": "☁",
    "pregunta": "¿Qué significa el valor 250?",
    "respuesta": "Nube: no se sabe qué hay debajo. No es “sin nieve”."
   },
   {
    "icono": "⚠",
    "pregunta": "¿Un NDSI alto prueba que hay un glaciar?",
    "respuesta": "No. Solo que el píxel parece nieve."
   }
  ],
  "trivia": [
   {
    "tipo": "pixeles",
    "pregunta": "Con umbral 40, ¿cuántos de estos píxeles cuentan como nieve?",
    "valores": [
     62,
     45,
     250,
     30,
     237,
     80
    ],
    "umbral": 40,
    "opciones": [
     "3 (62, 45 y 80)",
     "5 (todos menos 30)",
     "2",
     "6"
    ],
    "correcta": 0,
    "explicacion": "250 es una nube y 237 es agua: son avisos, no nieve. 30 está por debajo del umbral. Quedan 62, 45 y 80.",
    "pista": "Los números mayores que 100 no son nieve."
   },
   {
    "tipo": "opciones",
    "pregunta": "Verde = 0,60 y SWIR = 0,60. ¿Cuánto da el NDSI?",
    "opciones": [
     "0",
     "1",
     "0,60",
     "1,20"
    ],
    "correcta": 0,
    "explicacion": "(0,60 − 0,60) = 0. Cero dividido por cualquier número da 0.",
    "pista": "Resta primero."
   },
   {
    "tipo": "opciones",
    "pregunta": "NDSI 0,45 se guarda en MOD10A1 como…",
    "opciones": [
     "45",
     "0,45",
     "450",
     "4,5"
    ],
    "correcta": 0,
    "explicacion": "Se multiplica por 100.",
    "pista": "×100"
   },
   {
    "tipo": "opciones",
    "pregunta": "Si subes el umbral de 40 a 50…",
    "opciones": [
     "Cuentan menos píxeles como nieve",
     "Cuentan más",
     "No cambia nada",
     "Desaparecen las nubes"
    ],
    "correcta": 0,
    "explicacion": "Exiges más para llamar nieve a un píxel.",
    "pista": "Más exigente = menos píxeles."
   },
   {
    "tipo": "opciones",
    "pregunta": "Un píxel dice 211. ¿Qué haces?",
    "opciones": [
     "Lo cuento como 0",
     "No lo uso: era de noche",
     "Lo cuento como nieve",
     "Lo borro del mapa"
    ],
    "correcta": 1,
    "explicacion": "211 = noche. El satélite no pudo ver.",
    "pista": "Es un aviso."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Calcular el NDSI con verde y SWIR",
    "Que MOD10A1 guarda la nieve de 0 a 100",
    "Qué es el umbral y cómo elegirlo",
    "Leer los avisos: nube, noche, agua…",
    "Que nieve no es lo mismo que glaciar"
   ]
  },
  "jukumari": {
   "inicio": "Hoy descubrimos la fórmula secreta de la nieve.",
   "acierto": "¡Matemático de la nieve!",
   "fallo": "Casi. Haz la cuenta paso a paso.",
   "final": "¡Bloque B completo! Ya puedes leer los datos de MODIS."
  },
  "insignia": "inspector-pixeles",
  "imagenes": [
   "img/lecciones/leccion-4-p1.png",
   "img/lecciones/leccion-4-p2.png",
   "img/lecciones/leccion-4-p3.png",
   "img/lecciones/leccion-4-p4.png"
  ],
  "nombre": "El índice de nieve",
  "conceptos": [
   "La fórmula de la nieve",
   "De índice a número",
   "Números que son avisos",
   "Las trampas del índice"
  ],
  "datos": null
 },
 {
  "id": "caso",
  "numero": 5,
  "bloque": "C",
  "titulo": "El caso y tu pregunta",
  "titulo_corto": "El caso",
  "pregunta": "¿Qué vamos a investigar?",
  "paginas": [
   {
    "titulo": "Llegó un <em>expediente</em>",
    "texto": "Un detective empieza con un <b>caso</b>. Nuestro expediente trae noticias sobre el agua de La Paz y los glaciares. Antes de creer cualquier cosa, un detective <b>lee con cuidado</b> y busca <b>de dónde viene</b> cada información.",
    "ejemplo": "Noticia 1: en <b>2016</b> La Paz tuvo racionamiento de agua por la sequía. Noticia 2: en <b>agosto de 2026</b> se declaró alerta roja, pero la empresa de agua dijo que las represas estaban bien.",
    "chequeo": {
     "pregunta": "¿Qué hace primero un detective con una noticia?",
     "opciones": [
      "La cree",
      "Busca su fuente"
     ],
     "correcta": 1,
     "explicacion": "Primero revisa de dónde viene y si se puede comprobar."
    },
    "jukumari": {
     "dice": "¡Llegó una carpeta! Abrámosla juntos.",
     "piensa": "Dos noticias… dos mensajes distintos."
    }
   },
   {
    "titulo": "Dato, aclarar o <em>suposición</em>",
    "texto": "Separamos lo que leemos en tres cajas. <b>Dato</b>: se puede comprobar y tiene fuente. <b>Hay que aclarar</b>: tiene fuente, pero falta saber de qué habla exactamente. <b>Suposición</b>: alguien lo cree, pero no está probado.",
    "ejemplo": "“Los glaciares perdieron <b>42 %</b>” va en <b>hay que aclarar</b>: es de todos los Andes tropicales, entre 1990 y 2020, y mide el <b>tamaño</b> del hielo, no el agua.",
    "chequeo": {
     "pregunta": "“La culpa es del cambio climático” va en…",
     "opciones": [
      "Dato",
      "Suposición"
     ],
     "correcta": 1,
     "explicacion": "Puede ser cierto, pero con nuestros datos todavía no lo probamos."
    },
    "jukumari": {
     "dice": "¡Cada recorte a su caja!",
     "piensa": "42 %… ¿de qué? ¿hielo o agua?"
    }
   },
   {
    "titulo": "¿Qué puede <em>responder</em> MODIS?",
    "texto": "Cada herramienta responde algunas preguntas y otras no. MODIS ve <b>dónde hay nieve</b> y <b>cómo cambia con los años</b>. Pero <b>no</b> mide cuántos litros de agua hay, cuánto pesa el hielo ni <b>por qué</b> cambió.",
    "ejemplo": "Pregunta buena: “¿cambió la nieve de la Cordillera Real entre 2001 y 2025?”. Pregunta que MODIS no puede responder: “¿cuántos litros de agua tiene el Illimani?”.",
    "chequeo": {
     "pregunta": "“¿Cuántos litros de agua tiene el Illimani?” ¿La responde MODIS?",
     "opciones": [
      "Sí",
      "No"
     ],
     "correcta": 1,
     "explicacion": "MODIS ve superficie de nieve, no litros."
    },
    "jukumari": {
     "dice": "Una buena pregunta es medio caso resuelto.",
     "piensa": "¿Cuál será nuestra pregunta…?"
    }
   },
   {
    "titulo": "Tu <em>hipótesis</em>",
    "texto": "Una <b>hipótesis</b> es lo que crees que pasó, <b>antes</b> de mirar los datos. No tiene que ser correcta: los datos dirán. Nuestra pregunta: entre 2001 y 2025, en agosto y septiembre, ¿la nieve de la Cordillera Real <b>bajó</b>, <b>no cambió</b> o <b>subió</b>?",
    "ejemplo": "Si eliges “bajó” y al final los datos dicen “no cambió”, <b>no perdiste</b>: aprendiste algo. Así avanza la ciencia.",
    "chequeo": {
     "pregunta": "Si los datos contradicen tu hipótesis…",
     "opciones": [
      "Cambias los datos",
      "Aprendes algo nuevo"
     ],
     "correcta": 1,
     "explicacion": "Nunca se cambian los datos. Una hipótesis equivocada también es un hallazgo."
    },
    "jukumari": {
     "dice": "Elige tu hipótesis y qué tan seguro estás.",
     "piensa": "Ahora… ¿dónde miramos?"
    }
   }
  ],
  "hipotesis": {
   "pregunta": "Entre 2001 y 2025, en agosto y septiembre, la nieve de la Cordillera Real…",
   "opciones": [
    "bajó",
    "no cambió",
    "subió"
   ],
   "confianza": [
    "Poco seguro",
    "Más o menos",
    "Muy seguro"
   ]
  },
  "fuentes": [
   {
    "texto": "Racionamiento de 2016 (Los Tiempos)",
    "url": "https://www.lostiempos.com/actualidad/local/20161112/semapa-racionara-agua-mes-mas-crisis-llega-paz"
   },
   {
    "texto": "Alerta roja y EPSAS (eju.tv, 11/08/2026)",
    "url": "https://eju.tv/?p=5060524"
   },
   {
    "texto": "42 % de los Andes tropicales (EFE / Expreso, 2022)",
    "url": "https://www.expreso.ec/actualidad/mundo/glaciares-andinos-reducen-42-superficie-127878.html"
   }
  ],
  "tarjetas": [
   {
    "icono": "📁",
    "pregunta": "¿Qué hace un detective con una noticia?",
    "respuesta": "Busca su fuente y revisa si se puede comprobar."
   },
   {
    "icono": "📦",
    "pregunta": "¿Cuáles son las tres cajas?",
    "respuesta": "Dato, hay que aclarar y suposición."
   },
   {
    "icono": "📏",
    "pregunta": "¿El 42 % de los glaciares andinos es de agua?",
    "respuesta": "No. Es del tamaño (superficie) del hielo, de 1990 a 2020."
   },
   {
    "icono": "❓",
    "pregunta": "¿Qué puede responder MODIS?",
    "respuesta": "Dónde hay nieve y cómo cambia con los años. No litros, ni peso, ni causas."
   },
   {
    "icono": "💡",
    "pregunta": "¿Qué es una hipótesis?",
    "respuesta": "Lo que crees que pasó antes de mirar los datos. Puede estar equivocada."
   }
  ],
  "trivia": [
   {
    "tipo": "clasificar",
    "pregunta": "Pon cada recorte en su caja",
    "etiquetas": [
     "Dato",
     "Hay que aclarar",
     "Suposición"
    ],
    "escenas": [
     {
      "texto": "En 2016 La Paz tuvo racionamiento de agua.",
      "correcta": "Dato"
     },
     {
      "texto": "Los glaciares perdieron 42 %.",
      "correcta": "Hay que aclarar"
     },
     {
      "texto": "Alerta roja, pero represas en niveles óptimos.",
      "correcta": "Hay que aclarar"
     },
     {
      "texto": "Ya no hay agua para La Paz.",
      "correcta": "Suposición"
     }
    ],
    "explicacion": "El racionamiento de 2016 está documentado. El 42 % y la alerta necesitan aclararse. “Ya no hay agua” nadie lo comprobó.",
    "pista": "¿Tiene fuente? ¿Se sabe de qué habla?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuál es una pregunta que MODIS SÍ puede responder?",
    "opciones": [
     "¿Cuánto pesa el hielo?",
     "¿Cambió la nieve entre 2001 y 2025?",
     "¿Por qué hace calor?",
     "¿Cuántos litros hay?"
    ],
    "correcta": 1,
    "explicacion": "MODIS ve la nieve día a día durante años.",
    "pista": "Piensa en lo que ve MODIS."
   },
   {
    "tipo": "opciones",
    "pregunta": "El 42 % de los Andes tropicales mide…",
    "opciones": [
     "Litros de agua",
     "El tamaño del hielo",
     "La temperatura",
     "El peso del hielo"
    ],
    "correcta": 1,
    "explicacion": "Es superficie: tamaño, no agua.",
    "pista": "¿Área o agua?"
   },
   {
    "tipo": "opciones",
    "pregunta": "“En 2016 La Paz tuvo racionamiento de agua” es…",
    "opciones": [
     "Un dato",
     "Una suposición",
     "Una hipótesis",
     "Un rumor"
    ],
    "correcta": 0,
    "explicacion": "Está documentado en noticias de esa época.",
    "pista": "¿Tiene fuente?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Tu hipótesis resultó equivocada. ¿Qué pasa?",
    "opciones": [
     "Pierdes",
     "Aprendes algo: así avanza la ciencia",
     "Cambias los datos",
     "Repites hasta acertar"
    ],
    "correcta": 1,
    "explicacion": "Nunca se cambian los datos.",
    "pista": "La ciencia aprende de los errores."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Leer un expediente buscando las fuentes",
    "Separar dato, lo que hay que aclarar y suposición",
    "Qué preguntas puede responder MODIS",
    "Escribir tu hipótesis"
   ]
  },
  "jukumari": {
   "inicio": "¡Empieza el caso! Hoy abrimos el expediente del agua de La Paz.",
   "acierto": "¡Buen olfato de detective!",
   "fallo": "Casi. Pregúntate: ¿se puede comprobar?",
   "final": "Ya tienes tu pregunta y tu hipótesis. ¡A investigar!"
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-5-p1.png",
   "img/lecciones/leccion-5-p2.png",
   "img/lecciones/leccion-5-p3.png",
   "img/lecciones/leccion-5-p4.png"
  ],
  "nombre": "El caso",
  "conceptos": [
   "Llegó un expediente",
   "Dato, aclarar o suposición",
   "¿Qué puede responder MODIS?",
   "Tu hipótesis"
  ],
  "datos": null
 },
 {
  "id": "region",
  "numero": 6,
  "bloque": "C",
  "titulo": "¿Dónde? La región",
  "titulo_corto": "La región",
  "pregunta": "¿Qué pedazo de mapa vamos a mirar?",
  "paginas": [
   {
    "titulo": "La escena <em>importa</em>",
    "texto": "La <b>región</b> es el pedazo de mapa que analizas. Si es muy grande, entran roca, pasto y lagos sin hielo. Si es muy chica, tienes pocos píxeles. Elegir bien la región es como elegir bien la escena del crimen.",
    "ejemplo": "Vamos a comparar tres recuadros de la Cordillera Real: <b>grande</b> (toda la cordillera), <b>medio</b> (del Huayna Potosí al Tuni-Condoriri) y <b>solo glaciares</b>.",
    "chequeo": {
     "pregunta": "Si tu recuadro tiene muchos lagos y roca…",
     "opciones": [
      "El cambio del hielo se nota más",
      "El cambio del hielo se nota menos"
     ],
     "correcta": 1,
     "explicacion": "Lo que no es hielo no cambia y “agua” la señal."
    },
    "jukumari": {
     "dice": "La escena del crimen importa. ¡Mira dónde está el hielo!",
     "piensa": "¿Cuántos cuadritos tendrá cada recuadro?"
    }
   },
   {
    "titulo": "¿Cuántos <em>píxeles</em> entran?",
    "texto": "Cada píxel de MODIS mide 500 m × 500 m. El recuadro <b>grande</b> mide unos 120 km por lado: tiene <b>unos 57 000 píxeles</b>. El <b>medio</b> mide unos 33 km por lado: <b>unos 4300 píxeles</b>. El de <b>solo glaciares</b> tiene muchos menos, pero casi todos con hielo.",
    "ejemplo": "Más píxeles no siempre es mejor: en el recuadro grande, la mayoría son de roca y pasto que no cambian con los años.",
    "chequeo": {
     "pregunta": "¿Qué recuadro tiene más píxeles?",
     "opciones": [
      "Grande",
      "Solo glaciares"
     ],
     "correcta": 0,
     "explicacion": "El grande, pero la mayoría no tiene hielo."
    },
    "jukumari": {
     "dice": "¡Contar cuadritos también es trabajo de detective!",
     "piensa": "Muchos píxeles… pero ¿de qué?"
    }
   },
   {
    "titulo": "La señal se <em>diluye</em>",
    "texto": "Si solo una parte del recuadro tiene hielo, el cambio del hielo se mezcla con lo que no cambia y se ve <b>más débil</b>. A eso le decimos que la señal se <b>diluye</b>. El recuadro grande no miente: muestra el mismo rumbo, pero más suave.",
    "ejemplo": "Es como echar un vaso de jugo en un balde de agua: el jugo sigue ahí, pero casi no se nota el sabor.",
    "chequeo": {
     "pregunta": "Un recuadro grande muestra un cambio pequeño. ¿Es mentira?",
     "opciones": [
      "Sí",
      "No, solo diluye"
     ],
     "correcta": 1,
     "explicacion": "El rumbo es el mismo; solo se ve más débil."
    },
    "jukumari": {
     "dice": "No es mentira: es jugo en un balde de agua.",
     "piensa": "Entonces… ¿cuál elijo?"
    }
   },
   {
    "titulo": "Elegir con <em>criterio</em>",
    "texto": "Una buena región es <b>lo bastante grande</b> para tener muchos píxeles de MODIS y <b>lo bastante ajustada</b> para que casi todos tengan hielo. Para el recuadro “solo glaciares” usamos los bordes de <b>GLIMS</b>, un mapa mundial de glaciares.",
    "ejemplo": "Usamos todos los bordes conocidos de cada glaciar, incluso de años en que era más grande. Así también contamos el hielo que <b>ya se perdió</b>.",
    "chequeo": {
     "pregunta": "¿De dónde salen los bordes de los glaciares?",
     "opciones": [
      "De GLIMS",
      "De Google Maps"
     ],
     "correcta": 0,
     "explicacion": "GLIMS es el inventario mundial de glaciares."
    },
    "jukumari": {
     "dice": "En el caso usaremos “solo glaciares”, pero tú puedes comparar.",
     "piensa": "Siguiente: ¿cuándo miramos?"
    },
    "paraCuriosos": "GLIMS: Global Land Ice Measurements from Space, con datos del NSIDC y apoyo de NASA."
   }
  ],
  "tarjetas": [
   {
    "icono": "🗺",
    "pregunta": "¿Qué es la región?",
    "respuesta": "El pedazo de mapa que analizas."
   },
   {
    "icono": "🧃",
    "pregunta": "¿Qué significa que la señal se diluye?",
    "respuesta": "Que el cambio del hielo se mezcla con zonas que no cambian y se ve más débil."
   },
   {
    "icono": "🔢",
    "pregunta": "¿Cuántos píxeles tiene el recuadro grande?",
    "respuesta": "Unos 57 000, pero la mayoría sin hielo."
   },
   {
    "icono": "🧊",
    "pregunta": "¿Qué es GLIMS?",
    "respuesta": "Un mapa mundial con los bordes de los glaciares."
   },
   {
    "icono": "✅",
    "pregunta": "¿Cómo es una buena región?",
    "respuesta": "Con muchos píxeles y casi todos con hielo."
   }
  ],
  "trivia": [
   {
    "tipo": "opciones",
    "pregunta": "¿Con qué recuadro se ve más claro el cambio del hielo?",
    "opciones": [
     "Grande",
     "Medio",
     "Solo glaciares",
     "Da igual"
    ],
    "correcta": 2,
    "explicacion": "Tiene menos roca y lagos que diluyan la señal.",
    "pista": "¿Dónde hay más hielo por píxel?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Qué pico está en el recuadro medio?",
    "opciones": [
     "Illimani",
     "Huayna Potosí",
     "Kilimanjaro",
     "Everest"
    ],
    "correcta": 1,
    "explicacion": "El medio va del Huayna Potosí al Tuni-Condoriri.",
    "pista": "Está cerca de El Alto."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Por qué usamos bordes de años en que el glaciar era más grande?",
    "opciones": [
     "Para contar también el hielo perdido",
     "Por error",
     "Porque son más bonitos",
     "Para tener menos píxeles"
    ],
    "correcta": 0,
    "explicacion": "Si solo usamos el borde actual, no veríamos dónde se perdió hielo.",
    "pista": "¿Qué pasa con el hielo que ya no está?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Un recuadro de 1 km × 1 km tiene…",
    "opciones": [
     "4 píxeles de MODIS",
     "1000 píxeles",
     "1 millón",
     "Ninguno"
    ],
    "correcta": 0,
    "explicacion": "500 m × 500 m: entran 2 × 2 = 4.",
    "pista": "¿Cuántos de 500 m caben en 1 km?"
   },
   {
    "tipo": "opciones",
    "pregunta": "El recuadro grande muestra un cambio débil. Eso significa que…",
    "opciones": [
     "La señal se diluye",
     "Los datos están mal",
     "No hay glaciares",
     "MODIS falló"
    ],
    "correcta": 0,
    "explicacion": "La roca y los lagos no cambian y “aguan” el cambio.",
    "pista": "Jugo en un balde…"
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Qué es la región de estudio",
    "Cuántos píxeles entran en cada recuadro",
    "Por qué la señal se diluye",
    "Elegir una región con criterio (GLIMS)"
   ]
  },
  "jukumari": {
   "inicio": "Paso 2 del detective: ¿dónde miramos?",
   "acierto": "¡Cartógrafo nato!",
   "fallo": "Casi. Piensa en cuántos píxeles tienen hielo.",
   "final": "¡Ya tienes tu región! Ahora, ¿cuándo?"
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-6-p1.png",
   "img/lecciones/leccion-6-p2.png",
   "img/lecciones/leccion-6-p3.png",
   "img/lecciones/leccion-6-p4.png"
  ],
  "nombre": "La región",
  "conceptos": [
   "La escena importa",
   "¿Cuántos píxeles entran?",
   "La señal se diluye",
   "Elegir con criterio"
  ],
  "datos": null
 },
 {
  "id": "periodo",
  "numero": 7,
  "bloque": "C",
  "titulo": "¿Cuándo? El periodo",
  "titulo_corto": "El periodo",
  "pregunta": "¿Qué meses y años comparamos?",
  "paginas": [
   {
    "titulo": "La montaña <em>cambia de ropa</em>",
    "texto": "La nieve sube y baja durante el año: en la <b>época de lluvias</b> cae nieve nueva y en la <b>época seca</b> esa nieve se derrite. Ese ciclo se repite <b>todos los años</b>: se llama <b>estacionalidad</b>. No es una tendencia.",
    "ejemplo": "El gráfico muestra la nieve de cada mes en la Cordillera Real: en algunos meses hay mucha más que en otros, y eso pasa cada año.",
    "chequeo": {
     "pregunta": "La nieve sube en la época de lluvias y baja en la seca, cada año. Eso es…",
     "opciones": [
      "Una tendencia",
      "Estacionalidad"
     ],
     "correcta": 1,
     "explicacion": "Se repite cada año: es un ciclo, no un cambio de fondo."
    },
    "jukumari": {
     "dice": "Toca los meses y mira cómo cambia la nieve.",
     "piensa": "Si comparo meses distintos… ¿será justo?"
    }
   },
   {
    "titulo": "La comparación <em>injusta</em>",
    "texto": "Si comparas <b>marzo</b> de un año con <b>septiembre</b> de otro, verás una gran caída de nieve. Pero no es una tendencia: es la estación. Comparar épocas distintas es una <b>trampa</b>.",
    "ejemplo": "Es como comparar tu ropa de invierno con tu ropa de verano y decir que “cada vez te abrigas menos”. ¡Solo cambió la estación!",
    "chequeo": {
     "pregunta": "Marzo de 2001 contra septiembre de 2024, ¿es justo?",
     "opciones": [
      "Sí",
      "No, son estaciones distintas"
     ],
     "correcta": 1,
     "explicacion": "Hay que comparar los mismos meses."
    },
    "jukumari": {
     "dice": "¡Cuidado con esta trampa! Muchos caen.",
     "piensa": "Entonces… ¿qué meses comparamos?"
    }
   },
   {
    "titulo": "La ventana <em>justa</em>",
    "texto": "Lo justo es comparar <b>los mismos meses</b> en todos los años. Elegimos <b>agosto y septiembre</b>: es el final de la época seca. La nieve de temporada ya se fue y queda el hielo que <b>dura</b>. Además, hay menos nubes.",
    "ejemplo": "Así comparamos agosto–septiembre de 2001 con agosto–septiembre de 2002, de 2003… hasta 2025. Siempre la misma ventana.",
    "chequeo": {
     "pregunta": "¿Por qué agosto y septiembre?",
     "opciones": [
      "Es el fin de la época seca",
      "Hay más turistas"
     ],
     "correcta": 0,
     "explicacion": "Queda el hielo duradero y hay menos nubes."
    },
    "jukumari": {
     "dice": "La misma ventana cada año: así se compara justo.",
     "piensa": "¿Y cuántos años necesito?"
    }
   },
   {
    "titulo": "¿Cuántos <em>años</em>?",
    "texto": "Con pocos años, un año raro puede engañarte. Por eso usamos <b>muchos</b>: de <b>2001 a 2025</b>, son <b>25 años</b>. Como regla, con menos de <b>10 años</b> el resultado es poco confiable.",
    "ejemplo": "MODIS empezó en febrero de 2000. Usamos años completos: por eso empezamos en <b>2001</b>.",
    "chequeo": {
     "pregunta": "¿Cuántos años usamos?",
     "opciones": [
      "5",
      "25"
     ],
     "correcta": 1,
     "explicacion": "De 2001 a 2025: 25 años."
    },
    "jukumari": {
     "dice": "25 años de datos de NASA. ¡Eso sí es una buena serie!",
     "piensa": "Siguiente: limpiar los datos."
    }
   }
  ],
  "tarjetas": [
   {
    "icono": "🔁",
    "pregunta": "¿Qué es la estacionalidad?",
    "respuesta": "Un ciclo que se repite cada año, como la época de lluvias y la seca. No es tendencia."
   },
   {
    "icono": "⚖",
    "pregunta": "¿Qué comparación es justa?",
    "respuesta": "Los mismos meses en años distintos."
   },
   {
    "icono": "📅",
    "pregunta": "¿Qué ventana usamos?",
    "respuesta": "Agosto y septiembre: el fin de la época seca."
   },
   {
    "icono": "☀",
    "pregunta": "¿Por qué agosto y septiembre?",
    "respuesta": "Queda el hielo que dura y hay menos nubes."
   },
   {
    "icono": "🗓",
    "pregunta": "¿Cuántos años usamos y por qué?",
    "respuesta": "25 (2001–2025). Con menos de 10, un año raro puede engañar."
   }
  ],
  "trivia": [
   {
    "tipo": "opciones",
    "pregunta": "¿Cuál es la comparación justa?",
    "opciones": [
     "Marzo con septiembre",
     "Agosto–septiembre de cada año",
     "Cualquier mes con pocas nubes",
     "El primer día de cada año"
    ],
    "correcta": 1,
    "explicacion": "Siempre la misma ventana.",
    "pista": "Mismos meses."
   },
   {
    "tipo": "opciones",
    "pregunta": "Ves que hay menos nieve en septiembre que en marzo. ¿Qué es?",
    "opciones": [
     "Una tendencia segura",
     "La estación",
     "Un error de MODIS",
     "Un milagro"
    ],
    "correcta": 1,
    "explicacion": "Marzo es época de lluvias y septiembre, seca.",
    "pista": "Ropa de invierno y verano…"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Por qué empezamos en 2001 y no en 2000?",
    "opciones": [
     "Porque MODIS empezó a medir en febrero de 2000",
     "Por casualidad",
     "Porque 2000 no existió",
     "Porque llovió mucho"
    ],
    "correcta": 0,
    "explicacion": "2000 está incompleto: usamos años completos.",
    "pista": "¿Desde cuándo hay datos?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Con solo 4 años de datos…",
    "opciones": [
     "Un año raro puede engañarte",
     "Es más seguro",
     "Es igual que con 25",
     "No pasa nada"
    ],
    "correcta": 0,
    "explicacion": "Hacen falta muchos años para ver una tendencia.",
    "pista": "¿Y si uno de los 4 fue muy raro?"
   },
   {
    "tipo": "opciones",
    "pregunta": "En la época seca, la nieve de temporada…",
    "opciones": [
     "Se derrite",
     "Aumenta",
     "Se vuelve nube",
     "No cambia"
    ],
    "correcta": 0,
    "explicacion": "Por eso en agosto–septiembre queda el hielo que dura.",
    "pista": "Época seca = poca lluvia."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Qué es la estacionalidad",
    "Por qué comparar meses distintos es una trampa",
    "La ventana justa: agosto y septiembre",
    "Cuántos años hacen falta"
   ]
  },
  "jukumari": {
   "inicio": "Paso 3: ¿cuándo miramos? ¡Ojo con las estaciones!",
   "acierto": "¡Maestro del calendario!",
   "fallo": "Casi. ¿Estamos comparando épocas iguales?",
   "final": "Ya tienes tu periodo: agosto y septiembre, de 2001 a 2025."
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-7-p1.png",
   "img/lecciones/leccion-7-p2.png",
   "img/lecciones/leccion-7-p3.png",
   "img/lecciones/leccion-7-p4.png"
  ],
  "nombre": "El periodo",
  "conceptos": [
   "La montaña cambia de ropa",
   "La comparación injusta",
   "La ventana justa",
   "¿Cuántos años?"
  ],
  "datos": null
 },
 {
  "id": "serie",
  "numero": 8,
  "bloque": "C",
  "titulo": "Limpiar los datos",
  "titulo_corto": "Limpiar los datos",
  "pregunta": "¿Son confiables mis datos?",
  "paginas": [
   {
    "titulo": "Las nubes <em>tapan</em>",
    "texto": "En agosto y septiembre hay <b>61 días</b> cada año. Algunos días MODIS ve bien la montaña; otros, las <b>nubes</b> la tapan. Si un día está casi todo tapado, ese día <b>no nos sirve</b>: hay que descartarlo.",
    "ejemplo": "La cuadrícula muestra 61 días de un año: azul = nieve, café = sin nieve, gris = nube. Los días muy grises se descartan.",
    "chequeo": {
     "pregunta": "Un día con nubes en 9 de cada 10 píxeles, ¿lo usas?",
     "opciones": [
      "Sí",
      "No"
     ],
     "correcta": 1,
     "explicacion": "Casi no se ve nada: no nos dice nada del hielo."
    },
    "jukumari": {
     "dice": "El satélite no ve a través de las nubes. ¡Tú decides!",
     "piensa": "¿Cuántas nubes acepto en un día?"
    }
   },
   {
    "titulo": "Días <em>útiles</em>",
    "texto": "Un <b>día útil</b> es un día con suficiente cielo despejado. Tú eliges el mínimo: <b>30 %</b>, <b>50 %</b> o <b>70 %</b> de píxeles visibles. Si exiges poco, entran días dudosos. Si exiges mucho, quedan muy pocos días.",
    "ejemplo": "Usamos <b>50 %</b> y pedimos al menos <b>10 días útiles</b> en cada año. Si un año no los tiene, lo marcamos como “sin datos”, no como cero.",
    "chequeo": {
     "pregunta": "Si exiges 90 % de cielo despejado…",
     "opciones": [
      "Sobran días",
      "Casi no quedan días"
     ],
     "correcta": 1,
     "explicacion": "En los Andes casi siempre hay alguna nube."
    },
    "jukumari": {
     "dice": "Ni muy poco ni demasiado: busca el equilibrio.",
     "piensa": "¿Y qué tan blanco tiene que ser un píxel?"
    }
   },
   {
    "titulo": "Tu <em>umbral</em>",
    "texto": "Recuerda: MODIS da un número de 0 a 100 en cada píxel. Tu <b>umbral</b> dice desde qué número cuenta como nieve. Probaremos <b>30</b>, <b>40</b> y <b>50</b>. No hay un umbral perfecto, pero sí uno <b>razonable</b>: usamos <b>40</b>.",
    "ejemplo": "Con umbral 30 cuentan más píxeles; con 50, menos. Después vas a comprobar que el resultado <b>no dependa</b> de esa elección.",
    "chequeo": {
     "pregunta": "¿Existe un umbral perfecto?",
     "opciones": [
      "Sí, el 100",
      "No, pero sí uno razonable"
     ],
     "correcta": 1,
     "explicacion": "Se elige uno razonable y luego se prueba con otros."
    },
    "jukumari": {
     "dice": "Tú eres el juez del umbral.",
     "piensa": "¿Y cómo junto todo en un número por año?"
    }
   },
   {
    "titulo": "Un número por <em>año</em>",
    "texto": "Con los días útiles de agosto y septiembre sacamos <b>un promedio por año</b>: qué porcentaje de los píxeles visibles tenía nieve. Así se arma la <b>serie</b>: 25 números, uno por año, de 2001 a 2025. ¡Lista para analizar!",
    "ejemplo": "Un <b>dato que falta no es cero</b>. Si un año no tuvo días útiles, se deja vacío. Ponerle cero sería inventar que no había nieve.",
    "chequeo": {
     "pregunta": "Un año sin días útiles, ¿cuánto vale?",
     "opciones": [
      "Cero",
      "Sin dato (vacío)"
     ],
     "correcta": 1,
     "explicacion": "Ponerle cero sería inventar."
    },
    "jukumari": {
     "dice": "¡Tu serie está limpia! Ahora, a buscar la tendencia.",
     "piensa": "Siguiente: ¿real o casualidad?"
    },
    "paraCuriosos": "Valor del año = promedio de (píxeles con nieve ÷ píxeles visibles) en los días útiles de agosto y septiembre."
   }
  ],
  "tarjetas": [
   {
    "icono": "☁",
    "pregunta": "¿Puede MODIS ver nieve debajo de una nube?",
    "respuesta": "No. Por eso se descartan los días muy nublados."
   },
   {
    "icono": "✅",
    "pregunta": "¿Qué es un día útil?",
    "respuesta": "Un día con suficiente cielo despejado (en el caso, al menos 50 %)."
   },
   {
    "icono": "🎚",
    "pregunta": "¿Qué umbral usamos?",
    "respuesta": "40. Y lo comprobamos con 30 y 50."
   },
   {
    "icono": "🕳",
    "pregunta": "¿Un dato que falta es cero?",
    "respuesta": "No. Se deja vacío: ponerle cero sería inventar."
   },
   {
    "icono": "📈",
    "pregunta": "¿Qué es la serie?",
    "respuesta": "Una lista de valores en orden: aquí, uno por año de 2001 a 2025."
   }
  ],
  "trivia": [
   {
    "tipo": "opciones",
    "pregunta": "Un día casi todo tapado por nubes, ¿lo usamos?",
    "opciones": [
     "No",
     "Sí",
     "Solo si es lunes",
     "Siempre"
    ],
    "correcta": 0,
    "explicacion": "No nos dice nada del hielo.",
    "pista": "¿Se ve la montaña?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Subir el cielo despejado mínimo de 50 % a 70 % hace que…",
    "opciones": [
     "Queden menos días útiles",
     "Queden más días",
     "Aparezca nieve",
     "Nada cambie"
    ],
    "correcta": 0,
    "explicacion": "Exiges más: quedan menos días.",
    "pista": "Más exigente…"
   },
   {
    "tipo": "opciones",
    "pregunta": "Un año sin días útiles en la serie…",
    "opciones": [
     "Se deja vacío",
     "Vale 0",
     "Vale 100",
     "Se inventa"
    ],
    "correcta": 0,
    "explicacion": "Un dato que falta no es cero.",
    "pista": "¿Sabemos cuánta nieve hubo?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuántos días tienen agosto y septiembre juntos?",
    "opciones": [
     "61",
     "30",
     "90",
     "365"
    ],
    "correcta": 0,
    "explicacion": "31 + 30 = 61.",
    "pista": "Suma los dos meses."
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Por qué probaremos los umbrales 30 y 50 además de 40?",
    "opciones": [
     "Para ver que el resultado no dependa de una sola elección",
     "Por diversión",
     "Porque 40 está prohibido",
     "Para tener menos datos"
    ],
    "correcta": 0,
    "explicacion": "Un buen resultado resiste cambios razonables.",
    "pista": "¿Y si eligiéramos otro?"
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Descartar días con muchas nubes",
    "Qué es un día útil",
    "Elegir un umbral razonable",
    "Que un dato que falta no es cero",
    "Armar la serie: un número por año"
   ]
  },
  "jukumari": {
   "inicio": "Paso 4: antes de analizar, ¡a limpiar los datos!",
   "acierto": "¡Cazador de nubes!",
   "fallo": "Casi. Un día tapado no nos cuenta nada.",
   "final": "¡Serie limpia! 25 años listos para analizar."
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-8-p1.png",
   "img/lecciones/leccion-8-p2.png",
   "img/lecciones/leccion-8-p3.png",
   "img/lecciones/leccion-8-p4.png"
  ],
  "nombre": "Limpiar los datos",
  "conceptos": [
   "Las nubes tapan",
   "Días útiles",
   "Tu umbral",
   "Un número por año"
  ],
  "datos": null
 },
 {
  "id": "significancia",
  "numero": 9,
  "bloque": "C",
  "titulo": "¿Real o casualidad?",
  "titulo_corto": "Real o casualidad",
  "pregunta": "¿La nieve cambió de verdad o fue suerte?",
  "paginas": [
   {
    "titulo": "Variación o <em>tendencia</em>",
    "texto": "Los datos siempre suben y bajan un poco: eso es la <b>variación</b>. Una <b>tendencia</b> es un cambio que se mantiene durante <b>muchos años</b>, por encima de esas subidas y bajadas. Un solo año raro <b>no</b> es una tendencia.",
    "ejemplo": "Mira los tres gráficos: uno es una tendencia (baja poco a poco, como una escalera), otro es puro ruido y otro tiene un solo año raro.",
    "chequeo": {
     "pregunta": "Un solo año con mucha menos nieve, ¿es una tendencia?",
     "opciones": [
      "Sí",
      "No"
     ],
     "correcta": 1,
     "explicacion": "Un año no alcanza: la tendencia se ve en muchos años."
    },
    "jukumari": {
     "dice": "¡Aprende a ver el rumbo, no los saltos!",
     "piensa": "¿Cómo mido cuánto baja?"
    }
   },
   {
    "titulo": "La <em>pendiente</em>",
    "texto": "La <b>pendiente</b> dice cuánto sube o baja la nieve <b>cada año</b>, en promedio. La multiplicamos por 10 para decir cuánto cambia <b>cada 10 años</b>. Se calcula de una forma que un año raro no la engaña.",
    "ejemplo": "En tu serie de la Cordillera Real, la nieve cambia <b>{pendiente_decada} puntos cada 10 años</b>. Si el número es negativo, la nieve baja.",
    "chequeo": {
     "pregunta": "Una pendiente negativa significa que la nieve…",
     "opciones": [
      "Baja",
      "Sube"
     ],
     "correcta": 0,
     "explicacion": "Negativo = baja con los años."
    },
    "jukumari": {
     "dice": "La línea punteada muestra el rumbo.",
     "piensa": "Pero… ¿y si fue pura suerte?"
    },
    "paraCuriosos": "Usamos la pendiente de Sen: la mediana de todas las pendientes entre pares de años."
   },
   {
    "titulo": "La suerte también <em>dibuja</em>",
    "texto": "Si tiras una moneda 10 veces y salen 7 caras, ¿está trucada? No necesariamente: la <b>suerte</b> también hace patrones. Con los datos pasa igual: el azar puede dibujar subidas y bajadas que <b>parecen</b> tendencias.",
    "ejemplo": "En la actividad verás 6 gráficos: 5 son <b>puro azar</b> y 1 es tu serie real. ¿Puedes adivinar cuál es la real?",
    "chequeo": {
     "pregunta": "7 caras de 10 tiros, ¿prueba que la moneda está trucada?",
     "opciones": [
      "Sí",
      "No necesariamente"
     ],
     "correcta": 1,
     "explicacion": "La suerte también da rachas."
    },
    "jukumari": {
     "dice": "¡Cuidado! La suerte engaña al ojo.",
     "piensa": "¿Hay una forma de medir la suerte?"
    }
   },
   {
    "titulo": "El <em>valor p</em>",
    "texto": "El <b>valor p</b> responde: si la nieve <b>en verdad no cambiara</b>, ¿qué tan raro sería ver este dibujo por pura suerte? Si p es menor que <b>0,05</b> (menos de 5 en 100), decimos que es muy difícil que sea solo suerte.",
    "ejemplo": "Tu serie tiene <b>p = {p}</b>. Ojo: que no sea suerte <b>no</b> dice si el cambio es grande ni <b>por qué</b> pasó.",
    "chequeo": {
     "pregunta": "p = 0,01 quiere decir que…",
     "opciones": [
      "Sería muy raro verlo por pura suerte",
      "Hay 1 % de nieve"
     ],
     "correcta": 0,
     "explicacion": "El valor p mide qué tan raro sería el patrón sin cambio real."
    },
    "jukumari": {
     "dice": "¡Ya sabes separar lo real de la suerte!",
     "piensa": "Siguiente: ¿podemos confiar?"
    },
    "paraCuriosos": "Usamos la prueba de Mann-Kendall, que compara cada año con todos los siguientes."
   }
  ],
  "tarjetas": [
   {
    "icono": "📉",
    "pregunta": "¿Qué es una tendencia?",
    "respuesta": "Un cambio que se mantiene muchos años, por encima de las subidas y bajadas."
   },
   {
    "icono": "📐",
    "pregunta": "¿Qué es la pendiente?",
    "respuesta": "Cuánto sube o baja algo cada año. La decimos cada 10 años."
   },
   {
    "icono": "🪙",
    "pregunta": "¿La suerte puede parecer una tendencia?",
    "respuesta": "Sí. Por eso usamos una prueba y no solo la vista."
   },
   {
    "icono": "⚖",
    "pregunta": "¿Qué mide el valor p?",
    "respuesta": "Qué tan raro sería ver ese patrón por pura suerte si no hubiera cambio."
   },
   {
    "icono": "❗",
    "pregunta": "¿“No es suerte” significa que sabemos la causa?",
    "respuesta": "No. Solo que el cambio es difícil de explicar con suerte."
   }
  ],
  "trivia": [
   {
    "tipo": "juez",
    "pregunta": "5 gráficos son suerte y 1 es tu serie real. ¿Cuál es la real?",
    "explicacion": "La real mantiene su rumbo durante los 25 años; las de suerte suben y bajan sin rumbo.",
    "pista": "Mira el rumbo de punta a punta."
   },
   {
    "tipo": "opciones",
    "pregunta": "Tu valor p es {p}. ¿Qué significa?",
    "opciones": [
     "Si no hubiera cambio, ver este patrón sería poco común",
     "Hay {p} de probabilidad de lluvia",
     "El glaciar perdió {p}",
     "El satélite falló"
    ],
    "correcta": 0,
    "explicacion": "El valor p mide qué tan raro sería el patrón sin tendencia.",
    "pista": "Raro… si no pasara nada."
   },
   {
    "tipo": "opciones",
    "pregunta": "Pendiente de −3 puntos cada 10 años quiere decir…",
    "opciones": [
     "La nieve baja",
     "La nieve sube",
     "No cambia",
     "Hay 3 nubes"
    ],
    "correcta": 0,
    "explicacion": "Negativo = baja.",
    "pista": "¿Signo menos?"
   },
   {
    "tipo": "opciones",
    "pregunta": "p = 0,40. ¿Qué dices?",
    "opciones": [
     "Todavía no se sabe: podría ser suerte",
     "Es seguro que bajó",
     "Es seguro que subió",
     "Los datos están mal"
    ],
    "correcta": 0,
    "explicacion": "0,40 es mayor que 0,05: no alcanza.",
    "pista": "¿Menor que 0,05?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Un resultado “real”, ¿dice por qué cambió la nieve?",
    "opciones": [
     "No",
     "Sí, siempre",
     "Solo en Bolivia",
     "Solo si p = 0"
    ],
    "correcta": 0,
    "explicacion": "Dice que no es suerte; no dice la causa.",
    "pista": "Real no es igual a causa."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Diferenciar variación y tendencia",
    "Qué es la pendiente",
    "Que la suerte también dibuja patrones",
    "Qué significa el valor p"
   ]
  },
  "jukumari": {
   "inicio": "Paso 5: ¿real o casualidad? ¡La parte más emocionante!",
   "acierto": "¡Juez del azar!",
   "fallo": "Casi. Recuerda: p mide lo raro si no pasara nada.",
   "final": "¡Sabes separar lo real de la suerte!"
  },
  "insignia": null,
  "imagenes": [
   "img/lecciones/leccion-9-p1.png",
   "img/lecciones/leccion-9-p2.png",
   "img/lecciones/leccion-9-p3.png",
   "img/lecciones/leccion-9-p4.png"
  ],
  "nombre": "Real o casualidad",
  "conceptos": [
   "Variación o tendencia",
   "La pendiente",
   "La suerte también dibuja",
   "El valor p"
  ],
  "datos": [
   "lecciones/series.json"
  ]
 },
 {
  "id": "veredicto",
  "numero": 10,
  "bloque": "C",
  "titulo": "¿Podemos confiar? Veredicto",
  "titulo_corto": "Veredicto",
  "pregunta": "¿Qué podemos afirmar, con honestidad?",
  "paginas": [
   {
    "titulo": "Ponerlo a <em>prueba</em>",
    "texto": "Un buen detective desconfía de su propio resultado. Lo ponemos a prueba cambiando las reglas: otro <b>umbral</b> (30 y 50), más <b>cielo despejado</b>, revisar si los años <b>se copian</b> entre sí y quitar los años de <b>El Niño fuerte</b>. Resultado: <b>{n_ok} de {n_pruebas}</b> pruebas superadas.",
    "ejemplo": "Semáforo: <b>verde</b> = el rumbo se mantiene; <b>amarillo</b> = sobrevive, pero más débil; <b>rojo</b> = no pasa y se escribe como límite.",
    "chequeo": {
     "pregunta": "Una prueba sale en rojo. ¿Qué haces?",
     "opciones": [
      "La escondes",
      "La escribes como límite"
     ],
     "correcta": 1,
     "explicacion": "Un límite honesto hace más fuerte tu informe."
    },
    "jukumari": {
     "dice": "¡Desconfiar es de buenos detectives!",
     "piensa": "¿Y si todo fue por El Niño…?"
    },
    "paraCuriosos": "Los años que se copian se corrigen con la prueba de Hamed y Rao."
   },
   {
    "titulo": "El Niño y la <em>lluvia</em>",
    "texto": "<b>El Niño</b> es un calentamiento natural del océano Pacífico que vuelve cada pocos años; en el Altiplano suele traer menos lluvia. Si quitamos sus años y la tendencia sigue, no era solo El Niño. Y la <b>lluvia</b> de la Cordillera Real <b>no cambió de forma clara</b> (p = 0,47).",
    "ejemplo": "Que dos cosas cambien juntas no quiere decir que una cause la otra. En verano se venden más helados y hay más quemaduras de sol, ¡pero los helados no queman!",
    "chequeo": {
     "pregunta": "Si la nieve baja y la lluvia no cambió, ¿ya sabemos la causa?",
     "opciones": [
      "Sí",
      "No: solo descartamos una explicación"
     ],
     "correcta": 1,
     "explicacion": "Descartar una explicación no es demostrar otra."
    },
    "jukumari": {
     "dice": "Correlación no es causa. ¡Recuérdalo siempre!",
     "piensa": "¿Qué no pueden decir nuestros datos?"
    },
    "paraCuriosos": "El índice de El Niño (ONI) es de NOAA, no de NASA."
   },
   {
    "titulo": "Los <em>límites</em>",
    "texto": "Todo estudio tiene límites, y escribirlos te hace <b>más confiable</b>. Los nuestros: MODIS ve <b>nieve</b>, no el glaciar en sí; sus cuadritos miden <b>500 m</b>; el <b>tamaño</b> del hielo no es lo mismo que el <b>agua</b>; y usamos <b>una sola</b> fuente de nieve.",
    "ejemplo": "Un buen informe dice qué se sabe, qué es incierto y qué <b>no</b> se puede concluir.",
    "chequeo": {
     "pregunta": "¿Cuál es un límite real de este caso?",
     "opciones": [
      "MODIS no distingue nieve de glaciar",
      "El satélite es rojo"
     ],
     "correcta": 0,
     "explicacion": "Ve superficie blanca, no el glaciar en sí."
    },
    "jukumari": {
     "dice": "Decir lo que no sabes también es ciencia.",
     "piensa": "Hora de escribir tu veredicto…"
    }
   },
   {
    "titulo": "Tu <em>veredicto</em>",
    "texto": "Compara lo que creías (<b>{hipotesis}</b>) con lo que dicen los datos (<b>{pendiente_decada} cada 10 años, p = {p}</b>). Escribe tu veredicto con <b>palabras justas</b>: “va de acuerdo con” y no “demuestra”, porque medimos nieve, no litros de agua.",
    "ejemplo": "Entre 2001 y 2025, la nieve de la Cordillera Real en agosto–septiembre [bajó / no cambió de forma clara / subió] {pendiente_decada} puntos cada 10 años (p = {p}). Superó {n_ok} de {n_pruebas} pruebas.",
    "chequeo": {
     "pregunta": "Si p es mayor que 0,05, ¿puedes decir “la nieve bajó”?",
     "opciones": [
      "Sí",
      "No: todavía no se sabe"
     ],
     "correcta": 1,
     "explicacion": "Con esos datos no alcanza para afirmarlo."
    },
    "jukumari": {
     "dice": "¡Llegó la hora del veredicto, detective!",
     "piensa": "¡Después: resolver los casos!"
    }
   }
  ],
  "plantilla": "Entre {desde} y {hasta}, la nieve de {region} en agosto–septiembre [disminuyó / no cambió de forma clara / aumentó] a un ritmo de {pendiente_decada} puntos cada 10 años (p = {p}). El resultado [superó / superó en parte / no superó] las pruebas ({n_ok} de {n_pruebas}). Esto [va de acuerdo con / no alcanza para afirmar] una pérdida de agua para La Paz.",
  "limites": [
   "El satélite ve nieve, no el glaciar",
   "Cuadritos de 500 m",
   "Tamaño no es agua",
   "Una sola fuente de nieve"
  ],
  "tarjetas": [
   {
    "icono": "🚦",
    "pregunta": "¿Qué significa una prueba en rojo?",
    "respuesta": "Que no pasó: se escribe como límite, no se esconde."
   },
   {
    "icono": "🌊",
    "pregunta": "¿Qué es El Niño?",
    "respuesta": "Un calentamiento natural del Pacífico que en el Altiplano suele traer menos lluvia."
   },
   {
    "icono": "🍦",
    "pregunta": "¿Si dos cosas cambian juntas, una causa la otra?",
    "respuesta": "No siempre. Helados y quemaduras de sol suben juntos, pero los helados no queman."
   },
   {
    "icono": "🧱",
    "pregunta": "¿Para qué sirven los límites?",
    "respuesta": "Para decir qué no se puede concluir. Hacen el informe más confiable."
   },
   {
    "icono": "📝",
    "pregunta": "¿Por qué no decir “demuestra”?",
    "respuesta": "Porque medimos nieve, no litros de agua."
   }
  ],
  "trivia": [
   {
    "tipo": "opciones",
    "pregunta": "¿Qué palabra es honesta si la nieve bajó con p menor que 0,05?",
    "opciones": [
     "Demuestra pérdida de agua",
     "Va de acuerdo con una pérdida de agua",
     "Prueba el cambio climático",
     "No dice nada"
    ],
    "correcta": 1,
    "explicacion": "Medimos nieve, no agua: “va de acuerdo con” es lo justo.",
    "pista": "¿Medimos litros?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Quitamos los años de El Niño fuerte y la tendencia sigue. ¿Qué significa?",
    "opciones": [
     "Que no era solo El Niño",
     "Que El Niño es la causa",
     "Que los datos están mal",
     "Nada"
    ],
    "correcta": 0,
    "explicacion": "La tendencia no depende de esos años.",
    "pista": "¿Sobrevive sin ellos?"
   },
   {
    "tipo": "opciones",
    "pregunta": "¿Cuál NO es un límite de este caso?",
    "opciones": [
     "El satélite es de NASA",
     "MODIS ve nieve, no glaciar",
     "Píxeles de 500 m",
     "Tamaño no es agua"
    ],
    "correcta": 0,
    "explicacion": "Que sea de NASA no limita el estudio.",
    "pista": "Los otros tres sí limitan."
   },
   {
    "tipo": "opciones",
    "pregunta": "En verano suben las ventas de helado y las quemaduras de sol. ¿Los helados queman?",
    "opciones": [
     "No: los dos los causa el sol",
     "Sí",
     "Solo los de chocolate",
     "Depende"
    ],
    "correcta": 0,
    "explicacion": "Correlación no es causa.",
    "pista": "¿Qué tienen en común?"
   },
   {
    "tipo": "opciones",
    "pregunta": "Tus datos contradicen tu hipótesis. ¿Qué escribes?",
    "opciones": [
     "Lo que dicen los datos, con sus límites",
     "Mi hipótesis igual",
     "Nada",
     "Cambio los números"
    ],
    "correcta": 0,
    "explicacion": "El veredicto sigue a los datos.",
    "pista": "La honestidad primero."
   }
  ],
  "meta": {
   "ahoraSabes": [
    "Poner a prueba un resultado",
    "Que correlación no es causa",
    "Escribir los límites de un estudio",
    "Escribir un veredicto honesto"
   ],
   "abreCasos": true
  },
  "jukumari": {
   "inicio": "Último paso: ¿podemos confiar? ¡Y tu veredicto!",
   "acierto": "¡Escéptico profesional!",
   "fallo": "Ojo: con tus pruebas no podemos afirmar tanto.",
   "final": "¡Entrenamiento completo, detective! Los casos te esperan."
  },
  "insignia": "analista-tendencias",
  "imagenes": [
   "img/lecciones/leccion-10-p1.png",
   "img/lecciones/leccion-10-p2.png",
   "img/lecciones/leccion-10-p3.png",
   "img/lecciones/leccion-10-p4.png"
  ],
  "nombre": "Veredicto",
  "conceptos": [
   "Ponerlo a prueba",
   "El Niño y la lluvia",
   "Los límites",
   "Tu veredicto"
  ],
  "datos": [
   "lecciones/series.json",
   "lecciones/pruebas.json"
  ]
 }
];
