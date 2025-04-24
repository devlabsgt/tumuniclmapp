'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { EmpleadoDatos } from '@/components/admin/empleados/EmpleadoDatos';
import { generarPdfEmpleado } from '@/components/utils/PdfEmpleados';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const fetchUsuario = async (id: string): Promise<{ usuario: any; empleados: any[] }> => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: usuarios, error: errorUsuarios } = await supabase.rpc('obtener_usuarios');
  if (errorUsuarios || !usuarios) throw new Error('Error al obtener usuarios');

  const usuario = usuarios.find((u: any) => u.id === id);
  if (!usuario) throw new Error('Usuario no encontrado');

  const { data: empleados } = await supabase
    .from('empleados_municipales')
    .select('*')
    .eq('user_id', id)
    .order('fecha_ini', { ascending: true });

  return { usuario, empleados: empleados || [] };
};

export function UsuarioPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());
  const [contratoSeleccionadoId, setContratoSeleccionadoId] = useState('');

  const { data, error, isLoading } = useSWR(id ? ['usuario', id] : null, () => fetchUsuario(id!));

  const aniosDisponibles = useMemo(() => {
    if (!data?.empleados) return [];
    const anios = new Set<number>();
    data.empleados.forEach((emp: any) => {
      if (emp.fecha_ini) anios.add(new Date(emp.fecha_ini).getUTCFullYear());
    });
    return Array.from(anios).sort((a, b) => b - a);
  }, [data?.empleados]);

  useEffect(() => {
    if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(anioSeleccionado)) {
      setAnioSeleccionado(aniosDisponibles[0]);
    }
  }, [aniosDisponibles]);

  const contratosDelAnio = useMemo(() => {
    return data?.empleados?.filter((empleado: any) => {
      const fecha = new Date(empleado.fecha_ini);
      return fecha.getUTCFullYear() === anioSeleccionado;
    }) || [];
  }, [data?.empleados, anioSeleccionado]);

  useEffect(() => {
    if (contratosDelAnio.length > 0) {
      setContratoSeleccionadoId(contratosDelAnio[0].id);
    } else {
      setContratoSeleccionadoId('');
    }
  }, [contratosDelAnio]);

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }
  if (!data) return null;

  const { usuario } = data;

  const empleadoDelAnio = contratosDelAnio.find(
    (empleado: any) => empleado.id === contratoSeleccionadoId
  );

  const handleGenerarPDF = () => {
    if (!empleadoDelAnio) {
      Swal.fire('Sin registros', 'No hay datos de empleado para el año seleccionado.', 'info');
      return;
    }
    generarPdfEmpleado(usuario, empleadoDelAnio);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
      <div className="flex items-center justify-between mb-2">
        <Button
          type="button"
          className="h-10 text-white text-xl w-auto p-4 bg-blue-600 hover:bg-blue-700 mb-5"
          onClick={() => router.push(`/protected/admin/users`)}
        >
          Volver
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 text-white text-xl w-auto p-4 bg-blue-600 hover:bg-blue-700 mb-5">
              Acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="py-2 px-2 bg-background shadow-md rounded-md border border-border">
            <DropdownMenuItem
              className="cursor-pointer text-lg hover:bg-muted px-2 py-2 rounded"
              onClick={() => router.push(`/protected/admin/users/editar?id=${usuario.id}`)}
            >
              Editar usuario
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-lg hover:bg-muted px-2 py-2 rounded"
              onClick={handleGenerarPDF}
            >
              Generar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Informe de Datos de Empleado Municipal</h1>
      </div>

      <div className="border-t border-b divide-y divide-border text-xl">
        {[{ label: 'USUARIO', value: usuario.email }, { label: 'NOMBRE', value: usuario.nombre }, { label: 'ROL', value: usuario.rol }].map(({ label, value }) => (
          <div key={label} className="flex py-3 items-center gap-4">
            <strong className="min-w-[140px]">{label}</strong>
            <span className="flex-1">{value}</span>
          </div>
        ))}
        <div className="flex py-3 items-center gap-4">
          <strong className="min-w-[140px]">ESTADO</strong>
          <span className="flex items-center gap-2 flex-1">
            {usuario.activo === 'true' || usuario.activo === true ? (
              <span className="text-green-600">🟢 Activo</span>
            ) : (
              <span className="text-red-600">🔴 Inactivo</span>
            )}
          </span>
        </div>
      </div>

      <div className="my-6">
        {aniosDisponibles.length > 0 ? (
          <>
            <label className="block text-sm mb-2 font-bold">Seleccionar año:</label>
            <select
              className="border rounded p-2 w-full"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </>
        ) : (
          <div className="text-center text-red-600 text-lg font-semibold">
            No se ha ingresado ningún contrato
          </div>
        )}
      </div>

      {contratosDelAnio.length > 0 && (
        <div className="my-6">
          <label className="block text-sm mb-2 font-bold">Seleccionar contrato:</label>
          <select
            className="border rounded p-2 w-full"
            value={contratoSeleccionadoId}
            onChange={(e) => setContratoSeleccionadoId(e.target.value)}
          >
            {contratosDelAnio.map((contrato: any) => {
              const fechaIni = new Date(contrato.fecha_ini);
              const fechaFin = contrato.fecha_fin ? new Date(contrato.fecha_fin) : null;
              const fechaIniTexto = `${String(fechaIni.getUTCDate()).padStart(2, '0')}/${String(fechaIni.getUTCMonth() + 1).padStart(2, '0')}/${fechaIni.getUTCFullYear()}`;
              const fechaFinTexto = fechaFin
                ? `${String(fechaFin.getUTCDate()).padStart(2, '0')}/${String(fechaFin.getUTCMonth() + 1).padStart(2, '0')}/${fechaFin.getUTCFullYear()}`
                : 'Actual';
              return (
                <option key={contrato.id} value={contrato.id}>
                  {fechaIniTexto} - {fechaFinTexto}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="mt-6">
        {empleadoDelAnio ? (
          <div className="mb-6">
            <EmpleadoDatos empleado={empleadoDelAnio} />
            <div className="flex justify-center mt-6 gap-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xl"
                onClick={() => router.push(`/protected/admin/empleado/editar?id=${contratoSeleccionadoId}`)}
              >
                Editar Contrato
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white text-xl"
                onClick={() => router.push(`/protected/admin/empleado/crear?user_id=${usuario.id}`)}
              >
                Ingresar nuevo contrato
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-4">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white text-2xl"
              onClick={() => router.push(`/protected/admin/empleado/crear?user_id=${usuario.id}`)}
            >
              Ingresar nuevo contrato
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
