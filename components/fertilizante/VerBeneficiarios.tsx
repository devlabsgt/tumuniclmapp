'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import { generarPdfBeneficiarios } from '@/components/utils/PdfBeneficiarios';
import EstadisticasBeneficiarios from './EstadisticasBeneficiarios';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  telefono?: string;
  sexo?: string;
   cantidad?: number;
}

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';
type OrdenFiltro = 
  'nombre_completo_asc' | 'nombre_completo_desc' |
  'fecha_asc' | 'fecha_desc' |
  'codigo_asc' | 'codigo_desc' |
  'cantidad_desc'; 


export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('codigo_asc');
  const [userRole, setUserRole] = useState<'Admin' | 'User' | null>(null);
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([]);

  const [filtros, setFiltros] = useState({
    campo: 'nombre_completo' as CampoFiltro,
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
    const obtenerUsuario = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      const rol = user?.user_metadata?.rol || 'User';
      setUserRole(rol);
    };

    obtenerUsuario();
  }, []);


  useEffect(() => {
    const obtenerAnios = async () => {
      const { data, error } = await supabase
        .from('beneficiarios_fertilizante')
        .select('anio')
        .order('anio', { ascending: true });

      if (error) return;

      const unicos = Array.from(
        new Set(
          data
            .map((b: any) => (typeof b.anio === 'number' ? b.anio.toString() : null))
            .filter((anio): anio is string => anio !== null)
        )
      );
      setAniosDisponibles(unicos);
    };

    const obtenerRolUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      const rol = data?.user?.user_metadata?.rol || 'User';
      setUserRole(rol);
    };

    obtenerAnios();
    obtenerRolUsuario();
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data, error } = await supabase
        .from('beneficiarios_fertilizante')
        .select('*')
        .eq('anio', filtros.anio);

      if (!error) setBeneficiarios(data || []);
    };
    cargarDatos();
  }, [filtros.anio]);

  const beneficiariosFiltrados = beneficiarios
    .filter((b) =>
      b[filtros.campo].toLowerCase().includes(filtros.valor.toLowerCase()) &&
      (filtros.lugar === '' || b.lugar === filtros.lugar)
    )
    .sort((a, b) => {
      switch (orden) {
        case 'nombre_completo_asc': return a.nombre_completo.localeCompare(b.nombre_completo);
        case 'nombre_completo_desc': return b.nombre_completo.localeCompare(a.nombre_completo);
        case 'fecha_asc': return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'fecha_desc': return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case 'cantidad_desc': return (b.cantidad ?? 1) - (a.cantidad ?? 1);
        case 'codigo_asc': return a.codigo.localeCompare(b.codigo);
        case 'codigo_desc': return b.codigo.localeCompare(a.codigo);
        default: return 0;
      }
    });

  const [beneficiariosPorPagina, setBeneficiariosPorPagina] = useState(10);
  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  const resumen = {
    total: beneficiariosFiltrados.length,
    hombres: beneficiariosFiltrados.filter(b => b.sexo?.toUpperCase() === 'M').length,
    mujeres: beneficiariosFiltrados.filter(b => b.sexo?.toUpperCase() === 'F').length,
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros, orden, beneficiariosPorPagina]);

  const manejarVolver = () => {
    if (userRole === 'Admin') {
      router.push('/protected/admin');
    } else {
      router.push('/protected/user');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 overflow-hidden">
      <Button
        variant="ghost"
        onClick={manejarVolver}
        className="text-blue-600 text-base underline"
      >
        Volver
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold text-left">Lista de Beneficiarios</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {userRole === 'Admin' && (
            <Button
              onClick={() => generarPdfBeneficiarios(beneficiariosFiltrados)}
              className="h-12 bg-green-600 hover:bg-green-700 text-white px-4 w-full sm:w-auto"
            >
              Generar Reporte PDF
            </Button>
          )}

          <Button
            onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')}
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-4 w-full sm:w-auto"
          >
            Nuevo Beneficiario
          </Button>
        </div>
      </div>

      <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} anios={aniosDisponibles} />

      <EstadisticasBeneficiarios data={beneficiariosFiltrados} />

      <div className="mb-4">
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Ordenar por:</span>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
          className="border border-gray-300 rounded px-3 py-2 ml-2"
        >

          <option value="codigo_asc">Formulario (ascendente)</option>
          <option value="codigo_desc">Formulario (descendente)</option>
          <option value="nombre_completo_asc">Nombre (A-Z)</option>
          <option value="nombre_completo_desc">Nombre (Z-A)</option>
          <option value="fecha_desc">Fecha (más reciente primero)</option>
          <option value="fecha_asc">Fecha (más antigua primero)</option>
          <option value="cantidad_desc">Cantidad (mayor a menor)</option>

        </select>
      </div>

    {beneficiarios.length === 0 ? (
      <div className="text-center text-gray-600 my-10">
        <div className="mb-4 text-lg animate-pulse">🔄 Cargando beneficiarios...</div>
        <TablaBeneficiarios
          data={[]} // pasar array vacío, el skeleton se encarga
          resumen={resumen}
          isLoading={true}
        />
      </div>
    ) : beneficiariosPaginados.length === 0 ? (
      <div className="text-center text-gray-600 my-8 text-2xl">
        <strong>No se encontraron beneficiarios que coincidan con su búsqueda.</strong>
      </div>
    ) : (
      <TablaBeneficiarios
        data={beneficiariosPaginados}
        resumen={resumen}
        isLoading={false}
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
          .filter((numero) => {
            if (totalPaginas <= 14) return true;
            if (paginaActual <= 7) return numero <= 14;
            if (paginaActual >= totalPaginas - 6) return numero > totalPaginas - 14;
            return Math.abs(paginaActual - numero) <= 6;
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
