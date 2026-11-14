# Fuente única del contenido de la ruta de aprendizaje de APU (10 lecciones).
# Base: módulos de Diana + ruta de Darwin. Público: desde 12 años.
# Genera frontend/src/contenido/lecciones.js con: python lecciones_data.py
# Reglas: sin temperatura (no la medimos). Números de datos en {marcas}: la app los llena con los JSON.
import json

def pag(titulo, texto, ejemplo, chk, dice, piensa, curiosos=None):
    p = {"titulo": titulo, "texto": texto, "ejemplo": ejemplo,
         "chequeo": {"pregunta": chk[0], "opciones": chk[1], "correcta": chk[2], "explicacion": chk[3]},
         "jukumari": {"dice": dice, "piensa": piensa}}
    if curiosos: p["paraCuriosos"] = curiosos
    return p

def q(pregunta, opciones, correcta, explicacion, pista):
    return {"tipo": "opciones", "pregunta": pregunta, "opciones": opciones, "correcta": correcta,
            "explicacion": explicacion, "pista": pista}

BLOQUES = {
    "A": {"nombre": "Las variables", "insignia": {"id": "explorador-planeta", "nombre": "Explorador del planeta", "img": "montana-pin"}},
    "B": {"nombre": "Las herramientas", "insignia": {"id": "inspector-pixeles", "nombre": "Inspector de píxeles", "img": "lupa"}},
    "C": {"nombre": "El método del detective", "insignia": {"id": "analista-tendencias", "nombre": "Analista de tendencias", "img": "grafico"}},
}

L = []

# ───────────── 1
L.append({
 "id": "tierra", "numero": 1, "bloque": "A", "titulo": "La Tierra vista desde arriba", "titulo_corto": "La Tierra",
 "pregunta": "¿Qué estamos mirando en la montaña?",
 "paginas": [
  pag("¿Qué es un <em>glaciar</em>?",
      "Un <b>glaciar</b> es una gran masa de hielo que se forma en tierra firme con la nieve de <b>muchos años</b> y que baja muy despacio por su propio peso. La <b>nieve de temporada</b> es distinta: cae en la época de lluvias y se derrite en pocos meses.",
      "En el <b>Huayna Potosí</b>, la parte alta tiene glaciar todo el año. En febrero la nieve baja mucho más, pero en agosto esa nieve nueva ya se derritió.",
      ("Nieve que cae en febrero y desaparece en mayo es…", ["Glaciar", "Nieve de temporada"], 1, "Se va en pocos meses: es nieve de temporada. El glaciar dura muchos años."),
      "Primero lo básico: ¿qué estamos mirando en la montaña?", "Si se va en meses, no es glaciar…"),
  pag("De <em>nieve</em> a hielo",
      "Cada año cae nieve nueva encima de la anterior. El <b>peso</b> aprieta la nieve de abajo y le saca el aire: primero se vuelve <b>firn</b> (nieve granulada) y, después de muchos años, <b>hielo glaciar</b>. Por eso un glaciar es como un libro con capas de años.",
      "Es como apretar una bola de nieve con las manos: sale el aire y se vuelve dura. El glaciar hace lo mismo, pero con su propio peso y durante <b>décadas</b>.",
      ("¿Qué convierte la nieve en hielo glaciar?", ["El sol", "El peso y el tiempo"], 1, "El peso de la nieve nueva aprieta la de abajo durante muchos años."),
      "¡Un glaciar guarda la nieve de muchísimos años!", "¿Y si deja de caer nieve arriba…?"),
  pag("Lo blanco no siempre es <em>nieve</em>",
      "Desde el espacio, varias cosas se ven blancas: <b>nieve</b>, <b>nubes</b> y hasta un <b>salar</b>. El ojo se confunde fácil. Por eso los satélites usan luz que nosotros no vemos para separarlas (lo verás en la lección 3).",
      "En una foto de Bolivia, el <b>Salar de Uyuni</b> brilla tanto como la nieve del Illimani. Si solo miras el color, dirías que es nieve… ¡y te equivocarías!",
      ("El Salar de Uyuni se ve blanco desde el espacio. ¿Es nieve?", ["Sí, todo lo blanco es nieve", "No, es sal"], 1, "Es sal. El color solo no alcanza para saber qué es."),
      "¡Ojo de detective! No te fíes solo del color.", "¿Cómo hará el satélite para no confundirse…?"),
  pag("Ver, medir y <em>concluir</em>",
      "Un detective separa tres cosas: lo que <b>observa</b>, lo que <b>mide</b> y lo que <b>concluye</b>. Un dato siempre dice <b>dónde</b> (latitud y longitud), <b>cuándo</b> (fecha) y <b>quién lo midió</b>. Una interpretación sin datos es solo una idea.",
      "La <b>latitud</b> dice qué tan al norte o al sur está un lugar; la <b>longitud</b>, qué tan al este u oeste. La Cordillera Real está en <b>16,2° S y 68,2° O</b>.",
      ("“La nieve está bajando por el cambio climático” es…", ["Un dato", "Una interpretación"], 1, "Es una conclusión que habría que comprobar. Un dato tiene lugar, fecha y fuente."),
      "Ahora ya sabes qué miramos. ¡Vamos a practicar!", "Siguiente: la lluvia que alimenta la montaña…"),
 ],
 "tarjetas": [
  {"icono": "🏔", "pregunta": "¿Qué es un glaciar?", "respuesta": "Una gran masa de hielo en tierra firme, hecha con nieve de muchos años, que baja despacio por su peso."},
  {"icono": "🧊", "pregunta": "¿Qué es el firn?", "respuesta": "Nieve granulada y apretada, de más de un año. Es el paso entre la nieve y el hielo."},
  {"icono": "🧂", "pregunta": "¿Todo lo blanco que ve un satélite es nieve?", "respuesta": "No. Las nubes y los salares también se ven blancos."},
  {"icono": "📍", "pregunta": "¿Qué necesita un dato?", "respuesta": "Lugar (latitud y longitud), fecha y quién lo midió."},
  {"icono": "💭", "pregunta": "¿Qué es una interpretación?", "respuesta": "Lo que concluyes a partir de lo que ves o mides. Hay que comprobarla."},
 ],
 "trivia": [
  {"tipo": "clasificar", "pregunta": "Clasifica cada escena: ¿nieve, nube, sal o agua?", "etiquetas": ["Nieve", "Nube", "Sal", "Agua"],
   "escenas": [{"img": "escena-nieve", "correcta": "Nieve"}, {"img": "escena-nube", "correcta": "Nube"}, {"img": "escena-salar", "correcta": "Sal"}, {"img": "escena-lago", "correcta": "Agua"}],
   "explicacion": "La nieve sigue la forma de la montaña; la nube es borrosa y tapa todo; el salar es plano; el agua se ve oscura.", "pista": "Mira la forma, no solo el color."},
  q("Nieve que cae en febrero y se derrite en mayo es…", ["Glaciar", "Nieve de temporada", "Firn", "Hielo azul"], 1, "Dura pocos meses: es nieve de temporada.", "¿Cuánto tiempo dura?"),
  q("¿Qué saca el aire de la nieve para volverla hielo?", ["El viento", "El peso de la nieve nueva", "La lluvia", "El sol"], 1, "El peso aprieta las capas de abajo durante años.", "Piensa en la bola de nieve."),
  q("¿Cuál es un dato?", ["“Parece que hay menos nieve”", "“MODIS, 15/08/2024, 16,2° S 68,2° O, índice 40”", "“Es culpa del calor”", "“Se ve bonito”"], 1, "Tiene instrumento, fecha, lugar y valor.", "Un dato dice dónde, cuándo y quién."),
  q("La Cordillera Real está a 16,2° S. ¿Qué nos dice esa S?", ["Que está al sur del ecuador", "Que es soleada", "Que es pequeña", "Que está al este"], 0, "S = sur. Bolivia está al sur del ecuador.", "S de…"),
 ],
 "meta": {"ahoraSabes": ["Qué es un glaciar y qué es nieve de temporada", "Cómo la nieve se vuelve firn y luego hielo", "Que lo blanco no siempre es nieve", "La diferencia entre observación, dato e interpretación"]},
 "jukumari": {"inicio": "¡Hola, detective! Antes de investigar, aprendamos qué es lo que vamos a mirar.", "acierto": "¡Bien visto!", "fallo": "Casi. Lee la explicación: ¡así se aprende!", "final": "¡Primera lección lista! Ya sabes qué hay en la montaña."},
})

