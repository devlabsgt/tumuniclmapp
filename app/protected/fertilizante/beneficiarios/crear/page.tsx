'use client';

import { Suspense } from 'react';
import { CrearBeneficiario } from '@/components/fertilizante/beneficiario/crear/crearBeneficiario';

export default function CrearBeneficiarioPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CrearBeneficiario />
    </Suspense>
  );
}
