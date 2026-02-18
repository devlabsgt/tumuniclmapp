'use client';

import { useState, useEffect } from 'react';
import { useInfoForm } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Phone, Fingerprint, Hash, Shield, 
  CircleDollarSign, MapPin, Calendar, User, Loader2 
} from 'lucide-react';

export default function InfoForm({ userData }: { userData: any }) {
  // 1. Obtener ID de forma robusta (puede venir como 'id' o 'user_id' según el padre)
  const userId = userData?.id || userData?.user_id;

  // 2. Usar el hook que trae datos (usuarioData) y función de guardado (handleSave)
  const { usuarioData, isLoadingData, handleSave, isSaving } = useInfoForm(userId);

  // 3. Estado local del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    dpi: '',
    nit: '',
    igss: '',
    cuenta_no: '',
    direccion: '',
    nacimiento: '',
  });

  // 4. Sincronización: Cuando TanStack Query traiga los datos, actualizamos el form
  useEffect(() => {
    // Preferimos los datos frescos (usuarioData). Si aún no hay, usamos los básicos del padre (userData)
    const datos = usuarioData || userData;

    if (datos) {
      setFormData({
        nombre: datos.nombre || '',
        telefono: datos.telefono || '',
        dpi: datos.dpi || '',
        nit: datos.nit || '',
        igss: datos.igss || '',
        cuenta_no: datos.cuenta_no || '',
        direccion: datos.direccion || '',
        // Formatear fecha para input type="date" (YYYY-MM-DD)
        nacimiento: datos.nacimiento ? String(datos.nacimiento).split('T')[0] : '',
      });
    }
  }, [usuarioData, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(formData);
  };

  // 5. Estado de Carga Inicial (Skeleton o Spinner)
  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando información...</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 p-4 animate-in fade-in duration-500">
      <h2 className="text-sm font-bold mb-4 text-center text-gray-900 dark:text-zinc-400 tracking-widest uppercase">
        Información Personal del Usuario
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre Completo */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <User size={12} /> Nombre Completo
          </Label>
          <Input 
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre completo"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* Fecha de Nacimiento */}
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

        {/* Teléfono */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Phone size={12} /> Teléfono
          </Label>
          <Input 
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="0000-0000"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* DPI */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Fingerprint size={12} /> DPI
          </Label>
          <Input 
            name="dpi"
            value={formData.dpi}
            onChange={handleChange}
            placeholder="0000 00000 0000"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* NIT */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Hash size={12} /> NIT
          </Label>
          <Input 
            name="nit"
            value={formData.nit}
            onChange={handleChange}
            placeholder="Ingrese NIT"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* AFILIACIÓN IGSS */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <Shield size={12} /> Afiliación IGSS
          </Label>
          <Input 
            name="igss"
            value={formData.igss}
            onChange={handleChange}
            placeholder="No. de afiliación"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* NO. CUENTA */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase dark:text-zinc-500 flex items-center gap-2 font-bold tracking-tighter">
            <CircleDollarSign size={12} /> No. Cuenta
          </Label>
          <Input 
            name="cuenta_no"
            value={formData.cuenta_no}
            onChange={handleChange}
            placeholder="No. de cuenta bancaria"
            className="h-11 dark:bg-zinc-900 dark:border-zinc-800"
          />
        </div>

        {/* Dirección */}
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