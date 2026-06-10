'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Search,
  Navigation,
  Home,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';
import { albergues, CENTRO_ALBERGUES, type Albergue } from './data';

const formatearTelefono = (tel: string) => tel.replace(/(\d{4})(\d{4})/, '$1-$2');

const abrirGoogleMaps = (a: Albergue) => {
  window.open(`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`, '_blank');
};

const abrirWaze = (a: Albergue) => {
  window.open(`https://waze.com/ul?ll=${a.lat},${a.lng}&navigate=yes`, '_blank');
};

const llamar = (a: Albergue) => {
  window.location.href = `tel:+502${a.telefono}`;
};

const abrirWhatsApp = (a: Albergue) => {
  window.open(`https://wa.me/502${a.telefono}`, '_blank');
};

function MapaAlbergues({ seleccionado }: { seleccionado: Albergue | null }) {
  const punto = seleccionado ?? { lat: CENTRO_ALBERGUES.lat, lng: CENTRO_ALBERGUES.lng };
  const zoom = seleccionado ? 17 : 14;

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px]">
      <iframe
        key={`${punto.lat}-${punto.lng}-${zoom}`}
        title="Mapa de albergues"
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://maps.google.com/maps?q=${punto.lat},${punto.lng}&z=${zoom}&output=embed`}
      />
      {seleccionado && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/60 dark:border-neutral-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Seleccionado
              </p>
              <p className="text-sm font-bold truncate dark:text-white">{seleccionado.nombre}</p>
            </div>
            <button
              onClick={() => abrirGoogleMaps(seleccionado)}
              className="shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform"
            >
              <ExternalLink size={14} />
              Abrir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AccionesRapidas({ a, compacto = false }: { a: Albergue; compacto?: boolean }) {
  const btn = compacto
    ? 'flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-[11px] font-bold active:scale-95 transition-transform'
    : 'flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-transform';

  return (
    <div className="grid grid-cols-4 gap-2">
      <button onClick={() => abrirGoogleMaps(a)} className={`${btn} bg-blue-600 text-white`}>
        <MapPin size={compacto ? 20 : 18} />
        {compacto ? 'Maps' : 'Google Maps'}
      </button>
      <button onClick={() => abrirWaze(a)} className={`${btn} bg-sky-500 text-white`}>
        <Navigation size={compacto ? 20 : 18} />
        Waze
      </button>
      <button onClick={() => llamar(a)} className={`${btn} bg-slate-700 dark:bg-neutral-700 text-white`}>
        <Phone size={compacto ? 20 : 18} />
        Llamar
      </button>
      <button onClick={() => abrirWhatsApp(a)} className={`${btn} bg-emerald-600 text-white`}>
        <svg xmlns="http://www.w3.org/2000/svg" width={compacto ? 20 : 18} height={compacto ? 20 : 18} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </button>
    </div>
  );
}

export default function VerAlbergues() {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Albergue | null>(null);
  const [verTodas, setVerTodas] = useState(true);

  const alberguesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return albergues;
    return albergues.filter(
      (a) =>
        a.nombre.toLowerCase().includes(texto) ||
        a.direccion.toLowerCase().includes(texto) ||
        (a.encargado || '').toLowerCase().includes(texto)
    );
  }, [busqueda]);

  const alberguesVisibles = useMemo(() => {
    if (verTodas || !seleccionado) return alberguesFiltrados;
    return alberguesFiltrados.filter((a) => a.id === seleccionado.id);
  }, [verTodas, seleccionado, alberguesFiltrados]);

  useEffect(() => {
    setVerTodas(true);
  }, [busqueda]);

  const seleccionar = (a: Albergue) => {
    setSeleccionado(a);
    setVerTodas(false);
    document.getElementById('mapa-albergues')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-neutral-950">
      {/* Logo municipal */}
      <div className="w-full bg-white py-2 flex justify-center">
        <Image
          src="/images/logo-muni.png"
          alt="Municipalidad de Concepción Las Minas"
          width={400}
          height={120}
          priority
          className="w-[80%] max-w-[320px] md:max-w-[180px] h-auto object-contain"
        />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 pt-6 pb-10 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative max-w-lg mx-auto flex flex-col items-center text-center gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
              Municipalidad de Concepción Las Minas
            </p>
            <h1 className="text-2xl font-extrabold mt-1 leading-tight">Directorio de Albergues</h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Chiquimula, Guatemala · Encuentra el albergue más cercano y contacta al encargado
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold">
              <Home size={14} />
              {albergues.length} albergues
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold">
              <MapPin size={14} />
              24/7 disponible
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 pb-10">
        {/* Mapa */}
        <motion.div
          id="mapa-albergues"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden shadow-xl border border-white dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mapa</p>
                <p className="text-sm font-bold dark:text-white">Concepción Las Minas</p>
              </div>
            </div>
            <button
              onClick={() => seleccionado && abrirGoogleMaps(seleccionado)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
            >
              Ver en app
              <ChevronRight size={14} />
            </button>
          </div>
          <MapaAlbergues seleccionado={seleccionado} />
        </motion.div>

        {/* Buscador sticky */}
        <div className="sticky top-2 z-20 mt-4">
          <div className="relative shadow-md rounded-2xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar albergue..."
              className="w-full bg-white dark:bg-neutral-900 border-0 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white"
            />
          </div>
        </div>

        {/* Chips rápidos */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 -mx-1 px-1 snap-x [&::-webkit-scrollbar]:hidden">
          {alberguesFiltrados.map((a) => (
            <button
              key={a.id}
              onClick={() => seleccionar(a)}
              className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                seleccionado?.id === a.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
              }`}
            >
              {a.nombre.length > 22 ? `${a.nombre.slice(0, 22)}…` : a.nombre}
            </button>
          ))}
        </div>

        {/* Listado */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {!verTodas && seleccionado
                ? 'Albergue seleccionado'
                : `${alberguesFiltrados.length} resultado${alberguesFiltrados.length !== 1 ? 's' : ''}`}
            </p>
            {!verTodas && (
              <button
                type="button"
                onClick={() => {
                  setVerTodas(true);
                  setSeleccionado(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                <LayoutGrid size={14} />
                Ver todas
              </button>
            )}
          </div>

          {alberguesVisibles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Home size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se encontraron albergues</p>
            </div>
          ) : (
            alberguesVisibles.map((a, i) => {
              const activo = verTodas ? seleccionado?.id === a.id : true;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`w-full rounded-3xl p-4 transition-all ${
                    activo
                      ? 'bg-white dark:bg-neutral-900 ring-2 ring-blue-500 shadow-lg'
                      : 'bg-white dark:bg-neutral-900 shadow-sm border border-gray-100 dark:border-neutral-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => seleccionar(a)}
                    className="w-full text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-sm font-extrabold ${
                          activo
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {a.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base leading-snug dark:text-white pr-2">{a.nombre}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1 mt-1">
                          <MapPin size={14} className="shrink-0 mt-0.5 text-red-400" />
                          <span className="line-clamp-2">{a.direccion}</span>
                        </p>
                        {a.encargado && (
                          <p className="text-xs text-gray-400 mt-1">Encargado: {a.encargado}</p>
                        )}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2 flex items-center gap-1.5">
                          <Phone size={14} className="text-blue-500" />
                          {formatearTelefono(a.telefono)}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`shrink-0 mt-1 transition-colors ${activo ? 'text-blue-500' : 'text-gray-300'}`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {activo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-neutral-800">
                          <AccionesRapidas a={a} compacto />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
