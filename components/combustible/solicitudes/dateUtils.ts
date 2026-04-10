/**
 * Utilidades de fecha para el módulo de combustible.
 * Todas las funciones usan la zona horaria 'America/Guatemala' (UTC-6)
 * para garantizar consistencia entre local y producción.
 */

const TZ = 'America/Guatemala';

/**
 * Formatea una fecha ISO a texto largo: ej. "9 de abril de 2026"
 */
export const formatFechaLarga = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '---';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  });
};

/**
 * Formatea una fecha ISO a texto corto: ej. "09/04/2026"
 */
export const formatFechaCorta = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '---';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('es-GT', {
    timeZone: TZ,
  });
};

/**
 * Formatea una fecha ISO a mes/día corto: ej. "09 abr"
 */
export const formatFechaMes = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '---';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    timeZone: TZ,
  });
};

/**
 * Retorna el nombre del mes en ES: ej. "abr"
 */
export const getNombreMes = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-GT', { month: 'short', timeZone: TZ }).replace('.', '');
};
