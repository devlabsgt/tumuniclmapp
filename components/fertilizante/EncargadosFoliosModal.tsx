'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, UserCog, Search, Pencil, Trash2, Download, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { obtenerLugares } from '@/lib/obtenerLugares';
import { descargarDataUrlImagen, generarImagenEncargados, imprimirDataUrlImagen, type ImagenEncargadosGenerada } from './generarImagenEncargados';
import { BuscadorLugar } from './BuscadorLugar';
import { BuscadorOpciones } from './BuscadorOpciones';
import {
  cargarEncargadosFolios,
  guardarEncargadoFolio,
  actualizarEncargadoFolio,
  eliminarEncargadoFolio,
  obtenerUsuariosParaEncargado,
  type EncargadoFolio,
  type UsuarioEncargado,
} from './actions';

import useUserData from '@/hooks/sesion/useUserData';

const ROLES_GESTION_ENCARGADOS = ['SUPER', 'ADMIN', 'SECRETARIO', 'DMP'];

type Props = {
  visible: boolean;
  onClose: () => void;
};

const validarFolio = (valor: string): boolean => /^\d{4}$/.test(valor) && parseInt(valor, 10) > 0;

const folioValidoParcial = (valor: string): boolean => {
  const digitos = valor.replace(/\D/g, '');
  return digitos.length > 0 && digitos.length <= 4 && parseInt(digitos, 10) > 0;
};

const completarFolioConCeros = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (!digitos || parseInt(digitos, 10) <= 0) return digitos;
  return digitos.padStart(4, '0');
};

const ULTIMO_LUGAR_KEY = 'fertilizante.encargados.ultimo_lugar';
const ULTIMA_FECHA_KEY = 'fertilizante.encargados.ultima_fecha';

const leerUltimoLugar = (): string => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(ULTIMO_LUGAR_KEY) ?? '';
};

const leerUltimaFecha = (fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  return sessionStorage.getItem(ULTIMA_FECHA_KEY) ?? fallback;
};

const guardarPreferenciasFormulario = (lugar: string, fecha: string) => {
  if (typeof window === 'undefined') return;
  if (lugar) sessionStorage.setItem(ULTIMO_LUGAR_KEY, lugar);
  if (fecha) sessionStorage.setItem(ULTIMA_FECHA_KEY, fecha);
};

const folioEnRango = (folio: number, ini: string, fin: string): boolean => {
  const desde = parseInt(ini, 10);
  const hasta = parseInt(fin, 10);
  if (Number.isNaN(desde) || Number.isNaN(hasta) || Number.isNaN(folio)) return false;
  return folio >= desde && folio <= hasta;
};

