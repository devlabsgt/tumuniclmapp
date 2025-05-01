import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampoDPIProps {
  dpi: string;
  setDpi: (value: string) => void;
  verificarDPI: () => void;
}

export default function CampoDPI({ dpi, setDpi, verificarDPI }: CampoDPIProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Ingrese el DPI del beneficiario"
        value={dpi}
        onChange={(e) => setDpi(e.target.value)}
      />
      <Button onClick={verificarDPI} className="h-11 text-lg">
        Ingresar DPI
      </Button>
    </div>
  );
}
