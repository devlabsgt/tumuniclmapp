'use client';

import React, { useState, Fragment, useMemo } from 'react';
import { es } from 'date-fns/locale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addDays, subDays, getYear, getMonth, isSameDay, isWithinInterval } from 'date-fns';

interface CalendarioProps {
  todosLosRegistros: any[];
  onAbrirMapa: (registro: any) => void;
  fechaHoraGt: Date;
}

const getWeekDays = (date: Date) => eachDayOfInterval({
  start: startOfWeek(date, { locale: es, weekStartsOn: 1 }),
  end: endOfWeek(date, { locale: es, weekStartsOn: 1 }),
});

export default function Calendario({ todosLosRegistros = [], onAbrirMapa, fechaHoraGt }: CalendarioProps) {
  const [fechaDeReferencia, setFechaDeReferencia] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined);

  const diasDeLaSemana = useMemo(() => getWeekDays(fechaDeReferencia), [fechaDeReferencia]);

  const registrosVisibles = useMemo(() => {
    const registrosBase = diaSeleccionado 
      ? todosLosRegistros.filter((r: any) => isSameDay(new Date(r.created_at), diaSeleccionado))
      : todosLosRegistros.filter((r: any) => 
          isWithinInterval(new Date(r.created_at), { start: diasDeLaSemana[0], end: diasDeLaSemana[6] })
        );
    
    const agrupadosPorDiaYUsuario: Record<string, Record<string, { entrada: any | null, salida: any | null, nombre: string }>> = {};

    registrosBase.forEach(registro => {
      const diaString = format(new Date(registro.created_at), 'yyyy-MM-dd');
      const userId = registro.user_id;

      if (!agrupadosPorDiaYUsuario[diaString]) {
        agrupadosPorDiaYUsuario[diaString] = {};
      }
      if (!agrupadosPorDiaYUsuario[diaString][userId]) {
        agrupadosPorDiaYUsuario[diaString][userId] = {
          entrada: null,
          salida: null,
          nombre: registro.nombre
        };
      }

      if (registro.tipo_registro === 'Entrada') {
        agrupadosPorDiaYUsuario[diaString][userId].entrada = registro;
      } else if (registro.tipo_registro === 'Salida') {
        agrupadosPorDiaYUsuario[diaString][userId].salida = registro;
      }
    });

    return agrupadosPorDiaYUsuario;
  }, [todosLosRegistros, diaSeleccionado, diasDeLaSemana]);

  const diasParaTabla = useMemo(() => {
    return Object.keys(registrosVisibles).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [registrosVisibles]);
  
  const irSemanaSiguiente = () => setFechaDeReferencia(addDays(fechaDeReferencia, 7));
  const irSemanaAnterior = () => setFechaDeReferencia(subDays(fechaDeReferencia, 7));
  
  const handleSeleccionFecha = (anio: number, mes: number) => {
    const nuevaFecha = new Date(anio, mes, 1);
    setFechaDeReferencia(startOfWeek(nuevaFecha, { locale: es, weekStartsOn: 1 }));
    setDiaSeleccionado(undefined);
  };
  
  const handleSeleccionDia = (dia: Date) => {
    const yaEstaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
    setDiaSeleccionado(yaEstaSeleccionado ? undefined : dia);
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4 w-full">
      <h3 className="text-xl lg:text-3xl font-bold text-center">Registro Semanal</h3>
      
      <div className="flex justify-between items-center gap-2 p-2 bg-slate-50 rounded-lg">
        <button onClick={irSemanaAnterior} className="p-2 rounded-full hover:bg-slate-200" aria-label="Semana anterior"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
        <div className='flex gap-2 text-xl lg:text-3xl'>
          <select value={getMonth(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(getYear(fechaDeReferencia), parseInt(e.target.value))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar mes">
            {Array.from({ length: 12 }).map((_, i) => (<option key={i} value={i} className="capitalize">{format(new Date(2000, i, 1), 'LLLL', { locale: es })}</option>))}
          </select>
          <select value={getYear(fechaDeReferencia)} onChange={(e) => handleSeleccionFecha(parseInt(e.target.value), getMonth(fechaDeReferencia))} className="p-1 border rounded-md text-xl lg:text-3xl bg-white" aria-label="Seleccionar año">
            {Array.from({ length: 10 }).map((_, i) => { const anio = getYear(new Date()) - 5 + i; return <option key={anio} value={anio}>{anio}</option>; })}
          </select>
        </div>
        <button onClick={irSemanaSiguiente} className="p-2 rounded-full hover:bg-slate-200" aria-label="Siguiente semana"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
      </div>

      <div className="flex justify-around items-center">
        {diasDeLaSemana.map((dia) => {
          const esDiaSeleccionado = diaSeleccionado ? isSameDay(dia, diaSeleccionado) : false;
          return (
            <div key={dia.toString()} onClick={() => handleSeleccionDia(dia)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-md transition-all cursor-pointer ${isToday(dia) && !esDiaSeleccionado ? 'bg-blue-100 text-blue-800' : ''} ${esDiaSeleccionado ? 'bg-blue-600 text-white font-bold shadow-lg scale-110' : 'hover:bg-slate-100 text-slate-600'}`}>
              <span className="text-xs uppercase ">{format(dia, 'eee', { locale: es })}</span>
              <span className="text-xs ">{format(dia, 'd')}</span>
            </div>
          );
        })}
      </div>
      
      <div className="border-t pt-4 mt-4">
        <h4 className='text-xl lg:text-3xl font-semibold text-center mb-2'>{diaSeleccionado ? `Registros para el ${format(diaSeleccionado, 'eeee d', { locale: es })}` : 'Todos los registros de la semana'}</h4>
        <p className="text-xs text-blue-600 text-center mt-4">Seleccione un registro para ver más información.</p>

        {diasParaTabla.length === 0 ? (<p className="text-center text-gray-500 text-xl lg:text-3xl">No hay registros disponibles.</p>) : (
          <table className="w-full text-sm lg:text-base">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Entrada</th>
                <th className="px-4 py-2">Salida</th>
              </tr>
            </thead>
            <tbody>
              {diasParaTabla.map((diaString) => {
                const usuariosDelDia = Object.values(registrosVisibles[diaString]);
                return (
                  <Fragment key={diaString}>
                    <tr>
                      <td colSpan={3} className="bg-slate-100 px-4 py-2 font-bold text-slate-700 border-t border-b border-slate-200">
                        {format(new Date(diaString + 'T00:00:00'), 'eeee, d \'de\' LLLL', { locale: es })}
                      </td>
                    </tr>
                    {usuariosDelDia.length > 0 ? (
                      usuariosDelDia.map((usuario, index) => (
                        <tr 
                          key={index} 
                          onClick={() => onAbrirMapa(usuario.entrada || usuario.salida)}
                          className="border-b cursor-pointer transition-colors hover:bg-gray-100"
                        >
                          <td className="px-4 py-2">{usuario.nombre}</td>
                          <td className="px-4 py-2 font-mono">
                            {usuario.entrada ? new Date(usuario.entrada.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : <span className="text-red-400 underline">Sin registro</span>}
                          </td>
                          <td className="px-4 py-2 font-mono">
                            {usuario.salida ? new Date(usuario.salida.created_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : <span className="text-red-400 underline">Sin registro</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-center text-gray-500 italic">No hay registros para este día.</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}