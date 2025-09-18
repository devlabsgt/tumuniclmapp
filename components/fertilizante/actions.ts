// components/fertilizante/actions.ts
import Swal from 'sweetalert2';
import { obtenerLugares } from '@/lib/obtenerLugares';
import { createBrowserClient } from '@supabase/ssr';
import type { Beneficiario, CampoFiltro, OrdenFiltro } from './types';
import { registrarLog } from '@/utils/registrarLog';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const cargarBeneficiariosPorAnio = async (anio: string): Promise<Beneficiario[]> => {
  const { data, error } = await supabase
    .from('beneficiarios_fertilizante')
    .select('*')
    .eq('anio', anio);

  if (error) {
    console.error('Error al cargar beneficiarios:', error.message);
    return [];
  }

  return data as Beneficiario[];
};

export const obtenerAniosDisponibles = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('beneficiarios_fertilizante')
    .select('anio')
    .order('anio', { ascending: true });

  if (error || !data) return [];

  return Array.from(
    new Set(
      data
        .map((b: any) => (typeof b.anio === 'number' ? b.anio.toString() : null))
        .filter((anio): anio is string => anio !== null)
    )
  );
};

export const ingresarFolioAnulado = async (
  aniosDisponibles: string[],
  filtrosAnio: string,
  cargarDatos: () => void
) => {
  const listaLugares = await obtenerLugares();

  const { value: formValues } = await Swal.fire({
    title: 'Anular Folio',
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
        <label>Folio (4 dígitos)</label>
        <input id="folio" class="swal2-input" maxlength="4" style="text-align: center; letter-spacing: 5px;" placeholder="0234" />
        
        <label>Lugar</label>
        <select id="lugar" class="swal2-select">
          ${listaLugares.map((l) => `<option value="${l}">${l}</option>`).join('')}
        </select>

        <label>Año</label>
        <select id="anio" class="swal2-select">
          ${aniosDisponibles.map((anio) => `<option value="${anio}" ${anio === filtrosAnio ? 'selected' : ''}>${anio}</option>`).join('')}
        </select>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    preConfirm: () => {
      const folio = (document.getElementById('folio') as HTMLInputElement)?.value.trim();
      const lugar = (document.getElementById('lugar') as HTMLSelectElement)?.value;
      const anio = (document.getElementById('anio') as HTMLSelectElement)?.value;

      if (!folio || !/^\d{4}$/.test(folio)) {
        Swal.showValidationMessage('Ingrese un folio válido de 4 dígitos');
        return null;
      }

      return { folio, lugar, anio };
    }
  });

  if (!formValues) return;

  const { folio, lugar, anio } = formValues;
  const codigo = folio.padStart(4, '0');

  const { data: existente } = await supabase
    .from('beneficiarios_fertilizante')
    .select('id')
    .eq('codigo', codigo)
    .eq('anio', anio)
    .maybeSingle();

  if (existente) {
    return Swal.fire({
      icon: 'warning',
      title: 'Folio existente',
      text: `El folio ${codigo} ya está registrado para el año ${anio}`,
    });
  }

  const { error } = await supabase.from('beneficiarios_fertilizante').insert({
    codigo,
    lugar,
    anio,
    fecha: new Date().toISOString(),
    cantidad: 0,
    estado: 'Anulado',
    nombre_completo: null,
    dpi: null,
    telefono: null,
    sexo: null,
  });

  if (error) {
    const htmlError = `
      <p>No se pudo guardar el folio anulado para <strong>${lugar || 'N/A'}</strong>, año <strong>${anio || 'N/A'}</strong>.</p>
      <p><strong>Detalles:</strong> ${error.message}</p>
    `;

    await registrarLog({
      accion: 'ERROR_ANULAR',
      nombreModulo: 'FERTILIZANTE',
      descripcion: htmlError,
    });

    return Swal.fire({
      icon: 'error',
      title: 'Error al anular folio',
      html: htmlError,
    });
  }


const mensajeExito = `Se anuló correctamente el folio ${codigo} para ${lugar}, año ${anio}`;

await registrarLog({
  accion: 'ANULAR_FOLIO',
  nombreModulo: 'FERTILIZANTE',
  descripcion: mensajeExito,
});

await Swal.fire({
  icon: 'success',
  title: 'Folio anulado',
  text: mensajeExito,
});

  await cargarDatos();
};

