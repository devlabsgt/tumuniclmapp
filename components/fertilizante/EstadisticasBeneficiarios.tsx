'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/Progress';
import MTopLugares from './MTopLugares';
import MEdadRangos from './MEdadRangos';
import type { Beneficiario } from './types';

interface Props {
  data: Beneficiario[];
}

const calcularEdad = (fechaNacimiento: string): number => {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export default function EstadisticasBeneficiarios({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const totalMeta = 7000;
  
  // --- Cálculos (sin cambios) ---
  const dataFiltrada = data.filter((b) => b.estado !== 'Anulado');
  const totalCantidad = dataFiltrada.reduce((sum, b) => (b.cantidad ?? 0 > 0 ? sum + (b.cantidad ?? 0) : sum), 0);
  const hombres = dataFiltrada.filter((b) => b.sexo === 'M').length;
  const mujeres = dataFiltrada.filter((b) => b.sexo === 'F').length;
  const porcentaje = Math.min((totalCantidad / totalMeta) * 100, 100);
  const edades = dataFiltrada.filter((b) => b.fecha_nacimiento).map((b) => calcularEdad(b.fecha_nacimiento!));
  const jovenes = edades.filter((e) => e >= 18 && e <= 25).length;
  const adultoMenor = edades.filter((e) => e >= 26 && e <= 35).length;
  const adulto = edades.filter((e) => e >= 36 && e <= 59).length;
  const adultoMayor = edades.filter((e) => e >= 60).length;
  const conteoPorEdad = [{ rango: 'Jóvenes (18-25)', total: jovenes }, { rango: 'Adulto menor (26-35)', total: adultoMenor }, { rango: 'Adulto (36-59)', total: adulto }, { rango: 'Adulto mayor (60+)', total: adultoMayor }];
  const detallePorLugar: Record<string, any> = {};
  dataFiltrada.forEach((b) => {
    if (!b.lugar || !b.fecha_nacimiento) return;
    const edad = calcularEdad(b.fecha_nacimiento);
    const sexo = b.sexo;
    if (!detallePorLugar[b.lugar]) {
      detallePorLugar[b.lugar] = { jovenes: { total: 0, hombres: 0, mujeres: 0 }, adultoMenor: { total: 0, hombres: 0, mujeres: 0 }, adulto: { total: 0, hombres: 0, mujeres: 0 }, adultoMayor: { total: 0, hombres: 0, mujeres: 0 } };
    }
    const grupo = edad <= 25 ? 'jovenes' : edad <= 35 ? 'adultoMenor' : edad <= 59 ? 'adulto' : 'adultoMayor';
    detallePorLugar[b.lugar][grupo].total++;
    if (sexo === 'M') detallePorLugar[b.lugar][grupo].hombres++; else if (sexo === 'F') detallePorLugar[b.lugar][grupo].mujeres++;
  });
  const conteoPorLugar = dataFiltrada.reduce((acc: Record<string, number>, curr) => {
    const cantidad = curr.cantidad ?? 0;
    if (curr.lugar && cantidad > 0) acc[curr.lugar] = (acc[curr.lugar] || 0) + cantidad;
    return acc;
  }, {});
  const top3 = Object.entries(conteoPorLugar).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const [mostrarTopLugares, setMostrarTopLugares] = useState(false);
  const [mostrarEdadModal, setMostrarEdadModal] = useState(false);
  // --- Fin de Cálculos ---

  return (
    <>
      <motion.div layout className="mb-4 border rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Cabecera Clicable */}
        <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setIsOpen(prev => !prev)}>
          <div className="text-lg font-bold text-green-700">
            <div className="text-sm text-gray-900 mb-5">
              <span className="text-green-700 mx-1">Folios: {data.filter(b => b.estado === 'Entregado').length}</span>+
              <span className="text-orange-500 mx-1">Extraviados: {data.filter(b => b.estado === 'Extraviado').length}</span>+
              <span className="text-red-500 mx-1">Anulados: {data.filter(b => b.estado === 'Anulado').length}</span>= 
              <span className="text-gray-500 mx-1 underline">{data.length-data.filter(b => b.estado === 'Informe').length} en total</span>
              |<span className="text-blue-500 mx-2">Informes: {data.filter(b => b.estado === 'Informe').length}</span>

            </div>
            <span className="text-green-800">Sacos entregados: {totalCantidad}</span> / {totalMeta}
            <span className="text-black"> ({porcentaje.toFixed(2)}%)</span>
            <span className="text-blue-800"> (Restantes: {totalMeta - totalCantidad})</span>
          </div>
          <div className="mt-2">
            <Progress value={porcentaje} className="h-3" />
          </div>
        </div>

        {/* Contenido Desplegable */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t"
            >
              <div className="p-4 pt-2">
                <div className="text-gray-500 text-center text-sm mt-2">
                  Haz clic en las siguientes tarjetas para ver información detallada
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div onClick={() => setMostrarTopLugares(true)} className="w-full md:w-3/7 cursor-pointer bg-gray-50 rounded-sm shadow p-4 hover:bg-gray-100 transition">
                    <h3 className="text-blue-600 text-sm underline font-bold mb-3">🏆 Top 3 lugares</h3>
                    <div className="flex flex-col gap-2 text-gray-700 text-xs font-extrabold">
                      {top3.map(([lugar, cantidad], index) => (
                        <div key={lugar} className="flex items-center gap-2">
                          <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                          <span className="text-xs">{lugar}: {cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div onClick={() => setMostrarEdadModal(true)} className="w-full md:w-4/7 cursor-pointer bg-gray-50 rounded-sm shadow p-4 hover:bg-gray-100 transition">
                    <h3 className="text-blue-600 text-sm underline font-bold mb-3">👥 Género y Edades</h3>
                    <div className="flex flex-wrap items-center gap-x-6 font-semibold text-sm mb-2">
                      <span className="text-blue-700">Hombres: {hombres}</span> |
                      <span className="text-red-500">Mujeres: {mujeres}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                      <div className="text-gray-600 font-medium">Jóvenes (18–25): <span className="text-black">{jovenes}</span></div>
                      <div className="text-gray-600 font-medium">Adulto menor (26–35): <span className="text-black">{adultoMenor}</span></div>
                      <div className="text-gray-600 font-medium">Adulto (36–59): <span className="text-black">{adulto}</span></div>
                      <div className="text-gray-600 font-medium">Adulto mayor (60+): <span className="text-black">{adultoMayor}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Modales (se mantienen fuera del acordeón para un renderizado limpio) */}
      {mostrarTopLugares && <MTopLugares conteoPorLugar={conteoPorLugar} onClose={() => setMostrarTopLugares(false)} />}
      {mostrarEdadModal && <MEdadRangos conteoPorEdad={conteoPorEdad} detallePorLugar={detallePorLugar} onClose={() => setMostrarEdadModal(false)} />}
    </>
  );
}