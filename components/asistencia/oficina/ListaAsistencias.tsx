import React, { Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { List } from 'lucide-react';
import { RegistrosAgrupadosPorUsuario, RegistrosAgrupadosDiarios, AsistenciaEnriquecida } from './types';

interface ListaAsistenciasProps {
    vista: 'nombre' | 'fecha';
    registrosPorUsuario: RegistrosAgrupadosPorUsuario[];
    registrosPorFecha: RegistrosAgrupadosDiarios[];
    onAbrirModal: (
        asistencia: { entrada: AsistenciaEnriquecida | null, salida: AsistenciaEnriquecida | null, multiple?: AsistenciaEnriquecida[] },
        nombreUsuario: string
    ) => void;
}

const ListaAsistencias: React.FC<ListaAsistenciasProps> = ({
    vista,
    registrosPorUsuario,
    registrosPorFecha,
    onAbrirModal
}) => {
    
    let diaActual = "";

    return (
        <div className="w-full">
            <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-xs">
                    
                    {vista === 'nombre' ? (
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600 pl-8">Fecha</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Salida</th>
                            </tr>
                        </thead>
                    ) : (
                        <thead className="bg-slate-50 text-left">
                            <tr>
                                <th className="py-3 px-4 text-[10px] xl:text-xs w-[40%] font-semibold text-slate-600">Usuario</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Entrada</th>
                                <th className="py-3 px-2 text-[10px] xl:text-xs w-[30%] text-center font-semibold text-slate-600">Salida</th>
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {vista === 'nombre' ? (
                            registrosPorUsuario.map((usuario) => (
                                <Fragment key={usuario.userId}>
                                    <tr className="bg-slate-100 border-y border-slate-200">
                                        <td colSpan={3} className="py-2.5 px-4 font-semibold text-slate-800 text-sm">
                                            {usuario.nombre}
                                        </td>
                                    </tr>

                                    {usuario.asistencias.length > 0 ? (
                                        usuario.asistencias.map((asistencia) => {
                                            const esMultiple = asistencia.multiple.length > 0;

                                            return (
                                                <tr
                                                    key={asistencia.diaString}
                                                    className="border-b border-slate-100 transition-colors hover:bg-blue-50 group cursor-pointer"
                                                    onClick={() => onAbrirModal({
                                                        entrada: asistencia.entrada,
                                                        salida: asistencia.salida,
                                                        multiple: asistencia.multiple.length > 0 ? asistencia.multiple : undefined
                                                    }, usuario.nombre)}
                                                >
                                                    <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 w-[40%] pl-8">
                                                        {format(parseISO(asistencia.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                    </td>

                                                    {esMultiple ? (
                                                        <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                            <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                                <List size={12} /> Ver Asistencia ({asistencia.multiple.length})
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        <>
                                                            <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                                {asistencia.entrada ? format(parseISO(asistencia.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                            </td>
                                                            <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                                {asistencia.salida ? format(parseISO(asistencia.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr className="border-b border-slate-100">
                                            <td colSpan={3} className="py-2 px-4 text-xs text-slate-400 pl-8">
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

                                return (
                                    <Fragment key={usuario.userId + usuario.diaString}>
                                        {mostrarEncabezadoDia && (
                                            <tr>
                                                <td colSpan={3} className="bg-slate-50 py-1.5 px-4 font-medium text-slate-500 text-[11px] border-y border-slate-100">
                                                    {format(parseISO(usuario.diaString + 'T00:00:00'), 'EEEE, d \'de\' LLLL', { locale: es })}
                                                </td>
                                            </tr>
                                        )}
                                        <tr
                                            className="border-b border-slate-100 transition-colors hover:bg-blue-50 group cursor-pointer"
                                            onClick={() => onAbrirModal({
                                                entrada: usuario.entrada,
                                                salida: usuario.salida,
                                                multiple: usuario.multiple.length > 0 ? usuario.multiple : undefined
                                            }, usuario.nombre)}
                                        >
                                            <td className="py-3 px-4 text-[11px] xl:text-xs text-slate-700 w-[40%]">
                                                {usuario.nombre}
                                            </td>

                                            {esMultiple ? (
                                                <td colSpan={2} className="py-2 px-2 text-center w-[60%]">
                                                    <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-sm font-medium text-[10px]">
                                                        <List size={12} /> Ver Asistencia ({usuario.multiple.length})
                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                        {usuario.entrada ? format(parseISO(usuario.entrada.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
                                                    </td>
                                                    <td className="py-2 px-2 text-[11px] xl:text-xs font-mono text-center w-[30%]">
                                                        {usuario.salida ? format(parseISO(usuario.salida.created_at), 'hh:mm a', { locale: es }) : <span className="text-slate-300">--:--</span>}
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