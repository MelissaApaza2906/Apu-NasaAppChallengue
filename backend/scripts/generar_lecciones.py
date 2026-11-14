# generar_lecciones.py
# Convierte el CSV diario de Earth Engine (nieve_diaria.js) en los JSON de las lecciones 4 a 9.
# Solo usa Python, sin instalar nada.
#
# Uso:
#   python generar_lecciones.py nieve_agosep_cordillera_real.csv ../../frontend/public/datos/lecciones [oni.ascii.txt] [nieve_mensual_cordillera_real.csv]
#   (el CSV diario puede traer solo agosto-septiembre; el mensual sale de la segunda exportación de Earth Engine)
#
# oni.ascii.txt (opcional, NOAA, no NASA): https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt
#
# Salida (en la carpeta indicada):
#   series.json        27 combinaciones (3 recuadros x 3 umbrales x 3 coberturas): serie ago-sep + estadística
#   mensual.json       % de nieve por mes (lección 5)
#   dias_ejemplo.json  61 días de ago-sep de un año: nieve / sin nieve / nube (lección 6.1)
#   pruebas.json       5 pruebas con semáforo + veredicto sugerido (lección 8)

import csv, json, math, os, sys
from statistics import mean, median

REGIONES = ["grande", "medio", "glaciares"]
UMBRALES = [30, 40, 50]
COBERTURAS = [30, 50, 70]
# Ventana: por defecto agosto y septiembre. Otras regiones: APU_MESES=2,3 python generar_lecciones.py ...
MESES_VENTANA = tuple(int(m) for m in os.environ.get("APU_MESES", "8,9").split(","))
NOMBRE_MES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
BASE = ("glaciares", 40, 50)               # combinación por defecto del recorrido
Z95 = 1.959963984540054


