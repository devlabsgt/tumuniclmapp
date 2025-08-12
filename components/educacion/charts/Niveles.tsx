'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  LabelList, CartesianGrid, Legend
} from 'recharts';
import type { Alumno, Programa } from '../lib/esquemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Phone, Shield, Search } from 'lucide-react';
import MensajeAnimado from '../../ui/Typeanimation'; 

interface Props {
  niveles: Programa[];
  alumnos: Alumno[];
}

const COLORS = {
  'Hombres': '#3b82f6',
  'Mujeres': '#ec4899'
};

export default function EstadisticasNiveles({ niveles, alumnos }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState<Programa | null>(null);
  const [filtroGrafica, setFiltroGrafica] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    setNivelSeleccionado(null);
  }, [niveles]);

  if (nivelSeleccionado) {
    const alumnosDelNivel = alumnos
      .filter(a => a.programa_id === nivelSeleccionado.id)
      .sort((a, b) => {
        const getFirstLetters = (name: string) => name.split(' ').map(word => word.charAt(0)).join('');
        const firstLettersA = getFirstLetters(a.nombre_completo);
        const firstLettersB = getFirstLetters(b.nombre_completo);
        
        return firstLettersA.localeCompare(firstLettersB);
      });

    const hombres = alumnosDelNivel.filter(a => a.sexo === 'M').length;
    const mujeres = alumnosDelNivel.filter(a => a.sexo === 'F').length;

    const pieData = [
      { name: 'Hombres', value: hombres },
      { name: 'Mujeres', value: mujeres },
    ].filter(item => item.value > 0);

    const legendFormatter = (value: string, entry: any) => {
        const { payload } = entry;
        return <span className="text-gray-700">{value} ({payload.value})</span>;
    };

    return (
      <div className="bg-white p-4 rounded-lg">
        <Button variant="ghost" size="sm" onClick={() => setNivelSeleccionado(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a estadísticas generales
        </Button>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Nivel: {nivelSeleccionado.nombre}</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-slate-50 p-4 rounded-lg flex flex-col">
            <h4 className="text-md font-semibold text-gray-800 mb-4 text-center">Distribución por Género</h4>
            <div className="h-64 w-full overflow-x-auto">
              {pieData.length > 0 && isClient ? (
                <div className="min-w-[400px] h-full">
                  <PieChart width={400} height={256}>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Legend iconType="circle" formatter={legendFormatter} />
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14}>{`${(percent * 100).toFixed(0)}%`}</text>;
                      }}>
                      {pieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                    </Pie>
                  </PieChart>
                </div>
              ) : <div className="flex items-center justify-center h-full text-sm text-gray-500">No hay datos de género.</div>}
            </div>
            <p className="text-center text-gray-600 font-semibold mt-4">
              Total: {alumnosDelNivel.length} alumnos
            </p>
          </div>
          <div className="lg:col-span-3">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Listado de Alumnos ({alumnosDelNivel.length})</h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {alumnosDelNivel.map(alumno => (
                <div key={alumno.id} className="border rounded-lg p-3">
                  <h5 className="font-semibold text-gray-900">{alumno.nombre_completo}</h5>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {alumno.telefono_alumno ? (
                            <a href={`https://wa.me/502${alumno.telefono_alumno}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {alumno.telefono_alumno}
                            </a>
                        ) : (
                            <span>Sin teléfono</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span><span className="font-medium">Encargado:</span> {alumno.nombre_encargado || 'No asignado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Tel. Encargado:</span>
                        {alumno.telefono_encargado ? (
                             <a href={`https://wa.me/502${alumno.telefono_encargado}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {alumno.telefono_encargado}
                            </a>
                        ) : (
                            <span>No asignado</span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const barData = niveles
    .filter(nivel => nivel.nombre.toLowerCase().includes(filtroGrafica.toLowerCase()))
    .map(nivel => ({
        ...nivel,
        alumnos: alumnos.filter(a => a.programa_id === nivel.id).length
  }));

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const nivelId = data.activePayload[0].payload.id;
      const nivelEncontrado = niveles.find(n => n.id === nivelId);
      setNivelSeleccionado(nivelEncontrado || null);
    }
  };

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
        <div style={{ width: `${Math.max(600, barData.length * 80)}px`, height: '350px' }}>
          {barData.length > 0 ? (
            isClient && (
              <BarChart width={Math.max(600, barData.length * 80)} height={350} data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }} onClick={handleBarClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" height={40} interval={0} tick={{ fontSize: 11 }} />                 
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.8)' }} />
                <Bar dataKey="alumnos" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" barSize={60}>
                  <LabelList dataKey="alumnos" position="top" style={{ fill: '#4a5568', fontSize: 12 }} />
                </Bar>
              </BarChart>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No se encontraron niveles con ese nombre.</div>
          )}
        </div>
      </div>
    </div>
  );
}