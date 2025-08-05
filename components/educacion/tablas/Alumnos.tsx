'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Alumno, Programa } from '../esquemas';
import { desinscribirAlumno } from '../acciones';

interface Props {
  alumnos: Alumno[];
  nivel: Programa;
  onEditar: (alumno: Alumno) => void;
  onDataChange: () => void;
}

export default function Alumnos({ alumnos, nivel, onEditar, onDataChange }: Props) {
  if (alumnos.length === 0) {
    return <p className="text-sm text-gray-500 italic px-4 py-3">No hay alumnos inscritos en este nivel.</p>;
  }

  return (
    <div className="border-t border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600 w-12">No.</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Nombre del Alumno</th>
            <th className="px-4 py-2 text-right font-medium text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {alumnos.map((alumno, index) => (
            <tr key={alumno.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{alumno.nombre_completo}</div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end items-center gap-1 sm:gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onEditar(alumno)}
                    className="p-2 h-auto"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Editar</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => desinscribirAlumno(alumno.id, nivel.id, alumno.nombre_completo, onDataChange)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Desasignar</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}