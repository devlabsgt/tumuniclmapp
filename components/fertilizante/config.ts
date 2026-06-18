/** Folio inicial del rango válido (inclusive). */
export const FOLIO_INICIO = 2;

/** Folio final del rango válido (inclusive). */
export const FOLIO_FIN = 7100;

/** Meta total de sacos a entregar (suele coincidir con FOLIO_FIN). */
export const TOTAL_META_SACOS = FOLIO_FIN;

export const formatearFolio = (numero: number): string =>
  numero.toString().padStart(4, '0');
