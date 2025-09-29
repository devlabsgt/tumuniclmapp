// protected/admin/organos/page.tsx
'use client';

import { Suspense } from 'react';
import VerEducacion from '@/components/educacion/Ver';
import Cargando from '@/components/ui/animations/Cargando'; // Asegúrese de que la ruta sea correcta

export default function OrganosPage() {
  return (

    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <VerEducacion/>
    </Suspense>
    
  );

}