'use client';

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Maestro, Programa } from '../lib/esquemas';

interface Props {
  maestrosDelPrograma: Maestro[];
  nivelesDelPrograma: Programa[];
  onEditarMaestro: (maestro: Maestro) => void;
}

export default function TablaMaestros({ maestrosDelPrograma, nivelesDelPrograma, onEditarMaestro }: Props) {
  
  const totalNiveles = nivelesDelPrograma.length;
  const totalAlumnos = maestrosDelPrograma.reduce((sum, maestro) => sum + (maestro.ctd_alumnos || 0), 0);

  if (maestrosDelPrograma.length === 0) {
    return <p className="text-sm text-center text-gray-500 italic px-4 py-6 bg-white rounded-lg">No hay maestros asignados a los niveles de este programa.</p>;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Nombre del Maestro</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Nivel Asignado</th>
            <th className="px-4 py-2 text-left font-medium text-gray-600">Cantidad de Alumnos</th>
            <th className="px-4 py-2 text-right font-medium text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {maestrosDelPrograma.map((maestro) => {
            const nivelAsignado = nivelesDelPrograma.find(n => n.maestro_id === maestro.id);
            
            return (
              <tr key={maestro.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{maestro.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{nivelAsignado?.nombre || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{maestro.ctd_alumnos}</td>
                <td className="px-4 py-3 text-right">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onEditarMaestro(maestro)}
                    className="p-2 h-auto"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Editar</span>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* --- FILA DE TOTALES CORREGIDA --- */}
        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
                <td className="px-4 py-3 text-left font-bold text-gray-700">Total:</td>
                <td className="px-4 py-3 font-bold text-gray-700"> {totalNiveles} Niveles</td>
                <td className="px-4 py-3 font-bold text-gray-700"> {totalAlumnos} Alumnos</td>
                <td className="px-4 py-3"></td>
            </tr>
        </tfoot>
      </table>
    </div>
  );
}
