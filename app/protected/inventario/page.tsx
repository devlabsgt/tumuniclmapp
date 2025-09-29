// protected/inventario/page.tsx
import { Suspense } from 'react';
import Inventario from '@/components/inventario/ver/Inventario';
import Cargando from '@/components/ui/animations/Cargando';

export default function InventarioPage() {
  return (
    <Suspense fallback={<Cargando texto="Cargando inventario..." />}>
      <Inventario />
    </Suspense>
  );
}