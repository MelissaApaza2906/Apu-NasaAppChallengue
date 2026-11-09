// Pantalla: menu
// Responsable: Melissa
// Qué hace: Monitoreo glaciar: globo 3D, panel de datos reales, carrusel de picos y guía.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 2)
import './menu.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-menu';
  raiz.innerHTML = `
    <h1 class="titulo-apu">MENU</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
