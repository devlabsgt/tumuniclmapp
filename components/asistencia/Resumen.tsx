import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { esRegistroAnomalo } from './Asistencia';

interface Registro {
  created_at: string;
  tipo_registro: string | null;
  ubicacion: { lat: number; lng: number } | null;
}

interface ResumenProps {
  registros: Registro[];
  fechaDeReferencia: Date;
}

const Resumen: React.FC<ResumenProps> = ({ registros, fechaDeReferencia }) => {
  const inicioSemana = startOfWeek(fechaDeReferencia, { locale: es, weekStartsOn: 1 });
  const finSemana = endOfWeek(fechaDeReferencia, { locale: es, weekStartsOn: 1 });
  const inicioMes = startOfMonth(fechaDeReferencia);
  const finMes = endOfMonth(fechaDeReferencia);

  const llegadasTardiasSemana = registros.filter(r => isWithinInterval(new Date(r.created_at), { start: inicioSemana, end: finSemana })).filter(r => esRegistroAnomalo(r) && r.tipo_registro === 'Entrada').length;
  const salidasTempranasSemana = registros.filter(r => isWithinInterval(new Date(r.created_at), { start: inicioSemana, end: finSemana })).filter(r => esRegistroAnomalo(r) && r.tipo_registro === 'Salida').length;

  const llegadasTardiasMes = registros.filter(r => isWithinInterval(new Date(r.created_at), { start: inicioMes, end: finMes })).filter(r => esRegistroAnomalo(r) && r.tipo_registro === 'Entrada').length;
  const salidasTempranasMes = registros.filter(r => isWithinInterval(new Date(r.created_at), { start: inicioMes, end: finMes })).filter(r => esRegistroAnomalo(r) && r.tipo_registro === 'Salida').length;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="bg-white border rounded-xl p-6 flex flex-col gap-6"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-800">Resumen de la semana</h2>
        <p className="text-sm text-gray-600 mb-4">
          {format(inicioSemana, 'd \'de\' MMM', { locale: es })} - {format(finSemana, 'd \'de\' MMM yyyy', { locale: es })}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Llegadas Tardías:</span>
            <span className="font-bold text-lg">{llegadasTardiasSemana}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Salidas Antes de tiempo:</span>
            <span className="font-bold text-lg">{salidasTempranasSemana}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold text-gray-800">Resumen del mes</h2>
        <p className="text-sm text-gray-600 mb-4">
          {format(inicioMes, 'LLLL yyyy', { locale: es })}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Llegadas Tardías:</span>
            <span className="font-bold text-lg">{llegadasTardiasMes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Salidas Tempranas:</span>
            <span className="font-bold text-lg">{salidasTempranasMes}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Resumen;