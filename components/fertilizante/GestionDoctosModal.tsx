'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Ban } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { obtenerLugares } from '@/lib/obtenerLugares';
import { registrarLog } from '@/utils/registrarLog';
import Swal from 'sweetalert2';
import useUserData from '@/hooks/sesion/useUserData';

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

  // Form anular
  const [folio, setFolio] = useState('');
  const [lugarA, setLugarA] = useState('');
  const [anioA, setAnioA] = useState(anioActual);

  // Form informe
  const [codigo, setCodigo] = useState('');
  const [lugarI, setLugarI] = useState('');
  const [anioI, setAnioI] = useState(anioActual);
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!visible) return;
    obtenerLugares().then((l) => {
      setLugares(l);
      if (l.length > 0) {
        setLugarA((prev) => prev || l[0]);
        setLugarI((prev) => prev || l[0]);
      }
    });
    setAnioA(anioActual);
    setAnioI(anioActual);
  }, [visible, anioActual]);

  if (!visible) return null;

  const aniosLista = Array.from(new Set([...aniosDisponibles, anioActual])).sort();

  const reset = () => {
    setFolio('');
    setCodigo('');
    setCantidad('');
    setNotas('');
  };

  const guardarAnulado = async () => {
    if (!/^\d{4}$/.test(folio)) {
      Swal.fire({ icon: 'warning', title: 'Folio inválido', text: 'Ingrese un folio de 4 dígitos' });
      return;
    }
    setGuardando(true);
    const cod = folio.padStart(4, '0');
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
      lugar: lugarA,
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

    const msg = `Se anuló correctamente el folio ${cod} para ${lugarA}, año ${anioA}`;
    await registrarLog({ accion: 'ANULAR_FOLIO', nombreModulo: 'FERTILIZANTE', descripcion: msg });
    setGuardando(false);
    reset();
    Swal.fire({ icon: 'success', title: 'Folio anulado', text: msg, timer: 2000, showConfirmButton: false });
    onGuardado();
    onClose();
  };

  const guardarInforme = async () => {
    if (!/^\d{4}$/.test(codigo)) {
      Swal.fire({ icon: 'warning', title: 'Código inválido', text: 'El código debe tener 4 dígitos' });
      return;
    }
    if (!cantidad || cantidad <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'Ingrese una cantidad mayor a 0' });
      return;
    }
    setGuardando(true);
    const cod = `I-${codigo}`;
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
      lugar: lugarI,
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

    const msg = `Informe registrado con código ${cod} para ${lugarI}, año ${anioI}, cantidad: ${cantidad}`;
    await registrarLog({ accion: 'GUARDAR_INFORME', nombreModulo: 'FERTILIZANTE', descripcion: msg });
    setGuardando(false);
    reset();
    Swal.fire({ icon: 'success', title: 'Informe registrado', text: msg, timer: 2000, showConfirmButton: false });
    onGuardado();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
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
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Folio (4 dígitos)</label>
                <input
                  inputMode="numeric"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="0234"
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Lugar</label>
                <select
                  value={lugarA}
                  onChange={(e) => setLugarA(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  {lugares.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Año</label>
                <select
                  value={anioA}
                  onChange={(e) => setAnioA(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  {aniosLista.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={guardarAnulado}
                disabled={guardando}
                className="mt-3 h-11 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                {guardando ? 'Guardando...' : 'Anular folio'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Código (4 dígitos)</label>
                <input
                  inputMode="numeric"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="0234"
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Lugar</label>
                <select
                  value={lugarI}
                  onChange={(e) => setLugarI(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {lugares.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Año</label>
                <select
                  value={anioI}
                  onChange={(e) => setAnioI(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {aniosLista.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Cantidad entregada</label>
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej. 1"
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">Notas / descripción</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Anotaciones..."
                  className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>
              <button
                onClick={guardarInforme}
                disabled={guardando}
                className="mt-3 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                {guardando ? 'Guardando...' : 'Guardar informe'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
