'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { camposFormulario } from '../EmpleadoCampos';
import { EmpleadoForm } from '../EmpleadoForm';
import Swal from 'sweetalert2';

function inicializarFormulario() {
  return camposFormulario.reduce((acc, campo) => ({ ...acc, [campo.name]: '' }), {} as any);
}

export default function EditarEmpleadoForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contratoId = searchParams.get('id') || '';

  const [formulario, setFormulario] = useState(inicializarFormulario);
  const [original, setOriginal] = useState(inicializarFormulario);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!contratoId) return;

    const cargarContrato = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('empleados_municipales')
        .select('*')
        .eq('id', contratoId)
        .single();

      if (error || !data) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar el contrato.', 'error');
        return;
      }

      const datos = inicializarFormulario();
      camposFormulario.forEach((campo) => {
        if (campo.type === 'date' && data[campo.name]) {
          datos[campo.name] = data[campo.name].split('T')[0]; // "YYYY-MM-DD"
        } else {
          datos[campo.name] = data[campo.name]?.toString() || '';
        }
      });
      setFormulario(datos);
      setOriginal(datos);
    };

    cargarContrato();
  }, [contratoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario((prev: any) => ({ ...prev, [name]: value }));
  };

  const hayCambios = useMemo(() => {
    return JSON.stringify(formulario) !== JSON.stringify(original);
  }, [formulario, original]);
const actualizarEmpleado = async () => {
  if (!contratoId || !hayCambios) {
    Swal.fire({ icon: 'info', title: 'Sin cambios', text: 'No hiciste ninguna modificación.' });
    return;
  }

  setCargando(true);

  const supabase = createClient();

  // Primero traemos el contrato actual para sacar user_id
  const { data: contratoActual, error: errorContrato } = await supabase
    .from('empleados_municipales')
    .select('user_id')
    .eq('id', contratoId)
    .single();

  if (errorContrato || !contratoActual) {
    setCargando(false);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo verificar contrato actual.' });
    return;
  }

  const userId = contratoActual.user_id;

  // Ahora traemos todos los contratos del usuario
  const { data: contratos, error: errorContratos } = await supabase
    .from('empleados_municipales')
    .select('id, fecha_ini, fecha_fin')
    .eq('user_id', userId);

  if (errorContratos) {
    setCargando(false);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo verificar contratos existentes.' });
    return;
  }

  // Convertimos fechas
  const nuevaFechaIni = new Date(formulario.fecha_ini);
  const nuevaFechaFin = new Date(formulario.fecha_fin);

  const seCruzan = contratos?.some((contrato: any) => {
    if (contrato.id === contratoId) return false; // Ignorar el mismo contrato que editamos
    const ini = new Date(contrato.fecha_ini);
    const fin = new Date(contrato.fecha_fin);
    return nuevaFechaIni <= fin && nuevaFechaFin >= ini;
  });

  if (seCruzan) {
    setCargando(false);
    Swal.fire({ icon: 'error', title: 'Error', text: 'Las nuevas fechas se cruzan con otro contrato.' });
    return;
  }

  // Si todo bien, actualizamos
  const res = await fetch('/api/empleados/editar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: contratoId,
      data: {
        ...formulario,
        salario: formulario.salario ? parseFloat(formulario.salario) : null,
        bonificación: formulario.bonificación ? parseFloat(formulario.bonificación) : null,
      },
    }),
  });

  const json = await res.json();
  setCargando(false);

  if (!res.ok) {
    Swal.fire({ icon: 'error', title: 'Error', text: json.error || 'No se pudo actualizar el contrato.' });
    return;
  }

  Swal.fire({ icon: 'success', title: 'Contrato actualizado' }).then(() => {
    router.back();
  });
};


  if (!contratoId) return <p className="p-4 text-center">ID de contrato no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      <EmpleadoForm formulario={formulario} handleChange={handleChange} />
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
