'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface Props {
  onGenerar: () => void;
}

export default function BotonGenerarPDF({ onGenerar }: Props) {
  return (
    <Button
      variant="link"
      onClick={onGenerar}
      className="text-red-600 text-xl flex items-center gap-2"
    >
      <FileText className="w-5 h-5" />
      Generar PDF
    </Button>
  );
}
