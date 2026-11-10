// Pantalla: carga · Responsable: Diana
// Copia fiel de la maqueta "APU · Diseño visual del juego" → Pantalla 1 (ApuCarga).
// Flujo: EMPEZAR MISIÓN → aparece la barra CARGANDO (0 → 100 %) → menú.
// La sesión se crea sola (anónima); el registro se pide recién al entrar a etapas, casos o insignias.
import './carga.css';
import { ir } from '../../router.js';
import { SABIAS_QUE } from '../../contenido/sabias-que.js';
import { FRASES } from '../../contenido/frases-jukumari.js';

const FRASES_CARGA = [...FRASES.carga, '¡Tus datos de NASA ya casi están!'];

let intervalos = [];
let esperas = [];

// Copos de nieve: posición, tamaño y velocidad al azar (también los usa el registro, pantallas/acceso)
export function crearCopos(capa, cantidad = 38) {
  for (let i = 0; i < cantidad; i++) {
    const t = 1.5 + Math.random() * 3.5;
    const dur = 9 + Math.random() * 12;
    const c = document.createElement('span');
    c.style.cssText =
      `left:${(Math.random() * 100).toFixed(1)}%;width:${t.toFixed(1)}px;height:${t.toFixed(1)}px;` +
      `opacity:${(0.35 + Math.random() * 0.55).toFixed(2)};animation-duration:${dur.toFixed(1)}s;` +
      `animation-delay:-${(Math.random() * dur).toFixed(1)}s;--dx:${((Math.random() - 0.5) * 16).toFixed(1)}cqw`;
    capa.append(c);
  }
}

export function montar(contenedor) {
  const raiz = document.createElement('section');
  raiz.className = 'pantalla-carga';
  raiz.innerHTML = `
    <div class="carga-fondo" aria-hidden="true"></div>
    <div class="carga-profundidad" aria-hidden="true"></div>
    <div class="carga-cielo" aria-hidden="true">
      <span class="estrella" style="left:48%;top:8%;animation-delay:0s"></span>
      <span class="estrella" style="left:62%;top:14%;animation-delay:.8s"></span>
      <span class="estrella" style="left:80%;top:6%;animation-delay:1.6s"></span>
      <span class="estrella" style="left:92%;top:22%;animation-delay:.4s"></span>
      <span class="estrella" style="left:36%;top:18%;animation-delay:2s"></span>
      <span class="estrella" style="left:72%;top:28%;animation-delay:1.2s"></span>
      <span class="fugaz" style="left:84%;top:9%"></span>
    </div>
    <div class="carga-nieve" aria-hidden="true"></div>
    <div class="carga-velo" aria-hidden="true"></div>

    <div class="carga-juku">
      <div class="aura" aria-hidden="true"></div>
      <div class="sombra" aria-hidden="true"></div>
      <div class="cuerpo-anim">
        <button type="button" class="juku-btn" aria-label="Saludar al Jukumari">
          <img class="capa" src="/img/jukumari-cuerpo.webp" alt="El Jukumari, tu guía, con su máscara de la Diablada, gafas de nieve y equipo de montaña, saludando con la mano">
          <div class="saludo" aria-hidden="true"></div>
        </button>
      </div>
      <div class="dialogo" role="status" hidden></div>
    </div>

    <div class="carga-columna">
      <img class="logo" src="/img/logo-apu.png" alt="APU">
      <h1 class="titulo entra" style="animation-delay:.15s">
        <span class="barras" aria-hidden="true">//</span>
        <span class="palabra">CARGANDO</span>
        <span class="barras" aria-hidden="true" style="animation-delay:.7s">//</span>
      </h1>
      <p class="sub entra" style="animation-delay:.3s"><span class="puntos">PREPARANDO LA EXPERIENCIA</span></p>

      <button type="button" class="btn-mision entra latido">
        <span class="icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F2F4F8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 12H3v-3h6M15 12h6v3h-6"/><path d="M12 15v3"/><path d="M8.5 20.5a5 5 0 0 0 7 0"/></svg>
        </span>
        <span class="texto">EMPEZAR MISIÓN</span>
      </button>

      <div class="barra aparece" hidden>
        <div class="pista" role="progressbar" aria-label="Cargando APU" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="relleno"></div>
        </div>
        <span class="porcentaje">0%</span>
      </div>

      <section class="sabias entra" aria-live="polite" style="animation-delay:.6s">
        <span class="signo" aria-hidden="true">?</span>
        <div>
          <span class="rotulo">¿SABÍAS QUE…?</span>
          <p class="dato"></p>
        </div>
      </section>
    </div>`;
  contenedor.append(raiz);

  crearCopos(raiz.querySelector('.carga-nieve'));

  // ¿Sabías que…? cambia cada 4,2 s (se reinicia la animación de entrada)
  const dato = raiz.querySelector('.dato');
  let iDato = 0;
  const mostrarDato = () => {
    dato.textContent = SABIAS_QUE[iDato];
    dato.classList.remove('nuevo'); void dato.offsetWidth; dato.classList.add('nuevo');
  };
  mostrarDato();
  intervalos.push(setInterval(() => { iDato = (iDato + 1) % SABIAS_QUE.length; mostrarDato(); }, 4200));

  // El Jukumari habla: al llegar, cada 7,2 s y cuando lo tocan
  const dialogo = raiz.querySelector('.dialogo');
  let iFrase = 0, esperaHabla;
  const hablar = () => {
    clearTimeout(esperaHabla);
    dialogo.textContent = FRASES_CARGA[iFrase];
    iFrase = (iFrase + 1) % FRASES_CARGA.length;
    dialogo.hidden = false;
    dialogo.classList.remove('nuevo'); void dialogo.offsetWidth; dialogo.classList.add('nuevo');
    esperaHabla = setTimeout(() => { dialogo.hidden = true; }, 2600);
    esperas.push(esperaHabla);
  };
  esperas.push(setTimeout(hablar, 1000));
  intervalos.push(setInterval(hablar, 7200));
  raiz.querySelector('.juku-btn').addEventListener('click', hablar);

  // 1) botón → 2) barra → 3) menú
  const boton = raiz.querySelector('.btn-mision');
  const barra = raiz.querySelector('.barra');
  const pista = raiz.querySelector('.pista');
  const relleno = raiz.querySelector('.relleno');
  const pct = raiz.querySelector('.porcentaje');
  boton.addEventListener('click', () => {
    boton.hidden = true;
    barra.hidden = false;
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 1);
      relleno.style.width = p + '%';
      pista.setAttribute('aria-valuenow', p);
      pct.textContent = p + '%';
      if (p >= 100) {
        clearInterval(t);
        esperas.push(setTimeout(() => ir('menu'), 400));
      }
    }, 40);
    intervalos.push(t);
  }, { once: true });
}

export function desmontar() {
  intervalos.forEach(clearInterval);
  esperas.forEach(clearTimeout);
  intervalos = [];
  esperas = [];
}
