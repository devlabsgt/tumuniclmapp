'use client';

import React, { Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EstadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  type: 'estado' | 'votacion';
  currentValue: string;
}

const estadoOpciones = ['No iniciado', 'Aprobado', 'No aprobado', 'En progreso', 'En comisión', 'En espera', 'Realizado'];
const votacionOpciones = ['P1', 'Unanimidad', 'Ver Notas', 'Realizado', 'No Emitido'];

const statusStyles: Record<string, string> = {
  'Aprobado': 'bg-green-100 text-green-800 hover:bg-green-200',
  'No aprobado': 'bg-red-100 text-red-800 hover:bg-red-200',
  'En progreso': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'En comisión': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'En espera': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'No iniciado': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'Realizado': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
};

const votacionStyles: Record<string, string> = {
  'P1': 'bg-red-100 text-red-800 hover:bg-red-200',
  'Unanimidad': 'bg-green-100 text-green-800 hover:bg-green-200',
  'Ver Notas': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'Realizado': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  'No Emitido': 'bg-white text-gray-800 hover:bg-gray-100',
};

const getStatusClasses = (status: string) => statusStyles[status] || 'bg-gray-200 text-gray-700 hover:bg-gray-300';
const getVotacionClasses = (votacion: string) => votacionStyles[votacion] || 'bg-gray-200 text-gray-700 hover:bg-gray-300';

export default function Estado({ isOpen, onClose, onSelect, type, currentValue }: EstadoProps) {
  const isEstado = type === 'estado';
  const title = isEstado ? 'Seleccionar Estado' : 'Seleccionar Votación';
  const options = isEstado ? estadoOpciones : votacionOpciones;
  const getClasses = isEstado ? getStatusClasses : getVotacionClasses;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <DialogPanel className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <Button variant="link" onClick={onClose}>
                  Salir
                </Button>
              </div>
              <div className={`grid ${isEstado ? 'grid-cols-2' : 'grid-cols-1'} gap-2 flex-grow`}>
                {options.map(option => (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => onSelect(option)}
                    className={`w-full px-3 py-2 rounded-md shadow-sm text-center ${getClasses(option)} ${currentValue === option ? 'border-t-4 border-blue-500' : ''}`}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="font-semibold">{option}</span>
                  </motion.button>
                ))}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}