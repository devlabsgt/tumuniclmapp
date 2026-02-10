import React from 'react';
import { getSolicitudesParaEntrega } from './lib/actions'; 
import ListSolicitud from './ListSolicitud'; 

export default async function GestorEntrega() {
  const solicitudes = await getSolicitudesParaEntrega();

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="w-full">
        <ListSolicitud initialData={solicitudes} />
      </div>

    </div>
  );
}