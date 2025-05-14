'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import { generarPdfBeneficiarios } from '@/components/utils/PdfBeneficiarios';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
  telefono?: string;
  sexo?: string;
}

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';
type OrdenFiltro = 
  'nombre_completo_asc' | 'nombre_completo_desc' |
  'fecha_asc' | 'fecha_desc' |
  'codigo_asc' | 'codigo_desc';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('codigo_asc');
  const [userRole, setUserRole] = useState<'Admin' | 'User' | null>(null);

  const [filtros, setFiltros] = useState<{
    campo: CampoFiltro;
    valor: string;
    lugar: string;
  }>({
    campo: 'nombre_completo',
    valor: '',
    lugar: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      const { data, error } = await supabase
        .from('beneficiarios_fertilizante')
        .select('*');

      if (data) setBeneficiarios(data);
      if (error) console.error(error);
    };

    const obtenerUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const rol = user?.user_metadata?.rol || 'User'; // fallback a "user" si no tiene
      setUserRole(rol);
    };

    cargarDatos();
    obtenerUsuario();
  }, []);

  const beneficiariosFiltrados = beneficiarios
    .filter((b) => {
      return (
        b[filtros.campo].toLowerCase().includes(filtros.valor.toLowerCase()) &&
        (filtros.lugar === '' || b.lugar === filtros.lugar)
      );
    })
    .sort((a, b) => {
      switch (orden) {
        case 'nombre_completo_asc':
          return a.nombre_completo.localeCompare(b.nombre_completo);
        case 'nombre_completo_desc':
          return b.nombre_completo.localeCompare(a.nombre_completo);
        case 'fecha_asc':
          return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        case 'fecha_desc':
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        case 'codigo_asc':
          return a.codigo.localeCompare(b.codigo);
        case 'codigo_desc':
          return b.codigo.localeCompare(a.codigo);
        default:
          return 0;
      }
    });

  const beneficiariosPorPagina = 10;
  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  const resumen = {
    total: beneficiariosFiltrados.length,
    hombres: beneficiariosFiltrados.filter(b => b.sexo?.toUpperCase() === 'M').length,
    mujeres: beneficiariosFiltrados.filter(b => b.sexo?.toUpperCase() === 'F').length,
  };
  

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
      variant="link"
      onClick={manejarVolver}
      className="text-blue-600 text-base px-0 underline"
    >
      Volver
    </Button>
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
  <h1 className="text-2xl font-bold text-left">
    Lista de Beneficiarios
  </h1>

  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
    <Button
      onClick={() => generarPdfBeneficiarios(beneficiariosFiltrados)}
      className="h-12 bg-green-600 hover:bg-green-700 text-white px-4 w-full sm:w-auto"
    >
      Generar Reporte PDF
    </Button>
    <Button
      onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')}
      className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-4 w-full sm:w-auto"
    >
      Nuevo Beneficiario
    </Button>
  </div>
</div>


      {/* Filtros en una fila */}
      <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} />


      {/* Filtro de orden abajo */}
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


  </select>
</div>

      
<TablaBeneficiarios data={beneficiariosPaginados} resumen={resumen} />

<div className="flex justify-center mt-4 gap-2 flex-wrap">
  {/* Flecha izquierda */}
  <button
    onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
    disabled={paginaActual === 1}
    className={`px-3 py-2 rounded border ${paginaActual === 1 ? 'bg-gray-200 text-gray-500' : 'bg-white'}`}
  >
    ←
  </button>

  {/* Botones de página (dinámicos, máximo 14 números visibles) */}
  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .filter((numero) => {
      if (totalPaginas <= 14) return true; // Si hay pocas páginas, mostrar todas
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

  {/* Flecha derecha */}
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
