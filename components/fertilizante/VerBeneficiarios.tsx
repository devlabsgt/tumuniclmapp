'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FiltroBeneficiarios } from './FiltroBeneficiarios';
import { TablaBeneficiarios } from './TablaBeneficiarios';
import EstadisticasBeneficiarios from './EstadisticasBeneficiarios';
import MISSINGFolioModal from './MISSINGFolioModal';
import type { Beneficiario, CampoFiltro, OrdenFiltro } from './types';
import {
  cargarBeneficiariosPorAnio,
  obtenerAniosDisponibles,
  ingresarFolioAnulado,
  ingresarFolioInforme,
  filtrarYOrdenarBeneficiarios,
  generarResumenBeneficiarios,
} from './actions';
import useUserData from '@/hooks/sesion/useUserData';

export default function VerBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState<OrdenFiltro>('codigo_asc');
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([]);
  const [mostrarModalFolio, setMostrarModalFolio] = useState(false);
  const [beneficiariosPorPagina, setBeneficiariosPorPagina] = useState(20);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [filtros, setFiltros] = useState({
    campo: 'codigo' as CampoFiltro,
    valor: '',
    lugar: '',
    anio: '', // Se inicializa vacío para esperar la respuesta de la DB
  });

  const router = useRouter();
  const { permisos, cargando: cargandoUsuario } = useUserData();

  const cargarDatos = useCallback(async (anioParaCargar: string) => {
    if (!anioParaCargar) return;
    setInitialLoading(true);
    const data = await cargarBeneficiariosPorAnio(anioParaCargar);
    setBeneficiarios(data);
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      const anios = await obtenerAniosDisponibles();
      setAniosDisponibles(anios);

      const anioActual = new Date().getFullYear().toString();
      
      // Lógica inteligente: Si el año actual no está en la DB, usar el más reciente disponible
      let anioInicial = anioActual;
      if (anios.length > 0 && !anios.includes(anioActual)) {
        anioInicial = anios[0]; // Asumiendo que vienen ordenados desc (2025, 2024...)
      }

      setFiltros(prev => ({ ...prev, anio: anioInicial }));
      await cargarDatos(anioInicial);
    };

    inicializar();
  }, [cargarDatos]);

  // Efecto para cambios manuales en el select de año
  useEffect(() => {
    if (filtros.anio && !initialLoading) {
      cargarDatos(filtros.anio);
    }
  }, [filtros.anio, cargarDatos]);

  const beneficiariosFiltrados = filtrarYOrdenarBeneficiarios(beneficiarios, filtros, orden);
  const totalPaginas = Math.ceil(beneficiariosFiltrados.length / beneficiariosPorPagina);
  const inicio = (paginaActual - 1) * beneficiariosPorPagina;
  const beneficiariosPaginados = beneficiariosFiltrados.slice(inicio, inicio + beneficiariosPorPagina);
  const resumen = generarResumenBeneficiarios(beneficiariosFiltrados);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros, orden, beneficiariosPorPagina]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full mx-auto p-2 md:px-10">
      <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between my-6 gap-2">
          <h1 className="text-2xl font-bold text-left">Beneficiarios de Fertilizante</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {(permisos.includes('CREAR') || permisos.includes('TODO')) ? (
              <Button 
                onClick={() => router.push('/protected/fertilizante/beneficiarios/crear')} 
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-4 w-full sm:w-auto"
              >
                Nuevo Beneficiario
              </Button>
            ) : (
              <Button disabled className="h-12 bg-gray-400 text-gray-700 cursor-not-allowed px-4 w-full sm:w-auto">
                Nuevo Beneficiario
              </Button>
            )}
          </div>
        </div>
      </motion.div>
      
      <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.3 }}>
        <FiltroBeneficiarios filtros={filtros} setFiltros={setFiltros} anios={aniosDisponibles} />
      </motion.div>
      
      <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.4 }}>
        <EstadisticasBeneficiarios data={beneficiariosFiltrados} />
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.5 }}>
        <div className="my-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ordenar por:</span>
            <select value={orden} onChange={e => setOrden(e.target.value as OrdenFiltro)} className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded px-3 py-2 mt-2 sm:mt-0 sm:ml-2">
                <optgroup label="Formulario"><option value="codigo_asc">Folio (ascendente)</option><option value="codigo_desc">Folio (descendente)</option></optgroup>
                <optgroup label="Nombre"><option value="nombre_completo_asc">Nombre (A-Z)</option><option value="nombre_completo_desc">Nombre (Z-A)</option></optgroup>
                <optgroup label="Fecha"><option value="fecha_desc">Fecha (más reciente)</option><option value="fecha_asc">Fecha (más antigua)</option></optgroup>
                <optgroup label="Cantidad"><option value="cantidad_desc">Cantidad (mayor a menor)</option></optgroup>
                <optgroup label="Género"><option value="genero_hombres_primero">Hombres primero</option><option value="genero_mujeres_primero">Mujeres primero</option></optgroup>
                <optgroup label="Estado"><option value="solo_anulados">Anulados</option><option value="solo_extraviados">Extraviados</option><option value="solo_informes">Informes</option></optgroup>
            </select>
          </div>
          {(permisos.includes('TODO') || permisos.includes('LEER')) && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-fit">
              <div className="relative inline-block text-left">
                {(permisos.includes('CREAR') || permisos.includes('TODO')) ? (
                  <Button className="h-12 bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" onClick={() => setMostrarOpciones(!mostrarOpciones)}>
                    Gestionar Documentos
                  </Button>
                ) : (
                   <Button disabled className="h-12 bg-gray-400 text-gray-700 cursor-not-allowed px-4 w-full sm:w-auto">
                    Gestionar Documentos
                  </Button>
                )}
                {mostrarOpciones && (
                  <div className="absolute z-10 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-neutral-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700" onClick={() => { setMostrarOpciones(false); ingresarFolioAnulado(aniosDisponibles, filtros.anio, () => cargarDatos(filtros.anio)); }}>Anular folio</button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700" onClick={() => { setMostrarOpciones(false); ingresarFolioInforme(aniosDisponibles, filtros.anio, () => cargarDatos(filtros.anio)); }}>Ingresar informe</button>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={() => setMostrarModalFolio(true)} className="h-12 bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                Folios faltantes
              </Button>
              <MISSINGFolioModal visible={mostrarModalFolio} onClose={() => setMostrarModalFolio(false)} beneficiarios={beneficiariosFiltrados}/>
            </div>
          )}
        </div>
      </motion.div>
      
      <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.6 }}>
        {(initialLoading || cargandoUsuario) ? (
            <div className="text-center text-gray-500 my-10 text-lg italic">Cargando beneficiarios...</div>
        ) : beneficiariosFiltrados.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-neutral-400 my-8 text-2xl"><strong>No se encontraron beneficiarios en {filtros.anio}.</strong></div>
        ) : (
            <TablaBeneficiarios data={beneficiariosPaginados} resumen={resumen} isLoading={false} permisos={permisos} />
        )}
      </motion.div>

      {!(initialLoading || cargandoUsuario) && beneficiariosFiltrados.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={itemVariants} transition={{ duration: 0.5, delay: 0.7 }}>
          <div className="flex justify-center mt-5 mb-2 text-sm gap-2 items-center">
            <span className="font-medium">Ver por:</span>
            <select value={beneficiariosPorPagina} onChange={e => setBeneficiariosPorPagina(parseInt(e.target.value))} className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded px-2 py-1">
              <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
            </select>
          </div>
          <div className="flex justify-center mt-4 gap-2 flex-wrap pb-10">
            <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} className="px-3 py-2 rounded border disabled:bg-gray-200 disabled:text-gray-500 bg-white dark:bg-neutral-800 dark:border-neutral-700">←</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(n => {
                const grupo = Math.floor((paginaActual - 1) / 45);
                return n > grupo * 45 && n <= (grupo + 1) * 45;
              })
              .map(numero => (
                <button key={numero} onClick={() => setPaginaActual(numero)} className={`px-4 py-2 rounded border ${paginaActual === numero ? 'bg-blue-600 text-white' : 'bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-300'}`}>
                  {numero}
                </button>
              ))}
            <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="px-3 py-2 rounded border disabled:bg-gray-200 disabled:text-gray-500 bg-white dark:bg-neutral-800 dark:border-neutral-700">→</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}