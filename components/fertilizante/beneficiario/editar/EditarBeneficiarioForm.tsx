'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { registrarLog } from '@/utils/registrarLog';
import { obtenerLugares } from '@/lib/obtenerLugares';
import useUserData from '@/hooks/sesion/useUserData';
import { BuscadorLugar } from '@/components/fertilizante/BuscadorLugar';
import { btnPrimaryClass, btnSubmitClass, formFieldsClass, formSectionsGridClass, inputClass, inputErrorClass, inputMonoClass, labelClass, sectionClass } from '@/components/fertilizante/formStyles';

const completarFolioConCeros = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (!digitos) return digitos;
  return digitos.padStart(4, '0');
};

export default function EditarBeneficiarioForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') || '';
  const { nombre } = useUserData();

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
  const [cargando, setCargando] = useState(false);
  const [lugares, setLugares] = useState<string[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const estaAnulado = formulario.estado === 'Anulado';
  const estaInforme = formulario.estado === 'Informe';

  useEffect(() => {
    const cargarLugares = async () => {
      const lista = await obtenerLugares();
      setLugares(lista);
    };
    cargarLugares();
  }, []);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let { name, value } = e.target;

    if (name === 'dpi') {
      value = value.replace(/\D/g, '').slice(0, 13);
    } else if (name === 'telefono') {
      value = value.replace(/\D/g, '').slice(0, 8);
    } else if (name === 'codigo') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const hayCambios = useMemo(() => {
    return JSON.stringify(formulario) !== JSON.stringify(original);
  }, [formulario, original]);

  const actualizar = async () => {
    if (!id || !hayCambios) {
      Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
      return;
    }

    // Validaciones inline
    const nuevosErrores: Record<string, string> = {};
    const dpiActual = formulario.dpi.replace(/\s+/g, '');
    const codigoActual = formulario.codigo.replace(/\s+/g, '');
    const telefonoActual = formulario.telefono.replace(/\s+/g, '');

    if (!estaAnulado && !estaInforme) {
      if (dpiActual && !/^\d+$/.test(dpiActual)) {
        nuevosErrores['dpi'] = 'Solo números';
      }
      if (telefonoActual && telefonoActual !== 'N/A' && !/^\d{8}$/.test(telefonoActual)) {
        nuevosErrores['telefono'] = 'Debe tener 8 números';
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setCargando(true);
    const supabase = createClient();

    // Validación de duplicados
    const originalDPIclean = original.dpi.replace(/\s+/g, '');
    const originalCodigoClean = original.codigo.replace(/\s+/g, '');

    const needToCheckDpiForChange = (dpiActual !== originalDPIclean && !estaAnulado && !estaInforme);
    const needToCheckCodigoForChange = (codigoActual !== originalCodigoClean && !estaAnulado);

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
        const isDuplicateDPI = allBeneficiarios.some((b) => b.dpi === dpiActual && b.id !== id);
        if (isDuplicateDPI) {
          setCargando(false);
          nuevosErrores['dpi'] = 'DPI ya existe';
          setErrores(nuevosErrores);
          return;
        }
      }

      if (needToCheckCodigoForChange) {
        const isDuplicateCodigo = allBeneficiarios.some((b) => b.codigo === codigoActual && b.id !== id);
        if (isDuplicateCodigo) {
          setCargando(false);
          nuevosErrores['codigo'] = 'Folio ya existe';
          setErrores(nuevosErrores);
          return;
        }
      }
    }

    // Construcción dinámica de datosActualizar y lista de cambios para el log
    const datosActualizar: any = {};
    const cambios: string[] = [];

    if (formulario.lugar !== original.lugar) {
      datosActualizar.lugar = formulario.lugar;
      cambios.push(`<strong>Lugar:</strong> "${original.lugar}" → "${formulario.lugar}"`);
    }
    
    if (formulario.fecha !== original.fecha) {
      datosActualizar.fecha = formulario.fecha;
      cambios.push(`<strong>Fecha:</strong> "${original.fecha}" → "${formulario.fecha}"`);
    }

    if (codigoActual !== originalCodigoClean) {
      datosActualizar.codigo = codigoActual;
      cambios.push(`<strong>Folio:</strong> "${original.codigo}" → "${formulario.codigo}"`);
    }

    const cantidadActual = parseInt(formulario.cantidad || '0', 10);
    const originalCantidad = parseInt(original.cantidad || '0', 10);
    if (cantidadActual !== originalCantidad && !estaAnulado) {
      datosActualizar.cantidad = cantidadActual;
      cambios.push(`<strong>Cantidad:</strong> "${original.cantidad}" → "${formulario.cantidad}"`);
    }

    if (!estaAnulado && !estaInforme) {
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
    
    if (formulario.estado !== original.estado) {
      datosActualizar.estado = formulario.estado;
      cambios.push(`<strong>Estado:</strong> "${original.estado}" → "${formulario.estado}"`);

      if (formulario.estado === 'Anulado') {
        if (!('nombre_completo' in datosActualizar)) datosActualizar.nombre_completo = null;
        if (!('dpi' in datosActualizar)) datosActualizar.dpi = null;
        if (!('telefono' in datosActualizar)) datosActualizar.telefono = null;
        if (!('sexo' in datosActualizar)) datosActualizar.sexo = null;
        if (!('fecha_nacimiento' in datosActualizar)) datosActualizar.fecha_nacimiento = null;
        if (!('cantidad' in datosActualizar)) datosActualizar.cantidad = 0;
        if (!('fecha' in datosActualizar)) datosActualizar.fecha = new Date().toISOString().split('T')[0];

        if (original.nombre_completo !== null) cambios.push(`<strong>Nombre:</strong> Se anuló de "${original.nombre_completo}" a null`);
        if (original.dpi !== null) cambios.push(`<strong>DPI:</strong> Se anuló de "${original.dpi}" a null`);
        if (original.telefono !== null && original.telefono !== 'N/A') cambios.push(`<strong>Teléfono:</strong> Se anuló de "${original.telefono}" a null`);
        if (original.sexo !== null) cambios.push(`<strong>Sexo:</strong> Se anuló de "${original.sexo}" a null`);
        if (original.fecha_nacimiento !== null) cambios.push(`<strong>Fecha nacimiento:</strong> Se anuló de "${original.fecha_nacimiento}" a null`);
        if (parseInt(original.cantidad || '0', 10) !== 0) cambios.push(`<strong>Cantidad:</strong> Se anuló de "${original.cantidad}" a 0`);
      }
    }

    if (Object.keys(datosActualizar).length === 0) {
      Swal.fire('Sin cambios', 'No hubo modificaciones significativas para guardar.', 'info');
      setCargando(false);
      return;
    }

    // Agregar datos de auditoría
    datosActualizar.editado_por = nombre || 'Desconocido';
    datosActualizar.updated_at = new Date().toISOString();

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

  if (!id) return <p className="p-4 text-center text-sm text-gray-500">ID de beneficiario no proporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
        <div className={!estaAnulado && !estaInforme ? formSectionsGridClass : 'flex flex-col gap-6'}>
      {!estaAnulado && !estaInforme && (
        <section className={sectionClass}>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos personales</p>
          <div className={formFieldsClass}>
            <div>
              <label className={labelClass}>
                Nombre completo
                {errores.nombre_completo && (
                  <span className="text-red-500 normal-case tracking-normal ml-1">{errores.nombre_completo}</span>
                )}
              </label>
              <input
                type="text"
                name="nombre_completo"
                value={formulario.nombre_completo}
                onChange={handleChange}
                className={`${inputClass} ${errores.nombre_completo ? inputErrorClass : ''}`}
              />
            </div>

            <div>
              <label className={labelClass}>
                DPI
                {errores.dpi && (
                  <span className="text-red-500 normal-case tracking-normal ml-1">{errores.dpi}</span>
                )}
              </label>
              <input
                type="text"
                name="dpi"
                inputMode="numeric"
                value={formulario.dpi}
                onChange={handleChange}
                className={`${inputClass} ${errores.dpi ? inputErrorClass : ''}`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Teléfono
                {errores.telefono && (
                  <span className="text-red-500 normal-case tracking-normal ml-1">{errores.telefono}</span>
                )}
              </label>
              <input
                type="tel"
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                placeholder="8 dígitos"
                className={`${inputClass} ${errores.telefono ? inputErrorClass : ''}`}
              />
            </div>

            <div>
              <label className={labelClass}>Fecha de nacimiento</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formulario.fecha_nacimiento}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <span className={labelClass}>
                Sexo
                {errores.sexo && (
                  <span className="text-red-500 normal-case tracking-normal ml-1">{errores.sexo}</span>
                )}
              </span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="sexo"
                    value="M"
                    checked={formulario.sexo === 'M'}
                    onChange={handleChange}
                    className="accent-emerald-600"
                  />
                  Masculino
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
          </div>
        </section>
      )}

      <section className={sectionClass}>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos de entrega</p>
        <div className={formFieldsClass}>
          <BuscadorLugar
            value={formulario.lugar}
            onChange={(lugar) => {
              setFormulario((prev) => ({ ...prev, lugar }));
              if (errores.lugar) setErrores((prev) => ({ ...prev, lugar: '' }));
            }}
            lugares={lugares}
            error={errores.lugar}
          />

          <div>
            <label className={labelClass}>
              Fecha de entrega
              {errores.fecha && (
                <span className="text-red-500 normal-case tracking-normal ml-1">{errores.fecha}</span>
              )}
            </label>
            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              onChange={handleChange}
              className={`${inputClass} ${errores.fecha ? inputErrorClass : ''}`}
            />
          </div>

          {!estaAnulado && (
            <>
              <div>
                <label className={labelClass}>
                  Folio
                  {errores.codigo && (
                    <span className="text-red-500 normal-case tracking-normal ml-1">{errores.codigo}</span>
                  )}
                </label>
                <input
                  type="text"
                  name="codigo"
                  inputMode="numeric"
                  value={formulario.codigo}
                  onChange={handleChange}
                  onBlur={() =>
                    setFormulario((prev) => ({ ...prev, codigo: completarFolioConCeros(prev.codigo) }))
                  }
                  maxLength={4}
                  className={`${inputMonoClass} ${errores.codigo ? inputErrorClass : ''}`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Cantidad de sacos
                  {errores.cantidad && (
                    <span className="text-red-500 normal-case tracking-normal ml-1">{errores.cantidad}</span>
                  )}
                </label>
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  step="1"
                  value={formulario.cantidad}
                  onChange={handleChange}
                  className={`${inputClass} ${errores.cantidad ? inputErrorClass : ''}`}
                />
              </div>
            </>
          )}

          <div>
            <span className={labelClass}>Estado</span>
            <div className="flex gap-4 flex-wrap mt-1">
              {(formulario.estado === 'Entregado' || formulario.estado === 'Extraviado') && (
                <>
                  <label className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <input
                      type="radio"
                      name="estado"
                      value="Entregado"
                      checked={formulario.estado === 'Entregado'}
                      onChange={handleChange}
                      className="accent-green-600"
                    />
                    Entregado
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    <input
                      type="radio"
                      name="estado"
                      value="Extraviado"
                      checked={formulario.estado === 'Extraviado'}
                      onChange={handleChange}
                      className="accent-yellow-500"
                    />
                    Extraviado
                  </label>
                </>
              )}
              {(formulario.estado === 'Anulado' || formulario.estado === 'Informe') && (
                <>
                  <label className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <input
                      type="radio"
                      name="estado"
                      value="Anulado"
                      checked={formulario.estado === 'Anulado'}
                      onChange={handleChange}
                      disabled={estaAnulado || estaInforme}
                      className="accent-red-600"
                    />
                    Anulado
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    <input
                      type="radio"
                      name="estado"
                      value="Informe"
                      checked={formulario.estado === 'Informe'}
                      onChange={handleChange}
                      disabled={estaAnulado || estaInforme}
                      className="accent-blue-600"
                    />
                    Informe
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={actualizar}
          disabled={!hayCambios || cargando}
          className={btnSubmitClass}
        >
          {cargando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}