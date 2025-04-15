'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { EmpleadoDatos } from '@/components/admin/empleados/EmpleadoDatos';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { generarPdfEmpleado } from '@/components/utils/PdfEmpleados';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

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
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [contratoSeleccionadoId, setContratoSeleccionadoId] = useState('');

  const { data, error, isLoading } = useSWR(id ? ['usuario', id] : null, () => fetchUsuario(id!));

  const contratosDelAnio = data?.empleados?.filter((empleado: any) => {
    if (!empleado.fecha_ini) return false;
    const fecha = new Date(empleado.fecha_ini);
    return fecha.getUTCFullYear() === anioSeleccionado;
  }) || [];

  useEffect(() => {
    if (!contratoSeleccionadoId && contratosDelAnio.length > 0) {
      setContratoSeleccionadoId(contratosDelAnio[0].id);
    }
  }, [contratosDelAnio, contratoSeleccionadoId]);

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }
  if (!data) return null;

  const { usuario } = data;

  const empleadoDelAnio = contratosDelAnio.find((empleado: any) => empleado.id === contratoSeleccionadoId) || contratosDelAnio[0];

  const handleGenerarPDF = () => {
    if (!empleadoDelAnio) {
      Swal.fire('Sin registros', 'No hay datos de empleado para el año seleccionado.', 'info');
      return;
    }
    generarPdfEmpleado(usuario, empleadoDelAnio);
  };

  const generarOpcionesAnios = () => {
    const actual = new Date().getFullYear();
    const anios = [];
    for (let anio = 2008; anio <= actual; anio++) {
      anios.push(anio);
    }
    return anios;
  };

  return (
    <>
      {/* Botones principales */}
      <div className="flex justify-start items-center gap-4 mb-4">
        <Button
          type="button"
          className="h-10 text-white text-xl w-auto px-4 bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push(`/protected/admin/users`)}
        >
          Volver a usuarios
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 text-white text-2xl w-auto px-4 bg-green-600 hover:bg-green-700">
              Reporte
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="py-4 px-4 bg-background shadow-md rounded-md border border-border">
            <DropdownMenuItem className="cursor-pointer text-2xl hover:bg-muted px-2 py-1 rounded" onClick={handleGenerarPDF}>
              Descargar
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-2xl hover:bg-muted px-2 py-1 rounded" onClick={handleGenerarPDF}>
              Ver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card principal */}
      <div className="max-w-4xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Informe de Datos de <br /> Empleado Municipal</h1>
          {contratoSeleccionadoId && (
            <Button
              className="h-10 text-white text-xl w-auto ml-5 px-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push(`/protected/admin/empleado/editar?id=${contratoSeleccionadoId}`)}
            >
              Editar Contrato
            </Button>
          )}
        </div>

        {/* Datos de Usuario */}
        <div className="border-t border-b divide-y divide-border text-xl">
          {[
            { label: 'USUARIO', value: usuario.email },
            { label: 'NOMBRE', value: usuario.nombre },
            { label: 'ROL', value: usuario.rol },
          ].map(({ label, value }) => (
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

        {/* Selector de año */}
        <div className="my-6">
          <label className="block text-sm mb-2 font-bold">Seleccionar año:</label>
          <select
            className="border rounded p-2 w-full"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
          >
            {generarOpcionesAnios().map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de contrato */}
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

        {/* Datos del contrato */}
        <div className="mt-6">
          {empleadoDelAnio ? (
            <div className="mb-6">
              <EmpleadoDatos empleado={empleadoDelAnio} />
              <div className="flex justify-center mt-6 gap-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xl"
                  onClick={() => router.push(`/protected/admin/empleado/editar?id=${contratoSeleccionadoId}`)}
                  disabled={!contratoSeleccionadoId}
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
    </>
  );
}
