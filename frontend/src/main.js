// Arranque de APU: estilos globales + rutas
import './estilos/base.css';
import { iniciarRutas } from './router.js';
import { escucharSesion } from './servicios/auth.js';

escucharSesion();
iniciarRutas(document.getElementById('app'));
