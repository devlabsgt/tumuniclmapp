'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { CampoTexto } from '../crear/CampoTexto';
import { CampoLugar } from '../crear/CampoLugar';

export default function EditarBeneficiarioForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') || '';

  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dpi: '',
    lugar: '',
    fecha: '',
    fecha_nacimiento: '', 
    codigo: '',
    telefono: '',
    sexo: '',
  });

  const [original, setOriginal] = useState(formulario);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    const cargar = async () => {
      const { data, error } = await supabase
        .from('beneficiarios_fertilizante')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar el beneficiario.', 'error');
        return;
      }

const datos = {
  nombre_completo: data.nombre_completo || '',
  dpi: data.dpi || '',
  lugar: data.lugar || '',
  fecha: data.fecha?.split('T')[0] || '',
  fecha_nacimiento: data.fecha_nacimiento?.split('T')[0] || '', // 👈 nuevo campo
  codigo: data.codigo || '',
  telefono: data.telefono || '',
  sexo: data.sexo || 'M',
};



      setFormulario(datos);
      setOriginal(datos);
    };

    cargar();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const hayCambios = useMemo(() => {
    return JSON.stringify(formulario) !== JSON.stringify(original);
  }, [formulario, original]);

  const actualizar = async () => {
    if (!id || !hayCambios) {
      Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
      return;
    }
  
    setCargando(true);
    const supabase = createClient();
  
    formulario.dpi = formulario.dpi.replace(/\s+/g, '');
    formulario.codigo = formulario.codigo.replace(/\s+/g, '');
    formulario.telefono = formulario.telefono.replace(/\s+/g, '');
  
    if (!/^\d+$/.test(formulario.dpi) || !/^\d+$/.test(formulario.codigo)) {
      setCargando(false);
      Swal.fire('Error', 'DPI y Formulario deben contener solo números.', 'warning');
      return;
    }
  
    if (formulario.telefono !== '' && !/^\d{8}$/.test(formulario.telefono)) {
      setCargando(false);
      Swal.fire('Error', 'Si se ingresa Teléfono, debe tener exactamente 8 números.', 'warning');
      return;
    }
  
    const { data: duplicados, error: errorCheck } = await supabase
      .from('beneficiarios_fertilizante')
      .select('id, dpi, codigo, telefono');
  
    if (errorCheck || !duplicados) {
      setCargando(false);
      Swal.fire('Error', 'No se pudo verificar duplicados.', 'error');
      return;
    }
  
    const existeDPI = duplicados.find((b) => b.dpi === formulario.dpi && b.id !== id);
    const existeCodigo = duplicados.find((b) => b.codigo === formulario.codigo && b.id !== id);
    const existeTelefono = duplicados.find((b) => b.telefono === formulario.telefono && b.id !== id);
  
    if (existeDPI || existeCodigo || (formulario.telefono !== 'N/A' && existeTelefono)) {
      setCargando(false);
      Swal.fire('Error', 'DPI, Formulario o Teléfono ya existen para otro beneficiario.', 'warning');
      return;
    }
  
    // Aquí corregimos el teléfono si viene vacío
    const datosActualizar = {
      ...formulario,
      telefono: formulario.telefono === '' ? 'N/A' : formulario.telefono,
      fecha_nacimiento: formulario.fecha_nacimiento?.trim() || null
    };

  
    const { error } = await supabase
      .from('beneficiarios_fertilizante')
      .update(datosActualizar)
      .eq('id', id);
  
    setCargando(false);
  
    if (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el beneficiario.', 'error');
    } else {
      Swal.fire('Éxito', 'Beneficiario actualizado correctamente.', 'success').then(() => {
        router.back();
      });
    }
  };
  
  

  if (!id) return <p className="p-4 text-center">ID de beneficiario no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      <CampoTexto label="Nombre completo" name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} />
      <CampoTexto label="DPI" name="dpi" value={formulario.dpi} onChange={handleChange} />
      <CampoTexto
        label="Teléfono"
        name="telefono"
        value={formulario.telefono}
        onChange={handleChange}
        type="text"
        placeholder="8 dígitos numéricos"
      />
      <CampoTexto label="Formulario" name="codigo" value={formulario.codigo} onChange={handleChange} />
      <CampoLugar value={formulario.lugar} onChange={handleChange} />
      <div>
        <label className="font-semibold block mb-1">Fecha</label>
        <input type="date" name="fecha" value={formulario.fecha} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>
      <div>
      <label className="font-semibold block mb-1">Fecha de nacimiento</label>
      <input
        type="date"
        name="fecha_nacimiento"
        value={formulario.fecha_nacimiento}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
    </div>

      <div>
  <label className="font-semibold block mb-2">Sexo</label>
  <div className="flex gap-6">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="sexo"
        value="M"
        checked={formulario.sexo === 'M'}
        onChange={handleChange}
        className="accent-blue-600"
      />
      Masculino
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="sexo"
        value="F"
        checked={formulario.sexo === 'F'}
        onChange={handleChange}
        className="accent-pink-500"
      />
      Femenino
    </label>
  </div>
</div>

      <Button onClick={actualizar} disabled={!hayCambios || cargando} className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4">
        {cargando ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  );
}
