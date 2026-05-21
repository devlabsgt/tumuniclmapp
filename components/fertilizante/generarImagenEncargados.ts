import html2canvas from 'html2canvas';
import type { EncargadoFolio } from './actions';

const CARTA_ANCHO_PX = 816;
const CARTA_ALTO_PX = 1056;

const escapeHtml = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatearFechaImagen = (fecha: string): string => {
  const partes = fecha.split('-');
  if (partes.length !== 3) return fecha;
  const [anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio}`;
};

const cargarImagen = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });

const encabezadoMunicipalHtml = (logoUrl: string): string => `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:4px;">
    <div style="width:30%;padding-top:20px;padding-left:8px;box-sizing:border-box;">
      <img src="${logoUrl}" alt="Logo Municipalidad" style="height:100px;object-fit:contain;display:block;" />
    </div>
    <div style="width:55%;padding-top:20px;display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box;">
      <h2 style="font-size:20px;font-weight:700;color:#204184;line-height:1.2;margin:0 0 4px;letter-spacing:-0.02em;">
        Municipalidad de Concepción Las Minas
      </h2>
      <p style="font-size:10px;font-weight:700;color:#2563eb;line-height:1.3;margin:0 0 8px;white-space:nowrap;">
        Departamento de Chiquimula, Guatemala C.A. | TEL: 7943-5619 - CEL: 4790-2524
      </p>
      <div style="width:100%;height:3.5px;display:flex;border-radius:999px;overflow:hidden;margin-bottom:8px;">
        <div style="width:25%;background:#204184;"></div>
        <div style="width:25%;background:#366ac9;"></div>
        <div style="width:25%;background:#68a6f2;"></div>
        <div style="width:25%;background:#c2dafb;"></div>
      </div>
      <h1 style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;color:#000;margin:0;line-height:1.4;letter-spacing:0.02em;">
        Encargados de folios de entrega de fertilizante
      </h1>
    </div>
    <div style="width:15%;box-sizing:border-box;"></div>
  </div>
`;

export type OpcionesImagenEncargados = {
  lugar: string;
  fecha: string;
  encargadoNombre?: string;
  registros: EncargadoFolio[];
};

export type ImagenEncargadosGenerada = {
  dataUrl: string;
  fileName: string;
};

export function descargarDataUrlImagen(dataUrl: string, fileName: string): void {
  const enlace = document.createElement('a');
  enlace.download = fileName;
  enlace.href = dataUrl;
  enlace.click();
}

export function imprimirDataUrlImagen(dataUrl: string, titulo = 'Encargados de folios'): void {
  const ventana = window.open('', '_blank');
  if (!ventana) return;

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(titulo)}</title>
        <style>
          @page { size: letter; margin: 0; }
          html, body { margin: 0; padding: 0; }
          img { width: 100%; display: block; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${escapeHtml(titulo)}" onload="window.print();" />
      </body>
    </html>
  `);
  ventana.document.close();
}

