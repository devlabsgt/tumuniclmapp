'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip,
  LabelList, CartesianGrid, ResponsiveContainer
} from 'recharts';
import type { Alumno, Programa } from '../lib/esquemas';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import MensajeAnimado from '../../ui/Typeanimation';

interface Props {
  niveles: Programa[];
  alumnos: Alumno[];
  onBarClick: (data: any) => void;
}

export default function EstadisticasNiveles({ niveles, alumnos, onBarClick }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [filtroGrafica, setFiltroGrafica] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const barData = useMemo(() => {
    const data = niveles.map(nivel => ({
      ...nivel,
      alumnos_count: alumnos.filter(a => a.programa_id === nivel.id).length
    }));
    const filteredData = data.filter(nivel => nivel.nombre.toLowerCase().includes(filtroGrafica.toLowerCase()));
    
    return filteredData;
  }, [niveles, alumnos, filtroGrafica]);
  
  return (
    <div className="h-auto w-full rounded-lg bg-white p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-5">Alumnos por Nivel</h3>
      <div className="mb-6 text-xl text-blue-600 font-semibold">
        <MensajeAnimado
          textos={[
            'Haga clic en una barra para ver los detalles del nivel.',
          ]}
        />
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
            placeholder="Buscar nivel en la gráfica..."
            value={filtroGrafica}
            onChange={(e) => setFiltroGrafica(e.target.value)}
            className="pl-9"
        />
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(600, barData.length * 80)}px`, height: '350px' }}>
          {barData.length > 0 ? (
            isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }} onClick={onBarClick}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" height={40} interval={0} tick={{ fontSize: 11 }} />                 
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.8)' }} />
                  <Bar dataKey="alumnos_count" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" barSize={60}>
                    <LabelList dataKey="alumnos_count" position="top" style={{ fill: '#4a5568', fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No se encontraron niveles con ese nombre.</div>
          )}
        </div>
      </div>
    </div>
  );
}