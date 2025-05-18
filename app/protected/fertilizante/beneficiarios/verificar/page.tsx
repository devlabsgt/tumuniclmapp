'use client';

import { Suspense } from 'react';
import VerificarBeneficiario from '@/components/fertilizante/beneficiario/verificar/verificarBeneficiario';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function EditarBeneficiarioPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pt-12 px-4">
      <div className="relative mb-8">
          <Button
          variant="ghost"
          onClick={() => router.push('/protected/fertilizante/beneficiarios')}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>
        <h1 className="text-4xl font-bold text-center">Verificar Entrega de Abono</h1>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <VerificarBeneficiario />
      </Suspense>
    </div>
  );
}
