

const GT_OFFSET_MS = -6 * 60 * 60 * 1000; // UTC-6 en milisegundos

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];


const toGT = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  const utc = new Date(input instanceof Date ? input.getTime() : input);
  if (isNaN(utc.getTime())) return null;
  // Desplazar los milisegundos y usar getUTC* para leer como si fuera local GT
  return new Date(utc.getTime() + GT_OFFSET_MS);
};


const parseDateOnly = (input: string | null | undefined): Date | null => {
  if (!input) return null;
  const dateOnly = input.includes('T') ? input.split('T')[0] : input;
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d); // fecha local, sin conversión
};


export const formatFechaLarga = (input: string | Date | null | undefined): string => {
  const d = toGT(input);
  if (!d) return '---';
  return `${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};


export const formatFechaCorta = (input: string | Date | null | undefined): string => {
  const d = toGT(input);
  if (!d) return '---';
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
};

/**
 * Formatea un timestamp UTC a mes corto en Guatemala: "9-abr"
 */
export const formatFechaMes = (input: string | Date | null | undefined): string => {
  const d = toGT(input);
  if (!d) return '---';
  return `${d.getUTCDate()}-${MESES_CORTOS[d.getUTCMonth()]}`;
};

/**
 * Formatea un timestamp UTC a hora GT: "07:30 AM"
 */
export const formatHora = (input: string | Date | null | undefined): string => {
  const d = toGT(input);
  if (!d) return '--';
  const h24 = d.getUTCHours();
  const min = d.getUTCMinutes();
  const h12 = h24 % 12 || 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
};

/**
 * Para campos de solo fecha (fecha_inicio, fecha_fin, fecha_comision)
 * que ya vienen como "YYYY-MM-DD" — retorna fecha larga: "9 de abril de 2026"
 */
export const formatFechaDateOnly = (input: string | null | undefined): string => {
  const d = parseDateOnly(input);
  if (!d) return '---';
  return `${d.getDate()} de ${MESES_LARGOS[d.getMonth()]} de ${d.getFullYear()}`;
};

/**
 * Para campos de solo fecha — retorna fecha corta: "09/04/2026"
 */
export const formatFechaCortaDateOnly = (input: string | null | undefined): string => {
  const d = parseDateOnly(input);
  if (!d) return '---';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};
