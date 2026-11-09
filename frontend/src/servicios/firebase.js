// Conexión con Firebase. La configuración viene de las variables de entorno (.env.local / Vercel).
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseListo = Boolean(config.apiKey && config.projectId);
if (!firebaseListo) console.warn('APU: falta la configuración de Firebase (.env.local). Se usará solo el navegador.');

export const app = firebaseListo ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
