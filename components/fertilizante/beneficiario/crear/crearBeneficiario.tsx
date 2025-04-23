'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Formulario } from './Formulario';

export function CrearBeneficiario() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dpi: '',
    lugar: '',
    fecha: '',
    codigo: '',
    // img: '', // Imagen comentada por decisión
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const camposRequeridos = ['nombre_completo', 'dpi', 'lugar', 'fecha', 'codigo'];
    const vacios = camposRequeridos.some(
      (campo) => !formulario[campo as keyof typeof formulario]?.trim()
    );

    if (vacios) {
      Swal.fire('Error', 'Complete todos los campos obligatorios.', 'error');
      return;
    }

    // 🔍 Verificar DPI
    const { data: existeDpi, error: errorDpi } = await supabase
      .from('beneficiarios_fertilizante')
      .select('id')
      .eq('dpi', formulario.dpi)
      .maybeSingle();

    if (errorDpi) {
      console.error(errorDpi);
      Swal.fire('Error', 'Error al verificar el DPI.', 'error');
      return;
    }

    if (existeDpi) {
      Swal.fire('Error', 'El DPI ya está registrado.', 'error');
      return;
    }

    // 🔍 Verificar CÓDIGO
    const { data: existeCodigo, error: errorCodigo } = await supabase
      .from('beneficiarios_fertilizante')
      .select('id')
      .eq('codigo', formulario.codigo)
      .maybeSingle();

    if (errorCodigo) {
      console.error(errorCodigo);
      Swal.fire('Error', 'Error al verificar el Código.', 'error');
      return;
    }

    if (existeCodigo) {
      Swal.fire('Error', 'El Código ya está registrado.', 'error');
      return;
    }

    // ✅ Insertar si todo está bien
    const { error } = await supabase
      .from('beneficiarios_fertilizante')
      .insert([formulario]);

    if (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo registrar el beneficiario.', 'error');
    } else {
      Swal.fire('Éxito', 'Beneficiario registrado correctamente.', 'success').then(() => {
        router.push('/protected/fertilizante/beneficiarios');
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-center mb-4">Registrar Beneficiario de Fertilizante</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Formulario formulario={formulario} onChange={handleChange} />
        <Button type="submit" className="mt-4 h-11 text-lg">
          Crear Beneficiario
        </Button>
      </form>
    </div>
  );
}
