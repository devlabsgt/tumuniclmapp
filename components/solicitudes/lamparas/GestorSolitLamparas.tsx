import React from 'react';
import { getSolicitudesLamparas, getSolicitudesElectricista, getElectricistas, getUsuariosAtencionVecino } from './lib/actions';
import ListSolitLampara from './ListSolitLampara';
import { createClient } from '@/utils/supabase/server';

export default async function GestorSolitLamparas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // 1. Identificar si es del departamento de Atención al Vecino (Administrativos/Recepción)
  const atencionVecino = await getUsuariosAtencionVecino();
  const isAtencionVecino = atencionVecino.some(e => e.user_id === user.id);

  // 2. Identificar si es del departamento de Alumbrado Público (Electricistas/Operativos)
  const electricistas = await getElectricistas();
  const isElectricista = electricistas.some(e => e.user_id === user.id);

  // Lógica de carga de datos:
  // - Si es Atención al Vecino -> Carga todas las solicitudes (Aprobadas, Pendientes, Rechazadas)
  // - Si es Electricista -> Carga solo sus asignadas pendientes
  // - Por defecto (Admin General u otros) -> Carga todo
  const solicitudes = (isElectricista && !isAtencionVecino)
    ? await getSolicitudesElectricista() 
    : await getSolicitudesLamparas();

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full">
        <ListSolitLampara 
          initialData={solicitudes} 
          userServerSide={{
            userId: user.id,
            isElectricista: isElectricista && !isAtencionVecino // Solo aplicamos restricciones si NO es de atención al vecino
          }}
        />
      </div>
    </div>
  );
}
