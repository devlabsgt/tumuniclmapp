'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComisionConFechaYHoraSeparada, Asistente } from '@/hooks/comisiones/useObtenerComisiones';
import { Usuario } from '@/lib/usuarios/esquemas';
import Image from 'next/image';

interface DpdfProps {
  comision: ComisionConFechaYHoraSeparada;
  usuarios: Usuario[];
}

const getUsuarioNombre = (id: string, usuarios: Usuario[]) => {
  const user = usuarios.find(u => u.id === id);
  return user ? user.nombre : 'Desconocido';
};

export default function Dpdf({ comision, usuarios }: DpdfProps) {
  const fechaCompleta = format(parseISO(comision.fecha_hora), 'EEEE, d MMM yyyy, h:mm a', { locale: es });
  
  const encargado = comision.asistentes?.find(a => a.encargado);
  const asistentes = comision.asistentes?.filter(a => !a.encargado);

  return (
    <div className="p-0 bg-white max-w-2xl mx-auto shadow-md rounded-lg font-sans text-gray-800 border border-gray-200" style={{ width: '210mm', minHeight: '297mm', padding: '0' }}>
      
      <div className="text-center mb-8">
        <div className=" flex justify-center">
          <Image src="/images/logo-muni.png" alt="Logo Municipalidad" width={300} height={300} objectFit="contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1 leading-tight">{comision.titulo}</h1>
        <p className="text-gray-600 text-sm font-semibold">{fechaCompleta}</p>
      </div>

      <div>
        <table className="min-w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 font-semibold text-lg text-gray-700 w-1/4">Encargado</td>
              <td className="px-6 py-3 text-lg text-gray-800">
                {encargado ? getUsuarioNombre(encargado.id, usuarios) : 'N/A'}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-6 py-3 font-semibold text-lg text-gray-700 w-1/4 align-top">Asistentes</td>
              <td className="px-6 py-3 text-lg text-gray-800">
                {asistentes && asistentes.length > 0 ? (
                  <ul className="list-none space-y-1"> 
                    {asistentes.map(asistente => (
                      <li key={asistente.id}>{getUsuarioNombre(asistente.id, usuarios)}</li>
                    ))}
                  </ul>
                ) : (
                  'Ninguno'
                )}
              </td>
            </tr>
            {comision.comentarios && comision.comentarios.length > 0 && (
              <tr className="border-t border-gray-300">
                <td className="px-6 py-3 font-semibold text-lg text-gray-700 w-1/4 align-top">Notas</td>
                <td className="px-6 py-3 text-sm text-gray-800">
                  <ul className="list-disc list-inside space-y-1"> 
                    {comision.comentarios.map((comentario, index) => (
                      <li key={index}>{comentario}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}