'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import { generarPdfBeneficiarios } from '@/components/utils/PdfBeneficiarios';
import EstadisticasBeneficiarios from './EstadisticasBeneficiarios';
import MISSINGFolioModal from './MISSINGFolioModal';
import Swal from 'sweetalert2';
import type { Beneficiario } from './types';
import { obtenerLugares } from '@/lib/obtenerLugares';

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';
type OrdenFiltro =
  | 'nombre_completo_asc'
  | 'nombre_completo_desc'
  | 'fecha_asc'
  | 'fecha_desc'
  | 'codigo_asc'
  | 'codigo_desc'
  | 'cantidad_desc'
  | 'solo_anulados'
  | 'solo_extraviados'
  | 'genero_hombres_primero'
  | 'genero_mujeres_primero';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('codigo_asc');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([]);
  const [mostrarModalFolio, setMostrarModalFolio] = useState(false);
  const [beneficiariosPorPagina, setBeneficiariosPorPagina] = useState(10);
  const [lugarAnulado, setLugarAnulado] = useState('');
  const [anioAnulado, setAnioAnulado] = useState(new Date().getFullYear().toString());

  const [filtros, setFiltros] = useState({
    campo: 'codigo' as CampoFiltro,
    valor: '',
    lugar: '',
    anio: new Date().getFullYear().toString(),
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  useEffect(() => {
    const obtenerDesdeApi = async () => {
      try {
        const res = await fetch('/api/getuser');
        const data = await res.json();
        setPermisos(data.permisos || []);
      } catch (error) {
        console.error('Error al obtener datos del endpoint getuser:', error);
      }
    };
    obtenerDesdeApi();
  }, []);

  useEffect(() => {
    const obtenerAnios = async () => {
      const { data, error } = await supabase
        .from('beneficiarios_fertilizante')
        .select('anio')
        .order('anio', { ascending: true });

      if (!error && data) {
        const unicos = Array.from(new Set(
          data
            .map((b: any) => (typeof b.anio === 'number' ? b.anio.toString() : null))
            .filter((anio): anio is string => anio !== null)
        ));
        setAniosDisponibles(unicos);
      }
    };
    obtenerAnios();
  }, []);

  const cargarDatos = async () => {
    const { data, error } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('anio', filtros.anio);

    if (!error && data) {
      setBeneficiarios(data);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtros.anio]);

  const beneficiariosFiltrados = beneficiarios
    .filter((b) => {
      const campo = b[filtros.campo] || '';
      const cumpleCampo = campo.toLowerCase().includes(filtros.valor.toLowerCase());
      const cumpleLugar = filtros.lugar === '' || b.lugar === filtros.lugar;
      const cumpleEstado =
        orden === 'solo_anulados' ? b.estado === 'Anulado' :
        orden === 'solo_extraviados' ? b.estado === 'Extraviado' :
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
          return a.sexo === b.sexo
            ? a.codigo.localeCompare(b.codigo)
            : a.sexo === 'M'
            ? -1
            : 1;
        case 'genero_mujeres_primero':
          return a.sexo === b.sexo
            ? a.codigo.localeCompare(b.codigo)
            : a.sexo === 'F'
            ? -1
            : 1;
        default:
          return 0;
      }
    });

  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  const resumen = {
    total: beneficiariosFiltrados.length,
    hombres: beneficiariosFiltrados.filter((b) => b.sexo?.toUpperCase() === 'M').length,
    mujeres: beneficiariosFiltrados.filter((b) => b.sexo?.toUpperCase() === 'F').length,
  };

const ingresarFolioAnulado = async () => {
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
          ${aniosDisponibles.map((anio) => `<option value="${anio}" ${anio === filtros.anio ? 'selected' : ''}>${anio}</option>`).join('')}
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
    return Swal.fire({
      icon: 'error',
      title: 'Error al anular folio',
      html: `
        <p>No se pudo guardar el folio anulado para <strong>${lugar || 'N/A'}</strong>, año <strong>${anio || 'N/A'}</strong>.</p>
        <p><strong>Detalles:</strong> ${error.message}</p>
      `,
    });
  }

  await Swal.fire({
    icon: 'success',
    title: 'Folio anulado',
    text: `Se anuló correctamente el folio ${codigo} para ${lugar}, año ${anio}`,
  });

  await cargarDatos();
};

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros, orden, beneficiariosPorPagina]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => router.push("/protected")}
        className="text-blue-600 text-base underline"
      >
        Volver
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold text-left">Lista de Beneficiarios</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {(permisos.includes('IMPRIMIR') || permisos.includes('TODO')) && (
            <Button
              onClick={() => generarPdfBeneficiarios(beneficiariosFiltrados)}
              className="h-12 bg-green-600 hover:bg-green-700 text-white px-4 w-full sm:w-auto"
            >
              Generar Reporte PDF
            </Button>
          )}

          {(permisos.includes('CREAR') || permisos.includes('TODO')) && (
            <Button
              onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-4 w-full sm:w-auto"
            >
              Nuevo Beneficiario
            </Button>
          )}
        </div>
      </div>

      <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} anios={aniosDisponibles} />
      <EstadisticasBeneficiarios data={beneficiariosFiltrados} />