export const ingresarFolioInforme = async (
  aniosDisponibles: string[],
  filtrosAnio: string,
  cargarDatos: () => void
) => {
  const listaLugares = await obtenerLugares();

  const { value: formValues } = await Swal.fire({
    title: 'Ingresar informe',
    html: `
      <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
        <label>Código (solo 4 dígitos)</label>
        <input id="codigo" class="swal2-input" maxlength="4" placeholder="Ej. 0234"
          style="text-align: center; letter-spacing: 5px;" />

        <label>Lugar</label>
        <select id="lugar" class="swal2-select">
          ${listaLugares.map(l => `<option value="${l}">${l}</option>`).join('')}
        </select>

        <label>Año</label>
        <select id="anio" class="swal2-select">
          ${aniosDisponibles.map(anio => `
            <option value="${anio}" ${anio === filtrosAnio ? 'selected' : ''}>${anio}</option>
          `).join('')}
        </select>

        <label>Cantidad entregada</label>
        <input id="cantidad" class="swal2-input" type="number" min="1" placeholder="Ej. 1" />

        <label>Notas</label>
        <textarea id="notas" class="swal2-textarea" placeholder="Anotaciones..."></textarea>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    focusConfirm: false,
    preConfirm: () => {
      const codigoInput = (document.getElementById('codigo') as HTMLInputElement)?.value.trim();
      const lugar = (document.getElementById('lugar') as HTMLSelectElement)?.value;
      const anio = (document.getElementById('anio') as HTMLSelectElement)?.value;
      const cantidad = Number((document.getElementById('cantidad') as HTMLInputElement)?.value);
      const notas = (document.getElementById('notas') as HTMLTextAreaElement)?.value.trim();

      if (!/^\d{4}$/.test(codigoInput)) {
        Swal.showValidationMessage('El código debe contener exactamente 4 dígitos numéricos');
        return null;
      }

      if (!cantidad || cantidad <= 0) {
        Swal.showValidationMessage('Ingrese una cantidad válida mayor a 0');
        return null;
      }

      return { codigo: `I-${codigoInput}`, lugar, anio, cantidad, nombre_completo: notas };
    },
  });

  if (!formValues) return;

  const { codigo, lugar, anio, cantidad, nombre_completo } = formValues;

  const { data: existente } = await supabase
    .from('beneficiarios_fertilizante')
    .select('id')
    .eq('codigo', codigo)
    .eq('anio', anio)
    .maybeSingle();

  if (existente) {
    return Swal.fire({
      icon: 'warning',
      title: 'Código existente',
      text: `El código ${codigo} ya está registrado para el año ${anio}`,
    });
  }

  const { error } = await supabase.from('beneficiarios_fertilizante').insert({
    codigo,
    lugar,
    anio,
    fecha: new Date().toISOString(),
    cantidad,
    estado: 'Informe',
    nombre_completo,
    dpi: null,
    telefono: null,
    sexo: null,
  });

  if (error) {
    const htmlError = `
      <p>No se pudo guardar el informe para <strong>${lugar || 'N/A'}</strong>, año <strong>${anio || 'N/A'}</strong>.</p>
      <p><strong>Detalles:</strong> ${error.message}</p>
    `;

    await registrarLog({
      accion: 'ERROR_INFORME',
      nombreModulo: 'FERTILIZANTE',
      descripcion: htmlError,
    });

    return Swal.fire({
      icon: 'error',
      title: 'Error al guardar informe',
      html: htmlError,
    });
  }

  const mensajeExito = `Informe registrado con código ${codigo} para ${lugar}, año ${anio}, cantidad: ${cantidad}`;

  await registrarLog({
    accion: 'GUARDAR_INFORME',
    nombreModulo: 'FERTILIZANTE',
    descripcion: mensajeExito,
  });

  await Swal.fire({
    icon: 'success',
    title: 'Informe registrado',
    text: mensajeExito,
  });

  await cargarDatos();
};

export const filtrarYOrdenarBeneficiarios = (
  beneficiarios: Beneficiario[],
  filtros: {
    campo: CampoFiltro;
    valor: string;
    lugar: string;
    anio: string;
  },
  orden: OrdenFiltro
): Beneficiario[] => {
  return beneficiarios
    .filter((b) => {
      const campo = b[filtros.campo] || '';
      const cumpleCampo = campo.toLowerCase().includes(filtros.valor.toLowerCase());
      const cumpleLugar = filtros.lugar === '' || b.lugar === filtros.lugar;
      const cumpleEstado =
        orden === 'solo_anulados' ? b.estado === 'Anulado' :
        orden === 'solo_extraviados' ? b.estado === 'Extraviado' :
        orden === 'solo_informes' ? b.estado === 'Informe' :

        true;

      return cumpleCampo && cumpleLugar && cumpleEstado;
    })
    .sort((a, b) => {
      switch (orden) {
        case 'nombre_completo_asc':
          return (a.nombre_completo || '').localeCompare(b.nombre_completo || '');
        case 'nombre_completo_desc':
          return (b.nombre_completo || '').localeCompare(a.nombre_completo || '');
        case 'fecha_asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'fecha_desc':
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case 'cantidad_desc':
          return (b.cantidad ?? 1) - (a.cantidad ?? 1);
        case 'codigo_asc':
          return a.codigo.localeCompare(b.codigo);
        case 'codigo_desc':
          return b.codigo.localeCompare(a.codigo);
        case 'genero_hombres_primero':
          return a.sexo === b.sexo ? 0 : a.sexo === 'M' ? -1 : 1;
        case 'genero_mujeres_primero':
          return a.sexo === b.sexo ? 0 : a.sexo === 'F' ? -1 : 1;
        default:
          return 0;
      }
    });
};

export const generarResumenBeneficiarios = (lista: Beneficiario[]) => ({
  total: lista.length,
  hombres: lista.filter((b) => b.sexo?.toUpperCase() === 'M').length,
  mujeres: lista.filter((b) => b.sexo?.toUpperCase() === 'F').length,
});