// Fuente única de modelos, precios y contacto. Si cambia un valor, se cambia acá
// y se actualiza en el hero, la sección de motos, el FAQ y el mensaje de WhatsApp.

export const WSP = '5493624801950';

export const CUOTA_SEMANAL = 79000;
export const SEMANAS = 48;

export type MarcaKey = 'ika' | 'corven';
export type VersionKey = 'base' | 'full';

export const MARCAS: Record<MarcaKey, { nombre: string; modelo: string }> = {
  ika: { nombre: 'IKA', modelo: 'Slalom 110' },
  corven: { nombre: 'Corven', modelo: 'Energy 110' },
};

export const VERSIONES: Record<VersionKey, { corto: string; detalle: string; anticipoPago: number }> = {
  base: { corto: 'Base', detalle: 'Rayos · freno a tambor', anticipoPago: 190000 },
  full: { corto: 'Full', detalle: 'Llantas de aleación · freno a disco', anticipoPago: 290000 },
};

export const FOTOS: Record<MarcaKey, Record<VersionKey, string>> = {
  ika: { base: '/img/ikabase.jpg', full: '/img/ikafull.webp' },
  // TODO: falta la foto de la Corven Full; mientras tanto se usa la de la Base.
  corven: { base: '/img/corvenbase.jpg', full: '/img/corvenbase.jpg' },
};

export const MARCA_KEYS = Object.keys(MARCAS) as MarcaKey[];
export const VERSION_KEYS = Object.keys(VERSIONES) as VersionKey[];

export const nombreMoto = (m: MarcaKey, v: VersionKey) =>
  `${MARCAS[m].nombre} ${MARCAS[m].modelo} ${VERSIONES[v].corto}`;

// Las 4 del NEA van primero porque son la zona de cobertura.
export const PROVINCIAS_NEA = ['Chaco', 'Corrientes', 'Formosa', 'Misiones'];
export const PROVINCIAS_RESTO = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chubut', 'Córdoba', 'Entre Ríos', 'Jujuy', 'La Pampa',
  'La Rioja', 'Mendoza', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

export const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
