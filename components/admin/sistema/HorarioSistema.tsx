'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
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
  { numero: 7, nombre: 'Domingo' },
];

const HorarioSistema: React.FC<HorarioSistemaProps> = ({ onClose }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const [loading, setLoading] = useState(true);

  // Efecto para deshabilitar el scroll del fondo cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Efecto para cargar los datos iniciales
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

  const handleCheckboxChange = (day: number) => {
    setSelectedDays(prevDays =>
      prevDays.includes(day) ? prevDays.filter(d => d !== day) : [...prevDays, day]
    );
  };

  const handleGuardar = async () => {
    if (selectedDays.length === 0 || !entrada || !salida) {
      toast.error('Por favor, complete todos los campos.');
      return;
    }

    const horarioData = {
      dias: selectedDays,
      entrada,
      salida,
    };

    try {
      const response = await fetch('/api/config/horario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <p>Cargando horario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <ToastContainer />
        <h2 className="text-xl font-bold mb-4">Configurar Horario del Sistema</h2>
        <div className="flex gap-2 mb-4">
          <button 
            type="button" 
            onClick={() => setSelectedDays([1, 2, 3, 4, 5])} 
            className="w-1/2 px-3 py-2 border rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Semana Laboral
          </button>
          <button 
            type="button" 
            onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])} 
            className="w-1/2 px-3 py-2 border rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Toda la Semana
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Seleccionar Días
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DIAS_SEMANA.map(dia => (
              <div key={dia.numero} className="flex items-center">
                <input
                  type="checkbox"
                  id={`dia-${dia.numero}`}
                  checked={selectedDays.includes(dia.numero)}
                  onChange={() => handleCheckboxChange(dia.numero)}
                  className="mr-2 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={`dia-${dia.numero}`} className="text-gray-900">{dia.nombre}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="entrada">
            Hora de Entrada
          </label>
          <input
            type="time"
            id="entrada"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="salida">
            Hora de Salida
          </label>
          <input
            type="time"
            id="salida"
            value={salida}
            onChange={(e) => setSalida(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Salir
          </button>
          <button
            onClick={handleGuardar}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HorarioSistema;