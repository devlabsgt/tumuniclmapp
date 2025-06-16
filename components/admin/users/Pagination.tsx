'use client';

import { Button } from '@/components/ui/button';

type Props = {
  paginaActual: number;
  totalPaginas: number;
  setPaginaActual: (pagina: number) => void;
};

export default function Pagination({ paginaActual, totalPaginas, setPaginaActual }: Props) {
  return (
    <div className="flex justify-center mt-4 gap-2 flex-wrap">
      <Button
        variant="outline"
        onClick={() => setPaginaActual(paginaActual - 1)}
        disabled={paginaActual === 1}
      >
        ←
      </Button>

      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
        <Button
          key={numero}
          onClick={() => setPaginaActual(numero)}
          variant={paginaActual === numero ? 'default' : 'outline'}
        >
          {numero}
        </Button>
      ))}

      <Button
        variant="outline"
        onClick={() => setPaginaActual(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
      >
        →
      </Button>
    </div>
  );
}
