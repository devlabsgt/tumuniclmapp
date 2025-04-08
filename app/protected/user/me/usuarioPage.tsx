'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function UsuarioPageContent() {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUsuario(data.user);
      }
    };
    obtenerUsuarioActual();
  }, [supabase]);

  if (!usuario) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow bg-white text-sm">
      <h1 className="text-xl font-bold text-center mb-6">
        Mi Perfil
      </h1>

      <div className="border-t border-b divide-y">
        <div className="flex justify-between py-3 items-center">
          <strong className="w-1/3">EMAIL</strong>
          <span className="w-2/3">{usuario.email}</span>
        </div>

        <div className="flex justify-between py-3">
          <strong className="w-1/3">ID</strong>
          <span className="w-2/3">{usuario.id}</span>
        </div>
      </div>
    </div>
  );
}
