import { Suspense } from 'react';
import VerAlbergues from '@/components/albergue/VerAlbergues';

export default function AlberguePage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <VerAlbergues />
    </Suspense>
  );
}
