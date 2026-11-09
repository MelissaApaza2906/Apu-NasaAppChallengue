// Pantalla: carga · Responsable: Diana
// Flujo: EMPEZAR MISIÓN → barra CARGANDO de 0 a 100 % → acceso.
// Diseño de referencia: maqueta "APU · Diseño visual del juego" (Pantalla 1)
import './carga.css';
import { ir } from '../../router.js';
import { SABIAS_QUE } from '../../contenido/sabias-que.js';

let temporizadores = [];

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-carga';
  raiz.innerHTML = `
    <div class="carga-juku" aria-hidden="true">
      <img class="cuerpo" src="/img/jukumari-cuerpo.webp" alt="">
      <div class="saludo"></div>
    </div>
    <div class="carga-columna">
      <img class="logo" src="/img/logo-apu.png" alt="APU">
      <h1 class="titulo"><span class="barras">//</span> CARGANDO <span class="barras">//</span></h1>
      <p class="sub">PREPARANDO LA EXPERIENCIA..</p>
      <button class="btn-apu empezar"><span class="icono" aria-hidden="true">🛰</span>EMPEZAR MISIÓN</button>
      <div class="barra" hidden><div class="relleno" role="progressbar" aria-label="Cargando APU" aria-valuemin="0" aria-valuemax="100"></div><span class="porcentaje">0%</span></div>
      <section class="sabias" aria-live="polite"><span>¿SABÍAS QUE…?</span><p></p></section>
    </div>`;
  contenedor.append(raiz);

  const dato = raiz.querySelector('.sabias p');
  let i = 0;
  dato.textContent = SABIAS_QUE[0];
  temporizadores.push(setInterval(() => { i = (i + 1) % SABIAS_QUE.length; dato.textContent = SABIAS_QUE[i]; }, 4200));

  raiz.querySelector('.empezar').addEventListener('click', (e) => {
    e.currentTarget.hidden = true;
    const barra = raiz.querySelector('.barra'), relleno = raiz.querySelector('.relleno'), pct = raiz.querySelector('.porcentaje');
    barra.hidden = false;
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 1);
      relleno.style.width = p + '%'; relleno.setAttribute('aria-valuenow', p); pct.textContent = p + '%';
      if (p >= 100) { clearInterval(t); setTimeout(() => ir('acceso'), 400); }
    }, 40);
    temporizadores.push(t);
  });
}

export function desmontar() {
  temporizadores.forEach((t) => { clearInterval(t); clearTimeout(t); });
  temporizadores = [];
}
