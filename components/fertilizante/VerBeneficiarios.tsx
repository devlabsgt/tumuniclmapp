'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import { generarPdfBeneficiarios } from '@/components/utils/PdfBeneficiarios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
}

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';
type OrdenFiltro = 'created_at' | 'nombre_completo' | 'fecha' | 'codigo';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('created_at');

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

    cargarDatos();
  }, []);

  const beneficiariosFiltrados = beneficiarios
    .filter((b) => {
      return (
        b[filtros.campo].toLowerCase().includes(filtros.valor.toLowerCase()) &&
        (filtros.lugar === '' || b.lugar === filtros.lugar)
      );
    })
    .sort((a, b) => {
      if (orden === 'created_at') return 0;
      if (orden === 'fecha') return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return a[orden].localeCompare(b[orden]);
    });

  const beneficiariosPorPagina = 10;
  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
    <div className="flex items-center justify-between mb-6 h-12 gap-2 flex-wrap">
      <div className="flex items-center h-full">
        <Button
          onClick={() => router.push('/protected/')}
          className="h-full bg-blue-600 hover:bg-blue-700 text-white px-4"
        >
          Atrás
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-center flex-1">Lista de Beneficiarios</h1>

      <div className="flex gap-2 h-full">
        <Button
          onClick={() => generarPdfBeneficiarios(beneficiariosFiltrados)}
          className="h-full bg-green-600 hover:bg-green-700 text-white px-4"
        >
          Generar Reporte PDF
        </Button>
        <Button
          onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')}
          className="h-full bg-blue-600 hover:bg-blue-700 text-white px-4"
        >
          Nuevo Beneficiario
        </Button>
      </div>
    </div>




      {/* Filtros en una fila */}
      <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} />


      {/* Filtro de orden abajo */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap font-semibold">Ordenar por:  </span>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as OrdenFiltro)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="created_at">Orden de ingreso</option>
          <option value="nombre_completo">Nombre</option>
          <option value="fecha">Fecha</option>
          <option value="codigo">Formulario</option>
        </select>
      </div>
      
      <TablaBeneficiarios data={beneficiariosPaginados} />

      <div className="flex justify-center mt-4 gap-2">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i}
            onClick={() => setPaginaActual(i + 1)}
            className={`px-4 py-2 rounded border ${
              paginaActual === i + 1 ? 'bg-blue-600 text-white' : 'bg-white'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
