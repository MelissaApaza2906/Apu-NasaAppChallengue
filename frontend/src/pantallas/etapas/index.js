// Pantalla: etapas
// Responsable: Luis
// Qué hace: Ruta de aprendizaje: mundo girando y las 6 etapas en arco.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 3)
import './etapas.css';
import { ir } from '../../router.js';

export function montar(contenedor, params) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-etapas';
  raiz.innerHTML = `
    <h1 class="titulo-apu">ETAPAS</h1>
    <p>Pantalla en construcción.</p>
    <button class="btn-apu secundario" data-ir="menu">VOLVER AL MENÚ</button>
  `;
  raiz.querySelector('[data-ir]').addEventListener('click', () => ir('menu'));
  contenedor.append(raiz);
}

export function desmontar() {
  // Detén aquí animaciones, temporizadores o el globo 3D si los usas.
}
