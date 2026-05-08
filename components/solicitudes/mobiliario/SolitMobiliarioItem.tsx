import React from 'react';
import { SolicitudMobiliario } from './lib/zod';
import {
    ChevronDown,
    MapPin,
    Phone,
    User,
    Package,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Calendar,
    Wrench,
    Pencil,
    Trash2,
    MoreVertical,
    MessageCircle,
} from 'lucide-react';

interface Props {
    sol: SolicitudMobiliario;
    isOpen: boolean;
    onToggle: () => void;
    onAsignar?: (sol: SolicitudMobiliario) => void;
    onCambiarEstado?: (sol: SolicitudMobiliario) => void;
    onEditar?: (sol: SolicitudMobiliario) => void;
    onEliminar?: (sol: SolicitudMobiliario) => void;
    isOperario?: boolean;
}

export const SolitMobiliarioItem: React.FC<Props> = ({
    sol,
    isOpen,
    onToggle,
    onAsignar,
    onCambiarEstado,
    onEditar,
    onEliminar,
    isOperario = false
}) => {

    const getSimpleDate = (dateStr: string | null) => {
        if (!dateStr) return '--';
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '');
        return `${day}/${month}`;
    };

    const getSimpleTime = (dateStr: string | null) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completado':
                return { color: 'emerald', label: 'Completado', icon: <CheckCircle2 size={20} className="sm:w-6 sm:h-6" /> };
            case 'rechazado':
                return { color: 'red', label: 'Rechazado', icon: <XCircle size={20} className="sm:w-6 sm:h-6" /> };
            default:
                return { color: 'amber', label: 'Pendiente', icon: <Clock size={20} className="sm:w-6 sm:h-6" /> };
        }
    };

    const statusConfig = getStatusConfig(sol.estado);
    const color = statusConfig.color;

    const getButtonContent = () => {
        switch (sol.estado) {
            case 'completado':
                return {
                    text: 'Solicitud Finalizada',
                    style: 'bg-emerald-100 text-emerald-700 border-emerald-200 cursor-not-allowed dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 border',
                    action: 'none' as const,
                    icon: <CheckCircle2 size={16} />,
                };
            case 'rechazado':
                return {
                    text: 'Solicitud Rechazada',
                    style: 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 border',
                    action: 'none' as const,
                    icon: <XCircle size={16} />,
                };
            default:
                return {
                    text: 'Marcar como Completada',
                    style: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 shadow-sm cursor-pointer border-none',
                    action: 'cambiar_estado' as const,
                    icon: <CheckCircle2 size={16} />,
                };
        }
    };

    const btnProps = getButtonContent();

    const getFullAddress = () => {
        const parts = [sol.aldea, sol.caserio, sol.ubicacion].filter(Boolean);
        return parts.length > 0 ? parts.join(' | ') : 'Sin ubicación registrada';
    };

    const formatActivityDate = (dateStr: string | null) => {
        if (!dateStr) return '-';

        try {
            // Extraer solo la parte de la fecha YYYY-MM-DD para asegurar consistencia
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            const date = new Date(cleanDateStr + 'T00:00:00');

            if (isNaN(date.getTime())) return '--';

            const dayName = date.toLocaleDateString('es-GT', { weekday: 'short' }).replace('.', '').toLowerCase();
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${dayName}/${day}/${year}`;
        } catch (e) {
            return '--';
        }
    };

    return (
        <div className={`
        group w-full bg-white dark:bg-neutral-900 rounded-2xl border transition-all duration-300 overflow-hidden
        ${isOpen
                ? 'border-blue-500/30 shadow-xl ring-1 ring-blue-500/10'
                : 'border-slate-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-neutral-700 hover:shadow-md'
            }
    `}>
            <div
                onClick={onToggle}
                className="p-2 sm:p-5 cursor-pointer select-none relative z-10"
            >
                <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 sm:items-center justify-between">

                    <div className="flex items-start gap-3 sm:gap-4 overflow-hidden">
                        <div className={`
                        w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center border-2 transition-colors
                        ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : ''}
                        ${color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : ''}
                        ${color === 'red' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : ''}
                    `}>
                            {statusConfig.icon}
                        </div>

                        <div className="flex flex-col min-w-0 gap-0.5 sm:gap-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className={`
                                text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded border
                                text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-800 border-slate-100 dark:border-neutral-700
                            `}>
                                    CÓD: {sol.id.slice(0, 3)}-{sol.id.slice(3, 6)}
                                </span>
                                <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                                    {isOpen
                                        ? getFullAddress()
                                        : [sol.aldea, sol.caserio].filter(Boolean).join(' | ') || 'Sin ubicación'
                                    }
                                </h3>
                            </div>
                            {!isOpen && (
                                <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1 font-medium text-slate-500">
                                        <Calendar size={11} className="sm:w-3 sm:h-3" />
                                        {new Date(sol.created_at).toLocaleDateString('es-GT')}
                                    </span>
                                    <span className="hidden sm:inline text-slate-300 dark:text-neutral-600">•</span>
                                    <span className="hidden sm:inline-block font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] sm:max-w-none">
                                        {sol.nombre_responsable || 'Sin nombre'}
                                    </span>
                                    {sol.asignado && (
                                        <>
                                            <span className="hidden sm:inline text-slate-300 dark:text-neutral-600">•</span>
                                            <span className="hidden sm:flex items-center gap-1 text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-[120px] sm:max-w-none">
                                                <Wrench size={10} className="sm:w-[11px] sm:h-[11px] shrink-0" />
                                                {sol.asignado.nombre}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center justify-end sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                        <span className={`
                            text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md border
                            ${color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : ''}
                            ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : ''}
                            ${color === 'red' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : ''}
                        `}>
                            {statusConfig.label}
                        </span>

                        {!isOperario && (
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditar?.(sol);
                                    }}
                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    title="Editar"
                                >
                                    <Pencil size={14} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEliminar?.(sol);
                                    }}
                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        )}

                        <ChevronDown
                            size={20}
                            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                        />
                    </div>
                </div>

                {/* Vista móvil: Botones y Chevron absolutamente posicionados para ahorrar espacio */}
                {!isOperario && (
                    <div className="sm:hidden flex items-center gap-0.5 absolute top-2 right-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditar?.(sol);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEliminar?.(sol);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                        <ChevronDown
                            size={18}
                            className={`ml-1 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                        />
                    </div>
                )}
                {isOperario && (
                    <div className="sm:hidden absolute top-2 right-2">
                        <ChevronDown
                            size={18}
                            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                        />
                    </div>
                )}
            </div>

            <div className={`
                px-2 sm:px-5 space-y-5 sm:space-y-7 overflow-hidden transition-all duration-500 ease-in-out
            ${isOpen ? 'pb-5 sm:pb-7 pt-2 max-h-[1200px] opacity-100' : 'py-0 max-h-0 opacity-0'}
        `}>
                <div className="p-2 sm:p-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-neutral-950/60 dark:via-neutral-900/40 dark:to-blue-950/10 border-t border-slate-200/60 dark:border-neutral-800/60">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

                        {/* Columna izquierda: Solicitante + Botón */}
                        <div className="lg:col-span-4 flex flex-col gap-3">

                            {/* Solicitante */}
                            <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-slate-200/70 dark:border-neutral-700/50 shadow-sm">
                                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <User size={11} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-[0.15em]">Solicitante</span>
                                </div>
                                <div className="flex items-center gap-2.5 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-neutral-800/60 dark:to-neutral-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-neutral-700/50">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                                            <User size={13} className="text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <span className={`font-semibold text-slate-800 dark:text-slate-100 line-clamp-4 leading-tight break-words ${sol.nombre_responsable && sol.nombre_responsable.length > 50 ? 'text-[10px]' : sol.nombre_responsable && sol.nombre_responsable.length > 30 ? 'text-xs' : 'text-sm'}`} title={sol.nombre_responsable || ''}>
                                            {sol.nombre_responsable || 'No registrado'}
                                        </span>
                                    </div>
                                    {sol.telefono_contacto ? (
                                        <a
                                            href={`https://wa.me/502${sol.telefono_contacto.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 shrink-0 border-l border-slate-200/80 dark:border-neutral-600 pl-2.5 transition-all group"
                                            title="Contactar por WhatsApp"
                                        >
                                            <MessageCircle size={12} className="text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums group-hover:underline">
                                                {sol.telefono_contacto}
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="flex items-center shrink-0 border-l border-slate-200/80 dark:border-neutral-600 pl-2.5 opacity-50">
                                            <span className="text-xs font-medium text-slate-400">—</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ubicación (Dirección) - Movida a la izquierda */}
                            <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-slate-200/70 dark:border-neutral-700/50 shadow-sm">
                                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <MapPin size={11} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-[0.15em]">Dirección</span>
                                </div>
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-neutral-800/60 dark:to-neutral-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-neutral-700/50">
                                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-tight text-justify break-words">
                                        {getFullAddress()}
                                    </div>
                                </div>
                            </div>

                            {/* Motivo del Rechazo */}
                            {sol.estado === 'rechazado' && (
                                <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl p-3 border border-red-200/70 dark:border-red-900/40 shadow-sm">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400"></div>
                                    <h4 className="text-[10px] text-red-500 dark:text-red-400 uppercase font-bold tracking-[0.15em] mb-2 flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                            <FileText size={11} className="text-red-500 dark:text-red-400" />
                                        </div>
                                        Motivo del Rechazo
                                    </h4>
                                    <p className="text-xs text-red-700 dark:text-red-300 italic bg-red-50/80 dark:bg-red-900/15 p-2.5 rounded-lg border border-red-100/80 dark:border-red-800/20 leading-relaxed font-medium">
                                        &ldquo;{sol.comentarios || 'Sin comentarios'}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Botón — al fondo de la columna izquierda */}
                            <div className="mt-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (btnProps.action === 'cambiar_estado' && onCambiarEstado) {
                                            onCambiarEstado(sol);
                                        }
                                    }}
                                    disabled={btnProps.action === 'none'}
                                    className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-[0.98] disabled:active:scale-100 shadow-sm hover:shadow-md ${btnProps.style}`}
                                >
                                    {btnProps.icon}
                                    {btnProps.text}
                                </button>
                            </div>
                        </div>

                        {/* Columna derecha: Seguimiento */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <Calendar size={11} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.15em]">Seguimiento</h4>
                            </div>

                            <div className="relative bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-slate-200/70 dark:border-neutral-700/50 rounded-xl p-2 sm:p-4 hover:shadow-lg transition-all duration-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="relative z-10 w-[10px] h-[10px] shrink-0 rounded-full bg-blue-500 ring-[3px] ring-blue-100 dark:ring-blue-900/40 shadow-sm shadow-blue-500/30"></div>
                                    <h5 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 uppercase tracking-wide">Solicitud</h5>
                                </div>

                                <div className="w-full space-y-3">
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-neutral-800/60 dark:to-neutral-800/30 p-2 sm:p-3 rounded-lg border border-slate-100/80 dark:border-neutral-700/50">
                                        {(sol.fecha_inicio || sol.fecha_fin || sol.checklists?.items?.length > 0) && (
                                            <div>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.12em] mb-2 flex items-center gap-1.5">
                                                    <CheckCircle2 size={11} /> Detalles y Fechas
                                                </span>
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {(sol.fecha_inicio || sol.fecha_fin) && (
                                                        <div className="text-xs text-slate-600 dark:text-slate-300">
                                                            <span className="font-bold">Actividad: </span>
                                                            {formatActivityDate(sol.fecha_inicio)}
                                                            {sol.fecha_fin ? ` al ${formatActivityDate(sol.fecha_fin)}` : ''}
                                                        </div>
                                                    )}
                                                    {sol.checklists?.items && Array.isArray(sol.checklists.items) && sol.checklists.items.length > 0 && (
                                                        <div className="mt-1">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Mobiliario:</span>
                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                                {sol.checklists.items.map((item: any, i: number) => (
                                                                    <div key={i} className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md font-bold shrink-0">
                                                                                {item.cantidad}
                                                                            </span>
                                                                            <span className="font-medium">{item.descripcion}</span>
                                                                        </div>
                                                                        {i < sol.checklists.items.length - 1 && (
                                                                            <span className="text-slate-300 dark:text-slate-600 font-light">|</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Creada el <span className="font-semibold text-slate-600 dark:text-slate-300">{getSimpleDate(sol.created_at)}</span> a las <span className="font-semibold text-slate-600 dark:text-slate-300">{getSimpleTime(sol.created_at)}</span>
                                        {sol.solicitante && (
                                            <> por <span className="font-semibold text-slate-600 dark:text-slate-300">{sol.solicitante.nombre}</span></>
                                        )}
                                    </p>

                                    <div className={`border-t pt-3 mt-1
                                        ${sol.estado === 'completado' ? 'border-emerald-200/60 dark:border-emerald-800/30' : ''}
                                        ${sol.estado === 'rechazado' ? 'border-red-200/60 dark:border-red-800/30' : ''}
                                        ${sol.estado === 'pendiente' ? 'border-slate-200/60 dark:border-neutral-700/50' : ''}
                                    `}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-[10px] h-[10px] shrink-0 rounded-full ring-[3px] shadow-sm
                                                ${sol.estado === 'completado' ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/40 shadow-emerald-500/30' : ''}
                                                ${sol.estado === 'rechazado' ? 'bg-red-500 ring-red-100 dark:ring-red-900/40 shadow-red-500/30' : ''}
                                                ${sol.estado === 'pendiente' ? 'bg-amber-500 ring-amber-100 dark:ring-amber-900/40 shadow-amber-500/30' : ''}
                                            `}></div>
                                            <div>
                                                <h6 className="font-bold text-[12px] text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                                    {sol.estado === 'completado' ? 'Solicitud Completada' : sol.estado === 'rechazado' ? 'Solicitud Rechazada' : 'Solicitud Pendiente'}
                                                </h6>
                                                {sol.fecha_terminado && (
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                        <span className="font-semibold text-slate-600 dark:text-slate-300">{getSimpleDate(sol.fecha_terminado)}</span> a las <span className="font-semibold text-slate-600 dark:text-slate-300">{getSimpleTime(sol.fecha_terminado)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
