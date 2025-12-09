import React, { Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { List, AlertCircle } from 'lucide-react';
import { RegistrosAgrupadosPorUsuario, RegistrosAgrupadosDiarios, AsistenciaEnriquecida } from './types';

interface ListaAsistenciasProps {
    vista: 'nombre' | 'fecha';
    // Importante: Hacemos opcionales (?) los arrays para evitar el error de undefined
    registrosPorUsuario?: RegistrosAgrupadosPorUsuario[];
    registrosPorFecha?: RegistrosAgrupadosDiarios[];
    onAbrirModal: (
        asistencia: { entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] },
        nombreUsuario: string
    ) => void;
}

const ListaAsistencias: React.FC<ListaAsistenciasProps> = ({
    vista,
    // Valor por defecto [] para evitar "Cannot read properties of undefined (reading 'map')"
    registrosPorUsuario = [],
    registrosPorFecha = [],
    onAbrirModal
}) => {
    
    let diaActual = "";

    // Función para detectar si el día está vacío (sin marcas)
    const esDiaVacio = (entrada: any, salida: any, multiple: any[]) => {
        return !entrada && !salida && (!multiple || multiple.length === 0);
    };

    // Verificar si hay datos antes de intentar renderizar
    const hayDatos = vista === 'nombre' 
        ? registrosPorUsuario && registrosPorUsuario.length > 0 
        : registrosPorFecha && registrosPorFecha.length > 0;

    return (
        <div className="w-full">
            <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800">
                <table className="w-full table-fixed text-xs">
                    
                    {/* --- ENCABEZADOS --- */}
                    {vista === 'nombre' ? (
                        <thead className="bg-slate-50 dark:bg-neutral-900 text-left border-b border-gray-200 dark:border-neutral-800">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 dark:text-slate-300 pl-8">Fecha</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Salida</th>
                            </tr>
                        </thead>
                    ) : (
                        <thead className="bg-slate-50 dark:bg-neutral-900 text-left border-b border-gray-200 dark:border-neutral-800">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 dark:text-slate-300">Usuario</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Salida</th>
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {!hayDatos ? (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="h-6 w-6 opacity-50" />
                                        <p>No se encontraron registros para mostrar.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            // Renderizado Condicional según la vista
                            vista === 'nombre' ? (
                                registrosPorUsuario.map((usuario) => (
                                    <Fragment key={usuario.userId}>
                                        <tr className="bg-slate-100 dark:bg-neutral-800 border-y border-slate-200 dark:border-neutral-700">
                                            <td colSpan={3} className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                {usuario.nombre}
                                            </td>
                                        </tr>

                                        {usuario.asistencias.length > 0 ? (
                                            usuario.asistencias.map((asistencia) => {
                                                const esMultiple = asistencia.multiple.length > 0;
                                                const sinRegistros = esDiaVacio(asistencia.entrada, asistencia.salida, asistencia.multiple);

                                                return (
                                                    <tr
                                                        key={asistencia.diaString}
                                                        className={`border-b border-slate-100 dark:border-neutral-800 transition-colors ${!sinRegistros ? 'hover:bg-blue-50 dark:hover:bg-neutral-900/50 cursor-pointer group' : ''}`}
                                                        onClick={() => !sinRegistros && onAbrirModal({
                                                            entrada: asistencia.entrada,
                                                            salida: asistencia.salida,
                                                            multiple: asistencia.multiple.length > 0 ? asistencia.multiple : undefined
                                                        }, usuario.nombre)}
                                                    >
                                                        <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[40%] pl-8 capitalize">
                                                            {format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                        </td>

                                                        {esMultiple ? (
                                                            <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                                <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                                    <List size={12} /> Ver Asistencia ({asistencia.multiple.length})
                                                                </div>
                                                            </td>
                                                        ) : sinRegistros ? (
                                                            <td colSpan={2} className="py-2 px-2 text-center w-[60%] bg-red-50/50 dark:bg-red-900/10">
                                                                <span className="text-red-500 dark:text-red-400 font-medium text-[10px] xl:text-xs">
                                                                    Sin registros de asistencia
                                                                </span>
                                                            </td>
                                                        ) : (
                                                            <>
                                                                <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-300">
                                                                    {asistencia.entrada ? format(parseISO(asistencia.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 dark:text-red-400 font-bold">--:--</span>}
                                                                </td>
                                                                <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-300">
                                                                    {asistencia.salida ? format(parseISO(asistencia.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 dark:text-red-400 font-bold">--:--</span>}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr className="border-b border-slate-100 dark:border-neutral-800">
                                                <td colSpan={3} className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 pl-8 italic">
                                                    No hay registros para este usuario en el rango seleccionado.
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            ) : (
                                registrosPorFecha.map((usuario) => {
                                    const mostrarEncabezadoDia = usuario.diaString !== diaActual;
                                    if (mostrarEncabezadoDia) {
                                        diaActual = usuario.diaString;
                                    }
                                    const esMultiple = usuario.multiple.length > 0;
                                    const sinRegistros = esDiaVacio(usuario.entrada, usuario.salida, usuario.multiple);

                                    return (
                                        <Fragment key={usuario.userId + usuario.diaString}>
                                            {mostrarEncabezadoDia && (
                                                <tr>
                                                    <td colSpan={3} className="bg-slate-50 dark:bg-neutral-800 py-1.5 px-4 font-bold text-slate-600 dark:text-slate-300 text-[11px] border-y border-slate-200 dark:border-neutral-700 uppercase tracking-wide">
                                                        {format(parseISO(usuario.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr
                                                className={`border-b border-slate-100 dark:border-neutral-800 transition-colors ${!sinRegistros ? 'hover:bg-blue-50 dark:hover:bg-neutral-900/50 cursor-pointer group' : ''}`}
                                                onClick={() => !sinRegistros && onAbrirModal({
                                                    entrada: usuario.entrada,
                                                    salida: usuario.salida,
                                                    multiple: usuario.multiple.length > 0 ? usuario.multiple : undefined
                                                }, usuario.nombre)}
                                            >
                                                <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[40%] font-medium">
                                                    {usuario.nombre}
                                                </td>

                                                {esMultiple ? (
                                                    <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                        <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                            <List size={12} /> Ver Asistencia ({usuario.multiple.length})
                                                        </div>
                                                    </td>
                                                ) : sinRegistros ? (
                                                    <td colSpan={2} className="py-2 px-2 text-center w-[60%] bg-red-50/50 dark:bg-red-900/10">
                                                        <span className="text-red-500 dark:text-red-400 font-medium text-[10px] xl:text-xs">
                                                            Sin registros de asistencia
                                                        </span>
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-300">
                                                            {usuario.entrada ? format(parseISO(usuario.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 dark:text-red-400 font-bold">--:--</span>}
                                                        </td>
                                                        <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%] text-slate-600 dark:text-slate-300">
                                                            {usuario.salida ? format(parseISO(usuario.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-red-400 dark:text-red-400 font-bold">--:--</span>}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        </Fragment>
                                    );
                                })
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaAsistencias;