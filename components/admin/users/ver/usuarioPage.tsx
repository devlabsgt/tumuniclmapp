'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useEffect, useMemo, useState, Fragment } from 'react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import BotonEditar from '@/components/ui/botones/BotonEditar';
import BotonGenerarPDF from '@/components/ui/botones/BotonGenerarPDF';
import { generarPdfEmpleado } from '@/components/utils/PdfEmpleados';
import { ArrowLeft, FileText, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import type { Route } from 'next';

const fetchUsuario = async (id: string) => {
  const res = await fetch('/api/users/ver', {
    method: 'POST',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  if (!res.ok || !json?.usuario) {
    console.error('Respuesta del backend:', json);
    throw new Error(json.error || 'Error al obtener usuario');
  }

  return json.usuario;
};

export function UsuarioPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [mostrarModal, setMostrarModal] = useState(false);

  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());
  const [contratoSeleccionadoId, setContratoSeleccionadoId] = useState('');

  const { data: usuario, error, isLoading } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );

  const aniosDisponibles = useMemo(() => {
    if (!usuario?.empleados) return [];
    const anios = new Set<number>();
    usuario.empleados.forEach((emp: any) => {
      if (emp.fecha_ini) anios.add(new Date(emp.fecha_ini).getUTCFullYear());
    });
    return Array.from(anios).sort((a, b) => b - a);
  }, [usuario?.empleados]);

  const contratosDelAnio = useMemo(() => {
    return usuario?.empleados?.filter((emp: any) => {
      const fecha = new Date(emp.fecha_ini);
      return fecha.getUTCFullYear() === anioSeleccionado;
    }) || [];
  }, [usuario?.empleados, anioSeleccionado]);

  useEffect(() => {
    if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(anioSeleccionado)) {
      setAnioSeleccionado(aniosDisponibles[0]);
    }
  }, [aniosDisponibles]);

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
  if (!usuario) return null;

  const empleadoDelAnio = contratosDelAnio.find((e: any) => e.id === contratoSeleccionadoId);

  const handleGenerarPDF = () => {
    if (!empleadoDelAnio) {
      Swal.fire('Sin registros', 'No hay datos de empleado para el año seleccionado.', 'info');
      return;
    }
    generarPdfEmpleado(usuario, empleadoDelAnio);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
    <div className="flex justify-between items-center mb-4">
      <div>
        <BotonVolver ruta="/protected/admin/users" />
      </div>

      {(usuario.permisos?.includes('TODO') || usuario.permisos?.includes('IMPRIMIR')) && (
        <div>
          <BotonGenerarPDF onGenerar={handleGenerarPDF} />
        </div>
      )}

      {(usuario.permisos?.includes('TODO') || usuario.permisos?.includes('EDITAR')) && (
        <div>
          <BotonEditar ruta={`/protected/admin/users/editar?id=${usuario.id}`} />
        </div>
      )}


    </div>



      <h1 className="text-2xl font-bold mb-4">Informe de Datos de Empleado Municipal</h1>

      <div className="mt-4 border-[2.5px] border-gray-400 overflow-x-auto text-xl">
        <table className="w-full border-collapse border-[2.5px] border-gray-300">
          <thead className="bg-gray-200">
            <tr className="text-left text-2xl font-semibold">
              <th className="p-2 border-[1.5px] border-gray-300">Campo</th>
              <th className="p-2 border-[1.5px] border-gray-300">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold min-w-[140px]">Usuario</td>
              <td className="p-2 border-[1.5px] border-gray-300">{usuario.email}</td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Nombre</td>
              <td className="p-2 border-[1.5px] border-gray-300">{usuario.nombre || 'Sin nombre registrado'}</td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Rol</td>
              <td className="p-2 border-[1.5px] border-gray-300">
                <Button variant="ghost" className="text-black-600 text-lg py-0 px-1" onClick={() => setMostrarModal(true)}>
                  {usuario.rol || 'Sin rol'}
                </Button>
              </td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Estado</td>
              <td className="p-2 border-[1.5px] border-gray-300">
                {usuario.activo === true || usuario.activo === 'true' ? '🟢 Activo' : '🔴 Inactivo'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal Permisos y Módulos */}
      <Transition show={mostrarModal} as={Fragment}>
        <Dialog onClose={() => setMostrarModal(false)} className="relative z-50">
          <TransitionChild as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/30" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100" leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <DialogPanel className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4 text-center">
                  Permisos y Módulos que tiene el Rol: <span className='text-blue-500'>{usuario.rol}</span>
                </DialogTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Permisos */}
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                    <h3 className="text-base font-semibold mb-3 text-gray-700">Permisos del Rol</h3>
                    <div className="flex flex-wrap gap-2">
                      {usuario.permisos?.length ? (
                        usuario.permisos.map((permiso: string) => (
                          <span
                            key={permiso}
                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-sm border border-blue-300"
                          >
                            {permiso}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Sin permisos</span>
                      )}
                    </div>
                  </div>

                  {/* Módulos */}
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
                    <h3 className="text-base font-semibold mb-3 text-gray-700">Módulos con acceso</h3>
                    <div className="flex flex-wrap gap-2">
                      {usuario.modulos?.length ? (
                        usuario.modulos.map((modulo: string) => (
                          <span
                            key={modulo}
                            className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-sm border border-green-300"
                          >
                            {modulo}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Sin módulos</span>
                      )}
                    </div>
                  </div>
                </div>



                <div className="mt-6 text-right">
                  <Button variant="outline" onClick={() => setMostrarModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Selección de año y contrato */}
      <div className="my-6">
        {aniosDisponibles.length > 0 ? (
          <>
            <label className="block text-sm mb-2 font-bold">Seleccionar año:</label>
            <select className="border rounded p-2 w-full" value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(Number(e.target.value))}>
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className="text-center text-red-600 text-lg font-semibold">
            No se ha ingresado ningún contrato
          </div>
        )}
      </div>

      {contratosDelAnio.length > 0 ? (
        <div className="my-6">
          <label className="block text-sm mb-2 font-bold">Seleccionar contrato:</label>
          <select className="border rounded p-2 w-full" value={contratoSeleccionadoId} onChange={(e) => setContratoSeleccionadoId(e.target.value)}>
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
      ) : (
        <div className="text-center mt-6">
          <Button className="bg-green-600 hover:bg-green-700 text-white text-lg"
            onClick={() => router.push(`/protected/admin/empleado/crear?user_id=${usuario.id}`)}>
            Ingresar nuevo contrato
          </Button>
        </div>
      )}
    </div>
  );
}
