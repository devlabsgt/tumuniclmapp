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
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-15 bg-blue-600 hover:bg-blue-500 text-white rounded text-2xl px-4"
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