export async function generarImagenEncargados({
  lugar,
  fecha,
  encargadoNombre,
  registros,
}: OpcionesImagenEncargados): Promise<ImagenEncargadosGenerada> {
  const lugarTexto = lugar || 'Todos los lugares';
  const fechaTexto = fecha ? formatearFechaImagen(fecha) : 'Todas las fechas';
  const logoUrl = `${window.location.origin}/images/logo-muni.png`;

  await cargarImagen(logoUrl);

  const porEncargadoEspecifico = Boolean(encargadoNombre);

  const ordenados = [...registros].sort((a, b) => {
    if (porEncargadoEspecifico) {
      const cmpLugar = a.lugar.localeCompare(b.lugar);
      if (cmpLugar !== 0) return cmpLugar;
      const cmpFecha = b.fecha.localeCompare(a.fecha);
      if (cmpFecha !== 0) return cmpFecha;
      return a.folio_ini.localeCompare(b.folio_ini);
    }
    const cmpNombre = (a.encargado_nombre || '').localeCompare(b.encargado_nombre || '');
    if (cmpNombre !== 0) return cmpNombre;
    const cmpLugar = a.lugar.localeCompare(b.lugar);
    if (cmpLugar !== 0) return cmpLugar;
    return a.folio_ini.localeCompare(b.folio_ini);
  });

  const mostrarColumnaLugar =
    !porEncargadoEspecifico && new Set(registros.map((r) => r.lugar)).size > 1;

  const filas = porEncargadoEspecifico
    ? ordenados
        .map(
          (r, i) => `
        <tr>
          <td style="border:1px solid #333;padding:8px;text-align:center;width:48px;font-family:Arial,Helvetica,sans-serif;">${i + 1}</td>
          <td style="border:1px solid #333;padding:8px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(r.lugar)}</td>
          <td style="border:1px solid #333;padding:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(formatearFechaImagen(r.fecha))}</td>
          <td style="border:1px solid #333;padding:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(r.folio_ini)} – ${escapeHtml(r.folio_fin)}</td>
        </tr>
      `,
        )
        .join('')
    : ordenados
        .map(
          (r, i) => `
        <tr>
          <td style="border:1px solid #333;padding:8px;text-align:center;width:48px;font-family:Arial,Helvetica,sans-serif;">${i + 1}</td>
          <td style="border:1px solid #333;padding:8px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(r.encargado_nombre || '—')}</td>
          <td style="border:1px solid #333;padding:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(r.folio_ini)} – ${escapeHtml(r.folio_fin)}</td>
          ${mostrarColumnaLugar ? `<td style="border:1px solid #333;padding:8px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(r.lugar)}</td>` : ''}
        </tr>
      `,
        )
        .join('');

  const encabezadoTabla = porEncargadoEspecifico
    ? `
        <tr>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:center;width:48px;font-family:Arial,Helvetica,sans-serif;">No.</th>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:left;font-family:Arial,Helvetica,sans-serif;">Lugar</th>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:center;width:120px;font-family:Arial,Helvetica,sans-serif;">Fecha</th>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:center;width:180px;font-family:Arial,Helvetica,sans-serif;">Folios</th>
        </tr>
      `
    : `
        <tr>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:center;width:48px;font-family:Arial,Helvetica,sans-serif;">No.</th>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:left;font-family:Arial,Helvetica,sans-serif;">Encargado</th>
          <th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:center;width:180px;font-family:Arial,Helvetica,sans-serif;">Folios</th>
          ${mostrarColumnaLugar ? '<th style="border:1px solid #333;padding:10px 8px;background:#e5e7eb;text-align:left;font-family:Arial,Helvetica,sans-serif;">Lugar</th>' : ''}
        </tr>
      `;

  const encabezadoFiltros = encargadoNombre
    ? `
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.4;">
      <span><strong>Encargado:</strong> ${escapeHtml(encargadoNombre)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span><strong>Lugar:</strong> ${escapeHtml(lugarTexto)}</span>
        <span><strong>Fecha:</strong> ${escapeHtml(fechaTexto)}</span>
      </div>
    </div>
  `
    : `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.4;">
      <span><strong>Lugar:</strong> ${escapeHtml(lugarTexto)}</span>
      <span><strong>Fecha:</strong> ${escapeHtml(fechaTexto)}</span>
    </div>
  `;

  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    `width:${CARTA_ANCHO_PX}px`,
    `min-height:${CARTA_ALTO_PX}px`,
    'padding:12px 48px 48px',
    'background:#ffffff',
    'font-family:Arial,Helvetica,sans-serif',
    'color:#111111',
    'box-sizing:border-box',
  ].join(';');

  container.innerHTML = `
    ${encabezadoMunicipalHtml(logoUrl)}
    ${encabezadoFiltros}
    <table style="width:100%;border-collapse:collapse;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
      <thead>
        ${encabezadoTabla}
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>
    <p style="margin-top:24px;font-size:11px;color:#666;text-align:right;">
      Generado: ${new Date().toLocaleString('es-GT')}
    </p>
  `;

  document.body.appendChild(container);

  try {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      width: CARTA_ANCHO_PX,
      height: Math.max(container.scrollHeight, CARTA_ALTO_PX),
    });

    const slugLugar = (lugar || 'todos').replace(/\s+/g, '-').toLowerCase();
    const slugFecha = fecha || 'todas';
    const slugEncargado = encargadoNombre
      ? `-${encargadoNombre.replace(/\s+/g, '-').toLowerCase()}`
      : '';

    return {
      dataUrl: canvas.toDataURL('image/png'),
      fileName: `encargados-folios${slugEncargado}-${slugLugar}-${slugFecha}.png`,
    };
  } finally {
    document.body.removeChild(container);
  }
}
