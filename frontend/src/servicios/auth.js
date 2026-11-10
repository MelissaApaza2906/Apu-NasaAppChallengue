// Sesión: al iniciar la app, si no hay sesión, se crea una anónima en silencio (Firebase).
// El perfil (apodo + avatar) se pide aparte, en la pantalla de registro (pantallas/acceso).
import { onAuthStateChanged, signInAnonymously, signOut, deleteUser } from 'firebase/auth';
import { auth } from './firebase.js';
import { borrarDatosUsuario } from './progreso.js';

let usuario = null;
const oyentes = new Set();
let avisarLista;
// Se cumple cuando ya hay sesión (o cuando no se pudo crear: sin conexión, se sigue en el navegador)
export const sesionLista = new Promise((r) => { avisarLista = r; });

export function usuarioActual() { return usuario; }
export function alCambiarSesion(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

export function escucharSesion() {
  if (!auth) { usuario = { uid: 'local', isAnonymous: true }; avisarLista(); return; } // sin Firebase: modo navegador
  onAuthStateChanged(auth, (u) => {
    if (!u) {
      // Sin sesión: anónima, sin preguntar nada. Si falla (sin conexión), el progreso queda en el navegador.
      signInAnonymously(auth).catch((e) => { console.warn('APU: no se pudo crear la sesión anónima.', e); avisarLista(); });
      return;
    }
    usuario = u;
    avisarLista();
    oyentes.forEach((fn) => fn(u));
  });
}

export async function salir() { if (auth) await signOut(auth); }

// "Borrar mi cuenta" (Ajustes): borra el progreso y luego la cuenta.
export async function borrarCuenta() {
  await borrarDatosUsuario();
  if (auth?.currentUser) await deleteUser(auth.currentUser);
}
