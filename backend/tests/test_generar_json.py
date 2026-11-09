"""Pruebas del cálculo: una serie que baja debe dar 'real'; una serie de ruido, 'todavía no se sabe'."""
import json, math, os, random, subprocess, sys, tempfile, unittest

SCRIPT = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'generar_json.py')


def correr(variable, valores_mes):
    carpeta = tempfile.mkdtemp()
    csv_ruta, json_ruta = os.path.join(carpeta, 'serie.csv'), os.path.join(carpeta, 'salida.json')
    with open(csv_ruta, 'w') as f:
        f.write('fecha,valor\n')
        for i, v in enumerate(valores_mes):
            f.write(f'{2001 + i // 12}-{i % 12 + 1:02d}-01,{v:.4f}\n')
    subprocess.run([sys.executable, SCRIPT, variable, csv_ruta, json_ruta], check=True, capture_output=True)
    with open(json_ruta, encoding='utf-8') as f:
        return json.load(f)['variables'][variable]


class PruebasTendencia(unittest.TestCase):
    def test_serie_que_baja_es_real(self):
        random.seed(1)
        serie = [40 - 0.05 * i + 10 * math.cos(2 * math.pi * i / 12) + random.gauss(0, 2) for i in range(300)]
        r = correr('nieve', serie)
        self.assertEqual(r['veredicto'], 'real')
        self.assertLess(r['tendencia_por_decada'], 0)
        self.assertGreater(r['bajo'], r['subio'])

    def test_ruido_no_se_sabe(self):
        random.seed(7)
        serie = [60 + 40 * math.cos(2 * math.pi * i / 12) + random.gauss(0, 20) for i in range(300)]
        r = correr('lluvia', serie)
        self.assertEqual(r['veredicto'], 'todavia_no_se_sabe')

    def test_comparaciones_suman_bien(self):
        serie = [10 + math.sin(i) for i in range(300)]
        r = correr('nieve', serie)
        n = len(r['anios'])
        self.assertEqual(r['bajo'] + r['subio'] + r['empate'], n * (n - 1) // 2)


if __name__ == '__main__':
    unittest.main()
