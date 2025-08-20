// protected/concejo/page.tsx
import { Suspense } from 'react';
import VerSesion from '@/components/concejo/sesion/Ver';

export default function ConcejoPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <VerSesion />
    </Suspense>
  );
}