// protected/admin/organos/page.tsx
'use client';

import { Suspense } from 'react';
import Asistencia from '@/components/asistencia/Asistencia';

export default function OrganosPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <Asistencia/>
    </Suspense>
  );
}