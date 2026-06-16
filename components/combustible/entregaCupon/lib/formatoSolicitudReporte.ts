export type SolicitudReporteFormato = {
  correlativo?: number | null;
  placa?: string;
  vehiculo?: string;
  tipo_combustible?: string;
  id?: number;
  justificacion?: string | null;
  created_at?: string;
};

export const COLOR_DATOS_VEHICULO = '#3b82f6';
export const COLOR_DATOS_VEHICULO_CLARO = '#1d4ed8';
export const COLOR_GASOLINA = '#10b981';
export const COLOR_GASOLINA_CLARO = '#059669';
export const COLOR_DIESEL = '#eab308';
export const COLOR_DIESEL_CLARO = '#ca8a04';

const hexARgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

export const colorCombustibleClaro = (combustible: string) => {
  const t = combustible.toLowerCase();
  if (t.includes('gasolina')) return COLOR_GASOLINA_CLARO;
  if (t.includes('diesel')) return COLOR_DIESEL_CLARO;
  return '#475569';
};

export const colorCombustiblePdf = (combustible: string): [number, number, number] =>
  hexARgb(colorCombustibleClaro(combustible));

export const colorDatosVehiculoPdf = (): [number, number, number] =>
  hexARgb(COLOR_DATOS_VEHICULO_CLARO);

export const clasesColorNumeroSolicitud = () =>
  'font-bold text-slate-900 dark:text-slate-300';

export const clasesColorDatoVehiculo = () =>
  'font-bold text-[#1d4ed8] dark:text-[#3b82f6]';

export const clasesColorCombustible = (combustible: string) => {
  const t = combustible.toLowerCase();
  if (t.includes('gasolina')) return 'font-bold text-[#059669] dark:text-[#10b981]';
  if (t.includes('diesel')) return 'font-bold text-[#ca8a04] dark:text-[#eab308]';
  return 'font-bold text-slate-600 dark:text-slate-400';
};

const etiquetaCombustible = (tipo?: string) => {
  const t = tipo?.trim().toLowerCase() ?? '';
  if (t.includes('gasolina')) return 'Gasolina';
  if (t.includes('diesel')) return 'Diesel';
  return tipo?.trim() || '—';
};

export function formatearFechaSolicitudReporte(created_at: string): string {
  const d = new Date(created_at);
  const diaSemana = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    weekday: 'short',
  })
    .format(d)
    .replace(/\./g, '');
  const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const partes = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(d);
  const dia = partes.find((p) => p.type === 'day')?.value ?? '01';
  const mes = partes.find((p) => p.type === 'month')?.value ?? '01';
  const anio = partes.find((p) => p.type === 'year')?.value ?? '00';
  return `${diaCap} ${dia}/${mes}/${anio}`;
}

export function datosSolicitudReporte(sol: SolicitudReporteFormato) {
  const numero = sol.correlativo ?? sol.id;
  const no = numero != null ? String(numero) : '—';
  const vehiculo = sol.vehiculo?.trim() || '—';
  const placa = sol.placa?.trim() || '—';
  const combustible = etiquetaCombustible(sol.tipo_combustible);
  const justificacion = sol.justificacion?.trim() || 'Sin justificación';
  const fecha = sol.created_at ? formatearFechaSolicitudReporte(sol.created_at) : '—';
  return { no, noEtiqueta: `No. ${no}`, fecha, vehiculo, placa, combustible, justificacion };
}

export const clasesColorFechaSolicitud = () =>
  'font-bold text-slate-900 dark:text-slate-100';

export function formatoLineaSolicitud(sol: SolicitudReporteFormato): string {
  const { fecha, vehiculo, placa, combustible, justificacion } = datosSolicitudReporte(sol);
  return `${fecha} ${vehiculo}, ${placa}, ${combustible}\n${justificacion}`;
}

export const debeSubrayarTotalReporte = (fila: {
  tipo: 'dependencia' | 'empleado' | 'solicitud' | 'total-empleado';
}) => fila.tipo !== 'solicitud';
