'use client';

import EditarUsuarioForm from '@/components/admin/users/editar/EditarUsuarioForm';

export default function EditarUsuarioPage() {
  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-8 gap-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Editar Usuario</h1>
      <EditarUsuarioForm />
    </div>
  );
}
