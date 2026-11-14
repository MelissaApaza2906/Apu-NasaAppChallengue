// Caso resuelto (docs/mockups/casos/casoV-2-resuelto.jpg) e informe (casoV-3-informe.jpg).
//   Resuelto: rayos y órbitas → insignia dorada → "CASO RESUELTO" → sello CERRADO que cae → 6 pistas ✓ en cascada
//             → 4 chips que cuentan hasta su número → "+250 XP" → barra del veredicto. El globo 3D vuela a la cordillera.
//   Informe:  tarjeta con borde degradado e inclinación 3D que sigue al mouse; foto = captura de la montaña 3D
//             (o la foto de respaldo); Descargar PNG (html2canvas), Compartir (Web Share API), Volver al archivo.
import { ir } from '../../router.js';
import { CASOS, PISTAS, MESES_NOMBRES } from '../../contenido/casos.js';
import { GLACIARES } from '../../contenido/glaciares.js';
import { leerProgreso } from '../../servicios/progreso.js';
import { cargarDatosCaso } from '../../servicios/casos-datos.js';
import { estadosCasos } from '../casos/index.js';
import { esc, fmt, fmtP, logo, crearJukumari, sinMovimiento } from './comun.js';
import { serieElegida } from './pasos.js';

const INSIGNIA_IMG = '/img/insignias/montanas-oro.png';
const fechaCorta = (iso) => (iso ? iso.split('-').reverse().join(' · ') : '');
const coord = (lat, lon) => `${Math.abs(lat).toFixed(1).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(1).replace('.', ',')}° ${lon < 0 ? 'O' : 'E'}`;
const ventanaTexto = (v) => v.map((m) => MESES_NOMBRES[m - 1]).join('–');

function frase(ctx) {
  const v = ctx.est.veredicto ?? {};
  return { rumbo: v.rumbo ?? '—', palabras: v.palabras ?? '—', consecuencia: ctx.caso.consecuencia ?? `un cambio en el hielo de ${ctx.caso.de ?? ctx.caso.nombre}` };
}

