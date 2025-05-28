'use client';

import { useState, useEffect } from 'react';
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
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([]);

useEffect(() => {
  const obtenerAnios = async () => {
    const { data, error } = await supabase
      .from('beneficiarios_fertilizante')
      .select('anio')
      .order('anio', { ascending: true });

    if (error) {
      console.error('Error al obtener años:', error.message);
      return;
    }

    const actuales = data
      .map((b: any) => (typeof b.anio === 'number' ? b.anio.toString() : null))
      .filter((a): a is string => a !== null);

    const anioActual = new Date().getFullYear().toString();

    const todos = Array.from(
      new Set([...actuales, anioActual])
    ).sort();

    setAniosDisponibles(todos);

    // Establecer el año seleccionado solo si no está ya fijo
    if (!todos.includes(anio)) setAnio(anioActual);
  };

  obtenerAnios();
}, []);




  const [dpi, setDpi] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dpi: '',
    lugar: '',
    fecha: '',
    fecha_nacimiento: '',
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
      .eq('anio', anio)
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
          <strong>Formulario:</strong> ${data.codigo}<br/><br/>
          <strong>Lugar:</strong> ${data.lugar}<br/><br/>
          <strong>Fecha:</strong> ${data.fecha}
        `,
        icon: 'error',
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
      Swal.fire('Error', 'El Formulario debe tener 4 números.', 'warning');
      return;
    }
  
    if (telefono !== '' && !/^\d{8}$/.test(telefono)) {
      Swal.fire('Error', 'El Teléfono debe tener exactamente 8 números si se ingresa.', 'warning');
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
        campo = 'Formulario';
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
     
      .insert([{ 
        ...formulario,
        dpi,
        codigo,
        telefono: telefono === '' ? 'N/A' : telefono,
        fecha_nacimiento: formulario.fecha_nacimiento?.trim() || null
      }]);
        
if (error) {
  console.error('Error de Supabase:', error);
  Swal.fire('Error', `No se pudo registrar el beneficiario.<br><br><small>${error.message}</small>`, 'error');
} else {
      Swal.fire('Éxito', 'Beneficiario registrado correctamente.', 'success').then(() => {
      setFormulario({
        nombre_completo: '',
        dpi: '',
        lugar: '',
        fecha: '',
        fecha_nacimiento: '',
        codigo: '',
        telefono: '',
        sexo: 'M',
      });
      setDpi('');
      setMostrarFormulario(false);
    });

    }
  };
  
return (
  <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
    {/* Botón atrás */}
    <div className="flex items-center h-full">

      <Button
          variant="ghost"
        onClick={() => router.push('/protected/fertilizante/beneficiarios/')}
          className="text-blue-600 text-base underline"
        >
          Volver
      </Button>
    </div>

    

    

    <h1 className="text-2xl font-bold text-center mb-4">
      Registrar Beneficiario de Fertilizante
    </h1>

    {!mostrarFormulario && (
      <>
        {/* Año y DPI */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Año:</label>
          <select
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
          >
            {aniosDisponibles.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <CampoDPI dpi={dpi} setDpi={setDpi} verificarDPI={verificarDPI} />
      </>
    )}

    {mostrarFormulario && (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
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
