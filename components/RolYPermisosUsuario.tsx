'use client';

import { useEffect, useState } from 'react';

export default function RolYPermisosUsuario() {
  const [rol, setRol] = useState<string>('');
  const [permisos, setPermisos] = useState<string[]>([]);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch('/app/api/getuser');
        const data = await res.json();

        setRol(data.rol || '');
        setPermisos(data.permisos || []);
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    };

    obtenerDatos();
  }, []);

  return (
    <div className="p-4 border rounded shadow max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-2">Rol del usuario</h2>
      <p className="mb-4 text-blue-700">{rol || 'Cargando...'}</p>

      <h3 className="text-lg font-medium">Permisos:</h3>
      <ul className="list-disc list-inside text-gray-800">
        {permisos.length > 0 ? (
          permisos.map((permiso, i) => <li key={i}>{permiso}</li>)
        ) : (
          <li className="text-gray-500">Sin permisos</li>
        )}
      </ul>
    </div>
  );
}
