'use client';

import { Suspense } from 'react';
import  VerComisiones from '@/components/comisiones/Ver';
import Cargando from '@/components/ui/animations/Cargando'; 

export default function SignupPage() {
  return (
    <Suspense fallback={<Cargando />}> 
      <VerComisiones />
    </Suspense>
  );
}