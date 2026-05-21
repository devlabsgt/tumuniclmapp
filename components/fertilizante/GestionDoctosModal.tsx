'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Ban } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { obtenerLugares } from '@/lib/obtenerLugares';
import { registrarLog } from '@/utils/registrarLog';
import Swal from 'sweetalert2';
import useUserData from '@/hooks/sesion/useUserData';
import { BuscadorLugar } from '@/components/fertilizante/BuscadorLugar';
import { inputClass, inputMonoClass, labelClass, sectionClass } from '@/components/fertilizante/formStyles';

const completarFolioConCeros = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (!digitos) return digitos;
  return digitos.padStart(4, '0');
};

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Props = {
  visible: boolean;
  onClose: () => void;
  aniosDisponibles: string[];
  onGuardado: () => void;
};

type Tab = 'anular' | 'informe';

export default function GestionDoctosModal({ visible, onClose, aniosDisponibles, onGuardado }: Props) {
  const anioActual = new Date().getFullYear().toString();
  const { nombre } = useUserData();
  const [tab, setTab] = useState<Tab>('anular');
  const [lugares, setLugares] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Formularios (lugar compartido entre pestañas)
  const [folio, setFolio] = useState('');
  const [lugar, setLugar] = useState('');
  const [anioA, setAnioA] = useState(anioActual);
  const [codigo, setCodigo] = useState('');
  const [anioI, setAnioI] = useState(anioActual);
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [formKey, setFormKey] = useState(0);

  const limpiarFormulario = () => {
    setFolio('');
    setCodigo('');
    setCantidad('');
    setNotas('');
    setLugar('');
    setAnioA(anioActual);
    setAnioI(anioActual);
    setTab('anular');
    setFormKey((k) => k + 1);
  };

  useEffect(() => {
    if (!visible) return;
    limpiarFormulario();
    obtenerLugares().then(setLugares);
  }, [visible, anioActual]);

  if (!visible) return null;

  const aniosLista = Array.from(new Set([...aniosDisponibles, anioActual])).sort();

  const cerrarModal = () => {
    limpiarFormulario();
    onClose();
  };

  const guardarAnulado = async () => {
    const folioNorm = completarFolioConCeros(folio);
    setFolio(folioNorm);

    if (!/^\d{4}$/.test(folioNorm)) {
      Swal.fire({ icon: 'warning', title: 'Folio inválido', text: 'Ingrese un folio de 4 dígitos' });
      return;
    }
    if (!lugar) {
      Swal.fire({ icon: 'warning', title: 'Lugar requerido', text: 'Seleccione un lugar' });
      return;
    }
    setGuardando(true);
    const cod = folioNorm;
    const { data: existente } = await supabase
      .from('beneficiarios_fertilizante')
      .select('id')
      .eq('codigo', cod)
      .eq('anio', anioA)
      .maybeSingle();

    if (existente) {
      setGuardando(false);
      Swal.fire({ icon: 'warning', title: 'Folio existente', text: `El folio ${cod} ya está registrado para el año ${anioA}` });
      return;
    }

    const { error } = await supabase.from('beneficiarios_fertilizante').insert({
      codigo: cod,
      lugar: lugar,
      anio: anioA,
      fecha: new Date().toISOString(),
      cantidad: 0,
      estado: 'Anulado',
      nombre_completo: null,
      dpi: null,
      telefono: null,
      sexo: null,
      creado_por: nombre || 'Desconocido',
    });

    if (error) {
      setGuardando(false);
      await registrarLog({ accion: 'ERROR_ANULAR', nombreModulo: 'FERTILIZANTE', descripcion: error.message });
      Swal.fire({ icon: 'error', title: 'Error al anular folio', text: error.message });
      return;
    }

    const msg = `Se anuló correctamente el folio ${cod} para ${lugar}, año ${anioA}`;
    await registrarLog({ accion: 'ANULAR_FOLIO', nombreModulo: 'FERTILIZANTE', descripcion: msg });
    setGuardando(false);
    limpiarFormulario();
    Swal.fire({ icon: 'success', title: 'Folio anulado', text: msg, timer: 2000, showConfirmButton: false });
    onGuardado();
    cerrarModal();
  };

  const guardarInforme = async () => {
    const codigoNorm = completarFolioConCeros(codigo);
    setCodigo(codigoNorm);

    if (!/^\d{4}$/.test(codigoNorm)) {
      Swal.fire({ icon: 'warning', title: 'Código inválido', text: 'El código debe tener 4 dígitos' });
      return;
    }
    if (!lugar) {
      Swal.fire({ icon: 'warning', title: 'Lugar requerido', text: 'Seleccione un lugar' });
      return;
    }
    if (!cantidad || cantidad <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'Ingrese una cantidad mayor a 0' });
      return;
    }
    setGuardando(true);
    const cod = `I-${codigoNorm}`;
    const { data: existente } = await supabase
      .from('beneficiarios_fertilizante')
      .select('id')
      .eq('codigo', cod)
      .eq('anio', anioI)
      .maybeSingle();

    if (existente) {
      setGuardando(false);
      Swal.fire({ icon: 'warning', title: 'Código existente', text: `El código ${cod} ya está registrado para el año ${anioI}` });
      return;
    }

    const { error } = await supabase.from('beneficiarios_fertilizante').insert({
      codigo: cod,
      lugar: lugar,
      anio: anioI,
      fecha: new Date().toISOString(),
      cantidad,
      estado: 'Informe',
      nombre_completo: notas,
      dpi: null,
      telefono: null,
      sexo: null,
      creado_por: nombre || 'Desconocido',
    });

    if (error) {
      setGuardando(false);
      await registrarLog({ accion: 'ERROR_INFORME', nombreModulo: 'FERTILIZANTE', descripcion: error.message });
      Swal.fire({ icon: 'error', title: 'Error al guardar informe', text: error.message });
      return;
    }

    const msg = `Informe registrado con código ${cod} para ${lugar}, año ${anioI}, cantidad: ${cantidad}`;
    await registrarLog({ accion: 'GUARDAR_INFORME', nombreModulo: 'FERTILIZANTE', descripcion: msg });
    setGuardando(false);
    limpiarFormulario();
    Swal.fire({ icon: 'success', title: 'Informe registrado', text: msg, timer: 2000, showConfirmButton: false });
    onGuardado();
    cerrarModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={cerrarModal}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={cerrarModal}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          title="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Gestionar documentos</h2>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl mb-5">
            <button
              onClick={() => setTab('anular')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${tab === 'anular' ? 'bg-white dark:bg-neutral-700 shadow-sm text-red-600 dark:text-red-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <Ban size={16} />
              Anular folio
            </button>
            <button
              onClick={() => setTab('informe')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${tab === 'informe' ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <FileText size={16} />
              Ingresar informe
            </button>
          </div>

          {tab === 'anular' ? (
            <section className={sectionClass}>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Folio</label>
                  <input
                    inputMode="numeric"
                    value={folio}
                    onChange={(e) => setFolio(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={() => setFolio((v) => completarFolioConCeros(v))}
                    maxLength={4}
                    placeholder="0001"
                    className={inputMonoClass}
                  />
                </div>

                <BuscadorLugar key={`anular-${formKey}`} value={lugar} onChange={setLugar} lugares={lugares} />

                <div>
                  <label className={labelClass}>Año</label>
                  <select
                    value={anioA}
                    onChange={(e) => setAnioA(e.target.value)}
                    className={inputClass}
                  >
                    {aniosLista.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={guardarAnulado}
                  disabled={guardando}
                  className="h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold w-full transition-all active:scale-95"
                >
                  {guardando ? 'Guardando...' : 'Anular folio'}
                </button>
              </div>
            </section>
          ) : (
            <section className={sectionClass}>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Código</label>
                  <input
                    inputMode="numeric"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={() => setCodigo((v) => completarFolioConCeros(v))}
                    maxLength={4}
                    placeholder="0001"
                    className={inputMonoClass}
                  />
                </div>

                <BuscadorLugar key={`informe-${formKey}`} value={lugar} onChange={setLugar} lugares={lugares} />

                <div>
                  <label className={labelClass}>Año</label>
                  <select
                    value={anioI}
                    onChange={(e) => setAnioI(e.target.value)}
                    className={inputClass}
                  >
                    {aniosLista.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Cantidad entregada</label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej. 1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Notas / descripción</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Anotaciones..."
                    className={`${inputClass} h-auto py-2 resize-none`}
                  />
                </div>

                <button
                  type="button"
                  onClick={guardarInforme}
                  disabled={guardando}
                  className="h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold w-full transition-all active:scale-95"
                >
                  {guardando ? 'Guardando...' : 'Guardar informe'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
