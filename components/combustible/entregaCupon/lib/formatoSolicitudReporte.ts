export function formatoLineaSolicitud(sol: {
  correlativo?: number | null;
  placa?: string;
  id?: number;
  justificacion?: string | null;
}): string {
  const numero = sol.correlativo ?? sol.id;
  const no = numero != null ? String(numero) : '—';
  const placa = sol.placa?.trim() || '—';
  const justificacion = sol.justificacion?.trim() || 'Sin justificación';
  return `No.: ${no}, Placa: ${placa}, Just. ${justificacion}`;
}
