'use client';

import EditarUsuarioForm from '@/components/admin/users/editar/EditarUsuarioForm';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

export default function EditarUsuarioPage() {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col w-full max-w-md mx-auto gap-6">
        <Suspense fallback={<div>Cargando...</div>}>
          <EditarUsuarioForm />
        </Suspense>
      </div>
    </>
  );
}
