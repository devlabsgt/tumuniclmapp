'use client';

import { useRouter } from 'next/navigation';
import { MdErrorOutline } from 'react-icons/md';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col items-center justify-center text-center px-4 mt-20">
      <MdErrorOutline className="text-red-500 mb-4" size={80} />
      <h1 className="text-6xl font-bold text-gray-800">Página no autorizada</h1>
      <p className="text-3xl text-gray-500 mt-2">
        Lo sentimos, no tienes permiso para acceder a la página que buscas.
      </p>
      <Button
        onClick={() => router.push('/')}
        className="text-2xl mt-6 p-8"
      >
        Volver al inicio
      </Button>
    </div>
  );
}
