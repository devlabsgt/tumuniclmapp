'use client';

import React from 'react';

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

export function CampoTexto({ label, name, value, onChange, type = 'text', placeholder }: Props) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nuevoValor = e.target.value;

    if (name === 'dpi') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 13);
    } else if (name === 'telefono') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 8);
    } else if (name === 'codigo') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 4);
    }

    // Creamos un nuevo evento con el valor modificado
    const eventoModificado = {
      ...e,
      target: {
        ...e.target,
        value: nuevoValor,
        name: name,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(eventoModificado);
  };

  return (
    <div>
      <label className="font-semibold block mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
    </div>
  );
}