# ───────────── 2
L.append({
 "id": "lluvia", "numero": 2, "bloque": "A", "titulo": "La lluvia que alimenta la montaña", "titulo_corto": "La lluvia",
 "pregunta": "¿De dónde sale la nieve y el agua de la montaña?",
 "paginas": [
  pag("¿Qué es la <em>precipitación</em>?",
      "<b>Precipitación</b> es toda el agua que cae del cielo: <b>lluvia</b>, <b>nieve</b> o granizo. En la parte baja cae como lluvia; en lo alto de la cordillera, donde hace más frío, cae como <b>nieve</b>. Se mide en <b>milímetros (mm)</b>.",
      "<b>1 mm</b> de lluvia es como echar <b>1 litro de agua</b> sobre un cuadrado de 1 metro por 1 metro. Si llueven 20 mm, ¡son 20 litros en ese cuadrado!",
      ("La nieve que cae en la cordillera, ¿es precipitación?", ["No, solo la lluvia", "Sí, también es agua que cae"], 1, "Lluvia, nieve y granizo: todo es precipitación."),
      "¡La montaña también necesita agua para tener nieve!", "¿Cuándo llueve más en La Paz…?"),
  pag("La <em>época de lluvias</em>",
      "En la Cordillera Real el año tiene dos caras. De <b>diciembre a marzo</b> llueve mucho: es la <b>época de lluvias</b>. De <b>mayo a agosto</b> casi no llueve: es la <b>época seca</b>. En esos 4 meses de lluvias cae <b>más de la mitad</b> del agua de todo el año.",
      "En <b>enero</b> caen en promedio <b>186 mm</b>; en <b>julio</b>, solo <b>24 mm</b>. ¡Casi 8 veces menos! Son datos reales de NASA (GPM IMERG, 2001–2025).",
      ("¿En qué meses llueve más en la Cordillera Real?", ["Diciembre a marzo", "Junio a agosto"], 0, "Es la época de lluvias: el verano del hemisferio sur."),
      "¡Mira! Estos son datos reales de NASA.", "Si casi no llueve en julio… ¿de dónde sale el agua?"),
  pag("La montaña es una <em>alcancía</em>",
      "La lluvia y la nieve están conectadas. En la época de lluvias, la cordillera <b>guarda</b> agua en forma de nieve y hielo. En la época seca, ese hielo se derrite despacio y <b>suelta</b> agua. Por eso a las montañas con glaciares se les llama <b>torres de agua</b>.",
      "En la época seca, cuando casi no llueve, parte del agua de La Paz viene del <b>deshielo de los glaciares</b>. Un estudio calculó que puede llegar a cerca de <b>27 %</b> (Soruco y otros, 2015).",
      ("¿Cuándo “guarda” agua la montaña?", ["En la época de lluvias", "En la época seca"], 0, "Guarda en la época de lluvias y suelta en la seca."),
      "La montaña guarda agua como una alcancía.", "Si llueve menos, ¿se llenará menos la alcancía…?"),
  pag("¿Cómo se mide la lluvia <em>desde el espacio</em>?",
      "La misión <b>GPM</b> de NASA y Japón usa un satélite principal y otros satélites que pasan sobre la Tierra. El producto <b>IMERG</b> junta lo que ven todos y calcula cuánta lluvia cae en cuadros de unos <b>10 km</b>, cada <b>media hora</b>.",
      "Para la Cordillera Real usamos <b>GPM IMERG</b> mes a mes, desde 2001. Un cuadro de 10 km es grande: sirve para la <b>región</b>, no para una sola montaña.",
      ("¿Qué hace IMERG?", ["Junta datos de varios satélites", "Mide la nieve en el suelo"], 0, "Combina lo que miden muchos satélites para estimar la lluvia."),
      "¡Ya conoces nuestras dos variables: nieve y lluvia!", "Siguiente: los ojos que miran desde el espacio."),
 ],
 "tarjetas": [
  {"icono": "🌧", "pregunta": "¿Qué es la precipitación?", "respuesta": "Toda el agua que cae del cielo: lluvia, nieve o granizo."},
  {"icono": "🪣", "pregunta": "¿Qué significa que llovieron 10 mm?", "respuesta": "Que cayeron 10 litros de agua en cada metro cuadrado."},
  {"icono": "📅", "pregunta": "¿Cuándo es la época de lluvias en la Cordillera Real?", "respuesta": "De diciembre a marzo. La época seca, de mayo a agosto."},
  {"icono": "🏔", "pregunta": "¿Por qué se dice que las montañas son torres de agua?", "respuesta": "Porque guardan agua como nieve y hielo y la sueltan en la época seca."},
  {"icono": "🛰", "pregunta": "¿Qué es GPM IMERG?", "respuesta": "Un producto de NASA que junta varios satélites para medir la lluvia cada media hora, en cuadros de unos 10 km."},
 ],
 "trivia": [
  {"tipo": "ordenar", "pregunta": "Ordena el viaje del agua en la montaña",
   "pasos": ["Cae nieve en la época de lluvias", "El glaciar guarda la nieve", "El hielo se derrite en la época seca", "El agua llega a la ciudad"],
   "explicacion": "Primero se guarda, después se derrite y recién entonces el agua baja a la ciudad.", "pista": "El agua no llega antes de derretirse."},
  q("¿Cuántos litros cayeron en 1 m² si llovieron 5 mm?", ["5 litros", "50 litros", "0,5 litros", "500 litros"], 0, "1 mm = 1 litro por metro cuadrado.", "1 mm = 1 litro."),
  q("En la parte más alta de la cordillera, la precipitación cae sobre todo como…", ["Nieve", "Lluvia caliente", "Arena", "Nada"], 0, "Arriba hace frío: cae nieve.", "¿Hace frío o calor allá arriba?"),
  q("¿En qué mes llueve menos en la Cordillera Real?", ["Enero", "Julio", "Febrero", "Diciembre"], 1, "Julio está en plena época seca: unos 24 mm en promedio.", "Busca la época seca."),
  q("¿Para qué sirve un dato de lluvia en cuadros de 10 km?", ["Para ver la región", "Para medir una sola piedra", "Para ver un glaciar pequeño", "Para medir la nieve"], 0, "10 km es grande: sirve para la región.", "Piensa en el tamaño del cuadro."),
 ],
 "meta": {"ahoraSabes": ["Qué es la precipitación y cómo se mide en mm", "Cuándo es la época de lluvias y la época seca", "Por qué las montañas son torres de agua", "Cómo GPM IMERG mide la lluvia desde el espacio"]},
 "jukumari": {"inicio": "Sin lluvia no hay nieve. ¡Veamos de dónde sale el agua!", "acierto": "¡Eso es!", "fallo": "Casi. Fíjate en la explicación.", "final": "¡Bloque A completo! Ya conoces nuestras dos variables: nieve y lluvia."},
})

