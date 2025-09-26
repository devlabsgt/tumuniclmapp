'use client';

import { useRouter } from 'next/navigation';
import { MdErrorOutline } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import {  LogOut} from 'lucide-react';

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
        variant="link"
        onClick={() => router.push('/')}
      >
          <LogOut className="mr-2 h-4 w-4 rotate-180" />
          Volver
      </Button>

    </div>
  );
}
