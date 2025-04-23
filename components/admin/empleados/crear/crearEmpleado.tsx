'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { EmpleadoForm } from '../EmpleadoForm';
import { camposFormulario } from '../EmpleadoCampos';

export function CrearEmpleado() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [formulario, setFormulario] = useState(() =>
    camposFormulario.reduce((acc, campo) => ({ ...acc, [campo.name]: '' }), {} as any)
  );
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratoSeleccionadoId, setContratoSeleccionadoId] = useState('');

  useEffect(() => {
    if (!userId) return;

    const cargarDatos = async () => {
      const { data: usuarios } = await supabase.rpc('obtener_usuarios');
      const usuario = usuarios?.find((u: any) => u.id === userId);
      if (usuario) setNombreUsuario(usuario.nombre);

      const { data: empleados } = await supabase
        .from('empleados_municipales')
        .select('*')
        .eq('user_id', userId)
        .order('fecha_ini', { ascending: true });

      if (empleados) {
        setContratos(empleados);
      }
    };

    cargarDatos();
  }, [userId]);

  const copiarDatosContrato = async () => {
    const contrato = contratos.find((c) => c.id === contratoSeleccionadoId);
    if (!contrato) {
      Swal.fire('Error', 'Seleccione un contrato válido para copiar.', 'error');
      return;
    }

    const resultado = await Swal.fire({
      title: 'Copiar datos',
      text: '¿Desea copiar los datos del contrato seleccionado?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, copiar',
      cancelButtonText: 'No',
    });

    if (resultado.isConfirmed) {
      const nuevoFormulario = {} as any;
      camposFormulario.forEach((campo) => {
        nuevoFormulario[campo.name] = contrato[campo.name] ?? '';
      });
      setFormulario(nuevoFormulario);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      Swal.fire('Error', 'ID de usuario no encontrado.', 'error');
      return;
    }

    const { fecha_ini, fecha_fin } = formulario;

    if (!fecha_ini || !fecha_fin) {
      Swal.fire('Error', 'Debe seleccionar fecha de inicio y finalización.', 'error');
      return;
    }

    const fechaInicio = new Date(fecha_ini);
    const fechaFin = new Date(fecha_fin);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      Swal.fire('Error', 'Formato de fecha inválido.', 'error');
      return;
    }

    if (fechaInicio > fechaFin) {
      Swal.fire('Error', 'La fecha de inicio no puede ser posterior a la de finalización.', 'error');
      return;
    }

    const { data: existentes } = await supabase
      .from('empleados_municipales')
      .select('fecha_ini, fecha_fin')
      .eq('user_id', userId);

    const seCruzan = existentes?.some((emp: any) => {
      const ini = new Date(emp.fecha_ini);
      const fin = new Date(emp.fecha_fin);
      return fechaInicio <= fin && fechaFin >= ini;
    });

    if (seCruzan) {
      Swal.fire('Error', 'Las fechas se cruzan con un contrato existente.', 'error');
      return;
    }

    const { error } = await supabase.from('empleados_municipales').insert([{
      user_id: userId,
      ...formulario,
      salario: parseFloat(formulario.salario) || null,
      bonificación: parseFloat(formulario.bonificación) || null,
    }]);

    if (error) {
      console.error('Error al guardar:', error);
      Swal.fire('Error', 'No se pudo guardar el empleado.', 'error');
    } else {
      Swal.fire('Éxito', 'Empleado creado exitosamente.', 'success').then(() => {
        router.push(`/protected/admin/users/ver?id=${userId}`);
      });
    }
  };

  return (
    <div className="px-4">
      <div className="flex mb-6">
        <Button
          type="button"
          className="h-10 text-white text-lg w-auto px-6 bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push(`/protected/admin/users/ver?id=${userId}`)}
        >
          Volver
        </Button>
      </div>

      <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded">
        <h1 className="text-2xl mb-6 text-center">
          Ingresar datos para: <br/><strong>{nombreUsuario || '...'}</strong>
        </h1>

        {/* Selector de contratos existentes */}
        <div className="mb-6">
          <label className="font-semibold block mb-2">Copiar datos de contrato existente (opcional)</label>
          <div className="flex gap-2">
            <select
              className="border rounded p-2 flex-1"
              value={contratoSeleccionadoId}
              onChange={(e) => setContratoSeleccionadoId(e.target.value)}
            >
              {contratos.length > 0 ? (
                <>
                  <option value="">Seleccione un contrato...</option>
                  {contratos.map((contrato) => {
                    const fechaIni = new Date(contrato.fecha_ini);
                    const fechaFin = new Date(contrato.fecha_fin);
                    return (
                      <option key={contrato.id} value={contrato.id}>
                        {fechaIni.toLocaleDateString()} - {fechaFin.toLocaleDateString()}
                      </option>
                    );
                  })}
                </>
              ) : (
                <option value="">No hay contratos previos ingresados</option>
              )}
            </select>

            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={copiarDatosContrato}
              disabled={!contratoSeleccionadoId}
            >
              Copiar datos
            </Button>
          </div>
        </div>

        {/* Formulario de ingreso */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <EmpleadoForm formulario={formulario} handleChange={handleChange} />

          <Button type="submit" className="mt-6 h-12 text-lg">
            Crear Empleado
          </Button>
        </form>
      </div>
    </div>
  );
}
