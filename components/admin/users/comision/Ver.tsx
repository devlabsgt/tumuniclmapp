'use client';

import React, { useState, useMemo } from 'react';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ComisionForm from './forms/Comision';
import { useObtenerComisiones, Comision } from '@/hooks/comisiones/useObtenerComisiones';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useUserData from '@/hooks/sesion/useUserData';
import Swal from 'sweetalert2';

interface VerComisionProps {
  usuarios: Usuario[];
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2);

export default function Ver({ usuarios }: VerComisionProps) {
  const router = useRouter();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [comisionAEditar, setComisionAEditar] = useState<Comision | null>(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonth(new Date()));
  const [anioSeleccionado, setAnioSeleccionado] = useState(getYear(new Date()));

  const { rol, cargando } = useUserData();

  const { comisiones, loading, error, refetch } = useObtenerComisiones();

  const handleCrearComision = () => {
    setComisionAEditar(null);
    setModalAbierto(true);
  };

  const handleEditarComision = (comision: Comision) => {
    setComisionAEditar(comision);
    setModalAbierto(true);
  };

  const handleEliminarComision = async (comisionId: string) => {
      const result = await Swal.fire({
          title: '¿Está seguro?',
          text: '¡Esta acción no se puede revertir!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
          try {
              // --- CAMBIO AQUÍ ---
              const res = await fetch(`/api/users/comision`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: comisionId })
              });
              if (res.ok) {
                  refetch();
                  Swal.fire(
                      '¡Eliminado!',
                      'La comisión ha sido eliminada.',
                      'success'
                  );
              } else {
                  Swal.fire(
                      'Error',
                      'Hubo un problema al eliminar la comisión.',
                      'error'
                  );
                  console.error('Error al eliminar la comisión:', res.statusText);
              }
          } catch (err) {
              Swal.fire(
                  'Error',
                  'Hubo un problema de conexión al intentar eliminar la comisión.',
                  'error'
              );
              console.error('Error de red al eliminar la comisión:', err);
          }
      }
  };

  const handleGuardado = () => {
    refetch();
  };

  const handleVerComision = (comisionId: string) => {
    console.log('Navegando para ver la comisión:', comisionId);
  };

  const comisionesFiltradas = useMemo(() => {
    if (loading || error || !comisiones) {
      return [];
    }

    const comisionesBase = comisiones.filter(c => {
      const fechaComision = new Date(c.fecha);
      return fechaComision.getFullYear() === anioSeleccionado && fechaComision.getMonth() === mesSeleccionado;
    });

    comisionesBase.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (terminoBusqueda.length > 2) {
      const termino = terminoBusqueda.toLowerCase();
      return comisionesBase.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        c.asistentes?.some(a => (a.nombre || '').toLowerCase().includes(termino))
      );
    }

    return comisionesBase;
  }, [comisiones, mesSeleccionado, anioSeleccionado, terminoBusqueda, loading, error]);

  if (loading || cargando) {
    return <p className="text-center text-gray-500 py-8">Cargando...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">Error: {error}</p>;
  }

  return (
    <>
      <div className="bg-white rounded-lg space-y-4 w-full md:w-4/5 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Input
            placeholder="Buscar comisiones por título o asistente..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            className="w-full md:w-1/3"
          />
          <div className='flex gap-2 items-center'>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
              className="text-lg capitalize focus:ring-0"
            >
              {meses.map((mes, index) => (
                <option key={index} value={index}>
                  {format(setMonth(new Date(), index), 'MMM', { locale: es })}
                </option>
              ))}
            </select>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
              className="text-lg focus:ring-0"
            >
              {anios.map(anio => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCrearComision} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white">
            Crear Comisión
          </Button>
        </div>

        <div className="border-t pt-4 space-y-4">
          {comisionesFiltradas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron comisiones para la fecha seleccionada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comisionesFiltradas.map(comision => (
                    <tr
                      key={comision.id}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleVerComision(comision.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {comision.titulo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(comision.fecha + 'T00:00:00'), 'EEE, d MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {comision.hora ? format(new Date(`2000-01-01T${comision.hora}`), 'h:mm a') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarComision(comision);
                            }}
                            variant="ghost"
                            className="text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {(rol === 'SUPER' || rol === 'ADMINISTRADOR') && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarComision(comision.id);
                              }}
                              variant="ghost"
                            className="hover:bg-red-200 transition-colors flex items-center justify-center gap-1"                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ComisionForm
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSave={handleGuardado}
        usuarios={usuarios}
        comisionAEditar={comisionAEditar}
      />
    </>
  );
}