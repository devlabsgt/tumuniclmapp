import { Suspense } from 'react';
import Bien from '@/components/inventario/forms/Bien';
import Cargando from '@/components/ui/animations/Cargando';

export default function InventarioPage() {
  return (
    <Suspense fallback={<Cargando texto="Cargando Inventario" />}>
      <Bien />
    </Suspense>
  );
}