'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { Route } from 'next';

export default function BotonEditar({ ruta }: { ruta: Route }) {
  const router = useRouter();

  return (
    <Button
      variant="link"
      onClick={() => router.push(ruta)}
      className="text-green-600 text-xl flex items-center gap-2"
    >
      <Pencil className="w-5 h-5" />
      Editar
    </Button>
  );
}
