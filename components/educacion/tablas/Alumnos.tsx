'use client';

import { Eye, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Alumno, Programa } from '../lib/esquemas';
import { desinscribirAlumno } from '../lib/acciones';
import { differenceInYears } from 'date-fns';

interface Props {
  alumnos: Alumno[];
  nivel: Programa;
  onEditar: (alumno: Alumno) => void;
  onDataChange: () => void;
}

const calcularEdad = (fechaNacimiento: string): number => {
  return differenceInYears(new Date(), new Date(fechaNacimiento));
};

export default function Alumnos({ alumnos, nivel, onEditar, onDataChange }: Props) {
  if (alumnos.length === 0) {
    return <p className="text-sm text-gray-500 italic px-4 py-3">No hay alumnos inscritos en este nivel.</p>;
  }

  return (
    <div className="border-t border-gray-200 w-full overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600 w-12">No.</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600 min-w-[160px]">Nombre del Alumno</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Edad</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Teléfono</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600 min-w-[160px]">Encargado</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Tel. Encargado</th>
            <th className="px-4 py-2 text-right font-medium text-gray-600 min-w-[100px]">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {alumnos.map((alumno, index) => {
            const edad = calcularEdad(alumno.fecha_nacimiento);
            const edadClass = edad >= 18 ? 'text-green-600 font-semibold' : 'text-gray-500';

            return (
              <tr key={alumno.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{alumno.nombre_completo}</div>
                </td>
                <td className={`px-4 py-3 ${edadClass}`}>
                  {edad}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {alumno.telefono_alumno || '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {alumno.nombre_encargado}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {alumno.telefono_encargado}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-1 sm:gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditar(alumno)}
                      className="p-2 h-auto"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">Ver</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => desinscribirAlumno(alumno.id, nivel.id, alumno.nombre_completo, onDataChange)}
                    >
                      <ArrowDown className="h-4 w-4" />
                      <span className="hidden sm:inline sm:ml-2">Desasignar</span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}