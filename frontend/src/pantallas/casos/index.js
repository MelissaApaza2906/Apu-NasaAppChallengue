// Pantalla: casos
// Responsable: Luis
// Qué hace: Lista de casos con candado (se abren al terminar las 5 lecciones).
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (—)
import './casos.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-casos';
  raiz.innerHTML = `
    <h1 class="titulo-apu">CASOS</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
