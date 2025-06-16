
import { Suspense } from 'react';
import { UsuarioPageContent } from '@/components/admin/users/ver/usuarioPage';

export default function VerUsuarioPage() {
  return (
    <Suspense fallback={<div>Cargando usuario...</div>}>
      <UsuarioPageContent />
    </Suspense>
  );
}