# ───────────── 3
L.append({
 "id": "ojos", "numero": 3, "bloque": "B", "titulo": "Ojos en el espacio", "titulo_corto": "MODIS",
 "pregunta": "¿Quién mira la nieve desde el espacio?",
 "paginas": [
  pag("MODIS <em>no es</em> un satélite",
      "<b>MODIS</b> es un <b>instrumento</b>: una cámara muy especial que mide la luz que rebota en la Tierra. Viaja a bordo de dos satélites de NASA: <b>Terra</b> (lanzado en 1999) y <b>Aqua</b> (en 2002).",
      "Piensa en un <b>celular</b> y su <b>cámara</b>: el celular sería el satélite Terra y la cámara sería MODIS. Hay dos “celulares” con la misma cámara: Terra y Aqua.",
      ("MODIS es…", ["Un satélite", "Un instrumento que va en un satélite"], 1, "MODIS es el instrumento; Terra y Aqua son los satélites."),
      "¡Conozcamos los ojos que miran la nieve!", "¿Cada cuánto pasará por Bolivia…?",
      "MODIS significa, en inglés, “espectrorradiómetro de imágenes de resolución moderada”."),
  pag("¿Cada cuánto <em>mira</em>?",
      "Terra y Aqua dan vueltas a la Tierra de polo a polo. En cada vuelta MODIS ve una <b>franja</b> de unos 2300 km de ancho. Juntando franjas, cubre <b>toda la Tierra en 1 o 2 días</b>. Terra pasa por la <b>mañana</b> y Aqua por la <b>tarde</b>.",
      "En APU, el chip <b>“Terra en vivo”</b> muestra dónde está Terra ahora mismo. Pasa sobre Bolivia casi todos los días a media mañana.",
      ("¿Cada cuánto MODIS cubre toda la Tierra?", ["Cada 1 o 2 días", "Una vez al año"], 0, "Por eso hay datos de casi todos los días desde el año 2000."),
      "¡Por eso hay datos de casi todos los días!", "Muchas fotos… pero ¿qué tan detalladas?"),
  pag("Una foto hecha de <em>cuadritos</em>",
      "Las imágenes de satélite están hechas de <b>píxeles</b>: cuadritos que tienen un solo valor. En el producto de nieve de MODIS cada píxel mide <b>500 m × 500 m</b>. Si en un cuadrito hay nieve y roca a la vez, es un <b>píxel mixto</b>.",
      "Un píxel de 500 m es tan grande como <b>unas 35 canchas de fútbol</b>. Un glaciar más chico que eso queda mezclado con la roca. Por eso MODIS sirve para <b>regiones</b>, no para glaciares pequeños.",
      ("Un glaciar de 200 m de ancho, ¿se ve bien con MODIS?", ["Sí, perfecto", "No, es más chico que un píxel"], 1, "Queda dentro de un solo píxel, mezclado con roca."),
      "¡Cada cuadrito es como una pieza de rompecabezas!", "¿Cómo sabe si el cuadrito es blanco por nieve o por nube…?",
      "MODIS tiene píxeles de 250, 500 y 1000 m según la banda. El producto de nieve usa 500 m."),
  pag("Luz que <em>no vemos</em>",
      "MODIS mide la luz en <b>36 bandas</b>: colores que vemos (como el <b>verde</b>) y otros invisibles, como el <b>infrarrojo</b>. La nieve y las nubes son blancas a la vista, pero en el <b>infrarrojo de onda corta (SWIR)</b> la nieve se ve <b>oscura</b> y la nube sigue <b>brillante</b>.",
      "Es como unos <b>lentes mágicos</b>: sin ellos, nieve y nube se ven iguales; con el infrarrojo, la nieve “se apaga” y la nube no. ¡Así se separan!",
      ("En el infrarrojo SWIR, ¿cómo se ve la nieve?", ["Oscura", "Muy brillante"], 0, "La nieve absorbe el SWIR; la nube lo refleja."),
      "¡Ahora conoces el truco de MODIS!", "Con verde y SWIR… ¿se podrá calcular algo?",
      "Bandas de MODIS: 1 rojo, 2 infrarrojo cercano, 4 verde, 6 SWIR (1,6 µm)."),
 ],
 "tarjetas": [
  {"icono": "📷", "pregunta": "¿MODIS es un satélite?", "respuesta": "No. Es un instrumento que viaja en los satélites Terra y Aqua."},
  {"icono": "🌍", "pregunta": "¿Cada cuánto cubre MODIS toda la Tierra?", "respuesta": "Cada 1 o 2 días."},
  {"icono": "🔲", "pregunta": "¿Qué es un píxel mixto?", "respuesta": "Un cuadrito con nieve y roca a la vez. MODIS le da un solo valor."},
  {"icono": "⚽", "pregunta": "¿Qué tan grande es un píxel de nieve de MODIS?", "respuesta": "500 m × 500 m: como unas 35 canchas de fútbol."},
  {"icono": "🕶", "pregunta": "¿Cómo separa MODIS la nieve de las nubes?", "respuesta": "Con el infrarrojo SWIR: la nieve se ve oscura y la nube brillante."},
 ],
 "trivia": [
  q("¿En qué satélites viaja MODIS?", ["Terra y Aqua", "GPM y GRACE", "Landsat", "Solo en la Estación Espacial"], 0, "GPM mide la lluvia y GRACE el peso del hielo. MODIS va en Terra (1999) y Aqua (2002).", "Uno es “tierra” y el otro “agua” en latín."),
  q("¿Qué satélite pasa por la mañana?", ["Aqua", "Terra", "Ninguno", "Los dos a medianoche"], 1, "Terra cruza a media mañana; Aqua, después del mediodía.", "Terra es el primero."),
  q("¿Por qué MODIS sirve para regiones y no para glaciares chicos?", ["Porque sus píxeles miden 500 m", "Porque es muy viejo", "Porque solo ve de noche", "Porque no es de NASA"], 0, "Lo que es más chico que un píxel se mezcla con lo de alrededor.", "Piensa en el tamaño del cuadrito."),
  q("¿Cuántas bandas de luz mide MODIS?", ["3", "36", "1", "100"], 1, "36 bandas, desde la luz visible hasta el infrarrojo.", "Más de 30."),
  q("La nieve y una nube se ven iguales a la vista. ¿Qué las separa?", ["El infrarrojo SWIR", "El sonido", "El color verde solo", "Nada"], 0, "En el SWIR la nieve se ve oscura y la nube brillante.", "Los lentes mágicos…"),
 ],
 "meta": {"ahoraSabes": ["MODIS es un instrumento que viaja en Terra y Aqua", "Cubre toda la Tierra en 1 o 2 días", "Qué es un píxel de 500 m y un píxel mixto", "El infrarrojo separa la nieve de las nubes"]},
 "jukumari": {"inicio": "¡Hora de conocer los ojos que miran la nieve desde el espacio!", "acierto": "¡Ojo de satélite!", "fallo": "Casi. Revisa la explicación.", "final": "¡Ya conoces a MODIS! Ahora, su fórmula secreta."},
})

# ───────────── 4
L.append({
 "id": "ndsi", "numero": 4, "bloque": "B", "titulo": "Cómo MODIS reconoce la nieve", "titulo_corto": "El índice de nieve",
 "pregunta": "¿Cómo sabe MODIS que algo es nieve?",
 "paginas": [
  pag("La fórmula de la <em>nieve</em>",
      "MODIS compara la luz <b>verde</b> con la del <b>infrarrojo SWIR</b>. Con esa comparación calcula el <b>NDSI</b> (índice de nieve). La nieve refleja mucho verde y poco SWIR, así que su NDSI sale <b>alto</b>. Una nube o la roca dan un NDSI <b>bajo</b>.",
      "Un píxel con verde <b>0,60</b> y SWIR <b>0,20</b>: (0,60 − 0,20) ÷ (0,60 + 0,20) = 0,40 ÷ 0,80 = <b>0,50</b>. Parece nieve.",
      ("Si verde = 0,80 y SWIR = 0,20, el NDSI es…", ["0,60", "0,25"], 0, "(0,80 − 0,20) ÷ (0,80 + 0,20) = 0,60 ÷ 1,00 = 0,60."),
      "¡Hagamos matemáticas de detective!", "Si verde y SWIR son iguales… ¿cuánto da?",
      "NDSI = (verde − SWIR) / (verde + SWIR), con las bandas 4 y 6 de MODIS."),
  pag("De índice a <em>número</em>",
      "En el producto de nieve <b>MOD10A1</b>, MODIS guarda el NDSI multiplicado por 100: un número de <b>0 a 100</b> para cada píxel. Más alto = más parecido a nieve. Tú eliges el <b>umbral</b>: desde qué número dices “aquí hay nieve”.",
      "NDSI 0,50 → se guarda como <b>50</b>. Si tu umbral es <b>40</b>, ese píxel cuenta como nieve. Con umbral <b>60</b>, ya no.",
      ("Con umbral 40, un píxel con valor 35, ¿cuenta como nieve?", ["Sí", "No"], 1, "35 es menor que 40: no llega al umbral."),
      "¡Tú decides el límite, como un juez!", "¿Y si el número es mayor que 100…?",
      "MOD10A1 versión 6.1, banda NDSI_Snow_Cover, píxeles de 500 m, un dato por día."),
  pag("Números que son <em>avisos</em>",
      "Solo los valores de <b>0 a 100</b> hablan de nieve. Los números más grandes son <b>avisos</b>: el satélite dice “aquí no pude ver” (nube, noche) o “esto es agua”. Un aviso <b>no</b> significa “no hay nieve”: significa “no sé”.",
      "Si un día de agosto el píxel dice <b>250</b> (nube), no sabemos si había nieve debajo. Lo correcto es <b>no usar</b> ese día, no contarlo como cero.",
      ("Un píxel dice 250. ¿Qué significa?", ["No hay nieve", "Hay una nube, no se sabe"], 1, "250 = nube. No sabemos qué hay debajo."),
      "¡Leer los avisos es clave!", "Si hay muchas nubes… ¿quedarán datos suficientes?",
      "Avisos de MOD10A1: 200 falta el dato · 201 sin decisión · 211 noche · 237 agua de lagos · 239 océano · 250 nube · 254 sensor saturado · 255 relleno."),
  pag("Las <em>trampas</em> del índice",
      "El NDSI es muy útil, pero <b>no es perfecto</b>. El algoritmo oficial de NASA hace más pruebas para no equivocarse, y aun así hay casos difíciles: agua, sombras y algunas nubes de hielo. Un buen detective sabe dónde puede fallar su herramienta.",
      "Ver nieve en agosto en un píxel no prueba que ahí haya un glaciar: podría ser nieve de una nevada reciente. Por eso hablamos de <b>“cobertura de nieve”</b>, no de “glaciar”.",
      ("Un NDSI alto, ¿prueba que hay un glaciar?", ["Sí", "No, solo que parece nieve"], 1, "NDSI alto dice “parece nieve”, no “aquí hay un glaciar”."),
      "¡Ya sabes leer los datos como un científico!", "Siguiente: ¡el caso del agua de La Paz!"),
 ],
 "tarjetas": [
  {"icono": "🧮", "pregunta": "¿Cómo se calcula el NDSI?", "respuesta": "(verde − SWIR) ÷ (verde + SWIR). Nieve: verde alto y SWIR bajo → NDSI alto."},
  {"icono": "💯", "pregunta": "¿Qué valores de MOD10A1 hablan de nieve?", "respuesta": "De 0 a 100. 0 = sin nieve."},
  {"icono": "🎚", "pregunta": "¿Qué es el umbral?", "respuesta": "El número desde el cual decides que un píxel tiene nieve."},
  {"icono": "☁", "pregunta": "¿Qué significa el valor 250?", "respuesta": "Nube: no se sabe qué hay debajo. No es “sin nieve”."},
  {"icono": "⚠", "pregunta": "¿Un NDSI alto prueba que hay un glaciar?", "respuesta": "No. Solo que el píxel parece nieve."},
 ],
 "trivia": [
  {"tipo": "pixeles", "pregunta": "Con umbral 40, ¿cuántos de estos píxeles cuentan como nieve?", "valores": [62, 45, 250, 30, 237, 80], "umbral": 40,
   "opciones": ["3 (62, 45 y 80)", "5 (todos menos 30)", "2", "6"], "correcta": 0,
   "explicacion": "250 es una nube y 237 es agua: son avisos, no nieve. 30 está por debajo del umbral. Quedan 62, 45 y 80.", "pista": "Los números mayores que 100 no son nieve."},
  q("Verde = 0,60 y SWIR = 0,60. ¿Cuánto da el NDSI?", ["0", "1", "0,60", "1,20"], 0, "(0,60 − 0,60) = 0. Cero dividido por cualquier número da 0.", "Resta primero."),
  q("NDSI 0,45 se guarda en MOD10A1 como…", ["45", "0,45", "450", "4,5"], 0, "Se multiplica por 100.", "×100"),
  q("Si subes el umbral de 40 a 50…", ["Cuentan menos píxeles como nieve", "Cuentan más", "No cambia nada", "Desaparecen las nubes"], 0, "Exiges más para llamar nieve a un píxel.", "Más exigente = menos píxeles."),
  q("Un píxel dice 211. ¿Qué haces?", ["Lo cuento como 0", "No lo uso: era de noche", "Lo cuento como nieve", "Lo borro del mapa"], 1, "211 = noche. El satélite no pudo ver.", "Es un aviso."),
 ],
 "meta": {"ahoraSabes": ["Calcular el NDSI con verde y SWIR", "Que MOD10A1 guarda la nieve de 0 a 100", "Qué es el umbral y cómo elegirlo", "Leer los avisos: nube, noche, agua…", "Que nieve no es lo mismo que glaciar"]},
 "jukumari": {"inicio": "Hoy descubrimos la fórmula secreta de la nieve.", "acierto": "¡Matemático de la nieve!", "fallo": "Casi. Haz la cuenta paso a paso.", "final": "¡Bloque B completo! Ya puedes leer los datos de MODIS."},
})

