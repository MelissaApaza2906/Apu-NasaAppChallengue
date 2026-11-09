// Animador de la capa de nieve de NASA.
// Para que la animación sea fluida, cada fecha nueva entra invisible, espera a
// que NASA mande sus imágenes y recién entonces aparece con un fundido suave.
// Así nunca se ve el globo "vacío" entre una fecha y otra.
import { CAPAS, proveedor } from '../servicios/nasa-gibs.js';

export class AnimadorNieve {
  constructor(viewer, { opacidad = 0.9, capaEncima = null } = {}) {
    this.viewer = viewer;
    this.opacidad = opacidad;
    this.capaEncima = capaEncima; // las luces de noche quedan siempre arriba
    this.capas = [];              // capas de nieve vivas (máximo 2)
    this.fechaActual = null;
    this.pedidoActual = 0;
  }

  // Muestra la nieve de una fecha (AAAA-MM-DD). Devuelve una promesa que se
  // cumple cuando la imagen ya se ve, para que la animación avance sin trabarse.
  mostrar(fecha) {
    if (fecha === this.fechaActual) return Promise.resolve();
    this.fechaActual = fecha;
    const pedido = ++this.pedidoActual;
    const capas = this.viewer.imageryLayers;

    const nueva = capas.addImageryProvider(proveedor(CAPAS.nieveDia, fecha));
    nueva.alpha = 0;
    if (this.capaEncima) capas.raiseToTop(this.capaEncima);
    this.capas.push(nueva);

    return this.esperarImagenes().then(() => {
      if (pedido !== this.pedidoActual) return; // llegó otra fecha mientras tanto
      return this.fundir(nueva);
    });
  }

  // Espera a que el globo termine de descargar las imágenes visibles
  // (como máximo 5 segundos, para no quedarse colgado si NASA tarda).
  esperarImagenes() {
    const globo = this.viewer.scene.globe;
    return new Promise((resolver) => {
      let listo = false;
      const terminar = () => {
        if (listo) return;
        listo = true;
        quitar();
        clearTimeout(limite);
        resolver();
      };
      const quitar = globo.tileLoadProgressEvent.addEventListener((enCola) => {
        if (enCola === 0) setTimeout(terminar, 120);
      });
      const limite = setTimeout(terminar, 5000);
      this.viewer.scene.requestRender();
    });
  }

  // Fundido de 450 ms: la nueva aparece y la anterior se borra al final
  fundir(nueva) {
    return new Promise((resolver) => {
      const inicio = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - inicio) / 450);
        nueva.alpha = this.opacidad * k;
        if (k < 1) { requestAnimationFrame(paso); return; }
        // borrar las capas viejas
        const capas = this.viewer.imageryLayers;
        this.capas.filter((c) => c !== nueva).forEach((c) => capas.remove(c, true));
        this.capas = [nueva];
        resolver();
      };
      requestAnimationFrame(paso);
    });
  }

  ocultar() {
    const capas = this.viewer.imageryLayers;
    this.capas.forEach((c) => capas.remove(c, true));
    this.capas = [];
    this.fechaActual = null;
    this.pedidoActual++;
  }
}
