import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CampoDPIProps {
  dpi: string;
  setDpi: (value: string) => void;
  verificarDPI: () => void;
}

export default function CampoDPI({ dpi, setDpi, verificarDPI }: CampoDPIProps) {
  const handleDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 13);
    setDpi(soloNumeros);
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="text"
        placeholder="Ingrese el DPI del beneficiario"
        value={dpi}
        onChange={handleDpiChange}
      />
      <Button onClick={verificarDPI} className="h-11 text-lg">
        Ingresar DPI
      </Button>
    </div>
  );
}