# ───────────── 5
L.append({
 "id": "caso", "numero": 5, "bloque": "C", "titulo": "El caso y tu pregunta", "titulo_corto": "El caso",
 "pregunta": "¿Qué vamos a investigar?",
 "paginas": [
  pag("Llegó un <em>expediente</em>",
      "Un detective empieza con un <b>caso</b>. Nuestro expediente trae noticias sobre el agua de La Paz y los glaciares. Antes de creer cualquier cosa, un detective <b>lee con cuidado</b> y busca <b>de dónde viene</b> cada información.",
      "Noticia 1: en <b>2016</b> La Paz tuvo racionamiento de agua por la sequía. Noticia 2: en <b>agosto de 2026</b> se declaró alerta roja, pero la empresa de agua dijo que las represas estaban bien.",
      ("¿Qué hace primero un detective con una noticia?", ["La cree", "Busca su fuente"], 1, "Primero revisa de dónde viene y si se puede comprobar."),
      "¡Llegó una carpeta! Abrámosla juntos.", "Dos noticias… dos mensajes distintos."),
  pag("Dato, aclarar o <em>suposición</em>",
      "Separamos lo que leemos en tres cajas. <b>Dato</b>: se puede comprobar y tiene fuente. <b>Hay que aclarar</b>: tiene fuente, pero falta saber de qué habla exactamente. <b>Suposición</b>: alguien lo cree, pero no está probado.",
      "“Los glaciares perdieron <b>42 %</b>” va en <b>hay que aclarar</b>: es de todos los Andes tropicales, entre 1990 y 2020, y mide el <b>tamaño</b> del hielo, no el agua.",
      ("“La culpa es del cambio climático” va en…", ["Dato", "Suposición"], 1, "Puede ser cierto, pero con nuestros datos todavía no lo probamos."),
      "¡Cada recorte a su caja!", "42 %… ¿de qué? ¿hielo o agua?"),
  pag("¿Qué puede <em>responder</em> MODIS?",
      "Cada herramienta responde algunas preguntas y otras no. MODIS ve <b>dónde hay nieve</b> y <b>cómo cambia con los años</b>. Pero <b>no</b> mide cuántos litros de agua hay, cuánto pesa el hielo ni <b>por qué</b> cambió.",
      "Pregunta buena: “¿cambió la nieve de la Cordillera Real entre 2001 y 2025?”. Pregunta que MODIS no puede responder: “¿cuántos litros de agua tiene el Illimani?”.",
      ("“¿Cuántos litros de agua tiene el Illimani?” ¿La responde MODIS?", ["Sí", "No"], 1, "MODIS ve superficie de nieve, no litros."),
      "Una buena pregunta es medio caso resuelto.", "¿Cuál será nuestra pregunta…?"),
  pag("Tu <em>hipótesis</em>",
      "Una <b>hipótesis</b> es lo que crees que pasó, <b>antes</b> de mirar los datos. No tiene que ser correcta: los datos dirán. Nuestra pregunta: entre 2001 y 2025, en agosto y septiembre, ¿la nieve de la Cordillera Real <b>bajó</b>, <b>no cambió</b> o <b>subió</b>?",
      "Si eliges “bajó” y al final los datos dicen “no cambió”, <b>no perdiste</b>: aprendiste algo. Así avanza la ciencia.",
      ("Si los datos contradicen tu hipótesis…", ["Cambias los datos", "Aprendes algo nuevo"], 1, "Nunca se cambian los datos. Una hipótesis equivocada también es un hallazgo."),
      "Elige tu hipótesis y qué tan seguro estás.", "Ahora… ¿dónde miramos?"),
 ],
 "hipotesis": {"pregunta": "Entre 2001 y 2025, en agosto y septiembre, la nieve de la Cordillera Real…", "opciones": ["bajó", "no cambió", "subió"], "confianza": ["Poco seguro", "Más o menos", "Muy seguro"]},
 "fuentes": [
  {"texto": "Racionamiento de 2016 (Los Tiempos)", "url": "https://www.lostiempos.com/actualidad/local/20161112/semapa-racionara-agua-mes-mas-crisis-llega-paz"},
  {"texto": "Alerta roja y EPSAS (eju.tv, 11/08/2026)", "url": "https://eju.tv/?p=5060524"},
  {"texto": "42 % de los Andes tropicales (EFE / Expreso, 2022)", "url": "https://www.expreso.ec/actualidad/mundo/glaciares-andinos-reducen-42-superficie-127878.html"}],
 "tarjetas": [
  {"icono": "📁", "pregunta": "¿Qué hace un detective con una noticia?", "respuesta": "Busca su fuente y revisa si se puede comprobar."},
  {"icono": "📦", "pregunta": "¿Cuáles son las tres cajas?", "respuesta": "Dato, hay que aclarar y suposición."},
  {"icono": "📏", "pregunta": "¿El 42 % de los glaciares andinos es de agua?", "respuesta": "No. Es del tamaño (superficie) del hielo, de 1990 a 2020."},
  {"icono": "❓", "pregunta": "¿Qué puede responder MODIS?", "respuesta": "Dónde hay nieve y cómo cambia con los años. No litros, ni peso, ni causas."},
  {"icono": "💡", "pregunta": "¿Qué es una hipótesis?", "respuesta": "Lo que crees que pasó antes de mirar los datos. Puede estar equivocada."},
 ],
 "trivia": [
  {"tipo": "clasificar", "pregunta": "Pon cada recorte en su caja", "etiquetas": ["Dato", "Hay que aclarar", "Suposición"],
   "escenas": [{"texto": "En 2016 La Paz tuvo racionamiento de agua.", "correcta": "Dato"}, {"texto": "Los glaciares perdieron 42 %.", "correcta": "Hay que aclarar"}, {"texto": "Alerta roja, pero represas en niveles óptimos.", "correcta": "Hay que aclarar"}, {"texto": "Ya no hay agua para La Paz.", "correcta": "Suposición"}],
   "explicacion": "El racionamiento de 2016 está documentado. El 42 % y la alerta necesitan aclararse. “Ya no hay agua” nadie lo comprobó.", "pista": "¿Tiene fuente? ¿Se sabe de qué habla?"},
  q("¿Cuál es una pregunta que MODIS SÍ puede responder?", ["¿Cuánto pesa el hielo?", "¿Cambió la nieve entre 2001 y 2025?", "¿Por qué hace calor?", "¿Cuántos litros hay?"], 1, "MODIS ve la nieve día a día durante años.", "Piensa en lo que ve MODIS."),
  q("El 42 % de los Andes tropicales mide…", ["Litros de agua", "El tamaño del hielo", "La temperatura", "El peso del hielo"], 1, "Es superficie: tamaño, no agua.", "¿Área o agua?"),
  q("“En 2016 La Paz tuvo racionamiento de agua” es…", ["Un dato", "Una suposición", "Una hipótesis", "Un rumor"], 0, "Está documentado en noticias de esa época.", "¿Tiene fuente?"),
  q("Tu hipótesis resultó equivocada. ¿Qué pasa?", ["Pierdes", "Aprendes algo: así avanza la ciencia", "Cambias los datos", "Repites hasta acertar"], 1, "Nunca se cambian los datos.", "La ciencia aprende de los errores."),
 ],
 "meta": {"ahoraSabes": ["Leer un expediente buscando las fuentes", "Separar dato, lo que hay que aclarar y suposición", "Qué preguntas puede responder MODIS", "Escribir tu hipótesis"]},
 "jukumari": {"inicio": "¡Empieza el caso! Hoy abrimos el expediente del agua de La Paz.", "acierto": "¡Buen olfato de detective!", "fallo": "Casi. Pregúntate: ¿se puede comprobar?", "final": "Ya tienes tu pregunta y tu hipótesis. ¡A investigar!"},
})

