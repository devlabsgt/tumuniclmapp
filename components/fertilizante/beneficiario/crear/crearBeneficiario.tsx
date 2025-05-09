'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Formulario } from './Formulario';
import CampoDPI from './CampoDPI';
import CampoSexo from './CampoSexo';

export function CrearBeneficiario() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const router = useRouter();

  const [dpi, setDpi] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dpi: '',
    lugar: '',
    fecha: '',
    codigo: '',
    telefono: '',
    sexo: 'M', // valor por defecto
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const verificarDPI = async () => {
    if (!dpi.trim()) {
      Swal.fire('Error', 'Ingrese un DPI válido.', 'error');
      return;
    }

    const { data, error } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('dpi', dpi)
      .maybeSingle();

    if (error) {
      Swal.fire('Error', 'Error al verificar el DPI.', 'error');
      return;
    }

    if (data) {
      Swal.fire({
        title: 'No Entregar',
        html: `
          <h2>El DPI<br/><span style="color:red">${data.dpi}</span><br/>ya recibió el beneficio</h2><br/>
          <strong>Datos del beneficiario:</strong><br/><br/>
          <strong>Nombre:</strong> ${data.nombre_completo}<br/><br/>
          <strong>DPI:</strong> ${data.dpi}<br/><br/>
          <strong>Teléfono:</strong> ${data.telefono}<br/><br/>
          <strong>Formulario:</strong> ${data.codigo}<br/><br/>
          <strong>Lugar:</strong> ${data.lugar}<br/><br/>
          <strong>Fecha:</strong> ${data.fecha}
        `,
        icon: 'info',
      });
    } else {
      setFormulario((prev) => ({ ...prev, dpi }));
      setMostrarFormulario(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const camposRequeridos = [
      'nombre_completo',
      'dpi',
      'lugar',
      'fecha',
      'codigo',
      'telefono',
      'sexo',
    ];
    const vacios = camposRequeridos.some(
      (campo) => !formulario[campo as keyof typeof formulario]?.trim()
    );

    if (vacios) {
      Swal.fire('Error', 'Complete todos los campos obligatorios.', 'error');
      return;
    }

    const dpi = formulario.dpi.trim();
    const codigo = formulario.codigo.trim();
    const telefono = formulario.telefono.trim();

    if (!/^\d{13}$/.test(dpi)) {
      Swal.fire('Error', 'El DPI debe tener 13 números.', 'warning');
      return;
    }

    if (!/^\d{4}$/.test(codigo)) {
      Swal.fire('Error', 'El Código debe tener 4 números.', 'warning');
      return;
    }

    if (!/^\d{8}$/.test(telefono)) {
      Swal.fire('Error', 'El Teléfono debe tener 8 números.', 'warning');
      return;
    }

    const { data: duplicados, error: errorCheck } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .or(`dpi.eq.${dpi},codigo.eq.${codigo},telefono.eq.${telefono}`);

    if (errorCheck) {
      Swal.fire('Error', 'Error al verificar duplicados.', 'error');
      return;
    }

if (duplicados && duplicados.length > 0) {
  const duplicadoCodigo = duplicados.find((b) => b.codigo === codigo);
  const duplicadoDPI = duplicados.find((b) => b.dpi === dpi);
  const duplicadoTelefono = duplicados.find((b) => b.telefono === telefono);

  let campo = '';
  let valor = '';
  let b: any = null;

  if (duplicadoCodigo) {
    campo = 'Código';
    valor = codigo;
    b = duplicadoCodigo;
  } else if (duplicadoDPI) {
    campo = 'DPI';
    valor = dpi;
    b = duplicadoDPI;
  } else if (duplicadoTelefono) {
    campo = 'Teléfono';
    valor = telefono;
    b = duplicadoTelefono;
  }

  Swal.fire({
    title: `Ya existe un beneficiario con ${campo}: ${valor}`,
    html: `
      <strong>Nombre:</strong> ${b.nombre_completo}<br/><br/>
      <strong>DPI:</strong> ${b.dpi}<br/><br/>
      <strong>Teléfono:</strong> ${b.telefono}<br/><br/>
      <strong>Formulario:</strong> ${b.codigo}<br/><br/>
      <strong>Lugar:</strong> ${b.lugar}<br/><br/>
      <strong>Fecha:</strong> ${b.fecha}
    `,
    icon: 'info',
  });

  return;
}


    const { error } = await supabase
      .from('beneficiarios_fertilizante')
      .insert([{ ...formulario, dpi, codigo, telefono }]);

    if (error) {
      Swal.fire('Error', 'No se pudo registrar el beneficiario.', 'error');
    } else {
      Swal.fire('Éxito', 'Beneficiario registrado correctamente.', 'success').then(() => {
        router.push('/protected/fertilizante/beneficiarios');
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex items-center h-full">
        <Button
          onClick={() => router.push('/protected/fertilizante/beneficiarios/')}
          className="h-full bg-blue-600 hover:bg-blue-700 text-white px-4 mb-5"
        >
          Atrás
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-center mb-4">
        Registrar Beneficiario de Fertilizante
      </h1>

      {!mostrarFormulario && (
        <CampoDPI dpi={dpi} setDpi={setDpi} verificarDPI={verificarDPI} />
      )}

      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Formulario formulario={formulario} onChange={handleChange} />
          <CampoSexo sexo={formulario.sexo} onChange={handleChange} />
          <Button type="submit" className="mt-4 h-11 text-lg">
            Crear Beneficiario
          </Button>
        </form>
      )}
    </div>
  );
}
