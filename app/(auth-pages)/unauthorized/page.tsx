'use client';

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Image
        src="/images/logo.webp"
        alt="Logo Municipalidad de Concepción Las Minas"
        width={400}
        height={400}
        className="mb-6"
      />

      <h1 className="text-3xl font-bold text-red-600 mb-4">No autorizado</h1>
      <p className="text-lg text-center text-muted-foreground mb-6">
        No tiene permisos para acceder a esta sección, comuníquese con soporte técnico.
      </p>
      <button
        onClick={() => router.back()}
        className="px-5 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
      >
        Volver a la página anterior
      </button>
    </div>
  );
}