export function pintarResuelto(ctx) {
  const { caso, datos, est, raiz } = ctx;
  const st = serieElegida(ctx).stats;
  const f = frase(ctx);
  const g = GLACIARES.find((x) => x.id === caso.glaciar);
  const chips = [
    { v: datos.anios, d: 0, t: 'AÑOS ANALIZADOS', c: 'azul' },
    { v: st.pendientePorDecada, d: 2, t: 'PUNTOS / 10 AÑOS', c: 'rojo' },
    { v: st.p, d: 3, t: 'VALOR p', c: st.p < 0.05 ? 'verde' : 'amarillo', p: true },
    datos.meses ? { v: datos.meses.bajaron, d: 0, t: `DE ${datos.meses.total} MESES BAJARON`, c: 'amarillo' } : { v: datos.nOk, d: 0, t: `DE ${datos.nPruebas} PRUEBAS`, c: 'amarillo' }
  ];
  const COLOR = { azul: '#6FB0FF', rojo: '#FF6B6B', verde: '#47E08A', amarillo: 'var(--dato-tendencia)' };
  raiz.classList.add('pantalla-resuelto');
  raiz.innerHTML = `
    <header class="caso-cabeza"></header>
    <div class="particulas" aria-hidden="true"></div>
    <main class="resuelto-escena">
      <span class="resuelto-rayos" aria-hidden="true"></span><span class="resuelto-orbita" aria-hidden="true"></span><span class="resuelto-orbita dos" aria-hidden="true"></span>
      <p class="caso-ceja resuelto-ceja">EXPEDIENTE N.º ${caso.exp} · ${esc(caso.nombre.toUpperCase())}</p>
      <div class="resuelto-insignia"><img src="${INSIGNIA_IMG}" alt="Insignia ${esc(caso.insignia)}"></div>
      <h1 class="resuelto-titulo" tabindex="-1">CASO RESUELTO</h1>
      <p class="resuelto-insignia-nombre">Insignia: <b>${esc(caso.insignia)}</b></p>
      <div class="sello-cerrado" aria-hidden="true">CERRADO<small>${esc(fechaCorta(est.fecha ?? new Date().toISOString().slice(0, 10)))}</small></div>
      <div class="resuelto-pistas" role="list" aria-label="Las 6 pistas resueltas">${PISTAS.slice(1).map((p, i) => `<span role="listitem" style="animation-delay:${(2.6 + i * 0.15).toFixed(2)}s"><i aria-hidden="true">${p.icono}</i>${p.corto}</span>`).join('')}</div>
      <div class="resuelto-chips">
        <span class="resuelto-xp" aria-label="Ganaste 250 de experiencia">+250 XP</span>
        ${chips.map((c, i) => `<div><b data-chip="${i}" style="color:${COLOR[c.c]}">0</b><small>${c.t}</small></div>`).join('')}
      </div>
      <div class="resuelto-barra">
        <span class="ic" aria-hidden="true">⚖</span>
        <p><b>Veredicto: <em>la nieve ${esc(f.rumbo)}</em></b><br>${esc(f.palabras[0].toUpperCase() + f.palabras.slice(1))} ${esc(f.consecuencia)} · firmado: <i>${esc(ctx.apodo)}</i></p>
        <button type="button" class="btn-apu secundario" data-informe>VER INFORME</button>
        <button type="button" class="btn-apu" data-siguiente>SIGUIENTE CASO ›</button>
      </div>
    </main>`;
  raiz.querySelector('.caso-cabeza').append(logo('casos', 'Volver al archivo de casos'));
  // Partículas de colores
  const colores = ['#D52B1E', '#F8AE05', '#3B6C24', '#4F8DFF', '#A06BFF', '#F2F4F8'];
  raiz.querySelector('.particulas').replaceChildren(...Array.from({ length: sinMovimiento() ? 0 : 36 }, (_, i) => {
    const s = document.createElement('i'), dur = 5 + Math.random() * 6;
    s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(40 + Math.random() * 60).toFixed(1)}%;background:${colores[i % colores.length]};animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s`;
    return s;
  }));
  // Los 4 chips cuentan hasta su número (cuando aparecen)
  const contar = () => chips.forEach((c, i) => {
    const el = raiz.querySelector(`[data-chip="${i}"]`);
    if (!el || !Number.isFinite(c.v)) { if (el) el.textContent = '—'; return; }
    const t0 = performance.now(), dur = sinMovimiento() ? 0 : 1100;
    const final = () => { el.textContent = c.p ? fmtP(c.v) : fmt(c.v, c.d); };
    const paso = () => {
      const k = dur ? Math.min(1, Math.max(0, (performance.now() - t0) / dur)) : 1, x = c.v * (1 - (1 - k) ** 3);
      if (k >= 1) { final(); return; }
      el.textContent = fmt(x, c.p ? 3 : c.d);
      if (ctx.vivo()) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    setTimeout(final, dur + 150); // aunque la pantalla vaya lenta, el número final siempre queda
  });
  const reloj = setTimeout(contar, sinMovimiento() ? 0 : 3700);
  ctx.alSalir(() => clearTimeout(reloj));
  const juku = crearJukumari(raiz, { ayuda: 'con' });
  juku.decir('¡Caso cerrado, detective! 🎉', '');
  raiz.querySelector('[data-informe]').addEventListener('click', () => ir(`caso/${caso.id}/informe`));
  raiz.querySelector('[data-siguiente]').addEventListener('click', async () => {
    const p = await leerProgreso().catch(() => ctx.perfil);
    const conDatos = await Promise.all(CASOS.map((c) => cargarDatosCaso(c).then(Boolean)));
    const est2 = estadosCasos(p, conDatos);
    const i = CASOS.findIndex((c, k) => est2[k] === 'abierto' && c.id !== caso.id);
    ir(i >= 0 ? `caso/${CASOS[i].id}` : 'casos');
  });
  // El globo 3D reemplaza al planeta: vuela a la cordillera y su marcador se enciende verde con un pulso
  if (ctx.escena) {
    ctx.escena.planeta('centro');
    if (g) { ctx.escena.volarA(g.lat, g.lon); ctx.escena.marcadores([{ id: caso.id, lat: g.lat, lon: g.lon, estado: 'resuelto', foco: true }]); }
  }
  raiz.querySelector('h1')?.focus({ preventScroll: true });
}

export function pintarInforme(ctx) {
  const { caso, datos, est, raiz } = ctx;
  const s = serieElegida(ctx), st = s.stats;
  const f = frase(ctx);
  const g = GLACIARES.find((x) => x.id === caso.glaciar);
  let foto = null;
  try { foto = sessionStorage.getItem(`apu-informe-foto-${caso.id}`); } catch { /* modo privado */ }
  foto = foto ?? ctx.escena?.foto(caso) ?? g?.foto?.src ?? null;
  const fecha = est.fecha ?? new Date().toISOString().slice(0, 10);
  const codigo = `APU-${caso.id.split('-').map((x) => x[0]).join('').toUpperCase()}-${datos.desde}-${datos.hasta}`;
  const escenaNombre = { grande: `Recuadro grande de ${caso.de ?? caso.nombre}`, medio: 'Recuadro medio', glaciares: 'Solo glaciares (GLIMS)' }[est.elecciones?.escena ?? 'grande'] ?? 'Recuadro grande';
  // Mini gráfico: la serie y la línea de la pendiente de Sen
  const pares = s.anios.map((a, i) => [a, s.valores[i]]).filter(([, v]) => Number.isFinite(v));
  const a0 = s.anios[0], a1 = s.anios[s.anios.length - 1];
  const ys = pares.map((x) => x[1]), min = Math.min(...ys), max = Math.max(...ys), rg = max - min || 1;
  const X = (a) => 20 + (a - a0) / (a1 - a0 || 1) * 360, Y = (v) => 100 - (v - min) / rg * 80;
  const linea = pares.map(([a, v], i) => `${i ? 'L' : 'M'}${X(a).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const rumbo = (a) => st.intercepto + st.pendientePorAnio * a;
  raiz.innerHTML = `
    <header class="caso-cabeza"></header>
    <main class="caso-cuerpo" style="width:auto;right:26cqw;overflow:visible">
      <p class="caso-ceja">ARCHIVO APU · DOCUMENTO DEL DETECTIVE</p>
    </main>
    <div class="informe-zona">
      <article class="informe" aria-label="Informe del caso ${caso.exp}">
        <div class="informe-franja"><span>⚠ INFORME CONFIDENCIAL</span><span>EXP. N.º ${caso.exp}</span></div>
        <div class="informe-cuerpo">
          <div class="informe-detective">
            <div class="informe-foto">${foto ? `<img src="${esc(foto)}" alt="La montaña de ${esc(caso.nombre)}" crossorigin="anonymous">` : ''}<span>● ESCENA · ${g ? coord(g.lat, g.lon) : '—'}</span></div>
            <p class="caso-ceja" style="margin-top:1.4cqh">DETECTIVE</p>
            <p class="nombre">${esc(ctx.apodo)}</p>
            <div class="huella"><svg viewBox="0 0 40 52" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<ellipse cx="20" cy="26" rx="${4 + i * 2.6}" ry="${6 + i * 3}" fill="none" stroke="#4F8DFF" stroke-width="1.4" stroke-dasharray="${i % 2 ? '6 3' : '12 2'}"/>`).join('')}</svg><span>Huella verificada<br>${esc(fecha.split('-').reverse().join('/'))}</span></div>
            <div class="barras-codigo" aria-hidden="true"></div>
            <p class="codigo">${esc(codigo)}</p>
          </div>
          <div>
            <p class="caso-ceja">CASO ${caso.exp}</p>
            <h2>${esc(caso.informe ?? `La nieve de ${caso.nombre}`)}</h2>
            <p class="sub">${esc(caso.pregunta.replace(`de ${caso.de ?? caso.nombre} `, ''))} · Sospecha: <b>${esc(ctx.sospecha ?? '—')}</b></p>
            <div class="informe-tarjetas">
              <div><small>🛰 EVIDENCIA</small>${esc(datos.fuente)}<br>${esc(datos.unidad)}</div>
              <div><small>📍 ESCENA</small>${esc(escenaNombre)}</div>
              <div><small>📅 TIEMPO</small>${esc(ventanaTexto(datos.ventana))}<br>${datos.anios} años</div>
              <div class="resultado"><small>👣 RESULTADO</small>${fmt(st.pendientePorDecada, 2)} puntos / 10 años<br>p = ${fmtP(st.p)}</div>
            </div>
            <div class="informe-graf">
              <svg viewBox="0 0 400 118" role="img" aria-label="La serie de ${a0} a ${a1} con su rumbo">
                <defs><linearGradient id="infGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4F8DFF" stop-opacity=".5"/><stop offset="1" stop-color="#4F8DFF" stop-opacity="0"/></linearGradient></defs>
                <path d="${linea} L${X(pares[pares.length - 1][0]).toFixed(1)} 104 L${X(pares[0][0]).toFixed(1)} 104 Z" fill="url(#infGrad)"/>
                <path d="${linea}" fill="none" stroke="#5BA0FF" stroke-width="2.4" stroke-linejoin="round"/>
                <line x1="${X(a0)}" y1="${Y(rumbo(a0)).toFixed(1)}" x2="${X(a1)}" y2="${Y(rumbo(a1)).toFixed(1)}" stroke="#F8AE05" stroke-width="2.4" stroke-dasharray="7 5"/>
                <text x="20" y="116" fill="#C9D2E3" font-size="10" font-family="Inter, sans-serif">${a0}</text>
                <text x="380" y="116" fill="#C9D2E3" font-size="10" text-anchor="end" font-family="Inter, sans-serif">${a1}</text>
                <text x="380" y="12" fill="#A9B4CC" font-size="9" text-anchor="end" font-family="Inter, sans-serif">datos reales · ${esc(datos.fuente)}</text>
              </svg>
            </div>
          </div>
          <div class="informe-vered">
            <div><small>⚖ VEREDICTO</small>La nieve <b>${esc(f.rumbo)}</b>. Esto <b>${esc(f.palabras)}</b> ${esc(f.consecuencia)}${f.palabras === 'va de acuerdo con' ? ', pero no la demuestra' : ''}.</div>
            <span class="sello-resuelto" aria-hidden="true">CASO<br>RESUELTO</span>
          </div>
          <p class="informe-limites">Límites: ${ctx.limites.map((x) => esc(x.toLowerCase())).join(' · ')}.</p>
        </div>
      </article>
    </div>
    <aside class="informe-acciones">
      <button type="button" class="btn-apu" data-png>⬇ DESCARGAR PNG</button>
      <button type="button" class="btn-apu secundario" data-compartir>↗ COMPARTIR</button>
      <button type="button" class="btn-apu secundario" data-archivo>VOLVER AL ARCHIVO</button>
      <p class="informe-estado" aria-live="polite"></p>
      <div class="informe-insignia"><img src="${INSIGNIA_IMG}" alt="">INSIGNIA GANADA<b>${esc(caso.insignia)}</b></div>
    </aside>`;
  raiz.querySelector('.caso-cabeza').append(logo('casos', 'Volver al archivo de casos'));
  const tarjeta = raiz.querySelector('.informe'), zona = raiz.querySelector('.informe-zona'), estado = raiz.querySelector('.informe-estado');
  // Inclinación 3D que sigue al mouse
  if (!sinMovimiento()) {
    const mover = (e) => {
      const r = zona.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      tarjeta.style.transform = `rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg)`;
    };
    raiz.addEventListener('pointermove', mover);
    raiz.addEventListener('pointerleave', () => { tarjeta.style.transform = ''; });
  }
  const nombreArchivo = `apu-informe-caso-${caso.exp}.png`;
  async function aPng() {
    const { default: html2canvas } = await import('html2canvas');
    const antes = tarjeta.style.transform;
    tarjeta.style.transform = 'none';
    try {
      const lienzo = await html2canvas(tarjeta, { backgroundColor: '#0B192E', scale: Math.min(2, window.devicePixelRatio || 1), useCORS: true, logging: false });
      return await new Promise((r) => lienzo.toBlob(r, 'image/png'));
    } finally { tarjeta.style.transform = antes; }
  }
  raiz.querySelector('[data-png]').addEventListener('click', async () => {
    estado.textContent = 'Preparando la imagen…';
    try {
      const blob = await aPng();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = nombreArchivo;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      estado.textContent = 'Listo: se descargó el informe.';
    } catch (e) { console.error(e); estado.textContent = 'No se pudo crear la imagen.'; }
  });
  raiz.querySelector('[data-compartir]').addEventListener('click', async () => {
    const texto = `Resolví el caso ${caso.exp} de APU: la nieve de ${caso.de ?? caso.nombre} ${f.rumbo} (${fmt(st.pendientePorDecada, 2)} puntos cada 10 años, p = ${fmtP(st.p)}), con datos de NASA.`;
    try {
      if (navigator.share) {
        const blob = await aPng().catch(() => null);
        const archivo = blob ? new File([blob], nombreArchivo, { type: 'image/png' }) : null;
        if (archivo && navigator.canShare?.({ files: [archivo] })) await navigator.share({ title: 'Informe APU', text: texto, files: [archivo] });
        else await navigator.share({ title: 'Informe APU', text: texto, url: location.origin });
        estado.textContent = '¡Compartido!';
      } else {
        await navigator.clipboard.writeText(`${texto} ${location.origin}`);
        estado.textContent = 'Este navegador no comparte: copiamos el texto.';
      }
    } catch (e) { if (e?.name !== 'AbortError') estado.textContent = 'No se pudo compartir.'; }
  });
  raiz.querySelector('[data-archivo]').addEventListener('click', () => ir('casos'));
  if (ctx.escena && g) { ctx.escena.planeta('derecha'); ctx.escena.volarA(g.lat, g.lon); ctx.escena.marcadores([{ id: caso.id, lat: g.lat, lon: g.lon, estado: 'resuelto', foco: false }]); }
}
