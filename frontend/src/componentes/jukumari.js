// Componente del guía: avatar + globo de diálogo que escribe letra por letra. Responsable: (por definir)
export function crearJukumari({ texto = '', tamaño = 'mediano' } = {}) {
  const el = document.createElement('div');
  el.className = `jukumari jukumari-${tamaño}`;
  el.innerHTML = '<img src="/img/avatares/jukumari-cara.webp" alt="El Jukumari, tu guía"><p aria-live="polite"></p>';
  const p = el.querySelector('p');
  let t;
  el.decir = (nuevo) => {
    clearInterval(t); p.textContent = ''; let i = 0;
    t = setInterval(() => { i += 2; p.textContent = nuevo.slice(0, i); if (i >= nuevo.length) clearInterval(t); }, 28);
  };
  if (texto) el.decir(texto);
  return el;
}
