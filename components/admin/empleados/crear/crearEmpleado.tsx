'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';

export function CrearEmpleado() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');

  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [formulario, setFormulario] = useState({
    direccion: '',
    telefono: '',
    dpi: '',
    nit: '',
    igss: '',
    cargo: '',
    banco: '',
    cuenta: '',
    sueldo: '',
    bonificacion: '',
    fecha_inicio: '',
    fecha_finalizacion: '',
    contrato_no: '',
    renglon: '',
  });

  useEffect(() => {
    const obtenerNombre = async () => {
      if (!userId) return;

      const { data, error } = await supabase.rpc('obtener_usuarios');
      if (!error && data) {
        const usuario = data.find((u: any) => u.id === userId);
        if (usuario) {
          setNombreUsuario(usuario.nombre);
        }
      }
    };
    obtenerNombre();
  }, [userId, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert('No se encontró el ID de usuario.');
      return;
    }

    const { error } = await supabase.from('empleados_municipales').insert([
      {
        user_id: userId,
        ...formulario,
        sueldo: parseFloat(formulario.sueldo) || null,
        bonificacion: parseFloat(formulario.bonificacion) || null,
      },
    ]);

    if (error) {
      console.error('Error al crear empleado:', error);
      alert('Error al guardar empleado.');
    } else {
      router.push(`/protected/admin/users/ver?id=${userId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-md rounded">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Ingresar datos para {nombreUsuario || '...'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Formulario dinámico */}
        {[
          { label: 'Dirección', name: 'direccion' },
          { label: 'Teléfono', name: 'telefono' },
          { label: 'DPI', name: 'dpi' },
          { label: 'NIT', name: 'nit' },
          { label: 'IGSS', name: 'igss' },
          { label: 'Cargo', name: 'cargo' },
          { label: 'Banco', name: 'banco' },
          { label: 'Cuenta', name: 'cuenta' },
          { label: 'Sueldo', name: 'sueldo' },
          { label: 'Bonificación', name: 'bonificacion' },
          { label: 'Fecha de Inicio', name: 'fecha_inicio', type: 'date' },
          { label: 'Fecha de Finalización', name: 'fecha_finalizacion', type: 'date' },
          { label: 'Contrato No.', name: 'contrato_no' },
          { label: 'Renglón', name: 'renglon' },
        ].map((campo) => (
          <div key={campo.name}>
            <Label htmlFor={campo.name}>{campo.label}</Label>
            <Input
              type={campo.type || 'text'}
              id={campo.name}
              name={campo.name}
              value={formulario[campo.name as keyof typeof formulario]}
              onChange={handleChange}
              className="mt-1"
              required={campo.name !== 'fecha_finalizacion'} // fecha final opcional
            />
          </div>
        ))}

        <Button type="submit" className="mt-6 h-12 text-lg">
          Crear Empleado
        </Button>
      </form>
    </div>
  );
}
