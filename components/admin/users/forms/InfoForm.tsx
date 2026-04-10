'use client';

import { useState, useEffect } from 'react';
import { useInfoForm } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Phone, Fingerprint, Hash, Shield, 
  CircleDollarSign, MapPin, Calendar, Loader2 
} from 'lucide-react';

export default function InfoForm({ userData }: { userData: any }) {
  const userId = userData?.id || userData?.user_id;

  const { usuarioData, isLoadingData, handleSave, isSaving } = useInfoForm(userId);

  const [formData, setFormData] = useState({
    telefono: '',
    dpi: '',
    nit: '',
    igss: '',
    cuenta_no: '',
    direccion: '',
    nacimiento: '',
  });


  const cleanNumbers = (val: string) => val.toString().replace(/\D/g, '');

  const formatPhoneDisplay = (val: string) => {
    const clean = cleanNumbers(val).slice(0, 8);
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  };

  const formatDPIDisplay = (val: string) => {
    const clean = cleanNumbers(val).slice(0, 13);
    if (clean.length <= 4) return clean;
    if (clean.length <= 9) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9)}`;
  };

  const formatEveryFour = (val: string) => {
    return cleanNumbers(val).replace(/(.{4})/g, '$1 ').trim();
  };

  useEffect(() => {
    const datos = usuarioData || userData;

    if (datos) {
      setFormData({
        telefono: cleanNumbers(datos.telefono || ''),
        dpi: cleanNumbers(datos.dpi || ''),
        nit: cleanNumbers(datos.nit || ''),
        igss: cleanNumbers(datos.igss || ''),
        cuenta_no: cleanNumbers(datos.cuenta_no || ''),
        direccion: datos.direccion || '',
        nacimiento: datos.nacimiento ? String(datos.nacimiento).split('T')[0] : '',
      });
    }
  }, [usuarioData, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (['telefono', 'dpi', 'igss', 'nit', 'cuenta_no'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: cleanNumbers(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(formData);
  };


  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando información...</p>
      </div>
    );
  }

  return (
    <form 
      onSubmit={onSubmit} 
      className="flex flex-col gap-6 p-4 animate-in fade-in duration-500"
    >

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Calendar size={12} /> Fecha de Nacimiento
          </Label>
          <Input 
            type="date"
            name="nacimiento"
            value={formData.nacimiento}
            onChange={handleChange}
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Phone size={12} /> Teléfono
          </Label>
          <Input 
            type="text"
            name="telefono"
            value={formatPhoneDisplay(formData.telefono)}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="0000 0000"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800 font-mono tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Fingerprint size={12} /> DPI
          </Label>
          <Input 
            type="text"
            name="dpi"
            value={formatDPIDisplay(formData.dpi)}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="0000 00000 0000"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800 font-mono tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Hash size={12} /> NIT
          </Label>
          <Input 
            type="text"
            name="nit"
            value={formatEveryFour(formData.nit)}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="Ingrese NIT"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800 font-mono tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Shield size={12} /> Afiliación IGSS
          </Label>
          <Input 
            type="text"
            name="igss"
            value={formData.igss === formData.dpi && formData.igss !== '' ? formatDPIDisplay(formData.igss) : formData.igss}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="No. de afiliación"
            className={`h-11 dark:bg-zinc-900 dark:border-zinc-800 ${formData.igss === formData.dpi && formData.igss !== '' ? 'font-mono tracking-wider' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <CircleDollarSign size={12} /> No. Cuenta (BANRURAL)
          </Label>
          <Input 
            type="text"
            name="cuenta_no"
            value={formatEveryFour(formData.cuenta_no)}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="No. de cuenta bancaria"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800 font-mono tracking-wider"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <MapPin size={12} /> Dirección de Residencia
          </Label>
          <Input 
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Dirección completa"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isSaving}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 transition-all active:scale-[0.98]"
      >
        {isSaving ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
          </div>
        ) : (
          'Actualizar Información'
        )}
      </Button>
    </form>
  );
}