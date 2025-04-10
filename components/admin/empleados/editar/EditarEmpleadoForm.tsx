'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';

export default function EditarEmpleadoForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('user_id');
  const anio = searchParams.get('anio') ? parseInt(searchParams.get('anio')!, 10) : null;

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

  const [original, setOriginal] = useState(formulario);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!userId || !anio) return;
    const supabase = createClient();

    const cargarEmpleado = async () => {
      const { data, error } = await supabase
        .from('empleados_municipales')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error(error);
        return;
      }

      const empleadoDelAnio = data?.find((empleado: any) => {
        if (!empleado.fecha_inicio) return false;
        const anioEmpleado = new Date(empleado.fecha_inicio).getFullYear();
        return anioEmpleado === anio;
      });

      if (empleadoDelAnio) {
        const datos = {
          direccion: empleadoDelAnio.direccion || '',
          telefono: empleadoDelAnio.telefono || '',
          dpi: empleadoDelAnio.dpi || '',
          nit: empleadoDelAnio.nit || '',
          igss: empleadoDelAnio.igss || '',
          cargo: empleadoDelAnio.cargo || '',
          banco: empleadoDelAnio.banco || '',
          cuenta: empleadoDelAnio.cuenta || '',
          sueldo: empleadoDelAnio.sueldo?.toString() || '',
          bonificacion: empleadoDelAnio.bonificacion?.toString() || '',
          fecha_inicio: empleadoDelAnio.fecha_inicio || '',
          fecha_finalizacion: empleadoDelAnio.fecha_finalizacion || '',
          contrato_no: empleadoDelAnio.contrato_no || '',
          renglon: empleadoDelAnio.renglon || '',
        };
        setFormulario(datos);
        setOriginal(datos);
      } else {
        Swal.fire('Error', `No se encontró un registro para el año ${anio}.`, 'error');
      }
    };

    cargarEmpleado();
  }, [userId, anio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hayCambios = JSON.stringify(formulario) !== JSON.stringify(original);

  const actualizarEmpleado = async () => {
    if (!userId || !hayCambios) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No hiciste ninguna modificación.',
      });
      return;
    }

    setCargando(true);

    const res = await fetch('/api/empleados/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        fecha_inicio: formulario.fecha_inicio, // Para identificar el registro exacto
        data: {
          ...formulario,
          sueldo: formulario.sueldo ? parseFloat(formulario.sueldo) : null,
          bonificacion: formulario.bonificacion ? parseFloat(formulario.bonificacion) : null,
        },
      }),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: json.error || 'No se pudo actualizar el empleado.',
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Empleado actualizado',
    }).then(() => router.push(`/protected/admin/users/ver?id=${userId}`));
  };

  if (!userId || !anio) return <p className="p-4 text-center">ID o Año no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
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
        { label: 'Fecha Inicio', name: 'fecha_inicio', type: 'date' },
        { label: 'Fecha Finalización', name: 'fecha_finalizacion', type: 'date' },
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
            required={campo.name !== 'fecha_finalizacion'}
          />
        </div>
      ))}

      <Button
        onClick={actualizarEmpleado}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4"
      >
        {cargando ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  );
}
