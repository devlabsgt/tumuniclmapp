"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  MapPin,
  Phone,
  Search,
  Navigation,
  Home,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  X,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { albergues, CENTRO_ALBERGUES, type Albergue } from "./data";

const formatearTelefono = (tel: string) =>
  tel.replace(/(\d{4})(\d{4})/, "$1-$2");

const textoModalVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.55 },
  },
};

const abrirGoogleMaps = (a: Albergue) => {
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`,
    "_blank",
  );
};

const abrirWaze = (a: Albergue) => {
  window.open(
    `https://waze.com/ul?ll=${a.lat},${a.lng}&navigate=yes`,
    "_blank",
  );
};

const llamar = (a: Albergue) => {
  window.location.href = `tel:+502${a.telefono}`;
};

const abrirWhatsApp = (a: Albergue) => {
  window.open(`https://wa.me/502${a.telefono}`, "_blank");
};

function MapaAlbergues({ seleccionado }: { seleccionado: Albergue | null }) {
  const punto = seleccionado ?? {
    lat: CENTRO_ALBERGUES.lat,
    lng: CENTRO_ALBERGUES.lng,
  };
  const zoom = seleccionado ? 17 : 14;

  return (
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] lg:min-h-0">
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
    </div>
  );
}

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function AccionesRapidas({
  a,
  cardIndex = 0,
}: {
  a: Albergue;
  cardIndex?: number;
}) {
  const acciones = [
    {
      label: "Maps",
      icon: <MapPin size={18} />,
      onClick: () => abrirGoogleMaps(a),
      className: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Waze",
      icon: <Navigation size={18} />,
      onClick: () => abrirWaze(a),
      className: "bg-sky-500 hover:bg-sky-600",
    },
    {
      label: "Llamar",
      icon: <Phone size={18} />,
      onClick: () => llamar(a),
      className:
        "bg-slate-700 dark:bg-neutral-700 hover:bg-slate-800 dark:hover:bg-neutral-600",
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon size={18} />,
      onClick: () => abrirWhatsApp(a),
      className: "bg-emerald-600 hover:bg-emerald-700",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 lg:gap-3">
      {acciones.map((accion, j) => (
        <motion.button
          key={accion.label}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            accion.onClick();
          }}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.35,
            delay: cardIndex * 0.04 + j * 0.06,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          whileTap={{ scale: 0.9 }}
          className={`flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-1.5 py-3 lg:py-2.5 px-1 lg:px-2 rounded-2xl text-[11px] lg:text-xs font-bold text-white transition-colors ${accion.className}`}
        >
          {accion.icon}
          {accion.label}
        </motion.button>
      ))}
    </div>
  );
}