# ───────────── 6
L.append({
 "id": "region", "numero": 6, "bloque": "C", "titulo": "¿Dónde? La región", "titulo_corto": "La región",
 "pregunta": "¿Qué pedazo de mapa vamos a mirar?",
 "paginas": [
  pag("La escena <em>importa</em>",
      "La <b>región</b> es el pedazo de mapa que analizas. Si es muy grande, entran roca, pasto y lagos sin hielo. Si es muy chica, tienes pocos píxeles. Elegir bien la región es como elegir bien la escena del crimen.",
      "Vamos a comparar tres recuadros de la Cordillera Real: <b>grande</b> (toda la cordillera), <b>medio</b> (del Huayna Potosí al Tuni-Condoriri) y <b>solo glaciares</b>.",
      ("Si tu recuadro tiene muchos lagos y roca…", ["El cambio del hielo se nota más", "El cambio del hielo se nota menos"], 1, "Lo que no es hielo no cambia y “agua” la señal."),
      "La escena del crimen importa. ¡Mira dónde está el hielo!", "¿Cuántos cuadritos tendrá cada recuadro?"),
  pag("¿Cuántos <em>píxeles</em> entran?",
      "Cada píxel de MODIS mide 500 m × 500 m. El recuadro <b>grande</b> mide unos 120 km por lado: tiene <b>unos 57 000 píxeles</b>. El <b>medio</b> mide unos 33 km por lado: <b>unos 4300 píxeles</b>. El de <b>solo glaciares</b> tiene muchos menos, pero casi todos con hielo.",
      "Más píxeles no siempre es mejor: en el recuadro grande, la mayoría son de roca y pasto que no cambian con los años.",
      ("¿Qué recuadro tiene más píxeles?", ["Grande", "Solo glaciares"], 0, "El grande, pero la mayoría no tiene hielo."),
      "¡Contar cuadritos también es trabajo de detective!", "Muchos píxeles… pero ¿de qué?"),
  pag("La señal se <em>diluye</em>",
      "Si solo una parte del recuadro tiene hielo, el cambio del hielo se mezcla con lo que no cambia y se ve <b>más débil</b>. A eso le decimos que la señal se <b>diluye</b>. El recuadro grande no miente: muestra el mismo rumbo, pero más suave.",
      "Es como echar un vaso de jugo en un balde de agua: el jugo sigue ahí, pero casi no se nota el sabor.",
      ("Un recuadro grande muestra un cambio pequeño. ¿Es mentira?", ["Sí", "No, solo diluye"], 1, "El rumbo es el mismo; solo se ve más débil."),
      "No es mentira: es jugo en un balde de agua.", "Entonces… ¿cuál elijo?"),
  pag("Elegir con <em>criterio</em>",
      "Una buena región es <b>lo bastante grande</b> para tener muchos píxeles de MODIS y <b>lo bastante ajustada</b> para que casi todos tengan hielo. Para el recuadro “solo glaciares” usamos los bordes de <b>GLIMS</b>, un mapa mundial de glaciares.",
      "Usamos todos los bordes conocidos de cada glaciar, incluso de años en que era más grande. Así también contamos el hielo que <b>ya se perdió</b>.",
      ("¿De dónde salen los bordes de los glaciares?", ["De GLIMS", "De Google Maps"], 0, "GLIMS es el inventario mundial de glaciares."),
      "En el caso usaremos “solo glaciares”, pero tú puedes comparar.", "Siguiente: ¿cuándo miramos?",
      "GLIMS: Global Land Ice Measurements from Space, con datos del NSIDC y apoyo de NASA."),
 ],
 "tarjetas": [
  {"icono": "🗺", "pregunta": "¿Qué es la región?", "respuesta": "El pedazo de mapa que analizas."},
  {"icono": "🧃", "pregunta": "¿Qué significa que la señal se diluye?", "respuesta": "Que el cambio del hielo se mezcla con zonas que no cambian y se ve más débil."},
  {"icono": "🔢", "pregunta": "¿Cuántos píxeles tiene el recuadro grande?", "respuesta": "Unos 57 000, pero la mayoría sin hielo."},
  {"icono": "🧊", "pregunta": "¿Qué es GLIMS?", "respuesta": "Un mapa mundial con los bordes de los glaciares."},
  {"icono": "✅", "pregunta": "¿Cómo es una buena región?", "respuesta": "Con muchos píxeles y casi todos con hielo."},
 ],
 "trivia": [
  q("¿Con qué recuadro se ve más claro el cambio del hielo?", ["Grande", "Medio", "Solo glaciares", "Da igual"], 2, "Tiene menos roca y lagos que diluyan la señal.", "¿Dónde hay más hielo por píxel?"),
  q("¿Qué pico está en el recuadro medio?", ["Illimani", "Huayna Potosí", "Kilimanjaro", "Everest"], 1, "El medio va del Huayna Potosí al Tuni-Condoriri.", "Está cerca de El Alto."),
  q("¿Por qué usamos bordes de años en que el glaciar era más grande?", ["Para contar también el hielo perdido", "Por error", "Porque son más bonitos", "Para tener menos píxeles"], 0, "Si solo usamos el borde actual, no veríamos dónde se perdió hielo.", "¿Qué pasa con el hielo que ya no está?"),
  q("Un recuadro de 1 km × 1 km tiene…", ["4 píxeles de MODIS", "1000 píxeles", "1 millón", "Ninguno"], 0, "500 m × 500 m: entran 2 × 2 = 4.", "¿Cuántos de 500 m caben en 1 km?"),
  q("El recuadro grande muestra un cambio débil. Eso significa que…", ["La señal se diluye", "Los datos están mal", "No hay glaciares", "MODIS falló"], 0, "La roca y los lagos no cambian y “aguan” el cambio.", "Jugo en un balde…"),
 ],
 "meta": {"ahoraSabes": ["Qué es la región de estudio", "Cuántos píxeles entran en cada recuadro", "Por qué la señal se diluye", "Elegir una región con criterio (GLIMS)"]},
 "jukumari": {"inicio": "Paso 2 del detective: ¿dónde miramos?", "acierto": "¡Cartógrafo nato!", "fallo": "Casi. Piensa en cuántos píxeles tienen hielo.", "final": "¡Ya tienes tu región! Ahora, ¿cuándo?"},
})

