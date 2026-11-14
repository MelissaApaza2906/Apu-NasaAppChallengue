# Prueba: python -m pytest tests/test_generar_lecciones.py  (o python tests/test_generar_lecciones.py)
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from generar_lecciones import tendencia, semaforo

def test_baja_clara():
    t = list(range(2001, 2026))
    x = [50 - 0.5 * (a - 2001) + (1 if a % 2 else -1) for a in t]
    r = tendencia(t, x)
    assert r["pendiente_por_anio"] < 0 and r["p"] < 0.05 and r["veredicto"] == "real"
    assert r["pendiente_95"][0] <= r["pendiente_por_anio"] <= r["pendiente_95"][1]

def test_sin_tendencia():
    t = list(range(2001, 2026))
    x = [10, 12, 9, 11, 10, 13, 9, 12, 10, 11, 12, 9, 10, 13, 11, 10, 12, 9, 11, 10, 12, 10, 11, 9, 12]
    assert tendencia(t, x)["veredicto"] == "todavia_no_se_sabe"

def test_semaforo():
    b = {"pendiente_por_anio": -1.0, "p": 0.01}
    assert semaforo(b, {"pendiente_por_anio": -1.1, "p": 0.02}) == "verde"
    assert semaforo(b, {"pendiente_por_anio": -0.5, "p": 0.02}) == "amarillo"
    assert semaforo(b, {"pendiente_por_anio": -1.0, "p": 0.07}) == "amarillo"
    assert semaforo(b, {"pendiente_por_anio": 0.4, "p": 0.01}) == "rojo"
    assert semaforo(b, {"pendiente_por_anio": -1.0, "p": 0.2}) == "rojo"

if __name__ == "__main__":
    test_baja_clara(); test_sin_tendencia(); test_semaforo(); print("ok")
