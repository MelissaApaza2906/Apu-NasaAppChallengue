// Pantalla: leccion
// Responsable: Luis
// Qué hace: Lección: teoría del Jukumari, tarjetas que se giran y trivia.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 4)
import './leccion.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-leccion';
  raiz.innerHTML = `
    <h1 class="titulo-apu">LECCION</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
