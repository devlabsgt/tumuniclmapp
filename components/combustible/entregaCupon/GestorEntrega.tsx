import React from 'react';
import { getSolicitudesParaEntrega } from './lib/actions'; // Tu Server Action
import ListSolicitud from './ListSolicitud'; // Tu Client Component

export default async function GestorEntrega() {
  // 1. Fetch de datos en el servidor (SSR)
  // Esto se ejecuta en el servidor antes de enviar el HTML al cliente.
  const solicitudes = await getSolicitudesParaEntrega();

  // Calculamos contadores simples aquí para no sobrecargar al cliente
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER / TITULO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Entrega de Cupones
          </h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Gestione las solicitudes aprobadas para la asignación de combustible.
          </p>
        </div>

        {/* STATS RÁPIDOS */}
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Pendientes</span>
                <span className="text-xl font-black text-blue-700 dark:text-blue-300">{pendientes}</span>
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-xl font-black text-gray-700 dark:text-gray-200">{solicitudes.length}</span>
            </div>
        </div>
      </div>

      {/* LISTA (CLIENT COMPONENT) 
          Le pasamos la data inicial para que no cargue nada más entrar.
      */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <ListSolicitud initialData={solicitudes} />
      </div>

    </div>
  );
}