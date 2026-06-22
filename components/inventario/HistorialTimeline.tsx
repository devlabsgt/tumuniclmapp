'use client';

import React from 'react';
import { useHistorialBien } from './lib/hooks';
import { Loader2, PlusCircle, ArrowRightLeft, MinusCircle, User, Building2, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/utils/supabase/client';

export default function HistorialTimeline({ idBien }: { idBien: string }) {
  const { data: historial, isLoading, error } = useHistorialBien(idBien);
  const supabase = createClient();
  const [imageUrls, setImageUrls] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!historial) return;
    const fetchImages = async () => {
      const urls: Record<string, string> = {};
      for (const m of historial) {
        if (m.imagen_url) {
          const { data } = await supabase.storage.from('inventario-imgs').createSignedUrl(m.imagen_url, 3600);
          if (data?.signedUrl) urls[m.id] = data.signedUrl;
        }
      }
      setImageUrls(urls);
    };
    fetchImages();
  }, [historial]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Cargando historial inmutable...</p>
      </div>
    );
  }

  if (error || !historial) {
    return (
      <div className="text-center py-8 text-red-500">
        Error al cargar el historial.
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No hay movimientos registrados para este bien.
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alta': return <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'traslado': return <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'baja': return <MinusCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'alta': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' };
      case 'traslado': return { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' };
      case 'baja': return { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };
      default: return { bg: 'bg-slate-50 dark:bg-neutral-800', border: 'border-slate-200 dark:border-neutral-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' };
    }
  };

  return (
    <div className="relative border-l-2 border-slate-200/80 dark:border-neutral-800 ml-1 md:ml-2 py-4 space-y-10">
      {historial.map((mov, index) => {
        const theme = getColorForType(mov.tipo_movimiento);
        return (
        <div key={mov.id} className="relative pl-6 md:pl-8">
          {/* Timeline Dot */}
          <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-white dark:bg-[#0a0a0a] border-[3px] border-slate-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${theme.dot} shadow-sm`} />
          </div>

          <div className={`w-full p-0 rounded-2xl border border-slate-200/60 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] relative shadow-sm overflow-hidden group hover:border-slate-300 dark:hover:border-neutral-700 transition-colors`}>
            {/* Cabecera del Movimiento */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 ${theme.bg} border-b ${theme.border}`}>
              <div className="flex items-center gap-2.5">
                {getIconForType(mov.tipo_movimiento)}
                <span className={`font-black uppercase tracking-widest text-sm ${theme.text}`}>
                  {mov.tipo_movimiento}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 font-semibold bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-full shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(mov.created_at), "d MMM yyyy, h:mm a", { locale: es })}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-5">
              {/* Información */}
              <div className="flex-1 space-y-5">
                
                {/* De -> A para traslados */}
                {mov.tipo_movimiento.toLowerCase() === 'traslado' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                      <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-black mb-2.5 uppercase tracking-widest">Origen</p>
                      {mov.nombre_usuario_origen && (
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-base font-semibold leading-tight">{mov.nombre_usuario_origen}</span>
                        </div>
                      )}
                      {mov.nombre_dependencia_origen && (
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 mt-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-base font-semibold leading-tight">{mov.nombre_dependencia_origen}</span>
                        </div>
                      )}
                      {!mov.nombre_usuario_origen && !mov.nombre_dependencia_origen && (
                         <div className="flex items-center gap-2 text-slate-500 italic text-sm">Bodega General</div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-slate-100 dark:border-neutral-800/60">
                      <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-black mb-2.5 uppercase tracking-widest">Destino</p>
                      {mov.nombre_usuario_destino && (
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-base font-semibold leading-tight">{mov.nombre_usuario_destino}</span>
                        </div>
                      )}
                      {mov.nombre_dependencia_destino && (
                        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 mt-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-base font-semibold leading-tight">{mov.nombre_dependencia_destino}</span>
                        </div>
                      )}
                      {!mov.nombre_usuario_destino && !mov.nombre_dependencia_destino && (
                        <div className="flex items-center gap-2 text-slate-500 italic text-sm">Bodega General</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Destino para Altas */}
                {mov.tipo_movimiento.toLowerCase() === 'alta' && (
                  <div className="bg-slate-50 dark:bg-neutral-900/40 p-4 rounded-xl border border-slate-100 dark:border-neutral-800/60 w-full sm:w-1/2">
                    <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-black mb-2.5 uppercase tracking-widest">Asignación Inicial</p>
                    {mov.nombre_usuario_destino && (
                      <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-base font-semibold leading-tight">{mov.nombre_usuario_destino}</span>
                      </div>
                    )}
                    {mov.nombre_dependencia_destino && (
                      <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 mt-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-base font-semibold leading-tight">{mov.nombre_dependencia_destino}</span>
                      </div>
                    )}
                    {!mov.nombre_usuario_destino && !mov.nombre_dependencia_destino && (
                      <div className="flex items-center gap-2 text-slate-500 italic text-sm">En bodega</div>
                    )}
                  </div>
                )}

                {/* Observaciones */}
                <div className="bg-white dark:bg-[#0a0a0a]">
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-black mb-1.5 uppercase tracking-widest">Detalles u Observaciones</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{mov.observaciones || 'Sin observaciones'}</p>
                </div>
                
                {/* Cantidad Movida */}
                {mov.cantidad_movida > 1 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg text-sm">
                    <span className="font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">Cantidad afectada: </span>
                    <span className="text-slate-900 dark:text-white font-black">{mov.cantidad_movida}</span>
                  </div>
                )}
              </div>

              {/* Foto Testigo */}
              {imageUrls[mov.id] ? (
                <div className="w-full md:w-32 lg:w-40 shrink-0">
                  <div className="aspect-square bg-slate-100 dark:bg-neutral-900 rounded-xl overflow-hidden border border-slate-200/50 dark:border-neutral-800 relative group cursor-pointer" onClick={() => window.open(imageUrls[mov.id], '_blank')} title="Clic para ampliar">
                    <img 
                      src={imageUrls[mov.id]} 
                      alt="Evidencia" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <p className="text-[9px] text-center text-slate-400 dark:text-neutral-500 mt-2 uppercase tracking-widest font-black">Evidencia Fotográfica</p>
                </div>
              ) : (
                <div className="w-full md:w-32 lg:w-40 shrink-0 flex flex-col items-center justify-center aspect-square bg-slate-50/50 dark:bg-neutral-900/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-600">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-[9px] uppercase tracking-widest text-center px-4 font-black">Sin Evidencia Fotográfica</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )})}
    </div>
  );
}
