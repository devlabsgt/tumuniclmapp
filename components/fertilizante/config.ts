/** Folio inicial del rango válido (inclusive). */
export const FOLIO_INICIO = 2;

/** Folio final del rango válido (inclusive). */
export const FOLIO_FIN = 7100;

/** Meta total de sacos a entregar (suele coincidir con FOLIO_FIN). */
export const TOTAL_META_SACOS = FOLIO_FIN;

export const formatearFolio = (numero: number): string =>
  numero.toString().padStart(4, '0');

/** Extrae el folio numérico de un código (p. ej. "0234" → 234). Ignora informes (I-XXXX). */
export const folioNumericoDesdeCodigo = (codigo: string | number): number | null => {
  const trimmed = String(codigo ?? '').trim();
  if (!trimmed || trimmed.startsWith('I-')) return null;

  const digitos = trimmed.replace(/\D/g, '');
  if (!digitos || digitos.length > 4) return null;

  const folio = parseInt(digitos, 10);
  return Number.isNaN(folio) ? null : folio;
};

/** Estados que ocupan un folio del rango (no aparecen como faltantes). */
export const ESTADOS_FOLIO_OCUPADO = new Set(['Entregado', 'Extraviado']);