# ───────────── 7
L.append({
 "id": "periodo", "numero": 7, "bloque": "C", "titulo": "¿Cuándo? El periodo", "titulo_corto": "El periodo",
 "pregunta": "¿Qué meses y años comparamos?",
 "paginas": [
  pag("La montaña <em>cambia de ropa</em>",
      "La nieve sube y baja durante el año: en la <b>época de lluvias</b> cae nieve nueva y en la <b>época seca</b> esa nieve se derrite. Ese ciclo se repite <b>todos los años</b>: se llama <b>estacionalidad</b>. No es una tendencia.",
      "El gráfico muestra la nieve de cada mes en la Cordillera Real: en algunos meses hay mucha más que en otros, y eso pasa cada año.",
      ("La nieve sube en la época de lluvias y baja en la seca, cada año. Eso es…", ["Una tendencia", "Estacionalidad"], 1, "Se repite cada año: es un ciclo, no un cambio de fondo."),
      "Toca los meses y mira cómo cambia la nieve.", "Si comparo meses distintos… ¿será justo?"),
  pag("La comparación <em>injusta</em>",
      "Si comparas <b>marzo</b> de un año con <b>septiembre</b> de otro, verás una gran caída de nieve. Pero no es una tendencia: es la estación. Comparar épocas distintas es una <b>trampa</b>.",
      "Es como comparar tu ropa de invierno con tu ropa de verano y decir que “cada vez te abrigas menos”. ¡Solo cambió la estación!",
      ("Marzo de 2001 contra septiembre de 2024, ¿es justo?", ["Sí", "No, son estaciones distintas"], 1, "Hay que comparar los mismos meses."),
      "¡Cuidado con esta trampa! Muchos caen.", "Entonces… ¿qué meses comparamos?"),
  pag("La ventana <em>justa</em>",
      "Lo justo es comparar <b>los mismos meses</b> en todos los años. Elegimos <b>agosto y septiembre</b>: es el final de la época seca. La nieve de temporada ya se fue y queda el hielo que <b>dura</b>. Además, hay menos nubes.",
      "Así comparamos agosto–septiembre de 2001 con agosto–septiembre de 2002, de 2003… hasta 2025. Siempre la misma ventana.",
      ("¿Por qué agosto y septiembre?", ["Es el fin de la época seca", "Hay más turistas"], 0, "Queda el hielo duradero y hay menos nubes."),
      "La misma ventana cada año: así se compara justo.", "¿Y cuántos años necesito?"),
  pag("¿Cuántos <em>años</em>?",
      "Con pocos años, un año raro puede engañarte. Por eso usamos <b>muchos</b>: de <b>2001 a 2025</b>, son <b>25 años</b>. Como regla, con menos de <b>10 años</b> el resultado es poco confiable.",
      "MODIS empezó en febrero de 2000. Usamos años completos: por eso empezamos en <b>2001</b>.",
      ("¿Cuántos años usamos?", ["5", "25"], 1, "De 2001 a 2025: 25 años."),
      "25 años de datos de NASA. ¡Eso sí es una buena serie!", "Siguiente: limpiar los datos."),
 ],
 "tarjetas": [
  {"icono": "🔁", "pregunta": "¿Qué es la estacionalidad?", "respuesta": "Un ciclo que se repite cada año, como la época de lluvias y la seca. No es tendencia."},
  {"icono": "⚖", "pregunta": "¿Qué comparación es justa?", "respuesta": "Los mismos meses en años distintos."},
  {"icono": "📅", "pregunta": "¿Qué ventana usamos?", "respuesta": "Agosto y septiembre: el fin de la época seca."},
  {"icono": "☀", "pregunta": "¿Por qué agosto y septiembre?", "respuesta": "Queda el hielo que dura y hay menos nubes."},
  {"icono": "🗓", "pregunta": "¿Cuántos años usamos y por qué?", "respuesta": "25 (2001–2025). Con menos de 10, un año raro puede engañar."},
 ],
 "trivia": [
  q("¿Cuál es la comparación justa?", ["Marzo con septiembre", "Agosto–septiembre de cada año", "Cualquier mes con pocas nubes", "El primer día de cada año"], 1, "Siempre la misma ventana.", "Mismos meses."),
  q("Ves que hay menos nieve en septiembre que en marzo. ¿Qué es?", ["Una tendencia segura", "La estación", "Un error de MODIS", "Un milagro"], 1, "Marzo es época de lluvias y septiembre, seca.", "Ropa de invierno y verano…"),
  q("¿Por qué empezamos en 2001 y no en 2000?", ["Porque MODIS empezó a medir en febrero de 2000", "Por casualidad", "Porque 2000 no existió", "Porque llovió mucho"], 0, "2000 está incompleto: usamos años completos.", "¿Desde cuándo hay datos?"),
  q("Con solo 4 años de datos…", ["Un año raro puede engañarte", "Es más seguro", "Es igual que con 25", "No pasa nada"], 0, "Hacen falta muchos años para ver una tendencia.", "¿Y si uno de los 4 fue muy raro?"),
  q("En la época seca, la nieve de temporada…", ["Se derrite", "Aumenta", "Se vuelve nube", "No cambia"], 0, "Por eso en agosto–septiembre queda el hielo que dura.", "Época seca = poca lluvia."),
 ],
 "meta": {"ahoraSabes": ["Qué es la estacionalidad", "Por qué comparar meses distintos es una trampa", "La ventana justa: agosto y septiembre", "Cuántos años hacen falta"]},
 "jukumari": {"inicio": "Paso 3: ¿cuándo miramos? ¡Ojo con las estaciones!", "acierto": "¡Maestro del calendario!", "fallo": "Casi. ¿Estamos comparando épocas iguales?", "final": "Ya tienes tu periodo: agosto y septiembre, de 2001 a 2025."},
})

# ───────────── 8
L.append({
 "id": "serie", "numero": 8, "bloque": "C", "titulo": "Limpiar los datos", "titulo_corto": "Limpiar los datos",
 "pregunta": "¿Son confiables mis datos?",
 "paginas": [
  pag("Las nubes <em>tapan</em>",
      "En agosto y septiembre hay <b>61 días</b> cada año. Algunos días MODIS ve bien la montaña; otros, las <b>nubes</b> la tapan. Si un día está casi todo tapado, ese día <b>no nos sirve</b>: hay que descartarlo.",
      "La cuadrícula muestra 61 días de un año: azul = nieve, café = sin nieve, gris = nube. Los días muy grises se descartan.",
      ("Un día con nubes en 9 de cada 10 píxeles, ¿lo usas?", ["Sí", "No"], 1, "Casi no se ve nada: no nos dice nada del hielo."),
      "El satélite no ve a través de las nubes. ¡Tú decides!", "¿Cuántas nubes acepto en un día?"),
  pag("Días <em>útiles</em>",
      "Un <b>día útil</b> es un día con suficiente cielo despejado. Tú eliges el mínimo: <b>30 %</b>, <b>50 %</b> o <b>70 %</b> de píxeles visibles. Si exiges poco, entran días dudosos. Si exiges mucho, quedan muy pocos días.",
      "Usamos <b>50 %</b> y pedimos al menos <b>10 días útiles</b> en cada año. Si un año no los tiene, lo marcamos como “sin datos”, no como cero.",
      ("Si exiges 90 % de cielo despejado…", ["Sobran días", "Casi no quedan días"], 1, "En los Andes casi siempre hay alguna nube."),
      "Ni muy poco ni demasiado: busca el equilibrio.", "¿Y qué tan blanco tiene que ser un píxel?"),
  pag("Tu <em>umbral</em>",
      "Recuerda: MODIS da un número de 0 a 100 en cada píxel. Tu <b>umbral</b> dice desde qué número cuenta como nieve. Probaremos <b>30</b>, <b>40</b> y <b>50</b>. No hay un umbral perfecto, pero sí uno <b>razonable</b>: usamos <b>40</b>.",
      "Con umbral 30 cuentan más píxeles; con 50, menos. Después vas a comprobar que el resultado <b>no dependa</b> de esa elección.",
      ("¿Existe un umbral perfecto?", ["Sí, el 100", "No, pero sí uno razonable"], 1, "Se elige uno razonable y luego se prueba con otros."),
      "Tú eres el juez del umbral.", "¿Y cómo junto todo en un número por año?"),
  pag("Un número por <em>año</em>",
      "Con los días útiles de agosto y septiembre sacamos <b>un promedio por año</b>: qué porcentaje de los píxeles visibles tenía nieve. Así se arma la <b>serie</b>: 25 números, uno por año, de 2001 a 2025. ¡Lista para analizar!",
      "Un <b>dato que falta no es cero</b>. Si un año no tuvo días útiles, se deja vacío. Ponerle cero sería inventar que no había nieve.",
      ("Un año sin días útiles, ¿cuánto vale?", ["Cero", "Sin dato (vacío)"], 1, "Ponerle cero sería inventar."),
      "¡Tu serie está limpia! Ahora, a buscar la tendencia.", "Siguiente: ¿real o casualidad?",
      "Valor del año = promedio de (píxeles con nieve ÷ píxeles visibles) en los días útiles de agosto y septiembre."),
 ],
 "tarjetas": [
  {"icono": "☁", "pregunta": "¿Puede MODIS ver nieve debajo de una nube?", "respuesta": "No. Por eso se descartan los días muy nublados."},
  {"icono": "✅", "pregunta": "¿Qué es un día útil?", "respuesta": "Un día con suficiente cielo despejado (en el caso, al menos 50 %)."},
  {"icono": "🎚", "pregunta": "¿Qué umbral usamos?", "respuesta": "40. Y lo comprobamos con 30 y 50."},
  {"icono": "🕳", "pregunta": "¿Un dato que falta es cero?", "respuesta": "No. Se deja vacío: ponerle cero sería inventar."},
  {"icono": "📈", "pregunta": "¿Qué es la serie?", "respuesta": "Una lista de valores en orden: aquí, uno por año de 2001 a 2025."},
 ],
 "trivia": [
  q("Un día casi todo tapado por nubes, ¿lo usamos?", ["No", "Sí", "Solo si es lunes", "Siempre"], 0, "No nos dice nada del hielo.", "¿Se ve la montaña?"),
  q("Subir el cielo despejado mínimo de 50 % a 70 % hace que…", ["Queden menos días útiles", "Queden más días", "Aparezca nieve", "Nada cambie"], 0, "Exiges más: quedan menos días.", "Más exigente…"),
  q("Un año sin días útiles en la serie…", ["Se deja vacío", "Vale 0", "Vale 100", "Se inventa"], 0, "Un dato que falta no es cero.", "¿Sabemos cuánta nieve hubo?"),
  q("¿Cuántos días tienen agosto y septiembre juntos?", ["61", "30", "90", "365"], 0, "31 + 30 = 61.", "Suma los dos meses."),
  q("¿Por qué probaremos los umbrales 30 y 50 además de 40?", ["Para ver que el resultado no dependa de una sola elección", "Por diversión", "Porque 40 está prohibido", "Para tener menos datos"], 0, "Un buen resultado resiste cambios razonables.", "¿Y si eligiéramos otro?"),
 ],
 "meta": {"ahoraSabes": ["Descartar días con muchas nubes", "Qué es un día útil", "Elegir un umbral razonable", "Que un dato que falta no es cero", "Armar la serie: un número por año"]},
 "jukumari": {"inicio": "Paso 4: antes de analizar, ¡a limpiar los datos!", "acierto": "¡Cazador de nubes!", "fallo": "Casi. Un día tapado no nos cuenta nada.", "final": "¡Serie limpia! 25 años listos para analizar."},
})

