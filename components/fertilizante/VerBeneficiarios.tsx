'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import Link from 'next/link';

interface Beneficiario {
  id: string;
  nombre_completo: string;
  dpi: string;
  lugar: string;
  fecha: string;
  codigo: string;
}

type CampoFiltro = 'nombre_completo' | 'dpi' | 'codigo';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);

const [filtros, setFiltros] = useState<{
  campo: 'nombre_completo' | 'dpi' | 'codigo';
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
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setBeneficiarios(data);
      if (error) console.error(error);
    };

    cargarDatos();
  }, []);

  const beneficiariosFiltrados = beneficiarios.filter((b) => {
    return (
      b[filtros.campo].toLowerCase().includes(filtros.valor.toLowerCase()) &&
      (filtros.lugar === '' || b.lugar === filtros.lugar)
    );
  });

  const beneficiariosPorPagina = 10;
  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="mb-4">
          <Link href="/protected/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Volver</Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold">Lista de Beneficiarios</h1>

        <Button
          onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Nuevo Beneficiario
        </Button>
      </div>

      <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} />
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
