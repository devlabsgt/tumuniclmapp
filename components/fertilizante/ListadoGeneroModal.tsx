'use client';

import { Dialog } from '@headlessui/react';
import { Fragment, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Beneficiario } from './types';

type FiltroGenero = 'todos' | 'hombres' | 'mujeres';
type OrdenTodos = 'hombres_primero' | 'mujeres_primero';

interface Props {
  visible: boolean;
  onClose: () => void;
  beneficiarios: Beneficiario[];
}

const esHombre = (sexo?: string | null) => sexo?.toUpperCase() === 'M';
const esMujer = (sexo?: string | null) => sexo?.toUpperCase() === 'F';

const coincideBusqueda = (b: Beneficiario, termino: string): boolean => {
  const t = termino.trim().toLowerCase();
  if (!t) return true;

  return [b.codigo, b.nombre_completo].some((campo) =>
    campo?.toLowerCase().includes(t),
  );
};

export default function ListadoGeneroModal({
  visible,
  onClose,
  beneficiarios,
}: Props) {
  const [filtro, setFiltro] = useState<FiltroGenero>('todos');
  const [ordenTodos, setOrdenTodos] = useState<OrdenTodos>('hombres_primero');
  const [busqueda, setBusqueda] = useState('');

  const hombres = useMemo(
    () => beneficiarios.filter((b) => esHombre(b.sexo)),
    [beneficiarios],
  );
  const mujeres = useMemo(
    () => beneficiarios.filter((b) => esMujer(b.sexo)),
    [beneficiarios],
  );
  const sinGenero = useMemo(
    () => beneficiarios.filter((b) => !esHombre(b.sexo) && !esMujer(b.sexo)),
    [beneficiarios],
  );

  const listado = useMemo(() => {
    if (filtro === 'hombres') return hombres;
    if (filtro === 'mujeres') return mujeres;
    if (ordenTodos === 'hombres_primero') {
      return [...hombres, ...mujeres, ...sinGenero];
    }
    return [...mujeres, ...hombres, ...sinGenero];
  }, [filtro, hombres, mujeres, sinGenero, ordenTodos]);

  const listadoFiltrado = useMemo(
    () => listado.filter((b) => coincideBusqueda(b, busqueda)),
    [listado, busqueda],
  );

  const manejarCerrar = () => {
    setBusqueda('');
    onClose();
  };

  const manejarClickTodos = () => {
    if (filtro === 'todos') {
      setOrdenTodos((prev) =>
        prev === 'hombres_primero' ? 'mujeres_primero' : 'hombres_primero',
      );
      return;
    }
    setFiltro('todos');
    setOrdenTodos('hombres_primero');
  };

  const estiloTodos =
    filtro !== 'todos'
      ? 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
      : ordenTodos === 'hombres_primero'
        ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
        : 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300';

  const tituloFiltro =
    filtro === 'hombres'
      ? 'Hombres'
      : filtro === 'mujeres'
        ? 'Mujeres'
        : ordenTodos === 'hombres_primero'
          ? 'Hombres y Mujeres (hombres primero)'
          : 'Hombres y Mujeres (mujeres primero)';

  const botonFiltro = (valor: FiltroGenero, etiqueta: string, activo: string) => (
    <button
      type="button"
      onClick={() => setFiltro(valor)}
      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
        filtro === valor
          ? activo
          : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
      }`}
    >
      {etiqueta}
    </button>
  );

  return (
    <Dialog open={visible} onClose={manejarCerrar} as={Fragment}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Dialog.Panel className="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg flex flex-col">
          <div className="flex justify-between items-start gap-4 p-6 border-b dark:border-neutral-700">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Listado por género
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tituloFiltro}:{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {listadoFiltrado.length}
                </span>
                {busqueda.trim() ? (
                  <>
                    {' '}
                    de {listado.length} en esta vista
                  </>
                ) : null}{' '}
                | {beneficiarios.length} registros en total
              </p>
            </div>
            <Button onClick={manejarCerrar} variant="ghost">
              Cerrar
            </Button>
          </div>

          <div className="px-6 py-3 flex flex-wrap items-center gap-2 border-b dark:border-neutral-700">
            <button
              type="button"
              onClick={manejarClickTodos}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${estiloTodos}`}
            >
              Todos ({beneficiarios.length})
            </button>
            {botonFiltro(
              'hombres',
              `Hombres (${hombres.length})`,
              'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
            )}
            {botonFiltro(
              'mujeres',
              `Mujeres (${mujeres.length})`,
              'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
            )}
          </div>

          <div className="px-6 pt-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio o nombre..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-auto flex-1 p-6 pt-4">
            {listado.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No hay registros para mostrar.
              </p>
            ) : listadoFiltrado.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No se encontraron resultados para &quot;{busqueda}&quot;.
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="p-2 border dark:border-neutral-700 w-20">Folio</th>
                    <th className="p-2 border dark:border-neutral-700">Nombre</th>
                    <th className="p-2 border dark:border-neutral-700 w-24">Género</th>
                    <th className="p-2 border dark:border-neutral-700 w-16 text-center">Ctd.</th>
                    <th className="p-2 border dark:border-neutral-700">Lugar</th>
                  </tr>
                </thead>
                <tbody>
                  {listadoFiltrado.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-800/60"
                    >
                      <td className="p-2 border dark:border-neutral-700 font-mono">
                        {b.codigo}
                      </td>
                      <td className="p-2 border dark:border-neutral-700">
                        {b.nombre_completo || '—'}
                      </td>
                      <td
                        className={`p-2 border dark:border-neutral-700 font-semibold ${
                          esHombre(b.sexo)
                            ? 'text-blue-600 dark:text-blue-400'
                            : esMujer(b.sexo)
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {esHombre(b.sexo) ? 'Hombre' : esMujer(b.sexo) ? 'Mujer' : '—'}
                      </td>
                      <td className="p-2 border dark:border-neutral-700 text-center">
                        {b.cantidad ?? '—'}
                      </td>
                      <td className="p-2 border dark:border-neutral-700">
                        {b.lugar || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
