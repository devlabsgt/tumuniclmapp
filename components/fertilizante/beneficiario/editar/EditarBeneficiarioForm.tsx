'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { CampoTexto } from '../crear/CampoTexto';
import { CampoLugar } from '../crear/CampoLugar';
import CampoSexo from '../crear/CampoSexo';
import CampoEstado from '../crear/CampoEstado';
import { registrarLog } from '@/utils/registrarLog';

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
  const estaInforme = formulario.estado === 'Informe';
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

    const dpiActual = formulario.dpi.replace(/\s+/g, '');
    const codigoActual = formulario.codigo.replace(/\s+/g, '');
    const telefonoActual = formulario.telefono.replace(/\s+/g, '');

    // Validaciones de formato si los campos son editables y el estado lo permite
    if (formulario.estado !== 'Anulado' && formulario.estado !== 'Informe') {
      if (dpiActual && !/^\d+$/.test(dpiActual)) {
        setCargando(false);
        Swal.fire('Error', 'DPI debe contener solo números.', 'warning');
        return;
      }
      if (telefonoActual && telefonoActual !== 'N/A' && !/^\d{8}$/.test(telefonoActual)) {
        setCargando(false);
        Swal.fire('Error', 'Si se ingresa Teléfono, debe tener exactamente 8 dígitos.', 'warning');
        return;
      }
    }

    // Lógica de validación de duplicados (solo si el campo ha cambiado y no está en estado Anulado/Informe para DPI, Anulado para Código)
    let isDuplicateDPI = false;
    let isDuplicateCodigo = false;

    const originalDPIclean = original.dpi.replace(/\s+/g, '');
    const originalCodigoClean = original.codigo.replace(/\s+/g, '');

    const needToCheckDpiForChange = (dpiActual !== originalDPIclean && formulario.estado !== 'Anulado' && formulario.estado !== 'Informe');
    const needToCheckCodigoForChange = (codigoActual !== originalCodigoClean && formulario.estado !== 'Anulado');

    if (needToCheckDpiForChange || needToCheckCodigoForChange) {
        const { data: allBeneficiarios, error: errorCheck } = await supabase
            .from('beneficiarios_fertilizante')
            .select('id, dpi, codigo');

        if (errorCheck || !allBeneficiarios) {
            setCargando(false);
            Swal.fire('Error', 'No se pudo verificar duplicados.', 'error');
            return;
        }

        if (needToCheckDpiForChange) {
            isDuplicateDPI = allBeneficiarios.some((b) => b.dpi === dpiActual && b.id !== id);
        }

        if (needToCheckCodigoForChange) {
            isDuplicateCodigo = allBeneficiarios.some((b) => b.codigo === codigoActual && b.id !== id);
        }
    }

    if (isDuplicateDPI || isDuplicateCodigo) {
        setCargando(false);
        Swal.fire('Error', 'DPI o Folio ya existen para otro beneficiario.', 'warning');
        return;
    }

    // Construcción dinámica de datosActualizar y lista de cambios para el log
    const datosActualizar: any = {};
    const cambios: string[] = [];

    // Lógica para campos que pueden cambiar en diferentes estados
    if (formulario.lugar !== original.lugar) {
      datosActualizar.lugar = formulario.lugar;
      cambios.push(`<strong>Lugar:</strong> "${original.lugar}" → "${formulario.lugar}"`);
    }
    
    // Fecha: Siempre se puede modificar
    if (formulario.fecha !== original.fecha) {
      datosActualizar.fecha = formulario.fecha;
      cambios.push(`<strong>Fecha:</strong> "${original.fecha}" → "${formulario.fecha}"`);
    }

    // Código: Editable en "Normal" e "Informe", se mantiene en "Anulado"
    if (codigoActual !== originalCodigoClean) {
      datosActualizar.codigo = codigoActual;
      cambios.push(`<strong>Folio:</strong> "${original.codigo}" → "${formulario.codigo}"`);
    }

    // Cantidad: Editable en "Normal" e "Informe", 0 en "Anulado"
    const cantidadActual = parseInt(formulario.cantidad || '0', 10);
    const originalCantidad = parseInt(original.cantidad || '0', 10);
    if (cantidadActual !== originalCantidad && formulario.estado !== 'Anulado') {
        datosActualizar.cantidad = cantidadActual;
        cambios.push(`<strong>Cantidad:</strong> "${original.cantidad}" → "${formulario.cantidad}"`);
    }

    // Campos específicos para estado "Normal" (no Anulado ni Informe)
    if (formulario.estado !== 'Anulado' && formulario.estado !== 'Informe') {
      if (formulario.nombre_completo !== original.nombre_completo) {
        datosActualizar.nombre_completo = formulario.nombre_completo;
        cambios.push(`<strong>Nombre:</strong> "${original.nombre_completo}" → "${formulario.nombre_completo}"`);
      }
      if (dpiActual !== originalDPIclean) {
        datosActualizar.dpi = dpiActual;
        cambios.push(`<strong>DPI:</strong> "${original.dpi}" → "${formulario.dpi}"`);
      }
      if (telefonoActual !== original.telefono.replace(/\s+/g, '') || (telefonoActual === '' && original.telefono !== 'N/A')) {
        datosActualizar.telefono = telefonoActual === '' ? 'N/A' : telefonoActual;
        cambios.push(`<strong>Teléfono:</strong> "${original.telefono}" → "${formulario.telefono}"`);
      }
      if (formulario.fecha_nacimiento !== original.fecha_nacimiento) {
        datosActualizar.fecha_nacimiento = formulario.fecha_nacimiento?.trim() || null;
        cambios.push(`<strong>Fecha nacimiento:</strong> "${original.fecha_nacimiento}" → "${formulario.fecha_nacimiento}"`);
      }
      if (formulario.sexo !== original.sexo) {
        datosActualizar.sexo = formulario.sexo;
        cambios.push(`<strong>Sexo:</strong> "${original.sexo}" → "${formulario.sexo}"`);
      }
    }
    
    // El cambio de estado siempre es relevante y define otras actualizaciones
    if (formulario.estado !== original.estado) {
      datosActualizar.estado = formulario.estado;
      cambios.push(`<strong>Estado:</strong> "${original.estado}" → "${formulario.estado}"`);

      // Si el nuevo estado es Anulado, sobrescribimos ciertos campos a null/0
      if (formulario.estado === 'Anulado') {
          // Solo si no se ha establecido ya por un cambio de valor directo.
          // Si el campo ya tiene valor null/0 en datosActualizar, no lo sobrescribimos.
          if (!('nombre_completo' in datosActualizar)) datosActualizar.nombre_completo = null;
          if (!('dpi' in datosActualizar)) datosActualizar.dpi = null;
          if (!('telefono' in datosActualizar)) datosActualizar.telefono = null;
          if (!('sexo' in datosActualizar)) datosActualizar.sexo = null;
          if (!('fecha_nacimiento' in datosActualizar)) datosActualizar.fecha_nacimiento = null;
          if (!('cantidad' in datosActualizar)) datosActualizar.cantidad = 0;
          if (!('fecha' in datosActualizar)) datosActualizar.fecha = new Date().toISOString().split('T')[0]; // Fecha actual al anular

          // Registra en el log los campos que se anularon
          if (original.nombre_completo !== null) cambios.push(`<strong>Nombre:</strong> Se anuló de "${original.nombre_completo}" a null`);
          if (original.dpi !== null) cambios.push(`<strong>DPI:</strong> Se anuló de "${original.dpi}" a null`);
          if (original.telefono !== null && original.telefono !== 'N/A') cambios.push(`<strong>Teléfono:</strong> Se anuló de "${original.telefono}" a null`);
          if (original.sexo !== null) cambios.push(`<strong>Sexo:</strong> Se anuló de "${original.sexo}" a null`);
          if (original.fecha_nacimiento !== null) cambios.push(`<strong>Fecha nacimiento:</strong> Se anuló de "${original.fecha_nacimiento}" a null`);
          if (parseInt(original.cantidad || '0', 10) !== 0) cambios.push(`<strong>Cantidad:</strong> Se anuló de "${original.cantidad}" a 0`);
      }
    }

    // Si no hay campos para actualizar después de construir el objeto, no hay cambios reales
    if (Object.keys(datosActualizar).length === 0) {
        Swal.fire('Sin cambios', 'No hubo modificaciones significativas para guardar.', 'info');
        setCargando(false);
        return;
    }

    const descripcion = `<strong>Folio: ${formulario.codigo}</strong>:<br><br>${cambios.join('<br><br>')}`;

    const { error } = await supabase
      .from('beneficiarios_fertilizante')
      .update(datosActualizar)
      .eq('id', id);

    setCargando(false);

    if (error) {
      console.error(error);

      await registrarLog({
        accion: 'ERROR_EDITAR',
        nombreModulo: 'FERTILIZANTE',
        descripcion: `Error al editar el folio ${formulario.codigo}: ${error.message}`,
      });

      Swal.fire('Error', 'No se pudo actualizar el beneficiario.', 'error');
    } else {
      await registrarLog({
        accion: 'EDITAR',
        nombreModulo: 'FERTILIZANTE',
        descripcion,
      });

      Swal.fire('Éxito', 'Beneficiario actualizado correctamente.', 'success').then(() => {
        router.back();
      });
    }
  };

  if (!id) return <p className="p-4 text-center">ID de beneficiario no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      {formulario.estado !== 'Anulado' && formulario.estado !== 'Informe' && (
        <>
          <CampoTexto label="Nombre completo" name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} disabled={estaAnulado || estaInforme} />
          <CampoTexto label="DPI" name="dpi" value={formulario.dpi} onChange={handleChange} disabled={estaAnulado || estaInforme} />
          <CampoTexto label="Teléfono" name="telefono" value={formulario.telefono} onChange={handleChange} type="text" placeholder="8 dígitos numéricos" disabled={estaAnulado || estaInforme} />
        </>
      )}
      {formulario.estado !== 'Anulado'  && (
        <>
          <CampoTexto label="Folio" name="codigo" value={formulario.codigo} onChange={handleChange} disabled={estaAnulado} />
              <div>
            <label className="font-semibold block mb-1">Cantidad de sacos</label>
            <input type="number" name="cantidad" min="1" step="1" value={formulario.cantidad} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" disabled={estaAnulado} required />
          </div>

        </>
      )}


      <CampoLugar value={formulario.lugar} onChange={handleChange} />

      <div>
        <label className="font-semibold block mb-1">Fecha</label>
        <input type="date" name="fecha" value={formulario.fecha} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>



      {formulario.estado !== 'Anulado' && formulario.estado !== 'Informe' && (
        <>
          <div>
              <label className="font-semibold block mb-1">Fecha de nacimiento</label>
              <input type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={handleChange} disabled={estaAnulado || estaInforme} className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
        <CampoSexo sexo={formulario.sexo} onChange={handleChange} />
        </>
      )}
      
      <CampoEstado
        estado={formulario.estado}
        onChange={handleChange}
        esEdicion
        disabled={estaAnulado || estaInforme}
      />

      <Button onClick={actualizar} disabled={!hayCambios || cargando} className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white mt-4">
        {cargando ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  );
}