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
import type { Beneficiario, CampoFiltro, OrdenFiltro } from './types';
import { registrarLog } from '@/utils/registrarLog';
import {
  cargarBeneficiariosPorAnio,
  obtenerAniosDisponibles,
  ingresarFolioAnulado,
  ingresarFolioInforme,
  filtrarYOrdenarBeneficiarios,
  generarResumenBeneficiarios,
} from './actions';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('codigo_asc');
  const [permisos, setPermisos] = useState<string[]>([]);
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([]);
  const [mostrarModalFolio, setMostrarModalFolio] = useState(false);
  const [beneficiariosPorPagina, setBeneficiariosPorPagina] = useState(10);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

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
    fetch('/api/getuser')
      .then(res => res.json())
      .then(data => setPermisos(data.permisos || []))
      .catch(err => console.error('Error al obtener permisos:', err));
  }, []);

  useEffect(() => {
    obtenerAniosDisponibles().then(setAniosDisponibles);
  }, []);

  const cargarDatos = async () => {
    const data = await cargarBeneficiariosPorAnio(filtros.anio);
    setBeneficiarios(data);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtros.anio]);

  const beneficiariosFiltrados = filtrarYOrdenarBeneficiarios(beneficiarios, filtros, orden);

  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  const resumen = generarResumenBeneficiarios(beneficiariosFiltrados);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros, orden, beneficiariosPorPagina]);

return (
  <div className="w-full max-w-6xl mx-auto px-4 py-6 overflow-hidden">


    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <Button
      variant="ghost"
      onClick={() => router.push("/protected")}
      className="text-blue-600 text-base underline"
    >
      Volver
    </Button>
      <h1 className="text-2xl font-bold text-left">Beneficiarios de Fertilizante</h1>
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
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="text-sm font-semibold text-gray-700">Ordenar por:</span>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
          className="border border-gray-300 rounded px-3 py-2 mt-2 sm:mt-0 sm:ml-2"
        >
          <optgroup label="Formulario">
            <option value="codigo_asc">Folio (ascendente)</option>
            <option value="codigo_desc">Folio (descendente)</option>
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
            <option value="solo_informes">Mostrar Informes</option>

          </optgroup>
        </select>
      </div>

{(permisos.includes('TODO') || permisos.includes('LEER')) && (
  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-fit">
    <div className="relative inline-block text-left">
      <Button
        className="h-12 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
        onClick={() => setMostrarOpciones(!mostrarOpciones)}
      >
        Gestionar Documentos
      </Button>
      {mostrarOpciones && (
        <div className="absolute z-10 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setMostrarOpciones(false);
                ingresarFolioAnulado(aniosDisponibles, filtros.anio, cargarDatos);
              }}
            >
              Anular folio
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setMostrarOpciones(false);
                ingresarFolioInforme(aniosDisponibles, filtros.anio, cargarDatos);
              }}
            >
              Ingresar informe 
            </button>
          </div>
        </div>
      )}
    </div>

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