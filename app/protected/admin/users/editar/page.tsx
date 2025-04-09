'use client';

import EditarUsuarioForm from '@/components/admin/users/editar/EditarUsuarioForm';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button'; // ✅ El correcto, no de headlessui
import { useRouter } from 'next/navigation';

export default function EditarUsuarioPage() {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col w-full max-w-md mx-auto gap-6">
        <div className="flex items-center justify-start mb-6">
          <Button
            type="button"
            onClick={() => router.back()}
            className="h-10 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm w-auto px-4"
          >
            Volver
          </Button>

          <h1 className="text-3xl font-semibold ml-4">Editar Usuario</h1>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <EditarUsuarioForm />
        </Suspense>
      </div>
    </>
  );
}
