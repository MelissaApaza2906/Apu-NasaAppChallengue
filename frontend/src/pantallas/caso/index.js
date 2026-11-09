// Pantalla: caso
// Responsable: Karen
// Qué hace: Expediente del caso: los 5 pasos del Dr. Aker con datos reales.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 5)
import './caso.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-caso';
  raiz.innerHTML = `
    <h1 class="titulo-apu">CASO</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
