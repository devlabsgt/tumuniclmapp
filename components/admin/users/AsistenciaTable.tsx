'use client';

import React, { useState, Fragment, useMemo, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, FileText, Trash, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/asistencia/modal/Mapa';
import { Asistencia} from '@/lib/asistencia/esquemas';
import {
  format, isSameDay, eachDayOfInterval, isToday, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval, getYear, getMonth, startOfMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/input';

type Props = {
  registros: Asistencia[];
  rolActual: string | null;
};

export default function AsistenciaTable({ registros, rolActual }: Props) {
  const [semanaDeReferencia, setSemanaDeReferencia] = useState(new Date());
  const [fechaDeReferencia, setFechaDeReferencia] = useState<Date | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<Asistencia | null>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminoBusqueda.trim() !== '') {
      setEtiquetas([...etiquetas, terminoBusqueda.trim()]);
      setTerminoBusqueda('');
      setFechaDeReferencia(null);
    }
  };

  const handleEliminarEtiqueta = (etiquetaAEliminar: string) => {
    setEtiquetas(etiquetas.filter(etiqueta => etiqueta !== etiquetaAEliminar));
  };
  
  const handleBorrarTodasLasEtiquetas = () => {
    setEtiquetas([]);
  };

  const diasDeLaSemana = useMemo(() => eachDayOfInterval({
    start: startOfWeek(semanaDeReferencia, { weekStartsOn: 1 }),
    end: endOfWeek(semanaDeReferencia, { weekStartsOn: 1 }),
  }), [semanaDeReferencia]);

  const registrosFiltrados = useMemo(() => {
    let registrosBase: Asistencia[] = registros;

    // Aplicar filtro de búsqueda en tiempo real
    if (terminoBusqueda) {
      const termino = terminoBusqueda.toLowerCase();
      registrosBase = registrosBase.filter(r => {
        const nombreMatch = r.nombre?.toLowerCase().includes(termino);
        const emailMatch = r.email?.toLowerCase().includes(termino);
        const rolMatch = r.rol?.toLowerCase().includes(termino);
        const programaMatch = r.programas?.some(p => p.toLowerCase().includes(termino));
        return nombreMatch || emailMatch || rolMatch || programaMatch;
      });
    }

    // Aplicar filtros de etiquetas
    if (etiquetas.length > 0) {
      registrosBase = registrosBase.filter(r => {
        const nombreCompleto = r.nombre?.toLowerCase() || '';
        const email = r.email?.toLowerCase() || '';
        const rol = r.rol?.toLowerCase() || '';
        const programas = r.programas?.map(p => p.toLowerCase()) || [];

        return etiquetas.every(etiqueta => {
          const terminoEtiqueta = etiqueta.toLowerCase();
          return nombreCompleto.includes(terminoEtiqueta) ||
                 email.includes(terminoEtiqueta) ||
                 rol.includes(terminoEtiqueta) ||
                 programas.some(p => p.includes(terminoEtiqueta));
        });
      });
    }

    // Aplicar filtro de fecha/semana
    if (fechaDeReferencia) {
      registrosBase = registrosBase.filter(r => isSameDay(new Date(r.created_at), fechaDeReferencia));
    } else {
      const semanaInicio = diasDeLaSemana[0];
      const semanaFin = diasDeLaSemana[diasDeLaSemana.length - 1];
      registrosBase = registrosBase.filter(r =>
        isWithinInterval(new Date(r.created_at), { start: semanaInicio, end: semanaFin })
      );
    }
    
    const agrupados: Record<string, Asistencia[]> = {};
    registrosBase.forEach(r => {
      const diaString = format(new Date(r.created_at), 'yyyy-MM-dd');
      if (!agrupados[diaString]) {
        agrupados[diaString] = [];
      }
      agrupados[diaString].push(r);
    });

    for (const dia in agrupados) {
      agrupados[dia].sort((a, b) => (a.rol || '').localeCompare(b.rol || ''));
    }

    return agrupados;
  }, [registros, fechaDeReferencia, diasDeLaSemana, terminoBusqueda, etiquetas]);

  const diasOrdenados = useMemo(() => Object.keys(registrosFiltrados).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [registrosFiltrados]);

  const handleSeleccionMesAnio = (anio: number, mes: number) => {
    const nuevaFecha = new Date(anio, mes, 1);
    setSemanaDeReferencia(nuevaFecha);
    setFechaDeReferencia(null);
  };
  
  const handleNavegarSemana = (dias: number) => {
    setSemanaDeReferencia(addDays(semanaDeReferencia, dias));
    setFechaDeReferencia(null);
  };

  const handleAbrirModalMapa = (registro: Asistencia) => {
    setRegistroSeleccionado(registro);
    setModalMapaAbierto(true);
  };
  
  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="p-2 bg-white rounded-lg shadow-md space-y-4 w-full">
          <div className="flex justify-between items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Button onClick={() => handleNavegarSemana(-7)} variant="ghost" className="p-2 rounded-full hover:bg-slate-200" aria-label="Anterior">
              <ChevronLeft size={20} />
            </Button>
            <div className='flex gap-2 text-xl lg:text-3xl'>
              <select value={getMonth(semanaDeReferencia)} onChange={(e) => handleSeleccionMesAnio(getYear(semanaDeReferencia), parseInt(e.target.value))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar mes">
                {Array.from({ length: 12 }).map((_, i) => (<option key={i} value={i} className="capitalize">{format(new Date(2000, i, 1), 'LLLL', { locale: es })}</option>))}
              </select>
              <select value={getYear(semanaDeReferencia)} onChange={(e) => handleSeleccionMesAnio(parseInt(e.target.value), getMonth(semanaDeReferencia))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar año">
                {Array.from({ length: 10 }).map((_, i) => { const anio = getYear(new Date()) - 5 + i; return <option key={anio} value={anio}>{anio}</option>; })}
              </select>
            </div>
            <Button onClick={() => handleNavegarSemana(7)} variant="ghost" className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente">
              <ChevronRight size={20} />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {diasDeLaSemana.map((dia) => (
              <div key={dia.toString()} className="flex flex-col items-center">
                <span className="text-xs uppercase font-semibold text-gray-500 mb-1">{format(dia, 'eee', { locale: es })}</span>
                <button
                  type="button"
                  onClick={() => setFechaDeReferencia(isSameDay(dia, fechaDeReferencia || new Date()) ? null : dia)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer text-sm
                    ${fechaDeReferencia && isSameDay(dia, fechaDeReferencia) ? 'bg-blue-600 text-white shadow' : ''}
                    ${!fechaDeReferencia && isToday(dia) ? 'bg-blue-100 text-blue-800 font-bold' : ''}
                    ${!fechaDeReferencia && !isToday(dia) ? 'hover:bg-slate-100 text-slate-600' : ''}
                    ${registros.some(r => isSameDay(new Date(r.created_at), dia)) ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  {format(dia, 'd')}
                </button>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-col mb-4">
              <div className="relative group w-full">
                <Input
                  type="text"
                  placeholder="Buscar por nombre, correo, rol o programa..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                />
                <span className="absolute hidden md:block group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 w-max text-lg text-white bg-gray-800 rounded-md opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100">
                  Presiona Enter para crear una etiqueta de búsqueda
                </span>
              </div>
              {etiquetas.length > 0 && (
                <div className="flex flex-wrap items-center mt-2 gap-2">
                  {etiquetas.map((etiqueta, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full"
                    >
                      {etiqueta}
                      <button
                        onClick={() => handleEliminarEtiqueta(etiqueta)}
                        className="ml-1 text-gray-500 hover:text-gray-900"
                        aria-label="Eliminar filtro"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <Button
                    onClick={handleBorrarTodasLasEtiquetas}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 text-xs p-1"
                  >
                    Borrar todos
                  </Button>
                </div>
              )}
            </div>

            {diasOrdenados.length === 0 ? (
              <p className="text-center text-gray-500 text-xl lg:text-3xl">No hay registros disponibles para el rango seleccionado.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2">Usuario</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Rol</th>
                      <th className="px-4 py-2">Programas</th>
                      <th className="px-4 py-2">Registro</th>
                      <th className="px-4 py-2">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasOrdenados.map((diaString) => {
                      const registrosDelDia = registrosFiltrados[diaString] || [];
                      return (
                        <Fragment key={diaString}>
                          <tr>
                            <td colSpan={6} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(new Date(diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}</td>
                          </tr>
                          {registrosDelDia.length > 0 ? (
                            registrosDelDia.map((registro) => (
                              <tr key={registro.id} className="border-b transition-colors hover:bg-gray-100 group">
                                <td 
                                  className="px-4 py-2 cursor-pointer"
                                  onClick={() => handleAbrirModalMapa(registro)}
                                >
                                  {registro.nombre}
                                </td>
                                <td 
                                  className="px-4 py-2 cursor-pointer"
                                  onClick={() => handleAbrirModalMapa(registro)}
                                >
                                  {registro.email}
                                </td>
                                <td className="px-4 py-2">{registro.rol}</td>
                                <td className="px-4 py-2 relative">
                                  {registro.programas?.length > 0 ? (
                                    <>
                                      <span>{registro.programas[0]}</span>
                                      {registro.programas.length > 1 && <span>...</span>}
                                    </>
                                  ) : '—'}
                                  <span className="absolute left-0 top-full mt-2 w-auto min-w-[150px] p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 z-10 flex flex-col">
                                    {registro.programas?.length > 0 ? registro.programas.map((p, i) => <span key={i}>{p}</span>) : 'No hay programas'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">{registro.tipo_registro}</td>
                                <td className="px-4 py-2 font-mono">{format(new Date(registro.created_at), 'hh:mm a', { locale: es })}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-2 text-center text-gray-500 italic">No hay registros para este día.</td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {modalMapaAbierto && registroSeleccionado && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registro={registroSeleccionado}
            nombreUsuario={registroSeleccionado.nombre || 'Usuario'}
          >
          </Mapa>
        )}
      </AnimatePresence>
    </>
  );
}