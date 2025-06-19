'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { CampoTexto } from '../crear/CampoTexto';
import { CampoLugar } from '../crear/CampoLugar';
import CampoSexo from '../crear/CampoSexo';
import CampoEstado from '../crear/CampoEstado';

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
    sexo: 'M',
    cantidad: '',
    estado: '',
  });

  const [original, setOriginal] = useState(formulario);
  const estaAnulado = formulario.estado === 'Anulado';
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
        nombre_completo: data.nombre_completo ?? '',
        dpi: data.dpi ?? '',
        lugar: data.lugar ?? '',
        fecha: data.fecha?.split('T')[0] ?? '',
        fecha_nacimiento: data.fecha_nacimiento?.split('T')[0] ?? '',
        codigo: data.codigo ?? '',
        telefono: data.telefono ?? '',
        sexo: data.sexo ?? 'M',
        cantidad: data.cantidad?.toString() ?? '',
        estado: data.estado ?? '',
      };

      setFormulario(datos);
      setOriginal(datos);
    };

    cargar();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    const dpi = formulario.dpi.replace(/\s+/g, '');
    const codigo = formulario.codigo.replace(/\s+/g, '');
    const telefono = formulario.telefono.replace(/\s+/g, '');

    if (dpi && !/^\d+$/.test(dpi)) {
      setCargando(false);
      Swal.fire('Error', 'DPI debe contener solo números.', 'warning');
      return;
    }

    if (telefono && telefono !== 'N/A' && !/^\d{8}$/.test(telefono)) {
      setCargando(false);
      Swal.fire('Error', 'Si se ingresa Teléfono, debe tener exactamente 8 dígitos.', 'warning');
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

    const existeDPI = duplicados.find((b) => b.dpi === dpi && b.id !== id);
    const existeCodigo = duplicados.find((b) => b.codigo === codigo && b.id !== id);
    const existeTelefono = duplicados.find((b) => b.telefono === telefono && b.id !== id);

    if (existeDPI || existeCodigo || (telefono !== 'N/A' && existeTelefono)) {
      setCargando(false);
      Swal.fire('Error', 'DPI, Folio o Teléfono ya existen para otro beneficiario.', 'warning');
      return;
    }

    let datosActualizar: any = {
      ...formulario,
      dpi,
      codigo,
      telefono: telefono === '' ? 'N/A' : telefono,
      fecha_nacimiento: formulario.fecha_nacimiento?.trim() || null,
      cantidad: parseInt(formulario.cantidad || '1', 10),
    };

    if (formulario.estado === 'Anulado') {
      datosActualizar = {
        ...datosActualizar,
        nombre_completo: null,
        dpi: null,
        telefono: null,
        sexo: null,
        fecha_nacimiento: null,
        cantidad: 0,
        fecha: new Date().toISOString().split('T')[0],
      };
    }

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
      <CampoTexto label="Nombre completo" name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} disabled={estaAnulado} />
      <CampoTexto label="DPI" name="dpi" value={formulario.dpi} onChange={handleChange} disabled={estaAnulado} />
      <CampoTexto label="Teléfono" name="telefono" value={formulario.telefono} onChange={handleChange} type="text" placeholder="8 dígitos numéricos" disabled={estaAnulado} />
      <CampoTexto label="Folio" name="codigo" value={formulario.codigo} onChange={handleChange} disabled={estaAnulado} />

      <div>
        <label className="font-semibold block mb-1">Cantidad de sacos</label>
        <input type="number" name="cantidad" min="1" step="1" value={formulario.cantidad} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" disabled={estaAnulado} required />
      </div>

      <CampoLugar value={formulario.lugar} onChange={handleChange} />

      <div>
        <label className="font-semibold block mb-1">Fecha</label>
        <input type="date" name="fecha" value={formulario.fecha} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div>
        <label className="font-semibold block mb-1">Fecha de nacimiento</label>
        <input type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={handleChange} disabled={estaAnulado} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <CampoSexo sexo={formulario.sexo} onChange={handleChange} />
      <CampoEstado estado={formulario.estado} onChange={handleChange} esEdicion />

      <Button onClick={actualizar} disabled={!hayCambios || cargando} className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4">
        {cargando ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  );
}
