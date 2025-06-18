export function obtenerFechaYFormatoGT() {
  const fecha = new Date();
  const formateada = fecha.toLocaleString('es-GT', {
    timeZone: 'America/Guatemala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return { fecha, formateada };
}
