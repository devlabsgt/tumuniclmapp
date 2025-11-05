'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { guardarHorario } from './actions';
import type { Horario } from './actions';

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 0, nombre: 'Domingo' },
];

interface FormularioHorarioProps {
  horarioAEditar: Horario | null;
  onGuardar: () => void;
  onCancelar: () => void;
}

export default function FormularioHorario({ horarioAEditar, onGuardar, onCancelar }: FormularioHorarioProps) {
  const [nombre, setNombre] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (horarioAEditar) {
      setNombre(horarioAEditar.nombre || '');
      setSelectedDays(horarioAEditar.dias || []);
      setEntrada(horarioAEditar.entrada?.substring(0, 5) || '');
      setSalida(horarioAEditar.salida?.substring(0, 5) || '');
    } else {
      setNombre('');
      setSelectedDays([1, 2, 3, 4, 5]);
      setEntrada('08:00');
      setSalida('16:00');
    }
  }, [horarioAEditar]);

  const handleDayClick = (day: number) => {
    setSelectedDays(prevDays =>
      prevDays.includes(day) ? prevDays.filter(d => d !== day) : [...prevDays, day]
    );
  };

  const handleGuardar = async () => {
    if (!nombre || selectedDays.length === 0 || !entrada || !salida) {
      toast.error('Por favor, complete todos los campos.');
      return;
    }
    
    setIsSubmitting(true);
    const horarioData = { 
      nombre, 
      dias: selectedDays, 
      entrada, 
      salida 
    };

    const success = await guardarHorario(horarioAEditar, horarioData);
    
    if (success) {
      onGuardar();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        {horarioAEditar ? 'Editar Horario' : 'Crear Nuevo Horario'}
      </h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2" htmlFor="nombre">
          Nombre del Horario
        </label>
        <Input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Normal, Medio Turno, Sistema"
        />
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          type="button" 
          onClick={() => setSelectedDays([1, 2, 3, 4, 5])} 
          className="w-1/2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Semana Laboral
        </button>
        <button 
          type="button" 
          onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])} 
          className="w-1/2 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Toda la Semana
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-bold mb-3">
          Seleccionar Días
        </label>
        <div className="grid grid-cols-7 gap-2 text-center">
          {DIAS_SEMANA.map(dia => {
            const isSelected = selectedDays.includes(dia.numero);
            return (
              <div
                key={dia.numero}
                onClick={() => handleDayClick(dia.numero)}
                className={`
                  p-3 rounded-lg cursor-pointer border relative
                  transition-all duration-300 ease-in-out
                  transform hover:scale-105
                  ${isSelected 
                    ? 'bg-blue-500 text-white border-blue-400 border-2 shadow-lg scale-105' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <span className="font-semibold text-sm">{dia.nombre.substring(0, 3)}</span>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-bold mb-2" htmlFor="entrada">
            Entrada
          </label>
          <input
            type="time"
            id="entrada"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-2" htmlFor="salida">
            Salida
          </label>
          <input
            type="time"
            id="salida"
            value={salida}
            onChange={(e) => setSalida(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-6">
        <Button
          variant="ghost"
          onClick={onCancelar}
          className="text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          disabled={isSubmitting}
          className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}