export default function EncargadosFoliosModal({ visible, onClose }: Props) {
  const { rol } = useUserData();
  const puedeGestionar = ROLES_GESTION_ENCARGADOS.includes(rol);

  const [lugares, setLugares] = useState<string[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioEncargado[]>([]);
  const [encargados, setEncargados] = useState<EncargadoFolio[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Formulario nuevo encargado
  const [lugar, setLugar] = useState(() => leerUltimoLugar());
  const [fecha, setFecha] = useState(() => leerUltimaFecha(new Date().toISOString().slice(0, 10)));
  const [folioIni, setFolioIni] = useState('');
  const [folioFin, setFolioFin] = useState('');
  const [encargadoId, setEncargadoId] = useState('');

  // Filtros de registros guardados
  const [filtroLugar, setFiltroLugar] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEncargadoId, setFiltroEncargadoId] = useState('');
  const [busquedaRegistros, setBusquedaRegistros] = useState('');
  const [descargandoImagen, setDescargandoImagen] = useState(false);
  const [vistaPreviaImagen, setVistaPreviaImagen] = useState<ImagenEncargadosGenerada | null>(null);

  const recargarEncargados = useCallback(async () => {
    setCargandoLista(true);
    const data = await cargarEncargadosFolios();
    setEncargados(data);
    setCargandoLista(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    Promise.all([obtenerLugares(), obtenerUsuariosParaEncargado(), cargarEncargadosFolios()]).then(
      ([lugaresData, usuariosData, encargadosData]) => {
        setLugares(lugaresData);
        setUsuarios(usuariosData);
        setEncargados(encargadosData);
      },
    );

    setFolioIni('');
    setFolioFin('');
    setEncargadoId('');
    setFiltroLugar('');
    setFiltroFecha('');
    setFiltroEncargadoId('');
    setBusquedaRegistros('');
    setEditandoId(null);
    setVistaPreviaImagen(null);
  }, [visible]);

  const encargadoSeleccionado = useMemo(
    () => usuarios.find((u) => u.id === encargadoId) ?? null,
    [usuarios, encargadoId],
  );

  const opcionesUsuarios = useMemo(
    () => usuarios.map((u) => ({ id: u.id, label: u.nombre })),
    [usuarios],
  );

  const lugaresEnRegistros = useMemo(() => {
    return [...new Set(encargados.map((e) => e.lugar))].sort((a, b) => a.localeCompare(b));
  }, [encargados]);

  const fechasDisponibles = useMemo(() => {
    return [...new Set(encargados.map((e) => e.fecha))].sort((a, b) => b.localeCompare(a));
  }, [encargados]);

  const encargadosUnicosFiltro = useMemo(() => {
    const map = new Map<string, string>();
    encargados.forEach((e) => {
      if (e.encargado && !map.has(e.encargado)) {
        map.set(e.encargado, e.encargado_nombre || 'Sin nombre');
      }
    });
    return [...map.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [encargados]);

  const encargadoFiltroSeleccionado = useMemo(
    () => encargadosUnicosFiltro.find((e) => e.id === filtroEncargadoId) ?? null,
    [encargadosUnicosFiltro, filtroEncargadoId],
  );

  const opcionesEncargadosRegistros = useMemo(
    () => encargadosUnicosFiltro.map((e) => ({ id: e.id, label: e.nombre })),
    [encargadosUnicosFiltro],
  );

  const encargadosFiltrados = useMemo(() => {
    const q = busquedaRegistros.trim();
    const digitosBusqueda = q.replace(/\D/g, '');
    const esBusquedaFolio = digitosBusqueda.length > 0 && /^\d+$/.test(digitosBusqueda);
    const folioBuscado = esBusquedaFolio ? parseInt(digitosBusqueda.padStart(4, '0'), 10) : null;

    return encargados.filter((e) => {
      if (filtroLugar && e.lugar !== filtroLugar) return false;
      if (filtroFecha && e.fecha !== filtroFecha) return false;
      if (filtroEncargadoId && e.encargado !== filtroEncargadoId) return false;

      if (!q) return true;

      if (esBusquedaFolio && folioBuscado !== null) {
        return folioEnRango(folioBuscado, e.folio_ini, e.folio_fin);
      }

      return false;
    });
  }, [encargados, filtroLugar, filtroFecha, filtroEncargadoId, busquedaRegistros]);

  const encargadoFiltradoNombre = useMemo(() => {
    if (!filtroEncargadoId) return undefined;
    return encargadosUnicosFiltro.find((e) => e.id === filtroEncargadoId)?.nombre;
  }, [filtroEncargadoId, encargadosUnicosFiltro]);

  const vistaPorEncargadoEspecifico = Boolean(filtroEncargadoId);

  const mostrarColumnaLugar = useMemo(() => {
    if (vistaPorEncargadoEspecifico || encargadosFiltrados.length === 0) return false;
    const lugaresUnicos = new Set(encargadosFiltrados.map((e) => e.lugar));
    return lugaresUnicos.size > 1;
  }, [encargadosFiltrados, vistaPorEncargadoEspecifico]);

  const resetFormulario = () => {
    setFolioIni('');
    setFolioFin('');
    setEncargadoId('');
    setEditandoId(null);
  };

  const cargarRegistroEnFormulario = (registro: EncargadoFolio) => {
    setEditandoId(registro.id);
    setLugar(registro.lugar);
    setFecha(registro.fecha);
    setFolioIni(registro.folio_ini);
    setFolioFin(registro.folio_fin);
    setEncargadoId(registro.encargado);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarFormularioEncargado = () => {
    setLugar('');
    setFecha(new Date().toISOString().slice(0, 10));
    setFolioIni('');
    setFolioFin('');
    setEncargadoId('');
    setEditandoId(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ULTIMO_LUGAR_KEY);
      sessionStorage.removeItem(ULTIMA_FECHA_KEY);
    }
  };

  const limpiarFiltrosRegistros = () => {
    setFiltroLugar('');
    setFiltroFecha('');
    setFiltroEncargadoId('');
    setBusquedaRegistros('');
  };

  const formularioValido =
    Boolean(lugar && fecha && encargadoId) &&
    folioValidoParcial(folioIni) &&
    folioValidoParcial(folioFin) &&
    parseInt(completarFolioConCeros(folioFin), 10) >= parseInt(completarFolioConCeros(folioIni), 10);

  const handleGuardar = async () => {
    const folioIniNorm = completarFolioConCeros(folioIni);
    const folioFinNorm = completarFolioConCeros(folioFin);
    setFolioIni(folioIniNorm);
    setFolioFin(folioFinNorm);

    setGuardando(true);
    const payload = {
      lugar,
      fecha,
      folio_ini: folioIniNorm,
      folio_fin: folioFinNorm,
      encargado: encargadoId,
    };

    const ok = editandoId
      ? await actualizarEncargadoFolio(editandoId, payload)
      : await guardarEncargadoFolio(payload);

    setGuardando(false);

    if (ok) {
      guardarPreferenciasFormulario(lugar, fecha);
      resetFormulario();
      await recargarEncargados();
    }
  };

  const handleEliminar = async (registro: EncargadoFolio) => {
    const ok = await eliminarEncargadoFolio(registro);
    if (ok) {
      if (editandoId === registro.id) resetFormulario();
      await recargarEncargados();
    }
  };

  const handleImprimir = async () => {
    if (encargadosFiltrados.length === 0) {
      toast.warning('No hay registros para incluir en el documento con los filtros actuales.');
      return;
    }

    setDescargandoImagen(true);
    try {
      const imagen = await generarImagenEncargados({
        lugar: filtroLugar,
        fecha: filtroFecha,
        encargadoNombre: encargadoFiltradoNombre,
        registros: encargadosFiltrados,
      });
      setVistaPreviaImagen(imagen);
    } catch (error) {
      console.error('Error al generar documento:', error);
      toast.error('No se pudo crear la vista previa. Intente de nuevo.');
    } finally {
      setDescargandoImagen(false);
    }
  };

  const handleDescargarVistaPrevia = () => {
    if (!vistaPreviaImagen) return;
    descargarDataUrlImagen(vistaPreviaImagen.dataUrl, vistaPreviaImagen.fileName);
  };

  const handleImprimirVistaPrevia = () => {
    if (!vistaPreviaImagen) return;
    imprimirDataUrlImagen(vistaPreviaImagen.dataUrl);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-900">
      {/* Header fijo */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <UserCog size={24} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Encargados de folios</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          title="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          {/* Formulario nuevo encargado */}
          {puedeGestionar && (
          <section className="p-5 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {editandoId ? 'Editar encargado' : 'Nuevo encargado'}
              </p>
              <button
                type="button"
                onClick={limpiarFormularioEncargado}
                className="text-emerald-600 dark:text-emerald-400 text-xs underline p-0 m-0 h-auto min-h-0 bg-transparent border-0 shadow-none cursor-pointer font-medium shrink-0"
              >
                Limpiar
              </button>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
              <div className="w-full md:flex-1 md:min-w-[160px]">
                <BuscadorOpciones
                  label="Encargado"
                  placeholder="Buscar usuario..."
                  opciones={opcionesUsuarios}
                  seleccionado={
                    encargadoSeleccionado
                      ? { id: encargadoSeleccionado.id, label: encargadoSeleccionado.nombre }
                      : null
                  }
                  onSeleccionar={(o) => setEncargadoId(o.id)}
                  onQuitar={() => setEncargadoId('')}
                />
              </div>

              <div className="w-full md:flex-1 md:min-w-[130px]">
                <BuscadorLugar value={lugar} onChange={setLugar} lugares={lugares} />
              </div>

              <div className="w-full md:w-[130px]">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex w-full gap-2 md:contents">
                <div className="w-1/2 md:w-[72px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                    Folio ini
                  </label>
                  <input
                    inputMode="numeric"
                    value={folioIni}
                    onChange={(e) => setFolioIni(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={() => setFolioIni((v) => completarFolioConCeros(v))}
                    maxLength={4}
                    placeholder="0001"
                    className="w-full h-10 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-1 text-center text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="w-1/2 md:w-[72px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                    Folio fin
                  </label>
                  <input
                    inputMode="numeric"
                    value={folioFin}
                    onChange={(e) => setFolioFin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onBlur={() => setFolioFin((v) => completarFolioConCeros(v))}
                    maxLength={4}
                    placeholder="0100"
                    className="w-full h-10 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-1 text-center text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <button
                onClick={handleGuardar}
                disabled={guardando || !formularioValido}
                className="w-full md:w-auto h-10 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-all active:scale-95"
              >
                {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </section>
          )}

          {/* Registros guardados con filtros */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Registros guardados</h3>
                <button
                  type="button"
                  onClick={limpiarFiltrosRegistros}
                  className="text-emerald-600 dark:text-emerald-400 text-xs underline p-0 m-0 h-auto min-h-0 bg-transparent border-0 shadow-none cursor-pointer font-medium shrink-0"
                >
                  Limpiar
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {encargadosFiltrados.length} de {encargados.length} registros
                  {filtroLugar ? ` · ${filtroLugar}` : ''}
                </span>
                <button
                  type="button"
                  onClick={handleImprimir}
                  disabled={descargandoImagen || encargadosFiltrados.length === 0}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 disabled:opacity-40 transition-colors text-xs font-bold"
                  title={descargandoImagen ? 'Generando...' : 'Imprimir'}
                >
                  <Printer size={15} />
                  Imprimir
                </button>
              </div>
            </div>

            <div className="mb-3 p-2.5 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800">
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-full sm:w-auto sm:min-w-[130px] sm:flex-1">
                  <BuscadorLugar
                    value={filtroLugar}
                    onChange={setFiltroLugar}
                    lugares={lugaresEnRegistros}
                  />
                </div>

                <div className="w-full sm:w-auto sm:min-w-[120px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                    Fecha
                  </label>
                  <select
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">Todas</option>
                    {fechasDisponibles.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:flex-1 sm:min-w-[220px]">
                  <BuscadorOpciones
                    label="Encargado"
                    placeholder="Buscar encargado..."
                    opciones={opcionesEncargadosRegistros}
                    seleccionado={
                      encargadoFiltroSeleccionado
                        ? { id: encargadoFiltroSeleccionado.id, label: encargadoFiltroSeleccionado.nombre }
                        : null
                    }
                    onSeleccionar={(o) => setFiltroEncargadoId(o.id)}
                    onQuitar={() => setFiltroEncargadoId('')}
                  />
                </div>

                <div className="w-full sm:w-auto sm:min-w-[120px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                    Folio
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={busquedaRegistros}
                      onChange={(e) => setBusquedaRegistros(e.target.value)}
                      placeholder="0001..."
                      className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {cargandoLista ? (
              <p className="text-sm text-gray-500 italic">Cargando...</p>
            ) : encargados.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay encargados registrados.</p>
            ) : encargadosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No hay registros que coincidan con los filtros.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-neutral-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-800 text-left">
                    <tr>
                      {vistaPorEncargadoEspecifico ? (
                        <>
                          <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Lugar</th>
                          <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Fecha</th>
                          <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Folios</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Encargado</th>
                          <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Folios</th>
                          {mostrarColumnaLugar && (
                            <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400">Lugar</th>
                          )}
                        </>
                      )}
                      {puedeGestionar && (
                        <th className="px-4 py-3 font-bold text-gray-500 dark:text-gray-400 text-center">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {encargadosFiltrados.map((e) => (
                      <tr
                        key={e.id}
                        className="border-t border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                      >
                        {vistaPorEncargadoEspecifico ? (
                          <>
                            <td className="px-4 py-3">{e.lugar}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{e.fecha}</td>
                            <td className="px-4 py-3 font-mono whitespace-nowrap">
                              {e.folio_ini} – {e.folio_fin}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">{e.encargado_nombre || '—'}</td>
                            <td className="px-4 py-3 font-mono whitespace-nowrap">
                              {e.folio_ini} – {e.folio_fin}
                            </td>
                            {mostrarColumnaLugar && <td className="px-4 py-3">{e.lugar}</td>}
                          </>
                        )}
                        {puedeGestionar && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => cargarRegistroEnFormulario(e)}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminar(e)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {vistaPreviaImagen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/70 p-4"
          onClick={() => setVistaPreviaImagen(null)}
        >
          <div
            className="mx-auto w-full max-w-4xl flex flex-col flex-1 min-h-0 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Vista previa — tamaño carta</h3>
              <button
                type="button"
                onClick={() => setVistaPreviaImagen(null)}
                className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 bg-gray-100 dark:bg-neutral-950 flex justify-center">
              <img
                src={vistaPreviaImagen.dataUrl}
                alt="Vista previa de encargados de folios"
                className="max-w-full h-auto shadow-lg border border-gray-200 dark:border-neutral-700"
              />
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-2 justify-end px-4 py-3 border-t border-gray-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setVistaPreviaImagen(null)}
                className="h-10 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDescargarVistaPrevia}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Download size={16} />
                Descargar imagen
              </button>
              <button
                type="button"
                onClick={handleImprimirVistaPrevia}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
              >
                <Printer size={16} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
