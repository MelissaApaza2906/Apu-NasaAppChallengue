# generar_json.py
# Convierte una serie real de NASA (CSV de Giovanni o AppEEARS) en el JSON que lee APU.
# Calcula de verdad: tendencia por década, cuántas veces bajó y subió,
# valor p (prueba de Mann-Kendall) y el veredicto.
#
# Uso:
#   python generar_json.py nieve  nieve_cordillera_real.csv  datos/cordillera-real.json
#   python generar_json.py lluvia lluvia_cordillera_real.csv datos/cordillera-real.json
# (corre los dos: el segundo agrega la lluvia al mismo JSON)
#
# Solo usa Python, sin instalar nada.

import csv, json, math, os, sys
from datetime import datetime
from statistics import mean

variable, ruta_csv, ruta_json = sys.argv[1], sys.argv[2], sys.argv[3]
ES_LLUVIA = variable == "lluvia"

# ---------- 1. Leer el CSV ----------
# Giovanni y AppEEARS ponen líneas de información antes de la tabla.
# Buscamos la primera fila que empieza con una fecha.
def leer_fecha(texto):
    texto = texto.strip().replace("T", " ").split(" ")[0]
    for formato in ("%Y-%m-%d", "%Y-%m", "%Y/%m/%d"):
        try:
            return datetime.strptime(texto, formato)
        except ValueError:
            pass
    return None

filas = []
with open(ruta_csv, encoding="utf-8", errors="ignore") as f:
    for fila in csv.reader(f):
        if len(fila) < 2:
            continue
        fecha = leer_fecha(fila[0])
        if fecha is None:
            continue
        try:
            valor = float(fila[1])
        except ValueError:
            continue
        if valor < -9000:          # valores de "sin dato" (-9999)
            continue
        filas.append((fecha, valor))

if not filas:
    sys.exit("No encontré datos. Revisa que la primera columna sea la fecha y la segunda el valor.")

# ---------- 2. Un valor por mes ----------
# Si el CSV trae datos diarios u 8-diarios, los promediamos por mes.
por_mes = {}
for fecha, valor in filas:
    por_mes.setdefault(fecha.strftime("%Y-%m"), []).append(valor)
meses = sorted(por_mes)
valores = [round(mean(por_mes[m]), 3) for m in meses]

# ---------- 3. Quitar las estaciones (anomalías) ----------
# A cada mes le restamos el promedio de ese mismo mes en todos los años.
promedio_mes = {}
for m, v in zip(meses, valores):
    promedio_mes.setdefault(m[5:], []).append(v)
promedio_mes = {k: mean(v) for k, v in promedio_mes.items()}
anomalias = [round(v - promedio_mes[m[5:]], 3) for m, v in zip(meses, valores)]

# ---------- 4. Un valor por año ----------
# Lluvia: suma del año. Nieve: promedio del año. Solo años completos (12 meses).
por_anio = {}
for m, v in zip(meses, valores):
    por_anio.setdefault(int(m[:4]), []).append(v)
anios = [a for a in sorted(por_anio) if len(por_anio[a]) == 12]
anual = [sum(por_anio[a]) if ES_LLUVIA else mean(por_anio[a]) for a in anios]
n = len(anual)
if n < 10:
    print(f"OJO: solo hay {n} años completos. Con menos de 10 el resultado es poco confiable.")

# ---------- 5. Mann-Kendall: comparar cada año con todos los siguientes ----------
subio = bajo = empate = 0
for i in range(n):
    for j in range(i + 1, n):
        if anual[j] > anual[i]:
            subio += 1
        elif anual[j] < anual[i]:
            bajo += 1
        else:
            empate += 1
S = subio - bajo
# varianza de S (con corrección por empates)
grupos = {}
for x in anual:
    grupos[x] = grupos.get(x, 0) + 1
var_s = (n * (n - 1) * (2 * n + 5) - sum(t * (t - 1) * (2 * t + 5) for t in grupos.values())) / 18
if S > 0:
    z = (S - 1) / math.sqrt(var_s)
elif S < 0:
    z = (S + 1) / math.sqrt(var_s)
else:
    z = 0.0
p = math.erfc(abs(z) / math.sqrt(2))   # valor p de dos colas

# ---------- 6. Pendiente de Sen: cuánto cambia por año ----------
pendientes = sorted((anual[j] - anual[i]) / (anios[j] - anios[i]) for i in range(n) for j in range(i + 1, n))
k = len(pendientes)
sen = pendientes[k // 2] if k % 2 else (pendientes[k // 2 - 1] + pendientes[k // 2]) / 2

resultado = {
    "fuente": "GPM IMERG mensual (NASA)" if ES_LLUVIA else "MODIS MOD10A1 (NASA)",
    "unidad": "mm por mes" if ES_LLUVIA else "índice de nieve (0 a 100)",
    "unidad_tendencia": "mm de lluvia al año" if ES_LLUVIA else "puntos del índice de nieve",
    "desde": meses[0],
    "hasta": meses[-1],
    "meses": meses,
    "valores": valores,
    "anomalias": anomalias,
    "anios": anios,
    "anual": [round(x, 3) for x in anual],
    "tendencia_por_decada": round(sen * 10, 2),
    "subio": subio,
    "bajo": bajo,
    "empate": empate,
    "p": round(p, 4),
    "veredicto": "real" if p < 0.05 else "todavia_no_se_sabe",
}

# ---------- 7. Guardar en el JSON de la región ----------
datos = {}
if os.path.exists(ruta_json):
    with open(ruta_json, encoding="utf-8") as f:
        datos = json.load(f)
datos.pop("ejemplo", None)
datos.pop("aviso", None)
datos.setdefault("variables", {})[variable] = resultado
os.makedirs(os.path.dirname(ruta_json) or ".", exist_ok=True)
with open(ruta_json, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)

# ---------- 8. Resumen en pantalla ----------
print(f"{variable.upper()} · {meses[0]} a {meses[-1]} · {len(meses)} meses · {n} años completos")
print(f"Comparaciones: bajó {bajo} · subió {subio} · empate {empate}")
print(f"Tendencia: {resultado['tendencia_por_decada']:+} {resultado['unidad_tendencia']} por década")
print(f"Valor p: {'< 0.001' if p < 0.001 else resultado['p']}  ->  {'REAL (p < 0.05)' if p < 0.05 else 'TODAVÍA NO SE SABE'}")
print(f"Guardado en {ruta_json}")
