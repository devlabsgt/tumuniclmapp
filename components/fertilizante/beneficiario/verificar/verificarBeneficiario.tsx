'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function VerificarBeneficiario() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [dpi, setDpi] = useState('');

  const handleVerificar = async () => {
    const dpiLimpio = dpi.trim();

    if (!/^\d{13}$/.test(dpiLimpio)) {
      Swal.fire('Error', 'Ingrese un DPI válido de 13 dígitos numéricos.', 'error');
      return;
    }

    const { data, error } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('dpi', dpiLimpio)
      .maybeSingle();

    if (error) {
      Swal.fire('Error', 'Error al verificar el DPI.', 'error');
      return;
    }

    if (data) {
      Swal.fire({
            title: 'No Entregar',

        html: `
          <h2>El DPI<br/><strong>${data.dpi}</strong><br/>ya recibió el beneficio</h2><br/>
          <strong>Datos del beneficiario:</strong><br/><br/>
          <strong>Nombre:</strong> ${data.nombre_completo}<br/><br/>
          <strong>DPI:</strong> ${data.dpi}<br/><br/>
          <strong>Formulario:</strong> ${data.codigo}<br/><br/>
          <strong>Lugar:</strong> ${data.lugar}<br/><br/>
          <strong>Fecha:</strong> ${data.fecha}
        `,
        icon: 'error',
      });
    } else {
      Swal.fire(
        'Entregar',
        `El beneficiario con el número de DPI: <br><strong>${dpiLimpio}</strong><br/> no ha recibido el beneficio.`,
        'success'
      );
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center pt-12 px-4">
      <div className="text-center w-full max-w-xl">
        <Input
          type="text"
          placeholder="Ingrese el DPI"
          value={dpi}
          maxLength={13}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, ''); // Solo números
            setDpi(val);
          }}
          className="text-2xl h-16"
        />
        <Button onClick={handleVerificar} className="mt-5 w-full text-2xl h-16">
          Verificar
        </Button>
      </div>
    </div>
  );
}
