import React from 'react';
import { Award, Package, User, MessageCircle } from 'lucide-react';
import { SolicitudMobiliario } from '../lib/zod';

interface ResumenOperariosViewProps {
    solicitudes: SolicitudMobiliario[];
}

export default function ResumenOperariosView({ solicitudes }: ResumenOperariosViewProps) {
    const getSimpleDate = (dateStr: string | null) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getFechasActividad = (inicio: string | null, fin: string | null) => {
        if (!inicio && !fin) return '--';
        if (inicio && fin) return `${getSimpleDate(inicio)} al ${getSimpleDate(fin)}`;
        if (inicio) return getSimpleDate(inicio);
        return getSimpleDate(fin);
    };

    const getShortDate = (dateStr: string | null) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '').substring(0, 3);
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getShortFechasActividad = (inicio: string | null, fin: string | null) => {
        if (!inicio && !fin) return '--';
        if (inicio && !fin) return getShortDate(inicio);
        if (!inicio && fin) return getShortDate(fin);

        const d1 = new Date(inicio as string);
        const d2 = new Date(fin as string);

        const day1 = d1.getDate().toString().padStart(2, '0');
        const month1 = d1.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '').substring(0, 3);
        const year1 = d1.getFullYear();

        const day2 = d2.getDate().toString().padStart(2, '0');
        const month2 = d2.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '').substring(0, 3);
        const year2 = d2.getFullYear();

        if (year1 === year2 && month1 === month2 && day1 === day2) {
            return `${day1}/${month1}/${year1}`;
        }

        if (year1 === year2) {
            if (month1 === month2) {
                return `${day1}-${day2}/${month1}/${year1}`;
            } else {
                return `${day1}/${month1} al ${day2}/${month2} del ${year1}`;
            }
        } else {
            const shortYear1 = year1.toString().slice(-2);
            const shortYear2 = year2.toString().slice(-2);
            return `${day1}/${month1}/${shortYear1} al ${day2}/${month2}/${shortYear2}`;
        }
    };

    const getMobiliarioString = (checklists: any) => {
        if (!checklists?.items || !Array.isArray(checklists.items)) return '--';
        return checklists.items.map((item: any) => `${item.cantidad} ${item.descripcion}`).join(', ');
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'completado':
                return <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Completada</span>;
            case 'rechazado':
                return <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Rechazada</span>;
            case 'pendiente':
            default:
                return <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Pendiente</span>;
        }
    };

    return (
        <div className="w-full flex flex-col animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-2 pt-1 pb-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <Award className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            Listado Detallado
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Revisa y administra las solicitudes de mobiliario
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full mt-2">
                {solicitudes.length === 0 ? (
                    <div className="text-center py-10 border border-slate-200/70 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
                        <Package size={40} className="mx-auto text-slate-300 dark:text-neutral-700 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No hay solicitudes para mostrar.</p>
                    </div>
                ) : (
                    <>
                        {/* Vista Desktop (Tabla) */}
                        <div className="hidden lg:block w-full border border-slate-200/70 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200/70 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">CÓD</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Estado</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Fecha Creación</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Dirección</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Responsable</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Teléfono</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">Fecha Actividad</th>
                                        <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center max-w-xs">Mobiliario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                                    {solicitudes.map((sol) => (
                                        <tr key={sol.id} className="bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/20 transition-colors">
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium text-center">
                                                {sol.id.slice(0, 3)}-{sol.id.slice(3, 6)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(sol.estado)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-center">
                                                {getSimpleDate(sol.fecha_solicitud)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={sol.ubicacion || ''}>
                                                {sol.ubicacion || '--'}
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <div className={`whitespace-normal line-clamp-2 break-words text-slate-800 dark:text-slate-200 leading-tight ${sol.nombre_responsable && sol.nombre_responsable.length > 30 ? 'text-xs' : 'text-sm'}`} title={sol.nombre_responsable || ''}>
                                                    {sol.nombre_responsable || '--'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-center">
                                                {sol.telefono_contacto || '--'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 dark:text-slate-200 text-center">
                                                {getFechasActividad(sol.fecha_inicio, sol.fecha_fin)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[250px] truncate" title={getMobiliarioString(sol.checklists)}>
                                                {getMobiliarioString(sol.checklists)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista Móvil y Tablet (Tarjetas) */}
                        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                            {solicitudes.map((sol) => (
                                <div key={sol.id} className="flex flex-col bg-white dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group">
                                    {/* Franja Lateral - Abarca todo el alto */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${sol.estado === 'completado' ? 'bg-emerald-500' :
                                        sol.estado === 'rechazado' ? 'bg-red-500' : 'bg-amber-500'
                                        }`} />

                                    {/* Encabezado de Estado - Sin fondo de color, padding reducido */}
                                    <div className={`pt-1.5 pb-0.5 px-3 flex justify-center items-center text-[10px] font-black uppercase tracking-[0.2em] leading-none relative z-20 ${sol.estado === 'completado' ? 'text-emerald-600 dark:text-emerald-400' :
                                        sol.estado === 'rechazado' ? 'text-red-600 dark:text-red-400' :
                                            'text-amber-600 dark:text-amber-400'
                                        }`}>
                                        {sol.estado}
                                    </div>

                                    <div className="pt-0 pb-3 pr-3 pl-4 flex flex-col gap-1.5 relative z-0">
                                        {/* CÓD y Fecha Solicitud */}
                                        <div className="flex justify-between items-start px-1.5 border-b border-slate-50 dark:border-neutral-800/50 pb-1.5">
                                            <div className="flex flex-col items-center">
                                                <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CÓD</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                                    {sol.id.slice(0, 3)}-{sol.id.slice(3, 6)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                                                    {getShortDate(sol.fecha_solicitud)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Responsable y Teléfono (Formato Iconos) */}
                                        <div className="flex items-center justify-between bg-slate-100 dark:bg-neutral-800/80 px-1.5 py-2 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-neutral-700/80 flex items-center justify-center shrink-0">
                                                    <User size={13} className="text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <span className={`font-bold text-slate-800 dark:text-slate-200 line-clamp-4 leading-tight break-words ${sol.nombre_responsable && sol.nombre_responsable.length > 50 ? 'text-[10px]' : sol.nombre_responsable && sol.nombre_responsable.length > 30 ? 'text-xs' : 'text-sm'}`} title={sol.nombre_responsable || ''}>
                                                    {sol.nombre_responsable || '--'}
                                                </span>
                                            </div>

                                            <div className="h-5 w-px bg-slate-300 dark:bg-neutral-700 mx-3 shrink-0"></div>

                                            <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                                {sol.telefono_contacto && sol.telefono_contacto !== '--' && sol.telefono_contacto.trim() !== '' ? (
                                                    <>
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tel.</span>
                                                        <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide">
                                                            {sol.telefono_contacto}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">--</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actividad y Dirección */}
                                        <div className="space-y-2">
                                            <div>
                                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fecha de Actividad</span>
                                                <span className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-tight block italic">
                                                    {getShortFechasActividad(sol.fecha_inicio, sol.fecha_fin)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dirección</span>
                                                <span className="text-xs text-slate-800 dark:text-slate-200 leading-tight line-clamp-2" title={sol.ubicacion || ''}>
                                                    {sol.ubicacion || '--'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobiliario */}
                                        <div className="pt-1 mt-1 border-t border-slate-50 dark:border-neutral-800/50">
                                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mobiliario Solicitado</span>
                                            <div className="flex flex-wrap gap-1">
                                                {sol.checklists?.items && Array.isArray(sol.checklists.items) ? (
                                                    sol.checklists.items.map((item: any, idx: number) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100/50 dark:border-blue-800/30">
                                                            {item.cantidad} {item.descripcion}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">--</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
