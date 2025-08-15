'use client';

import EditarUsuarioForm from '@/components/admin/users/editar/EditarUsuarioForm';
import { Suspense } from 'react';
import Cargando from '@/components/ui/animations/Cargando'; // 1. Importar el componente

export default function EditarUsuarioPage() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-6">
      <Suspense fallback={<Cargando />}> {/* 2. Usar el componente aquí */}
        <EditarUsuarioForm />
      </Suspense>
    </div>
  );
}