import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function parseFechaHoraComision(fechaHora: string): Date {
  return new Date(fechaHora.replace(' ', 'T'));
}

export function formatHoraComision(fecha: Date): string {
  const hours = fecha.getHours();
  const minutes = fecha.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${ampm}`;
}

export function formatFechaHoraComision(fecha: Date): string {
  const dia = format(fecha, 'EEE', { locale: es }).replace(/\./g, '');
  const diaFmt = dia.charAt(0).toUpperCase() + dia.slice(1);
  const fechaParte = format(fecha, 'dd/MM/yy');
  return `${diaFmt} ${fechaParte} | ${formatHoraComision(fecha)}`;
}

export function formatHoraComisionDesdeIso(dateString: string | undefined | null): string {
  if (!dateString) return '---';
  return formatHoraComision(new Date(dateString));
}
