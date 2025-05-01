'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Formulario } from './Formulario';
import CampoDPI from './CampoDPI';

export function CrearBeneficiario() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  const [dpi, setDpi] = useState('');
  const [beneficiarioExiste, setBeneficiarioExiste] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dpi: '',
    lugar: '',
    fecha: '',
    codigo: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

const verificarDPI = async () => {
  if (!dpi.trim()) {
    Swal.fire('Error', 'Ingrese un DPI válido.', 'error');
    return;
  }

  const { data, error } = await supabase
    .from('beneficiarios_fertilizante')
    .select('*')
    .eq('dpi', dpi)
    .maybeSingle();

  if (error) {
    Swal.fire('Error', 'Error al verificar el DPI.', 'error');
    return;
  }

  if (data) {
    Swal.fire({
      title: 'Beneficiario ya existe',
      html: `
        <strong>Nombre:</strong> ${data.nombre_completo}<br/>
        <strong>Lugar:</strong> ${data.lugar}<br/>
        <strong>Fecha:</strong> ${data.fecha}<br/>
        <strong>Código:</strong> ${data.codigo}
      `,
      icon: 'info',
    });
  } else {
    setFormulario((prev) => ({ ...prev, dpi }));
    setMostrarFormulario(true);
  }
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

    const { error } = await supabase
      .from('beneficiarios_fertilizante')
      .insert([formulario]);

    if (error) {
      Swal.fire('Error', 'No se pudo registrar el beneficiario.', 'error');
    } else {
      Swal.fire('Éxito', 'Beneficiario registrado correctamente.', 'success').then(() => {
        router.push('/protected/fertilizante/beneficiarios');
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-center mb-4">
        Registrar Beneficiario de Fertilizante
      </h1>

      {!mostrarFormulario && (
        <CampoDPI dpi={dpi} setDpi={setDpi} verificarDPI={verificarDPI} />
      )}


      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Formulario formulario={formulario} onChange={handleChange} />
          <Button type="submit" className="mt-4 h-11 text-lg">
            Crear Beneficiario
          </Button>
        </form>
      )}
    </div>
  );
}
