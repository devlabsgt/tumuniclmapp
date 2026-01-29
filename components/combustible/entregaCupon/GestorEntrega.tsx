import React from 'react';
import { getSolicitudesParaEntrega } from './lib/actions'; 
import ListSolicitud from './ListSolicitud'; 

export default async function GestorEntrega() {
  const solicitudes = await getSolicitudesParaEntrega();

  // (Opcional) Si ya no usas 'pendientes' en el header, puedes quitar esta línea, 
  // pero no hace daño dejarla por si decides volver a poner estadísticas.
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  return (
    <div className="w-full flex flex-col gap-6">

      {/* --- CAMBIO AQUÍ --- */}
      {/* He quitado: bg-white, p-6, rounded-xl, border, shadow-sm */}
      {/* Ahora el componente ListSolicitud se renderizará directamente sobre el fondo gris de la página */}
      <div className="w-full">
        <ListSolicitud initialData={solicitudes} />
      </div>

    </div>
  );
}