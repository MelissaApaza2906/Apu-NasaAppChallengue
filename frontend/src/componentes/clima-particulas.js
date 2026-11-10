// Nevada o lluvia encima del globo, según un dato real (efecto visual, no simulación).
//
//   const clima = crearClima(viewer, { tipo: 'nieve', intensidad01: 0.4 });
//   clima.destruir();
//
// Es un <canvas> 2D encima del canvas de Cesium (más liviano que un ParticleSystem), recortado
// al círculo del planeta. intensidad01 (0 a 1) decide cuántas partículas hay y qué tan rápido caen.
// Máximo 1 500 partículas en PC y 300 en celular; en celular, si baja de 30 FPS, se quitan la mitad.
// Con prefers-reduced-motion no se dibuja nada (animado: false).

const MAX_PC = 1500;
const MAX_CELULAR = 300;

export function crearClima(viewer, { tipo = 'nieve', intensidad01 = 0.5 } = {}) {
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto || !viewer?.container) return { animado: false, particulas: 0, destruir() {} };

  const celular = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  const k = Math.min(1, Math.max(0, Number(intensidad01) || 0));
  const lluvia = tipo === 'lluvia';
  let cantidad = Math.max(12, Math.round((celular ? MAX_CELULAR : MAX_PC) * k));

  const lienzo = document.createElement('canvas');
  lienzo.className = 'clima-particulas';
  lienzo.setAttribute('aria-hidden', 'true');
  Object.assign(lienzo.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none',
    // Solo sobre el planeta (mismo diámetro que el globo de globo3d.css)
    clipPath: 'circle(calc(var(--globo-tamano, 96%) / 2) at 50% 50%)'
  });
  viewer.container.append(lienzo);
  const g = lienzo.getContext('2d');

  let w = 0;
  let h = 0;
  let dpr = 1;
  const medir = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = viewer.container.clientWidth;
    h = viewer.container.clientHeight;
    lienzo.width = Math.round(w * dpr);
    lienzo.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  medir();
  const observador = new ResizeObserver(medir);
  observador.observe(viewer.container);

  // Más intensidad = caen más rápido (la nieve flota, la lluvia cae en diagonal)
  const ritmo = 0.6 + 0.8 * k;
  const nueva = (arriba) => ({
    x: Math.random() * w,
    y: arriba ? -20 - Math.random() * h * 0.2 : Math.random() * h,
    v: (lluvia ? 380 + Math.random() * 260 : 22 + Math.random() * 38) * ritmo,
    r: lluvia ? 9 + Math.random() * 9 : 0.9 + Math.random() * 1.8,
    fase: Math.random() * Math.PI * 2
  });
  let gotas = Array.from({ length: cantidad }, () => nueva(false));

  let anim = 0;
  let antes = performance.now();
  let cuadros = 0;
  let inicioFps = antes;
  const paso = (ahora) => {
    const dt = Math.min(0.05, (ahora - antes) / 1000);
    antes = ahora;
    g.clearRect(0, 0, w, h);
    if (lluvia) {
      g.strokeStyle = 'rgba(160, 205, 255, .55)';
      g.lineWidth = 1.1;
      g.beginPath();
    } else {
      g.fillStyle = 'rgba(255, 255, 255, .9)';
    }
    for (const p of gotas) {
      p.y += p.v * dt;
      if (lluvia) {
        p.x -= p.v * 0.18 * dt;
        g.moveTo(p.x, p.y);
        g.lineTo(p.x + p.r * 0.18, p.y - p.r);
      } else {
        p.fase += dt * 1.6;
        p.x += Math.sin(p.fase) * 12 * dt;
        g.moveTo(p.x + p.r, p.y);
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      if (p.y > h + 20 || p.x < -20 || p.x > w + 20) Object.assign(p, nueva(true));
    }
    if (lluvia) g.stroke();
    else g.fill();

    // En celular: si va a menos de 30 FPS, la mitad de partículas (mínimo 40)
    cuadros++;
    if (celular && ahora - inicioFps > 2000) {
      const fps = (cuadros * 1000) / (ahora - inicioFps);
      if (fps < 30 && gotas.length > 40) {
        gotas = gotas.slice(0, Math.max(40, Math.floor(gotas.length / 2)));
        cantidad = gotas.length;
      }
      cuadros = 0;
      inicioFps = ahora;
    }
    anim = requestAnimationFrame(paso);
  };
  anim = requestAnimationFrame(paso);

  return {
    animado: true,
    get particulas() { return cantidad; },
    destruir() {
      cancelAnimationFrame(anim);
      observador.disconnect();
      lienzo.remove();
    }
  };
}
