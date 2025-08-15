'use client';

import { Suspense } from 'react';
import EditarBeneficiarioForm from '@/components/fertilizante/beneficiario/editar/EditarBeneficiarioForm';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Cargando from '@/components/ui/animations/Cargando'; // Ruta corregida

export default function EditarBeneficiarioPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full max-w-md mx-auto gap-6">
      <div className="flex items-center justify-start mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/protected/fertilizante/beneficiarios')}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>

        <h1 className="text-3xl font-semibold ml-4">Editar Beneficiario</h1>
      </div>

      <Suspense fallback={<Cargando />}>
        <EditarBeneficiarioForm />
      </Suspense>
    </div>
  );
}