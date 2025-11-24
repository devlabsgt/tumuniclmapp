'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchAsistenciaGlobalAgenda } from '@/components/concejo/agenda/lib/acciones';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CargandoAnimacion from '@/components/ui/animations/Cargando';
import { AnimatePresence } from 'framer-motion';
import Mapa from '@/components/ui/modals/Mapa';

interface RegistroRaw {
  id: string;
  created_at: string;
  tipo_registro: 'Entrada' | 'Salida';
  ubicacion: { latitude?: number; longitude?: number; lat?: number; lng?: number } | null;
  notas?: string;
  usuarios: {
    id: string;
    nombre: string;
    puesto: string;
  };
}

interface UsuarioAsistencia {
  userId: string;
  nombre: string;
  puesto: string;
  entrada: string | null;
  salida: string | null;
  coordsEntrada: { lat: number; lng: number } | null;
  coordsSalida: { lat: number; lng: number } | null;
  duracion: string;
  estado: 'Presente' | 'Finalizado' | 'Sin Salida';
  registroEntradaCompleto?: any;
  registroSalidaCompleto?: any;
}

export default function ListaAsistenciaGlobal({ agendaId }: { agendaId: string }) {
  const [registros, setRegistros] = useState<RegistroRaw[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalMapaOpen, setModalMapaOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAsistencia | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    const data = await fetchAsistenciaGlobalAgenda(agendaId);
    setRegistros(data as any);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [agendaId]);

  const asistenciaProcesada = useMemo(() => {
    const mapa = new Map<string, UsuarioAsistencia>();

    registros.forEach((reg) => {
      const userId = reg.usuarios?.id;
      if (!userId) return;

      if (!mapa.has(userId)) {
        mapa.set(userId, {
          userId,
          nombre: reg.usuarios.nombre || 'Desconocido',
          puesto: reg.usuarios.puesto || 'Sin cargo',
          entrada: null,
          salida: null,
          coordsEntrada: null,
          coordsSalida: null,
          duracion: '--',
          estado: 'Sin Salida',
          registroEntradaCompleto: null,
          registroSalidaCompleto: null
        });
      }

      const usuario = mapa.get(userId)!;

      let coords = { lat: 0, lng: 0 };
      if (reg.ubicacion) {
        const lat = reg.ubicacion.latitude ?? reg.ubicacion.lat ?? 0;
        const lng = reg.ubicacion.longitude ?? reg.ubicacion.lng ?? 0;
        coords = { lat, lng };
      }

      const registroNormalizado = {
          created_at: reg.created_at,
          tipo_registro: reg.tipo_registro,
          ubicacion: coords,
          notas: reg.notas
      };

      if (reg.tipo_registro === 'Entrada') {
        usuario.entrada = reg.created_at;
        usuario.coordsEntrada = coords;
        usuario.registroEntradaCompleto = registroNormalizado;
      } else if (reg.tipo_registro === 'Salida') {
        usuario.salida = reg.created_at;
        usuario.coordsSalida = coords;
        usuario.registroSalidaCompleto = registroNormalizado;
      }
    });

    const lista = Array.from(mapa.values());

    return lista.map(u => {
      if (u.entrada && u.salida) {
        const diff = differenceInMinutes(new Date(u.salida), new Date(u.entrada));
        const horas = Math.floor(diff / 60);
        const mins = diff % 60;
        u.duracion = `${horas}h ${mins}m`;
        u.estado = 'Finalizado';
      } else if (u.entrada && !u.salida) {
        u.estado = 'Presente';
      }
      return u;
    });
  }, [registros]);

  const handleRowClick = (usuario: UsuarioAsistencia) => {
    setUsuarioSeleccionado(usuario);
    setModalMapaOpen(true);
  };

  if (cargando) return <CargandoAnimacion texto="Cargando lista de asistencia..." />;

  if (asistenciaProcesada.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-500 font-medium">Aún no hay registros de asistencia para esta sesión.</p>
        <Button variant="outline" onClick={cargarDatos} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Listado de Asistencia
            <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded-full text-gray-600">
              {asistenciaProcesada.length} marcajes
            </span>
          </h3>
          <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cargarDatos}>
                  <RefreshCw className="h-4 w-4" />
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:hidden">
          {asistenciaProcesada.map((usuario) => (
            <div 
              key={usuario.userId} 
              onClick={() => handleRowClick(usuario)}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="bg-slate-50 p-3 border-b border-gray-100 flex items-center justify-center flex-col text-center">
                  <span className="font-bold text-gray-800 text-sm">{usuario.nombre}</span>
                  <span className="text-xs text-gray-500 uppercase font-medium tracking-wide">{usuario.puesto}</span>
              </div>

<div className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                      <div className={`flex flex-col items-center justify-center p-2 rounded-md border ${usuario.entrada ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Entrada</p>
                          <p className={`font-mono text-xs font-bold whitespace-nowrap ${usuario.entrada ? 'text-green-700' : 'text-gray-400'}`}>
                              {usuario.entrada ? format(new Date(usuario.entrada), 'h:mm a', { locale: es }) : '-'}
                          </p>
                      </div>

                      <div className={`flex flex-col items-center justify-center p-2 rounded-md border ${usuario.salida ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Salida</p>
                          <p className={`font-mono text-xs font-bold whitespace-nowrap ${usuario.salida ? 'text-orange-700' : 'text-gray-400'}`}>
                              {usuario.salida ? format(new Date(usuario.salida), 'h:mm a', { locale: es }) : '-'}
                          </p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-2 rounded-md border bg-blue-50 border-blue-200">
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Duración</p>
                          <p className="font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                              {usuario.duracion}
                          </p>
                      </div>
                  </div>
              </div>
              
              <div className="bg-gray-50 py-2 text-center border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" /> Toca para ver detalle
                  </p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-center">Entrada</th>
                  <th className="px-4 py-3 text-center">Salida</th>
                  <th className="px-4 py-3 text-center">Duración</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asistenciaProcesada.map((usuario) => (
                  <tr 
                    key={usuario.userId} 
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(usuario)}
                    title="Ver ubicación en mapa"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{usuario.nombre}</span>
                        <span className="text-xs text-gray-500 capitalize">{usuario.puesto}</span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {usuario.entrada ? (
                        <div className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-100">
                          <Clock className="h-3 w-3" />
                          {format(new Date(usuario.entrada), 'h:mm a', { locale: es })}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {usuario.salida ? (
                        <div className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs font-medium border border-orange-100">
                          <Clock className="h-3 w-3" />
                          {format(new Date(usuario.salida), 'h:mm a', { locale: es })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Pendiente</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-xs text-gray-600">
                      {usuario.duracion}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        usuario.estado === 'Finalizado' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800 animate-pulse'
                      }`}>
                        {usuario.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalMapaOpen && usuarioSeleccionado && (
          <Mapa
            isOpen={modalMapaOpen}
            onClose={() => setModalMapaOpen(false)}
            registros={{
              entrada: usuarioSeleccionado.registroEntradaCompleto || null,
              salida: usuarioSeleccionado.registroSalidaCompleto || null
            }}
            nombreUsuario={usuarioSeleccionado.nombre}
            titulo="Detalle de Asistencia"
          />
        )}
      </AnimatePresence>
    </>
  );
}