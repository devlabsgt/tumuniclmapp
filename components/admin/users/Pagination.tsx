// components/admin/users/Pagination.tsx
'use client';

import { Button } from '@/components/ui/button';

type Props = {
  paginaActual: number;
  totalPaginas: number;
  setPaginaActual: (nueva: number) => void;
};

export default function Pagination({ paginaActual, totalPaginas, setPaginaActual }: Props) {
  return (
    <div className="mt-10 flex justify-center items-center gap-5">
      <Button
        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
        disabled={paginaActual === 1}
      >
        Anterior
      </Button>

      <span className="text-sm">
        Página {paginaActual} de {totalPaginas || 1}
      </span>

      <Button
        onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
        disabled={paginaActual === totalPaginas || totalPaginas === 0}
      >
        Siguiente
      </Button>
    </div>
  );
}
