import { Suspense } from 'react';
import VerUsuarios from '@/components/admin/users/VerUsuarios';

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-600">Cargando usuarios...</div>}>
      <VerUsuarios />
    </Suspense>
  );
}
