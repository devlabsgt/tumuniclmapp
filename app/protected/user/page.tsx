'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function UserDashboard() {
  const router = useRouter();

  return (
    <section className="w-full max-w-5xl mx-auto pt-0 px-4 md:px-8 relative">
      {/* Header con botón Volver */}
      <div className="relative flex items-center justify-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/protected')}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>

        <h1 className="text-2xl md:text-4xl font-bold text-center">
          Dashboard de Usuario
        </h1>
      </div>

      {/* Barra de acciones */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Link href="/protected/fertilizante/beneficiarios">
          <Button variant="outline" className="w-full md:w-auto justify-start">
            Entrega de Fertilizante
          </Button>
        </Link>
      </div>

      <p className="text-center text-muted-foreground text-lg mb-8">
        Desde aquí podrá gestionar sus acciones disponibles en el sistema.
      </p>
    </section>
  );
}
