// File: app/protected/admin/empleado/editar/page.tsx

'use client';

import { Suspense } from 'react';
import EditarEmpleadoForm from '@/components/admin/empleados/editar/EditarEmpleadoForm';

export default function EditarEmpleadoPage() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-8 gap-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Editar Empleado</h1>
      <Suspense fallback={<div>Cargando...</div>}>
        <EditarEmpleadoForm />
      </Suspense>
    </div>
  );
}
