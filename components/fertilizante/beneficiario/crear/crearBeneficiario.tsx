'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registrarLog } from '@/utils/registrarLog';
import { buscarHistorialDPI } from './actions';
import { obtenerLugares } from '@/lib/obtenerLugares';
import useUserData from '@/hooks/sesion/useUserData';

export function CrearBeneficiario() {
  const { nombre } = useUserData();
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
  const [anioHistorial, setAnioHistorial] = useState<string | null>(null);
  const [lugares, setLugares] = useState<string[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    const cargarLugares = async () => {
      const lista = await obtenerLugares();
      setLugares(lista);
    };
    cargarLugares();
  }, []);

const [formulario, setFormulario] = useState({
  nombre_completo: '',
  dpi: '',
  lugar: '',
  fecha: '',
  fecha_nacimiento: '',
  codigo: '',
  telefono: '',
  sexo: 'M',
  cantidad: '1',
  estado: 'Entregado',
});


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

  const verificarDPI = async () => {
    if (!dpi.trim()) {
      Swal.fire('Error', 'Ingrese un DPI válido.', 'error');
      return;
    }

    const respuesta = await buscarHistorialDPI(dpi, anio);

    if (!respuesta.success) {
      Swal.fire('Error', respuesta.error || 'Error al verificar el DPI.', 'error');
      return;
    }

    if (respuesta.existeActual) {
      const { data } = respuesta;
      Swal.fire({
        title: 'No Entregar',
        html: `
          <h2>El DPI<br/><span style="color:red">${data.dpi}</span><br/>ya recibió el beneficio este año</h2><br/>
          <strong>Datos del beneficiario:</strong><br/><br/>
          <strong>Nombre:</strong> ${data.nombre_completo}<br/><br/>
          <strong>DPI:</strong> ${data.dpi}<br/><br/>
          <strong>Folio:</strong> ${data.codigo}<br/><br/>
          <strong>Lugar:</strong> ${data.lugar}<br/><br/>
          <strong>Fecha:</strong> ${data.fecha}
        `,
        icon: 'error',
      });
    } else {
      if (respuesta.data) {
        const historial = respuesta.data;
        setAnioHistorial(historial.anio.toString());
        setFormulario((prev) => ({
          ...prev,
          dpi,
          nombre_completo: historial.nombre_completo || '',
          lugar: historial.lugar || '',
          fecha: '',
          fecha_nacimiento: historial.fecha_nacimiento || '',
          codigo: '',
          telefono: historial.telefono === 'N/A' ? '' : (historial.telefono || ''),
          sexo: historial.sexo || 'M',
        }));
      } else {
        setAnioHistorial(null);
        setFormulario((prev) => ({ ...prev, dpi }));
      }
      
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
      'cantidad',
    ];
    
    const nuevosErrores: Record<string, string> = {};
    camposRequeridos.forEach((campo) => {
      if (!formulario[campo as keyof typeof formulario]?.trim()) {
        nuevosErrores[campo] = 'Campo necesario';
      }
    });

    const cantidad = parseInt(formulario.cantidad || '1', 10);

    if (isNaN(cantidad) || cantidad < 1) {
      nuevosErrores['cantidad'] = 'Debe ser >= 1';
    }

    const dpi = formulario.dpi.trim();
    const codigo = formulario.codigo.trim();
    const telefono = formulario.telefono.trim();
  
    if (dpi && !/^\d{13}$/.test(dpi)) {
      nuevosErrores['dpi'] = 'Debe tener 13 números';
    }
  
    if (codigo && !/^\d{4}$/.test(codigo)) {
      nuevosErrores['codigo'] = 'Debe tener 4 números';
    }
  
    if (telefono !== '' && !/^\d{8}$/.test(telefono)) {
      nuevosErrores['telefono'] = 'Debe tener 8 números';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }
  
    const { data: duplicados, error: errorCheck } = await supabase
      .from('beneficiarios_fertilizante')
      .select('*')
      .eq('anio', anio)
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
        campo = 'Folio';
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
          <strong>Folio:</strong> ${b.codigo}<br/><br/>
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
        cantidad,
        dpi,
        codigo,
        telefono: telefono === '' ? 'N/A' : telefono,
        fecha_nacimiento: formulario.fecha_nacimiento?.trim() || null,
        anio: Number(anio),
        creado_por: nombre || 'Desconocido'
      }]);
        
