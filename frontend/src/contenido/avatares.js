// Avatares de detective: animales de los Andes (imágenes en public/img/avatares/).
// cara: 320 × 320, para el registro y el riel del menú.
// cuerpo: de cuerpo entero, para cuando se gane una insignia (todavía sin usar).
const avatar = (id, nombre) => ({ id, nombre, cara: `/img/avatares/${id}.webp`, cuerpo: `/img/avatares/${id}-cuerpo.webp` });

export const AVATARES = [
  avatar('llama', 'Llama'),
  avatar('condor', 'Cóndor'),
  avatar('vicuna', 'Vicuña'),
  avatar('gato-andino', 'Gato andino'),
  avatar('vizcacha', 'Vizcacha'),
  avatar('zorro-andino', 'Zorro andino')
];

export const avatarPorId = (id) => AVATARES.find((a) => a.id === id) ?? null;
