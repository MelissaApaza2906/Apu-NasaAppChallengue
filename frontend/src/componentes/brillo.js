// Dibuja una sola vez la imagen del brillo de cada glaciar (un halo con centro blanco).
export function imagenBrillo(colorRGB, tam = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const ctx = c.getContext('2d');
  const r = tam / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.3, `rgba(${colorRGB},0.7)`);
  g.addColorStop(0.6, `rgba(${colorRGB},0.22)`);
  g.addColorStop(1, `rgba(${colorRGB},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, tam, tam);
  return c;
}
