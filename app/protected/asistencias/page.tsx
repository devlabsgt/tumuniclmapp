'use client';

import { Suspense } from 'react';
import  AsistenciaDependencias from '@/components/asistencia/oficina/AsistenciasOficinas';
import Cargando from '@/components/ui/animations/Cargando'; 

export default function SignupPage() {
  return (
    <Suspense fallback={<Cargando />}> 
      <AsistenciaDependencias />
    </Suspense>
  );
}