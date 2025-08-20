// protected/concejo/page.tsx
import { Suspense } from 'react';
import VerConcejo from '@/components/concejo/Ver';

export default function ConcejoPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <VerConcejo />
    </Suspense>
  );
}