if (error) {
  console.error('Error de Supabase:', error);
      await registrarLog({
        accion: 'ERROR_CREAR',
        nombreModulo: 'FERTILIZANTE',
        descripcion: `No se pudo registrar el beneficiario.<br><br><small>${error.message}</small>`,
      });
  Swal.fire('Error', `No se pudo registrar el beneficiario.<br><br><small>${error.message}</small>`, 'error');
} else {
        await registrarLog({
        accion: 'CREAR',
        nombreModulo: 'FERTILIZANTE',
        descripcion: `Se ingresó:<br><br><strong>Folio:</strong> ${formulario.codigo}<br><br><strong>Nombre:</strong> ${formulario.nombre_completo}<br><br><strong>DPI:</strong> ${formulario.dpi}`,
      });
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
        cantidad: '1',
          estado: 'Entregado',
      });
      setDpi('');
      setAnioHistorial(null);
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
        onClick={() => router.push('/protected/fertilizante/beneficiarios')}
          className="text-blue-600 text-base underline"
        >
          Volver
      </Button>
    </div>

    <h1 className="text-2xl font-bold text-center mb-4">
      Registrar Beneficiario de Fertilizante
    </h1>

    {mostrarFormulario && anioHistorial && (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Datos recuperados del año <strong>{anioHistorial}</strong>. Por favor complete la fecha y el folio actual.
            </p>
          </div>
        </div>
      </div>
    )}

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

        <div className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Ingrese el DPI del beneficiario"
            value={dpi}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 13);
              setDpi(soloNumeros);
            }}
          />
          <Button onClick={verificarDPI} className="h-11 text-lg">
            Ingresar DPI
          </Button>
        </div>
      </>
    )}

    {mostrarFormulario && (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        {/* Nombre completo */}
        <div>
          <label className="font-semibold block mb-1">
            Nombre completo
            {errores.nombre_completo && <span className="text-red-500 ml-2 text-sm">{errores.nombre_completo}</span>}
          </label>
          <input
            type="text"
            name="nombre_completo"
            value={formulario.nombre_completo}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.nombre_completo ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* DPI */}
        <div>
          <label className="font-semibold block mb-1">
            DPI
            {errores.dpi && <span className="text-red-500 ml-2 text-sm">{errores.dpi}</span>}
          </label>
          <input
            type="text"
            name="dpi"
            value={formulario.dpi}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.dpi ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* Lugar */}
        <div>
          <label className="font-semibold block mb-1">
            Lugar
            {errores.lugar && <span className="text-red-500 ml-2 text-sm">{errores.lugar}</span>}
          </label>
          <select
            name="lugar"
            value={formulario.lugar}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.lugar ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Seleccione un lugar...</option>
            {lugares.map((lugar) => (
              <option key={lugar} value={lugar}>
                {lugar}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="font-semibold block mb-1">
            Fecha de entrega
            {errores.fecha && <span className="text-red-500 ml-2 text-sm">{errores.fecha}</span>}
          </label>
          <input
            type="date"
            name="fecha"
            value={formulario.fecha}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.fecha ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="font-semibold block mb-1">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            name="fecha_nacimiento"
            value={formulario.fecha_nacimiento}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 border-gray-300"
          />
        </div>

        {/* Folio */}
        <div>
          <label className="font-semibold block mb-1">
            Folio
            {errores.codigo && <span className="text-red-500 ml-2 text-sm">{errores.codigo}</span>}
          </label>
          <input
            type="text"
            name="codigo"
            value={formulario.codigo}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.codigo ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* Cantidad de sacos */}
        <div>
          <label className="font-semibold block mb-1">
            Cantidad de sacos
            {errores.cantidad && <span className="text-red-500 ml-2 text-sm">{errores.cantidad}</span>}
          </label>
          <input
            type="number"
            name="cantidad"
            min="1"
            step="1"
            value={formulario.cantidad}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errores.cantidad ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="font-semibold block mb-1">
            Teléfono
            {errores.telefono && <span className="text-red-500 ml-2 text-sm">{errores.telefono}</span>}
          </label>
          <input
            type="tel"
            name="telefono"
            value={formulario.telefono}
            onChange={handleChange}
            placeholder="Ingrese 8 dígitos"
            className={`w-full border rounded px-3 py-2 ${errores.telefono ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        {/* Sexo */}
        <div className="flex items-center gap-4">
          <label className="text-lg font-medium">
            Sexo:
            {errores.sexo && <span className="text-red-500 ml-2 text-sm">{errores.sexo}</span>}
          </label>
          <div className="flex gap-4">
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

        {/* Estado */}
        <div className="flex items-center gap-4">
          <label className="text-lg font-medium">Estado:</label>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-green-700 font-medium">
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

            <label className="flex items-center gap-2 text-yellow-600 font-medium">
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
          </div>
        </div>

        <Button type="submit" className="mt-4 h-11 text-lg">
          Crear Beneficiario
        </Button>
      </form>
    )}
  </div>
);

}
