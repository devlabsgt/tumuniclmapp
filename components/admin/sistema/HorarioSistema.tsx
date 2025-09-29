'use client';

import React, { useState, useEffect } from 'react';import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type HorarioSistemaProps = {
  onClose: () => void;
};

const DIAS_SEMANA = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miércoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sábado' },
  { numero: 0, nombre: 'Domingo' },
];

const HorarioSistema: React.FC<HorarioSistemaProps> = ({ onClose }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const cargarHorario = async () => {
      try {
        const response = await fetch('/api/config/horario?nombre=Sistema');
        const { data } = await response.json();
        
        if (response.ok && data && data.length > 0) {
          const horario = data[0];
          setEntrada(horario.entrada.substring(0, 5));
          setSalida(horario.salida.substring(0, 5));
          setSelectedDays(horario.dias || []);
        } else {
          toast.error('No se pudo cargar el horario.');
        }
      } catch (err) {
        toast.error('Error de red al cargar el horario.');
      } finally {
        setLoading(false);
      }
    };
    cargarHorario();
  }, []);

  const handleDayClick = (day: number) => {
    setSelectedDays(prevDays =>
      prevDays.includes(day) ? prevDays.filter(d => d !== day) : [...prevDays, day]
    );
  };

  const handleGuardar = async () => {
    if (selectedDays.length === 0 || !entrada || !salida) {
      toast.error('Por favor, complete todos los campos.');
      return;
    }
    const horarioData = { dias: selectedDays, entrada, salida };
    try {
      const response = await fetch('/api/config/horario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horarioData),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Error al guardar el horario.');
      }
    } catch (err) {
      toast.error('Error de red. Inténtelo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p>Cargando horario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
        <ToastContainer />
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Configurar Horario del Sistema</h2>
        
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
          <div className="flex flex-col gap-3">
            {/* Fila 1: Lunes a Viernes */}
            <div className="grid grid-cols-5 gap-3 text-center">
              {DIAS_SEMANA.slice(0, 5).map(dia => {
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
                        ? 'bg-white text-blue-500 border-blue-400 border-2 shadow-lg scale-105' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="font-semibold text-sm">{dia.nombre.substring(0, 3)}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Fila 2: Sábado y Domingo (Centrados) */}
            <div className="flex justify-center gap-3 text-center">
              {DIAS_SEMANA.slice(5, 7).map(dia => {
                const isSelected = selectedDays.includes(dia.numero);
                return (
                  <div
                    key={dia.numero}
                    onClick={() => handleDayClick(dia.numero)}
                    className={`
                      w-16 p-3 rounded-lg cursor-pointer border relative
                      transition-all duration-300 ease-in-out
                      transform hover:scale-105
                      ${isSelected 
                        ? 'bg-white text-blue-500 border-blue-400 border-2 shadow-lg scale-105' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="font-semibold text-sm">{dia.nombre.substring(0, 3)}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
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
        
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-600 hover:underline font-semibold transition-colors"
          >
            Salir
          </button>
          <button
            onClick={handleGuardar}
            className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HorarioSistema;