# ───────────── 9
L.append({
 "id": "significancia", "numero": 9, "bloque": "C", "titulo": "¿Real o casualidad?", "titulo_corto": "Real o casualidad",
 "pregunta": "¿La nieve cambió de verdad o fue suerte?",
 "paginas": [
  pag("Variación o <em>tendencia</em>",
      "Los datos siempre suben y bajan un poco: eso es la <b>variación</b>. Una <b>tendencia</b> es un cambio que se mantiene durante <b>muchos años</b>, por encima de esas subidas y bajadas. Un solo año raro <b>no</b> es una tendencia.",
      "Mira los tres gráficos: uno es una tendencia (baja poco a poco, como una escalera), otro es puro ruido y otro tiene un solo año raro.",
      ("Un solo año con mucha menos nieve, ¿es una tendencia?", ["Sí", "No"], 1, "Un año no alcanza: la tendencia se ve en muchos años."),
      "¡Aprende a ver el rumbo, no los saltos!", "¿Cómo mido cuánto baja?"),
  pag("La <em>pendiente</em>",
      "La <b>pendiente</b> dice cuánto sube o baja la nieve <b>cada año</b>, en promedio. La multiplicamos por 10 para decir cuánto cambia <b>cada 10 años</b>. Se calcula de una forma que un año raro no la engaña.",
      "En tu serie de la Cordillera Real, la nieve cambia <b>{pendiente_decada} puntos cada 10 años</b>. Si el número es negativo, la nieve baja.",
      ("Una pendiente negativa significa que la nieve…", ["Baja", "Sube"], 0, "Negativo = baja con los años."),
      "La línea punteada muestra el rumbo.", "Pero… ¿y si fue pura suerte?",
      "Usamos la pendiente de Sen: la mediana de todas las pendientes entre pares de años."),
  pag("La suerte también <em>dibuja</em>",
      "Si tiras una moneda 10 veces y salen 7 caras, ¿está trucada? No necesariamente: la <b>suerte</b> también hace patrones. Con los datos pasa igual: el azar puede dibujar subidas y bajadas que <b>parecen</b> tendencias.",
      "En la actividad verás 6 gráficos: 5 son <b>puro azar</b> y 1 es tu serie real. ¿Puedes adivinar cuál es la real?",
      ("7 caras de 10 tiros, ¿prueba que la moneda está trucada?", ["Sí", "No necesariamente"], 1, "La suerte también da rachas."),
      "¡Cuidado! La suerte engaña al ojo.", "¿Hay una forma de medir la suerte?"),
  pag("El <em>valor p</em>",
      "El <b>valor p</b> responde: si la nieve <b>en verdad no cambiara</b>, ¿qué tan raro sería ver este dibujo por pura suerte? Si p es menor que <b>0,05</b> (menos de 5 en 100), decimos que es muy difícil que sea solo suerte.",
      "Tu serie tiene <b>p = {p}</b>. Ojo: que no sea suerte <b>no</b> dice si el cambio es grande ni <b>por qué</b> pasó.",
      ("p = 0,01 quiere decir que…", ["Sería muy raro verlo por pura suerte", "Hay 1 % de nieve"], 0, "El valor p mide qué tan raro sería el patrón sin cambio real."),
      "¡Ya sabes separar lo real de la suerte!", "Siguiente: ¿podemos confiar?",
      "Usamos la prueba de Mann-Kendall, que compara cada año con todos los siguientes."),
 ],
 "tarjetas": [
  {"icono": "📉", "pregunta": "¿Qué es una tendencia?", "respuesta": "Un cambio que se mantiene muchos años, por encima de las subidas y bajadas."},
  {"icono": "📐", "pregunta": "¿Qué es la pendiente?", "respuesta": "Cuánto sube o baja algo cada año. La decimos cada 10 años."},
  {"icono": "🪙", "pregunta": "¿La suerte puede parecer una tendencia?", "respuesta": "Sí. Por eso usamos una prueba y no solo la vista."},
  {"icono": "⚖", "pregunta": "¿Qué mide el valor p?", "respuesta": "Qué tan raro sería ver ese patrón por pura suerte si no hubiera cambio."},
  {"icono": "❗", "pregunta": "¿“No es suerte” significa que sabemos la causa?", "respuesta": "No. Solo que el cambio es difícil de explicar con suerte."},
 ],
 "trivia": [
  {"tipo": "juez", "pregunta": "5 gráficos son suerte y 1 es tu serie real. ¿Cuál es la real?",
   "explicacion": "La real mantiene su rumbo durante los 25 años; las de suerte suben y bajan sin rumbo.", "pista": "Mira el rumbo de punta a punta."},
  q("Tu valor p es {p}. ¿Qué significa?", ["Si no hubiera cambio, ver este patrón sería poco común", "Hay {p} de probabilidad de lluvia", "El glaciar perdió {p}", "El satélite falló"], 0, "El valor p mide qué tan raro sería el patrón sin tendencia.", "Raro… si no pasara nada."),
  q("Pendiente de −3 puntos cada 10 años quiere decir…", ["La nieve baja", "La nieve sube", "No cambia", "Hay 3 nubes"], 0, "Negativo = baja.", "¿Signo menos?"),
  q("p = 0,40. ¿Qué dices?", ["Todavía no se sabe: podría ser suerte", "Es seguro que bajó", "Es seguro que subió", "Los datos están mal"], 0, "0,40 es mayor que 0,05: no alcanza.", "¿Menor que 0,05?"),
  q("Un resultado “real”, ¿dice por qué cambió la nieve?", ["No", "Sí, siempre", "Solo en Bolivia", "Solo si p = 0"], 0, "Dice que no es suerte; no dice la causa.", "Real no es igual a causa."),
 ],
 "meta": {"ahoraSabes": ["Diferenciar variación y tendencia", "Qué es la pendiente", "Que la suerte también dibuja patrones", "Qué significa el valor p"]},
 "jukumari": {"inicio": "Paso 5: ¿real o casualidad? ¡La parte más emocionante!", "acierto": "¡Juez del azar!", "fallo": "Casi. Recuerda: p mide lo raro si no pasara nada.", "final": "¡Sabes separar lo real de la suerte!"},
})

