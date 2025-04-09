'use client';

import { Suspense } from 'react';
import { CrearEmpleado } from '@/components/admin/empleados/crear/crearEmpleado'; // ⬅️ Ajuste si su ruta es diferente

export default function CrearEmpleadoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CrearEmpleado />
    </Suspense>
  );
}