<div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
  {/* Ordenar por */}
<div className="flex flex-col sm:flex-row sm:items-center">
  <span className="text-sm font-semibold text-gray-700">Ordenar por:</span>
  <select
    value={orden}
    onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
    className="border border-gray-300 rounded px-3 py-2 mt-2 sm:mt-0 sm:ml-2"
  >
    <optgroup label="Formulario">
      <option value="codigo_asc">Folio (ascendente)</option>
      <option value="codigo_desc">F (descendente)</option>
    </optgroup>
    <optgroup label="Nombre">
      <option value="nombre_completo_asc">Nombre (A-Z)</option>
      <option value="nombre_completo_desc">Nombre (Z-A)</option>
    </optgroup>
    <optgroup label="Fecha">
      <option value="fecha_desc">Fecha (más reciente primero)</option>
      <option value="fecha_asc">Fecha (más antigua primero)</option>
    </optgroup>
    <optgroup label="Cantidad">
      <option value="cantidad_desc">Cantidad (mayor a menor)</option>
    </optgroup>
    <optgroup label="Género">
      <option value="genero_hombres_primero">Hombres primero</option>
      <option value="genero_mujeres_primero">Mujeres primero</option>
    </optgroup>
    <optgroup label="Estado">
      <option value="solo_anulados">Mostrar Anulados</option>
      <option value="solo_extraviados">Mostrar Extraviados</option>
    </optgroup>
  </select>
</div>


  {/* Botones */}
  {(permisos.includes('TODO') || permisos.includes('LEER')) && (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-fit">
      <Button
        onClick={ingresarFolioAnulado}
        className="h-12 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
      >
        Anular Folio
      </Button>
      <Button
        onClick={() => setMostrarModalFolio(true)}
        className="h-12 bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
      >
        Folios faltantes
      </Button>

      <MISSINGFolioModal
        visible={mostrarModalFolio}
        onClose={() => setMostrarModalFolio(false)}
        beneficiarios={beneficiariosFiltrados}
      />
    </div>
  )}
</div>


      {beneficiarios.length === 0 && filtros.valor === '' ? (
        <div className="text-center text-gray-600 my-10">
          <div className="mb-4 text-lg animate-pulse">🔄 Cargando beneficiarios...</div>
          <TablaBeneficiarios data={[]} resumen={resumen} isLoading={true} permisos={permisos} />
        </div>
      ) : beneficiariosFiltrados.length === 0 ? (

        <div className="text-center text-gray-600 my-8 text-2xl">
          <strong>No se encontraron beneficiarios que coincidan con su búsqueda.</strong>
        </div>
      ) : (
        <TablaBeneficiarios
          data={beneficiariosPaginados}
          resumen={resumen}
          isLoading={false}
          permisos={permisos}
        />
      )}

      <div className="flex justify-center mt-5 mb-2 text-sm gap-2 items-center">
        <span className="font-medium">Ver por:</span>
        <select
          value={beneficiariosPorPagina}
          onChange={(e) => setBeneficiariosPorPagina(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex justify-center mt-4 gap-2 flex-wrap">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded border ${paginaActual === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white'}`}
        >
          ←
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter((n) => {
            const grupo = Math.floor((paginaActual - 1) / 45);
            return n > grupo * 45 && n <= (grupo + 1) * 45;
          })
          .map((numero) => (
            <button
              key={numero}
              onClick={() => setPaginaActual(numero)}
              className={`px-4 py-2 rounded border ${
                paginaActual === numero ? 'bg-blue-600 text-white' : 'bg-white'
              }`}
            >
              {numero}
            </button>
          ))}

        <button
          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded border ${paginaActual === totalPaginas ? 'bg-gray-200 text-gray-500' : 'bg-white'}`}
        >
          →
        </button>
      </div>

    </div>
  );
}