# ───────────── 10
L.append({
 "id": "veredicto", "numero": 10, "bloque": "C", "titulo": "¿Podemos confiar? Veredicto", "titulo_corto": "Veredicto",
 "pregunta": "¿Qué podemos afirmar, con honestidad?",
 "paginas": [
  pag("Ponerlo a <em>prueba</em>",
      "Un buen detective desconfía de su propio resultado. Lo ponemos a prueba cambiando las reglas: otro <b>umbral</b> (30 y 50), más <b>cielo despejado</b>, revisar si los años <b>se copian</b> entre sí y quitar los años de <b>El Niño fuerte</b>. Resultado: <b>{n_ok} de {n_pruebas}</b> pruebas superadas.",
      "Semáforo: <b>verde</b> = el rumbo se mantiene; <b>amarillo</b> = sobrevive, pero más débil; <b>rojo</b> = no pasa y se escribe como límite.",
      ("Una prueba sale en rojo. ¿Qué haces?", ["La escondes", "La escribes como límite"], 1, "Un límite honesto hace más fuerte tu informe."),
      "¡Desconfiar es de buenos detectives!", "¿Y si todo fue por El Niño…?",
      "Los años que se copian se corrigen con la prueba de Hamed y Rao."),
  pag("El Niño y la <em>lluvia</em>",
      "<b>El Niño</b> es un calentamiento natural del océano Pacífico que vuelve cada pocos años; en el Altiplano suele traer menos lluvia. Si quitamos sus años y la tendencia sigue, no era solo El Niño. Y la <b>lluvia</b> de la Cordillera Real <b>no cambió de forma clara</b> (p = 0,47).",
      "Que dos cosas cambien juntas no quiere decir que una cause la otra. En verano se venden más helados y hay más quemaduras de sol, ¡pero los helados no queman!",
      ("Si la nieve baja y la lluvia no cambió, ¿ya sabemos la causa?", ["Sí", "No: solo descartamos una explicación"], 1, "Descartar una explicación no es demostrar otra."),
      "Correlación no es causa. ¡Recuérdalo siempre!", "¿Qué no pueden decir nuestros datos?",
      "El índice de El Niño (ONI) es de NOAA, no de NASA."),
  pag("Los <em>límites</em>",
      "Todo estudio tiene límites, y escribirlos te hace <b>más confiable</b>. Los nuestros: MODIS ve <b>nieve</b>, no el glaciar en sí; sus cuadritos miden <b>500 m</b>; el <b>tamaño</b> del hielo no es lo mismo que el <b>agua</b>; y usamos <b>una sola</b> fuente de nieve.",
      "Un buen informe dice qué se sabe, qué es incierto y qué <b>no</b> se puede concluir.",
      ("¿Cuál es un límite real de este caso?", ["MODIS no distingue nieve de glaciar", "El satélite es rojo"], 0, "Ve superficie blanca, no el glaciar en sí."),
      "Decir lo que no sabes también es ciencia.", "Hora de escribir tu veredicto…"),
  pag("Tu <em>veredicto</em>",
      "Compara lo que creías (<b>{hipotesis}</b>) con lo que dicen los datos (<b>{pendiente_decada} cada 10 años, p = {p}</b>). Escribe tu veredicto con <b>palabras justas</b>: “va de acuerdo con” y no “demuestra”, porque medimos nieve, no litros de agua.",
      "Entre 2001 y 2025, la nieve de la Cordillera Real en agosto–septiembre [bajó / no cambió de forma clara / subió] {pendiente_decada} puntos cada 10 años (p = {p}). Superó {n_ok} de {n_pruebas} pruebas.",
      ("Si p es mayor que 0,05, ¿puedes decir “la nieve bajó”?", ["Sí", "No: todavía no se sabe"], 1, "Con esos datos no alcanza para afirmarlo."),
      "¡Llegó la hora del veredicto, detective!", "¡Después: resolver los casos!"),
 ],
 "plantilla": "Entre {desde} y {hasta}, la nieve de {region} en agosto–septiembre [disminuyó / no cambió de forma clara / aumentó] a un ritmo de {pendiente_decada} puntos cada 10 años (p = {p}). El resultado [superó / superó en parte / no superó] las pruebas ({n_ok} de {n_pruebas}). Esto [va de acuerdo con / no alcanza para afirmar] una pérdida de agua para La Paz.",
 "limites": ["El satélite ve nieve, no el glaciar", "Cuadritos de 500 m", "Tamaño no es agua", "Una sola fuente de nieve"],
 "tarjetas": [
  {"icono": "🚦", "pregunta": "¿Qué significa una prueba en rojo?", "respuesta": "Que no pasó: se escribe como límite, no se esconde."},
  {"icono": "🌊", "pregunta": "¿Qué es El Niño?", "respuesta": "Un calentamiento natural del Pacífico que en el Altiplano suele traer menos lluvia."},
  {"icono": "🍦", "pregunta": "¿Si dos cosas cambian juntas, una causa la otra?", "respuesta": "No siempre. Helados y quemaduras de sol suben juntos, pero los helados no queman."},
  {"icono": "🧱", "pregunta": "¿Para qué sirven los límites?", "respuesta": "Para decir qué no se puede concluir. Hacen el informe más confiable."},
  {"icono": "📝", "pregunta": "¿Por qué no decir “demuestra”?", "respuesta": "Porque medimos nieve, no litros de agua."},
 ],
 "trivia": [
  q("¿Qué palabra es honesta si la nieve bajó con p menor que 0,05?", ["Demuestra pérdida de agua", "Va de acuerdo con una pérdida de agua", "Prueba el cambio climático", "No dice nada"], 1, "Medimos nieve, no agua: “va de acuerdo con” es lo justo.", "¿Medimos litros?"),
  q("Quitamos los años de El Niño fuerte y la tendencia sigue. ¿Qué significa?", ["Que no era solo El Niño", "Que El Niño es la causa", "Que los datos están mal", "Nada"], 0, "La tendencia no depende de esos años.", "¿Sobrevive sin ellos?"),
  q("¿Cuál NO es un límite de este caso?", ["El satélite es de NASA", "MODIS ve nieve, no glaciar", "Píxeles de 500 m", "Tamaño no es agua"], 0, "Que sea de NASA no limita el estudio.", "Los otros tres sí limitan."),
  q("En verano suben las ventas de helado y las quemaduras de sol. ¿Los helados queman?", ["No: los dos los causa el sol", "Sí", "Solo los de chocolate", "Depende"], 0, "Correlación no es causa.", "¿Qué tienen en común?"),
  q("Tus datos contradicen tu hipótesis. ¿Qué escribes?", ["Lo que dicen los datos, con sus límites", "Mi hipótesis igual", "Nada", "Cambio los números"], 0, "El veredicto sigue a los datos.", "La honestidad primero."),
 ],
 "meta": {"ahoraSabes": ["Poner a prueba un resultado", "Que correlación no es causa", "Escribir los límites de un estudio", "Escribir un veredicto honesto"], "abreCasos": True},
 "jukumari": {"inicio": "Último paso: ¿podemos confiar? ¡Y tu veredicto!", "acierto": "¡Escéptico profesional!", "fallo": "Ojo: con tus pruebas no podemos afirmar tanto.", "final": "¡Entrenamiento completo, detective! Los casos te esperan."},
})

# insignia de la lección: la del bloque si es la última del bloque
ultimas = {"A": 2, "B": 4, "C": 10}
for l in L:
    l["insignia"] = BLOQUES[l["bloque"]]["insignia"]["id"] if ultimas[l["bloque"]] == l["numero"] else None
    l["imagenes"] = [f"img/lecciones/leccion-{l['numero']}-p{i}.png" for i in range(1, 5)]
    # compatibilidad con pantallas existentes
    l["nombre"] = l["titulo_corto"]
    l["conceptos"] = [p["titulo"].replace("<em>", "").replace("</em>", "") for p in l["paginas"]]
    l["datos"] = {9: ["lecciones/series.json"], 10: ["lecciones/series.json", "lecciones/pruebas.json"]}.get(l["numero"])

if __name__ == "__main__":
    js = ("// APU · Ruta de aprendizaje (10 lecciones). Generado por lecciones_data.py — no editar a mano.\n"
          "// Base: módulos de Diana + ruta de Darwin. Público: desde 12 años. Sin temperatura.\n"
          "// Cada lección: 4 páginas (texto, imagen, ejemplo, ¿lo entendiste?) → 5 tarjetas → 5 trivia → meta.\n"
          "// {marcas}: la app las llena con los JSON de datos; si faltan, muestra \"—\".\n\n"
          f"export const BLOQUES = {json.dumps(BLOQUES, ensure_ascii=False, indent=1)};\n\n"
          f"export const LECCIONES = {json.dumps(L, ensure_ascii=False, indent=1)};\n")
    open("lecciones.js", "w").write(js)
    json.dump(L, open("lecciones.json", "w"), ensure_ascii=False)
    print(len(L), "lecciones", sum(len(l["paginas"]) for l in L), "páginas")