export default function VerAlbergues() {
  const [busqueda, setBusqueda] = useState("");
  const [lugarFiltro, setLugarFiltro] = useState("");
  const [seleccionado, setSeleccionado] = useState<Albergue | null>(null);
  const [verTodas, setVerTodas] = useState(true);
  const [logoModalAbierto, setLogoModalAbierto] = useState(false);

  const lugaresDisponibles = useMemo(
    () =>
      [...new Set(albergues.map((a) => a.lugar))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [],
  );

  const alberguesFiltrados = useMemo(() => {
    let resultado = albergues;

    if (lugarFiltro) {
      resultado = resultado.filter((a) => a.lugar === lugarFiltro);
    }

    const texto = busqueda.toLowerCase().trim();
    if (!texto) return resultado;

    return resultado.filter(
      (a) =>
        a.nombre.toLowerCase().includes(texto) ||
        a.lugar.toLowerCase().includes(texto) ||
        a.direccion.toLowerCase().includes(texto) ||
        (a.encargado || "").toLowerCase().includes(texto),
    );
  }, [busqueda, lugarFiltro]);

  const alberguesVisibles = useMemo(() => {
    if (verTodas || !seleccionado) return alberguesFiltrados;
    return alberguesFiltrados.filter((a) => a.id === seleccionado.id);
  }, [verTodas, seleccionado, alberguesFiltrados]);

  const esVistaMovil = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1023px)").matches;

  useEffect(() => {
    setVerTodas(true);
    setSeleccionado(null);
  }, [busqueda, lugarFiltro]);

  const seleccionar = (a: Albergue) => {
    setSeleccionado(a);
    if (esVistaMovil()) {
      setVerTodas(false);
      document
        .getElementById("mapa-encabezado")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-neutral-950">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-3xl lg:rounded-b-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 lg:px-8 pb-4 lg:pb-0 text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
          <div className="flex items-end gap-1">
            <AnimatedIcon
              iconKey="oyksjpcy"
              className="w-32 h-32 shrink-0"
              trigger="hover"
            />
            <AnimatedIcon
              iconKey="gdmuqfji"
              className="w-28 h-28 shrink-0"
              trigger="hover"
            />
            <AnimatedIcon
              iconKey="lwjrqevu"
              className="w-28 h-28 shrink-0"
              trigger="hover"
            />
          </div>
        </div>

        <div className="relative max-w-lg lg:max-w-none mx-auto flex flex-col items-center text-center gap-3 lg:flex-row lg:items-center lg:text-left lg:gap-6">
          <button
            type="button"
            onClick={() => setLogoModalAbierto(true)}
            className="shrink-0 w-[68%] max-w-[240px] sm:max-w-[280px] lg:w-auto lg:max-w-none cursor-pointer rounded-2xl transition-transform active:scale-[0.98] hover:opacity-90"
            aria-label="Ver logo municipal"
          >
            <Image
              src="/images/logo-muni-sombra.png"
              alt="Municipalidad de Concepción Las Minas"
              width={500}
              height={380}
              priority
              className="block w-full lg:w-[340px] xl:w-[380px] h-auto object-contain drop-shadow-md pointer-events-none"
            />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100">
              Municipalidad de Concepción Las Minas
            </p>
            <h1 className="text-2xl lg:text-3xl font-extrabold mt-1 leading-tight">
              Directorio de Albergues
            </h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed max-w-xl">
              Chiquimula, Guatemala · Encuentra el albergue más cercano y
              contacta al encargado
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold">
                <Home size={14} />
                {albergues.length} albergues
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold">
                <MapPin size={14} />
                24/7 disponible
              </span>
            </div>
            <div className="lg:hidden flex justify-center items-end gap-0 mt-4 pointer-events-auto">
              <AnimatedIcon
                iconKey="oyksjpcy"
                className="w-20 h-20 shrink-0"
                trigger="hover"
              />
              <AnimatedIcon
                iconKey="gdmuqfji"
                className="w-[4.5rem] h-[4.5rem] shrink-0"
                trigger="hover"
              />
              <AnimatedIcon
                iconKey="lwjrqevu"
                className="w-[4.5rem] h-[4.5rem] shrink-0"
                trigger="hover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg lg:max-w-none mx-auto mt-5 pb-10 px-0 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Columna izquierda — filtros fijos + mapa */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-3">
            <div
              className={`sticky top-0 z-30 bg-slate-50 dark:bg-neutral-950 pt-2 pb-1 px-4 lg:px-0 space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 ${
                !verTodas ? "hidden lg:block" : ""
              }`}
            >
              <div className="relative shadow-md rounded-2xl">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar albergue..."
                  className="w-full bg-white dark:bg-neutral-900 border-0 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white"
                />
              </div>
              <div className="relative shadow-md rounded-2xl">
                <MapPin
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
                />
                <select
                  value={lugarFiltro}
                  onChange={(e) => setLugarFiltro(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-neutral-900 border-0 rounded-2xl pl-11 pr-10 py-3.5 text-sm font-semibold text-blue-600 dark:text-blue-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  <option value="">Todas las ubicaciones</option>
                  {lugaresDisponibles.map((lugar) => (
                    <option key={lugar} value={lugar}>
                      {lugar}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-none shadow-sm bg-white dark:bg-neutral-900"
            >
              <div
                id="mapa-encabezado"
                className={`px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${
                  seleccionado ? "sticky top-0 z-40 shadow-sm" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <MapPin
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="min-w-0">
                    {seleccionado ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Seleccionado
                        </p>
                        <p className="text-sm font-bold truncate dark:text-white">
                          {seleccionado.nombre}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                          {seleccionado.lugar}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Mapa
                        </p>
                        <p className="text-sm font-bold dark:text-white">
                          Concepción Las Minas
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {seleccionado ? (
                  <button
                    type="button"
                    onClick={() => abrirGoogleMaps(seleccionado)}
                    className="shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform"
                  >
                    <ExternalLink size={14} />
                    Abrir
                  </button>
                ) : null}
              </div>
              <div
                id="mapa-albergues"
                className="h-[220px] sm:h-[280px] lg:h-[min(42vw,520px)] overflow-hidden"
              >
                <MapaAlbergues seleccionado={seleccionado} />
              </div>
            </motion.div>
          </div>

          {/* Columna derecha — listado */}
          <div className="lg:min-w-0 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
            <div className="mt-4 lg:mt-0 space-y-3">
              <div className="flex items-center justify-between gap-2 mb-1 px-4 lg:px-0">
                {!verTodas ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setVerTodas(true);
                        setSeleccionado(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 active:scale-95 transition-transform"
                    >
                      <ChevronLeft size={18} strokeWidth={2.5} />
                      Ver todos
                    </button>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Albergue seleccionado
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {alberguesFiltrados.length} resultado
                    {alberguesFiltrados.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {(verTodas ? alberguesFiltrados : alberguesVisibles).length ===
              0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Home size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No se encontraron albergues</p>
                </div>
              ) : (
                (verTodas ? alberguesFiltrados : alberguesVisibles).map(
                  (a, i) => {
                    const activo = seleccionado?.id === a.id;
                    return (
                      <motion.div
                        key={a.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: i * 0.04,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className={`w-full rounded-none py-4 transition-all duration-300 ease-out ${
                          activo
                            ? "bg-white dark:bg-neutral-900 ring-2 ring-inset ring-blue-500 shadow-sm"
                            : "bg-white dark:bg-neutral-900 shadow-sm"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => seleccionar(a)}
                          className="w-full text-left px-4 lg:px-5 active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-sm font-extrabold ${
                                activo
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h2 className="font-bold text-base leading-snug dark:text-white">
                                  {a.nombre}
                                </h2>
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-lg">
                                  {a.capacidad} pers.
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                {a.lugar}
                              </p>
                            </div>
                          </div>

                          <p className="mt-2.5 w-full text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 mt-0.5 text-red-400"
                            />
                            <span>{a.direccion}</span>
                          </p>

                          <div className="mt-2 w-full flex items-center justify-between gap-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 min-w-0">
                              {a.encargado ? (
                                <>
                                  Encargado:{" "}
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {a.encargado}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400">
                                  Sin encargado
                                </span>
                              )}
                            </p>
                            <p className="shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Phone size={13} className="text-blue-500" />
                              {formatearTelefono(a.telefono)}
                            </p>
                          </div>
                        </button>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.35,
                            delay: i * 0.04 + 0.15,
                            ease: "easeOut",
                          }}
                          className="pt-4 mt-4 px-4 lg:px-5 border-t border-gray-100 dark:border-neutral-800"
                        >
                          <AccionesRapidas a={a} cardIndex={i} />
                        </motion.div>
                      </motion.div>
                    );
                  },
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {logoModalAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white/60 dark:bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-6"
            onClick={() => setLogoModalAbierto(false)}
          >
            <button
              type="button"
              onClick={() => setLogoModalAbierto(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/50 dark:bg-neutral-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={32} />
            </button>

            <div
              className="flex flex-col items-center text-center gap-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Image
                  src="/images/logo-muni-sombra.png"
                  alt="Logo Municipalidad de Concepción Las Minas"
                  width={500}
                  height={380}
                  className="w-full max-w-[min(92vw,28rem)] h-auto object-contain drop-shadow-2xl"
                />
              </motion.div>

              <div className="flex flex-col items-center mt-6 px-4">
                <motion.span
                  className="text-xl lg:text-2xl font-bold text-center text-[#0066cc]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  variants={textoModalVariant}
                  initial="hidden"
                  animate="visible"
                >
                  Municipalidad de Concepción Las Minas
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
