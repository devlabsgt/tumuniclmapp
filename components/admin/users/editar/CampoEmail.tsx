'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CampoEmail({ value, onChange }: Props) {
  return (
    <div>
      <Label className="text-lg mb-1 block">Correo</Label>
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="h-12 text-lg"
      />
    </div>
  );
}
