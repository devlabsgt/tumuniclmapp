'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BotonVolver({ ruta }: { ruta: string }) {
  const router = useRouter();

  return (
    <Button
      variant="link"
      onClick={() => router.push(ruta)}
      className="text-blue-600 text-xl flex items-center gap-2"
    >
      <ArrowLeft className="w-5 h-5" />
      Volver
    </Button>
  );
}
