import React from 'react';
import { getSolicitudesJefes } from './lib/actions';
import ListSolitJefes from './ListSolitJefes';
import { createClient } from '@/utils/supabase/server';

export default async function GestorSolicitudesJefes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const solicitudes = await getSolicitudesJefes();

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full">
        <ListSolitJefes
          initialData={solicitudes}
          userServerSide={{
            userId: user.id,
            isOperario: false
          }}
        />
      </div>
    </div>
  );
}
