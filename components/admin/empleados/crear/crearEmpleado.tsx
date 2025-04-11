'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export function CrearEmpleado() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');

  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [anioParaCopiar, setAnioParaCopiar] = useState(new Date().getFullYear());
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

  const generarOpcionesAnios = () => {
    const actual = new Date().getFullYear();
    const anios = [];
    for (let anio = 2008; anio <= actual; anio++) {
      anios.push(anio);
    }
    return anios;
  };

  const copiarDatosDeAnio = async (anio: number) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('empleados_municipales')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      return;
    }

    const existente = data?.find((empleado: any) => {
      if (!empleado.fecha_inicio) return false;
      const anioEmpleadoUTC = new Date(empleado.fecha_inicio).getUTCFullYear();
      return anioEmpleadoUTC === anio;
    });

    if (existente) {
      const resultado = await Swal.fire({
        title: 'Copiar datos',
        text: '¿Desea copiar los datos del año seleccionado?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, copiar',
        cancelButtonText: 'No',
      });

      if (resultado.isConfirmed) {
        setFormulario({
          direccion: existente.direccion ?? '',
          telefono: existente.telefono ?? '',
          dpi: existente.dpi ?? '',
          nit: existente.nit ?? '',
          igss: existente.igss ?? '',
          cargo: existente.cargo ?? '',
          banco: existente.banco ?? '',
          cuenta: existente.cuenta ?? '',
          sueldo: existente.sueldo?.toString() ?? '',
          bonificacion: existente.bonificacion?.toString() ?? '',
          fecha_inicio: '',
          fecha_finalizacion: '',
          contrato_no: existente.contrato_no ?? '',
          renglon: existente.renglon ?? '',
        });
      }
    }
  };

  useEffect(() => {
    if (userId) {
      copiarDatosDeAnio(anioParaCopiar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anioParaCopiar]);

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
    if (!formulario.fecha_inicio) {
      Swal.fire('Error', 'Debe seleccionar una fecha de inicio.', 'error');
      return;
    }
    const anioNuevo = new Date(formulario.fecha_inicio).getUTCFullYear();
    const { data, error } = await supabase
      .from('empleados_municipales')
      .select('fecha_inicio')
      .eq('user_id', userId);

    if (error) {
      console.error('Error verificando años:', error);
      Swal.fire('Error', 'Error verificando registros existentes.', 'error');
      return;
    }

    const existeMismoAnio = data?.some((empleado: any) => {
      if (!empleado.fecha_inicio) return false;
      const anioEmpleadoUTC = new Date(empleado.fecha_inicio).getUTCFullYear();
      return anioEmpleadoUTC === anioNuevo;
    });

    if (existeMismoAnio) {
      Swal.fire('Error', `Ya existe un registro para el año ${anioNuevo}.`, 'error');
      return;
    }

    const { error: errorGuardar } = await supabase.from('empleados_municipales').insert([
      {
        user_id: userId,
        ...formulario,
        sueldo: parseFloat(formulario.sueldo) || null,
        bonificacion: parseFloat(formulario.bonificacion) || null,
      },
    ]);

    if (errorGuardar) {
      console.error('Error al crear empleado:', errorGuardar);
      Swal.fire('Error', 'No se pudo guardar el empleado.', 'error');
    } else {
      Swal.fire('Éxito', 'Empleado creado exitosamente.', 'success').then(() => {
        router.push(`/protected/admin/users/ver?id=${userId}`);
      });
    }
  };

  return (
    <div className="px-4">
      {/* ✅ Botón Volver arriba */}
      <div className="flex mb-6">
        <Button
          type="button"
          className="h-10 text-white text-lg w-auto px-6 bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push(`/protected/admin/users/ver?id=${userId}`)}
        >
          Volver
        </Button>
      </div>

      {/* ✅ Card del formulario */}
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Ingresar datos para {nombreUsuario || '...'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Selector de año solo para copiar */}
          <div>
            <Label htmlFor="anio">Copiar datos de un año anterior (opcional)</Label>
            <select
              id="anio"
              className="border p-2 rounded w-full mt-1"
              value={anioParaCopiar}
              onChange={(e) => setAnioParaCopiar(Number(e.target.value))}
            >
              {generarOpcionesAnios().map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>

          {/* Campos dinámicos */}
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
                required={campo.name !== 'fecha_finalizacion'}
              />
            </div>
          ))}

          <Button type="submit" className="mt-6 h-12 text-lg">
            Crear Empleado
          </Button>
        </form>
      </div>
    </div>
  );
}
