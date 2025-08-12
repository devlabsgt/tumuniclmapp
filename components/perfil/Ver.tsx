'use client';

import useUserData from '@/hooks/useUserData';

export default function Ver() {
  // Ahora podemos volver a pedir el 'email' sin que dé error
  const { nombre, email, rol, permisos, modulos, programas, cargando } = useUserData();

  if (cargando) {
    return <p className="text-center">Cargando perfil...</p>;
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-md max-w-4xl mx-auto overflow-hidden">
      <table className="w-full text-base">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left font-bold text-lg text-gray-700 w-1/4">Campo</th>
            <th className="p-4 text-left font-bold text-lg text-gray-700">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600">Nombre</td>
            <td className="p-4">{nombre || 'No asignado'}</td>
          </tr>
           <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600">Email</td>
            <td className="p-4">{email || 'No disponible'}</td>
          </tr>
          <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600">Rol</td>
            <td className="p-4 capitalize">{rol || 'No asignado'}</td>
          </tr>
          <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600 align-top">Módulos</td>
            <td className="p-4 flex flex-wrap gap-2">
              {modulos && modulos.length > 0 ? (
                modulos.map(m => <span key={m} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-md border border-blue-200">{m}</span>)
              ) : (
                <span className="text-gray-500">Ninguno</span>
              )}
            </td>
          </tr>
          <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600 align-top">Programas</td>
            <td className="p-4 flex flex-wrap gap-2">
              {programas && programas.length > 0 ? (
                programas.map(p => <span key={p} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-md border border-green-200">{p}</span>)
              ) : (
                <span className="text-gray-500">Ninguno</span>
              )}
            </td>
          </tr>
          <tr className='border-t hover:bg-slate-50'>
            <td className="p-4 font-semibold text-gray-600 align-top">Permisos</td>
            <td className="p-4">
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {permisos && permisos.length > 0 ? (
                  permisos.map(p => <li key={p}>{p}</li>)
                ) : (
                  <li>Sin permisos especiales</li>
                )}
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}