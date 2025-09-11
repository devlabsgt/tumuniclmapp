'use client';

import React, { useState, Fragment, useMemo, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/asistencia/modal/Mapa';
import { Asistencia} from '@/lib/asistencia/esquemas';
import {
  format, isSameDay, eachDayOfInterval, isToday, addDays, startOfWeek, endOfWeek, isWithinInterval, getYear, getMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

  type Props = {
    registros: Asistencia[];
    rolActual: string | null;
  };

  type RegistrosAgrupadosPorUsuario = {
    entrada: Asistencia | null;
    salida: Asistencia | null;
    nombre: string;
    email: string;
    rol: string;
    programas: string[];
    userId: string;
  };

export default function AsistenciaTable({ registros, rolActual }: Props) {
  const [semanaDeReferencia, setSemanaDeReferencia] = useState(new Date());
  const [fechaDeReferencia, setFechaDeReferencia] = useState<Date | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);
  
  const [registrosSeleccionadosParaMapa, setRegistrosSeleccionadosParaMapa] = useState<{ entrada: Asistencia | null, salida: Asistencia | null }>({ entrada: null, salida: null });

  useEffect(() => {
    if (modalMapaAbierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalMapaAbierto]);


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
  
  const registrosAgrupados = useMemo(() => {
    let registrosBase: Asistencia[] = registros;
    
    if (terminoBusqueda) {
        const termino = terminoBusqueda.toLowerCase();
        registrosBase = registrosBase.filter(r => 
            (r.nombre?.toLowerCase().includes(termino) || 
             r.email?.toLowerCase().includes(termino) ||
             r.rol?.toLowerCase().includes(termino) ||
             r.programas?.some(p => p.toLowerCase().includes(termino)))
        );
    }
    if (etiquetas.length > 0) {
        registrosBase = registrosBase.filter(r => {
            const contenido = `${r.nombre} ${r.email} ${r.rol} ${r.programas?.join(' ')}`.toLowerCase();
            return etiquetas.every(etiqueta => contenido.includes(etiqueta.toLowerCase()));
        });
    }
    
    if (fechaDeReferencia) {
        registrosBase = registrosBase.filter(r => isSameDay(new Date(r.created_at), fechaDeReferencia));
    } else {
        const semanaInicio = startOfWeek(semanaDeReferencia, { weekStartsOn: 1 });
        const semanaFin = endOfWeek(semanaDeReferencia, { weekStartsOn: 1 });
        registrosBase = registrosBase.filter(r => isWithinInterval(new Date(r.created_at), { start: semanaInicio, end: semanaFin }));
    }

    const agrupadosPorDia: Record<string, Record<string, RegistrosAgrupadosPorUsuario>> = {};
    
    registrosBase.forEach(registro => {
        const diaString = format(new Date(registro.created_at), 'yyyy-MM-dd');
        const userId = registro.user_id;

        if (!agrupadosPorDia[diaString]) {
            agrupadosPorDia[diaString] = {};
        }

        if (!agrupadosPorDia[diaString][userId]) {
            agrupadosPorDia[diaString][userId] = {
                entrada: null,
                salida: null,
                nombre: registro.nombre || 'N/A',
                email: registro.email || 'N/A',
                rol: registro.rol || 'N/A',
                programas: registro.programas || [],
                userId: userId,
            };
        }

        if (registro.tipo_registro === 'Entrada') {
            agrupadosPorDia[diaString][userId].entrada = registro;
        } else if (registro.tipo_registro === 'Salida') {
            agrupadosPorDia[diaString][userId].salida = registro;
        }
    });

    return agrupadosPorDia;
  }, [registros, fechaDeReferencia, semanaDeReferencia, terminoBusqueda, etiquetas]);

  const diasOrdenados = useMemo(() => Object.keys(registrosAgrupados).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [registrosAgrupados]);

  const handleSeleccionMesAnio = (anio: number, mes: number) => {
    setSemanaDeReferencia(new Date(anio, mes, 1));
    setFechaDeReferencia(null);
  };
  
  const handleNavegarSemana = (dias: number) => {
    setSemanaDeReferencia(addDays(semanaDeReferencia, dias));
    setFechaDeReferencia(null);
  };

  const handleAbrirModalMapa = (registrosUsuario: RegistrosAgrupadosPorUsuario) => {
    setRegistrosSeleccionadosParaMapa({
      entrada: registrosUsuario.entrada,
      salida: registrosUsuario.salida
    });
    setModalMapaAbierto(true);
  };
  
  return (
    <>
     <div className="w-full md:w-4/5 mx-auto">
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
                    <Input type="text" placeholder="Buscar por nombre, correo, rol o programa..." value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} onKeyPress={handleKeyPress} className="w-full"/>
                    <span className="absolute hidden md:block group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 w-max text-lg text-white bg-gray-800 rounded-md opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100">
                        Presiona Enter para crear una etiqueta de búsqueda
                    </span>
                </div>
                {etiquetas.length > 0 && (
                    <div className="flex flex-wrap items-center mt-2 gap-2">
                        {etiquetas.map((etiqueta, index) => (<span key={index} className="flex items-center gap-1 bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">{etiqueta}<button onClick={() => handleEliminarEtiqueta(etiqueta)} className="ml-1 text-gray-500 hover:text-gray-900" aria-label="Eliminar filtro"><X size={12} /></button></span>))}
                        <Button onClick={handleBorrarTodasLasEtiquetas} variant="ghost" size="sm" className="text-red-500 text-xs p-1">Borrar todos</Button>
                    </div>
                )}
            </div>

            {diasOrdenados.length === 0 ? (
              <p className="text-center text-gray-500 text-xl lg:text-3xl">No hay registros disponibles para el rango seleccionado.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2">Usuario</th>
                      <th className="px-4 py-2">Rol</th>
                      <th className="px-4 py-2">Programas</th>
                      <th className="px-4 py-2">Entrada</th>
                      <th className="px-4 py-2">Salida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasOrdenados.map((diaString) => {
                      const usuariosDelDia = Object.values(registrosAgrupados[diaString]);
                      return (
                        <Fragment key={diaString}>
                          <tr>
                            <td colSpan={5} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">{format(new Date(diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}</td>
                          </tr>
                          {usuariosDelDia.map((usuario) => (
                            <tr 
                              key={usuario.userId} 
                              className="border-b transition-colors hover:bg-gray-100 group cursor-pointer"
                              onClick={() => handleAbrirModalMapa(usuario)}
                            >
                              <td className="px-4 py-2 relative">
                                {usuario.nombre}
                                <span className="absolute left-0 top-full mt-2 w-auto p-2 bg-white text-blue-600 font-semibold text-sm rounded-md shadow-lg border border-gray-200 invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 z-10">
                                  {usuario.email}
                                </span>
                              </td>
                              <td className="px-4 py-2">{usuario.rol}</td>
                              <td className="px-4 py-2 relative">
                                {usuario.programas.length > 0 ? (
                                    <><span>{usuario.programas[0]}</span>{usuario.programas.length > 1 && <span>...</span>}</>
                                ) : <span className="underline text-gray-500">Sin Programas</span>}
                                {usuario.programas.length > 1 && (
                                  <span className="absolute left-0 top-full mt-2 w-auto min-w-[150px] p-2 bg-white text-blue-600 text-xs rounded-md shadow-lg border border-gray-200 invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 z-10 flex flex-col">
                                      {usuario.programas.map((p, i) => <span key={i}>{p}</span>)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {usuario.entrada ? format(new Date(usuario.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 underline">Sin registro</span>}
                              </td>
                              <td className="px-4 py-2">
                                {usuario.salida ? format(new Date(usuario.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 underline">Sin registro</span>}
                              </td>
                            </tr>
                          ))}
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
        {modalMapaAbierto && (
          <Mapa
            isOpen={modalMapaAbierto}
            onClose={() => setModalMapaAbierto(false)}
            registros={registrosSeleccionadosParaMapa}
            nombreUsuario={registrosSeleccionadosParaMapa.entrada?.nombre || registrosSeleccionadosParaMapa.salida?.nombre || 'Usuario'}
          />
        )}
      </AnimatePresence>
    </>
  );
}