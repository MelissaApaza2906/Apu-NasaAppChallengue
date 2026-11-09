// Pantalla: ajustes
// Responsable: Karen
// Qué hace: Ajustes: apodo, sonido apagado, "Borrar mi cuenta".
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (—)
import './ajustes.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-ajustes';
  raiz.innerHTML = `
    <h1 class="titulo-apu">AJUSTES</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
