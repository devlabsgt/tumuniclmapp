import { Suspense } from 'react';
import Ver from '@/components/concejo/tareas/Ver';

export default function ConcejoPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando Módulo...</div>}>
      <Ver />
    </Suspense>
  );
}