# ---------- Estadística ----------
def _rangos(x):
    orden = sorted(range(len(x)), key=lambda i: x[i])
    r = [0.0] * len(x)
    i = 0
    while i < len(x):
        j = i
        while j + 1 < len(x) and x[orden[j + 1]] == x[orden[i]]:
            j += 1
        for k in range(i, j + 1):
            r[orden[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def _var_s(x):
    n = len(x)
    grupos = {}
    for v in x:
        grupos[v] = grupos.get(v, 0) + 1
    return (n * (n - 1) * (2 * n + 5) - sum(t * (t - 1) * (2 * t + 5) for t in grupos.values())) / 18


def _p(s, var):
    if var <= 0 or s == 0:
        return 1.0
    z = (s - 1) / math.sqrt(var) if s > 0 else (s + 1) / math.sqrt(var)
    return math.erfc(abs(z) / math.sqrt(2))


def tendencia(t, x):
    """Mann-Kendall + pendiente de Sen + p corregido por autocorrelación (Hamed y Rao, 1998)."""
    n = len(x)
    if n < 4:
        return None
    s = sum((x[j] > x[i]) - (x[j] < x[i]) for i in range(n) for j in range(i + 1, n))
    var = _var_s(x)
    pend = sorted((x[j] - x[i]) / (t[j] - t[i]) for i in range(n) for j in range(i + 1, n))
    k = len(pend)
    sen = pend[k // 2] if k % 2 else (pend[k // 2 - 1] + pend[k // 2]) / 2
    intercepto = median([x[i] - sen * t[i] for i in range(n)])
    # intervalo de confianza 95 % de la pendiente (Sen, 1968)
    c = Z95 * math.sqrt(var)
    m1 = int(round((k - c) / 2))
    m2 = int(round((k + c) / 2))
    bajo = pend[max(m1 - 1, 0)]
    alto = pend[min(m2, k - 1)]
    # Hamed-Rao: autocorrelación de los rangos de la serie sin tendencia
    r = _rangos([x[i] - sen * t[i] for i in range(n)])
    m = mean(r)
    den = sum((v - m) ** 2 for v in r)
    suma = 0.0
    if den > 0:
        for lag in range(1, n - 1):
            acf = sum((r[i] - m) * (r[i + lag] - m) for i in range(n - lag)) / den
            if abs(acf) > Z95 / math.sqrt(n):
                suma += (n - lag) * (n - lag - 1) * (n - lag - 2) * acf
    factor = 1 + 2 / (n * (n - 1) * (n - 2)) * suma
    return {
        "n_anios": n,
        "pendiente_por_anio": round(sen, 4),
        "pendiente_por_decada": round(sen * 10, 3),
        "intercepto": round(intercepto, 4),
        "pendiente_95": [round(bajo, 4), round(alto, 4)],
        "subio": sum(1 for i in range(n) for j in range(i + 1, n) if x[j] > x[i]),
        "bajo": sum(1 for i in range(n) for j in range(i + 1, n) if x[j] < x[i]),
        "p": round(_p(s, var), 4),
        "p_hamed_rao": round(_p(s, var * factor), 4) if factor > 0 else round(_p(s, var), 4),
        "veredicto": "real" if _p(s, var) < 0.05 else "todavia_no_se_sabe",
    }


# ---------- Leer el CSV diario ----------
def leer(ruta):
    dias = []
    with open(ruta, encoding="utf-8") as f:
        for fila in csv.DictReader(f):
            if not fila.get("fecha"):
                continue
            d = {"fecha": fila["fecha"][:10]}
            for r in REGIONES:
                d[r] = {}
                for b in ("total", "validos", "nubes", "noche", "nieve30", "nieve40", "nieve50"):
                    v = fila.get(f"{r}_{b}", "")
                    d[r][b] = float(v) if v not in ("", None) else 0.0
            dias.append(d)
    if not dias:
        sys.exit("El CSV está vacío o no tiene la columna fecha.")
    return dias


def pct_dia(d, region, umbral, cobertura):
    """% de nieve del día (sobre píxeles visibles) o None si el día no es útil."""
    c = d[region]
    if c["total"] <= 0 or c["validos"] / c["total"] * 100 < cobertura or c["validos"] <= 0:
        return None
    return c[f"nieve{umbral}"] / c["validos"] * 100


def serie_anual(dias, region, umbral, cobertura):
    por_anio = {}
    for d in dias:
        a, m = int(d["fecha"][:4]), int(d["fecha"][5:7])
        if m not in MESES_VENTANA:
            continue
        por_anio.setdefault(a, [])
        v = pct_dia(d, region, umbral, cobertura)
        if v is not None:
            por_anio[a].append(v)
    anios = sorted(por_anio)
    return [{"anio": a, "dias_utiles": len(por_anio[a]),
             "nieve": round(mean(por_anio[a]), 3) if por_anio[a] else None} for a in anios]


def stats_de(filas):
    ok = [f for f in filas if f["nieve"] is not None]
    return tendencia([f["anio"] for f in ok], [f["nieve"] for f in ok])


def sin_extremos(filas, cuantos=3):
    ok = [f for f in filas if f["nieve"] is not None]
    prom = mean(f["nieve"] for f in ok)
    quitar = {f["anio"] for f in sorted(ok, key=lambda f: -abs(f["nieve"] - prom))[:cuantos]}
    resto = [f for f in ok if f["anio"] not in quitar]
    e = tendencia([f["anio"] for f in resto], [f["nieve"] for f in resto])
    return {"quitados": sorted(quitar), **{k: e[k] for k in ("pendiente_por_decada", "p", "veredicto")}}


def semaforo(base, prueba):
    if prueba is None:
        return "rojo"
    misma = (base["pendiente_por_anio"] > 0) == (prueba["pendiente_por_anio"] > 0)
    p = prueba["p"]
    cambio = abs(prueba["pendiente_por_anio"] - base["pendiente_por_anio"]) / abs(base["pendiente_por_anio"] or 1e-9)
    if not misma or p >= 0.10:
        return "rojo"
    if p < 0.05 and cambio <= 0.30:
        return "verde"
    return "amarillo"


def leer_oni(ruta):
    """Año Y con El Niño fuerte: ONI >= 1.5 en alguna estación de DJF a JAS de ese año,
    es decir, antes o durante la ventana de agosto y septiembre (no después)."""
    validas = {"DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS"}
    fuertes = set()
    with open(ruta, encoding="utf-8") as f:
        for linea in f:
            partes = linea.split()
            if len(partes) == 4 and partes[1].isdigit() and partes[0] in validas:
                if float(partes[3]) >= 1.5:
                    fuertes.add(int(partes[1]))
    return fuertes


def main():
    ruta_csv, carpeta = sys.argv[1], sys.argv[2]
    ruta_oni = sys.argv[3] if len(sys.argv) > 3 else None
    ruta_mensual = sys.argv[4] if len(sys.argv) > 4 else None
    os.makedirs(carpeta, exist_ok=True)
    dias = leer(ruta_csv)
    fuente = "MODIS MOD10A1 v061 (NASA), NDSI_Snow_Cover diario, 500 m"

    # series.json
    series = {}
    for r in REGIONES:
        for u in UMBRALES:
            for c in COBERTURAS:
                filas = serie_anual(dias, r, u, c)
                st = stats_de(filas)
                series[f"{r}_{u}_{c}"] = {"region": r, "umbral": u, "cobertura": c, "anual": filas,
                                         "estadistica": st,
                                         "sin_extremos": sin_extremos(filas) if st else None}
    guardar(carpeta, "series.json", {
        "fuente": fuente, "ventana": " y ".join(NOMBRE_MES[m] for m in MESES_VENTANA), "unidad": "% de píxeles visibles con nieve",
        "base": "_".join(map(str, BASE)), "combinaciones": series})

    # mensual.json (recuadro base, umbral y cobertura base)
    r, u, c = BASE
    por_mes = {}
    for d in dias:
        v = pct_dia(d, r, u, c)
        if v is not None:
            por_mes.setdefault(d["fecha"][:7], []).append(v)
    serie_mes = {k: round(mean(v), 3) for k, v in sorted(por_mes.items())}
    if ruta_mensual:  # % de píxeles-día visibles con nieve en cada mes (exportación mensual)
        serie_mes = {}
        with open(ruta_mensual, encoding="utf-8") as f:
            for fila in csv.DictReader(f):
                val = float(fila.get("validos") or 0)
                if fila.get("mes") and val > 0:
                    serie_mes[fila["mes"][:7]] = round(float(fila["nieve40"]) / val * 100, 3)
    clima = {}
    for k, v in serie_mes.items():
        clima.setdefault(int(k[5:]), []).append(v)
    guardar(carpeta, "mensual.json", {
        "fuente": fuente, "region": r, "umbral": u, "cobertura": c,
        "promedio_por_mes": [{"mes": m, "nieve": round(mean(clima[m]), 3) if m in clima else None,
                              "anios_con_dato": len(clima.get(m, []))} for m in range(1, 13)],
        "serie": serie_mes})

    # dias_ejemplo.json: el año más reciente con al menos 10 días útiles en la base
    base_filas = series["_".join(map(str, BASE))]["anual"]
    anio = max((f["anio"] for f in base_filas if f["dias_utiles"] >= 10), default=base_filas[-1]["anio"])
    ejemplo = []
    for d in dias:
        if int(d["fecha"][:4]) == anio and int(d["fecha"][5:7]) in MESES_VENTANA:
            k = d[r]
            t = k["total"] or 1
            ejemplo.append({"fecha": d["fecha"],
                            "nieve": round(k[f"nieve{u}"] / t * 100, 1),
                            "sin_nieve": round((k["validos"] - k[f"nieve{u}"]) / t * 100, 1),
                            "nube": round((t - k["validos"]) / t * 100, 1),
                            "visible": round(k["validos"] / t * 100, 1)})
    guardar(carpeta, "dias_ejemplo.json", {"fuente": fuente, "region": r, "umbral": u, "anio": anio, "dias": ejemplo})

    # pruebas.json (lección 8)
    st_base = series["_".join(map(str, BASE))]["estadistica"]
    pruebas = []
    def agregar(id_, nombre, st):
        pruebas.append({"id": id_, "nombre": nombre, "semaforo": semaforo(st_base, st),
                        "pendiente_por_decada": st["pendiente_por_decada"] if st else None,
                        "p": st["p"] if st else None})
    agregar("umbral30", "Otro umbral (30)", series[f"{r}_30_{c}"]["estadistica"])
    agregar("umbral50", "Otro umbral (50)", series[f"{r}_50_{c}"]["estadistica"])
    agregar("cobertura70", "Más cielo despejado (70 %)", series[f"{r}_{u}_70"]["estadistica"])
    auto = dict(st_base, p=st_base["p_hamed_rao"])
    agregar("autocorrelacion", "Corrección por autocorrelación", auto)
    if ruta_oni:
        fuertes = leer_oni(ruta_oni)
        resto = [f for f in base_filas if f["nieve"] is not None and f["anio"] not in fuertes]
        st = tendencia([f["anio"] for f in resto], [f["nieve"] for f in resto])
        agregar("sin_nino", "Sin años de El Niño fuerte", st)
        pruebas[-1]["anios_quitados"] = sorted(fuertes & {f["anio"] for f in base_filas})
        pruebas[-1]["fuente"] = "ONI, NOAA CPC (no es NASA)"
    n_ok = sum(1 for p in pruebas if p["semaforo"] in ("verde", "amarillo"))
    if st_base["p"] < 0.05 and n_ok >= 4:
        veredicto = "robusto"
    elif st_base["p"] < 0.05 and n_ok >= 2:
        veredicto = "parcial"
    else:
        veredicto = "no_concluyente"
    guardar(carpeta, "pruebas.json", {"base": st_base, "pruebas": pruebas, "n_ok": n_ok,
                                      "n_pruebas": len(pruebas), "veredicto_sugerido": veredicto})

    # resumen
    print(f"Base {BASE}: {st_base['pendiente_por_decada']:+} puntos por década · p = {st_base['p']} "
          f"(Hamed-Rao {st_base['p_hamed_rao']}) · {st_base['n_anios']} años")
    for p in pruebas:
        print(f"  {p['semaforo']:8} {p['nombre']}: {p['pendiente_por_decada']} · p = {p['p']}")
    print(f"{n_ok} de {len(pruebas)} pruebas superadas -> {veredicto}")
    print(f"Ejemplo de días: {anio}. Archivos en {carpeta}")


def guardar(carpeta, nombre, datos):
    with open(os.path.join(carpeta, nombre), "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
