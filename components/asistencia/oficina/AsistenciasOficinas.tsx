import React, { Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { List } from 'lucide-react';
import { RegistrosAgrupadosPorUsuario, RegistrosAgrupadosDiarios, AsistenciaEnriquecida } from './types';

interface ListaAsistenciasProps {
    vista: 'nombre' | 'fecha';
    // Hacemos opcionales (?) para evitar errores de tipado estricto si vienen undefined
    registrosPorUsuario?: RegistrosAgrupadosPorUsuario[];
    registrosPorFecha?: RegistrosAgrupadosDiarios[];
    onAbrirModal: (
        asistencia: { entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] },
        nombreUsuario: string
    ) => void;
}

const ListaAsistencias: React.FC<ListaAsistenciasProps> = ({
    vista,
    // SOLUCIÓN DEL ERROR: Asignamos array vacío por defecto si vienen undefined
    registrosPorUsuario = [], 
    registrosPorFecha = [],
    onAbrirModal
}) => {
    
    let diaActual = "";

    // Función auxiliar para determinar si debemos mostrar "Sin registros" o "--:--"
    // Si no tiene entrada NI salida NI multiple, es un día vacío (rojo).
    const esDiaVacio = (entrada: any, salida: any, multiple: any[]) => {
        return !entrada && !salida && (!multiple || multiple.length === 0);
    };

    return (
        <div className="w-full">
            <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-xs">
                    
                    {vista === 'nombre' ? (
                        <thead className="bg-slate-50 dark:bg-neutral-900 text-left">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 dark:text-slate-300 pl-8">Fecha</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Salida</th>
                            </tr>
                        </thead>
                    ) : (
                        <thead className="bg-slate-50 dark:bg-neutral-900 text-left">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 dark:text-slate-300">Usuario</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600 dark:text-slate-300">Salida</th>
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {vista === 'nombre' ? (
                            registrosPorUsuario.map((usuario) => (
                                <Fragment key={usuario.userId}>
                                    <tr className="bg-slate-100 dark:bg-neutral-800 border-y border-slate-200 dark:border-neutral-700 transition-colors">
                                        <td colSpan={3} className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">
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
                                                    className="border-b border-slate-100 dark:border-neutral-800 transition-colors hover:bg-blue-50 dark:hover:bg-neutral-900/50 group cursor-pointer"
                                                    onClick={() => !sinRegistros && onAbrirModal({
                                                        entrada: asistencia.entrada,
                                                        salida: asistencia.salida,
                                                        multiple: asistencia.multiple.length > 0 ? asistencia.multiple : undefined
                                                    }, usuario.nombre)}
                                                >
                                                    <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[40%] pl-8">
                                                        {format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                    </td>

                                                    {esMultiple ? (
                                                        <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                            <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px] transition-colors">
                                                                <List size={12} /> Ver Asistencia ({asistencia.multiple.length})
                                                            </div>
                                                        </td>
                                                    ) : sinRegistros ? (
                                                        <td colSpan={2} className="py-2 px-2 text-center w-[60%] text-red-500 dark:text-red-400 font-medium text-[11px] xl:text-xs bg-red-50/30 dark:bg-red-900/10">
                                                            Sin registros de asistencia
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
                                            <td colSpan={3} className="py-2 px-4 text-xs text-slate-400 dark:text-neutral-500 pl-8">
                                                No hay registros de asistencia para este usuario en el rango seleccionado.
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
                                                <td colSpan={3} className="bg-slate-50 dark:bg-neutral-800 py-1.5 px-4 font-medium text-slate-500 dark:text-slate-400 text-[11px] border-y border-slate-100 dark:border-neutral-700 transition-colors">
                                                    {format(parseISO(usuario.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                </td>
                                            </tr>
                                        )}
                                        <tr
                                            className="border-b border-slate-100 dark:border-neutral-800 transition-colors hover:bg-blue-50 dark:hover:bg-neutral-900/50 group cursor-pointer"
                                            onClick={() => !sinRegistros && onAbrirModal({
                                                entrada: usuario.entrada,
                                                salida: usuario.salida,
                                                multiple: usuario.multiple.length > 0 ? usuario.multiple : undefined
                                            }, usuario.nombre)}
                                        >
                                            <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 dark:text-slate-300 w-[40%]">
                                                {usuario.nombre}
                                            </td>

                                            {esMultiple ? (
                                                <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                    <div className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm font-medium text-[10px] transition-colors">
                                                        <List size={12} /> Ver Asistencia ({usuario.multiple.length})
                                                    </div>
                                                </td>
                                            ) : sinRegistros ? (
                                                <td colSpan={2} className="py-2 px-2 text-center w-[60%] text-red-500 dark:text-red-400 font-medium text-[11px] xl:text-xs bg-red-50/30 dark:bg-red-900/10">
                                                    Sin registros de asistencia
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
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListaAsistencias;