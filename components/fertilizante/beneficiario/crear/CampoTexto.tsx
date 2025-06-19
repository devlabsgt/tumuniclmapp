'use client';

import React from 'react';

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean; // ✅ ahora soporta campo deshabilitado
}

export function CampoTexto({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
}: Props) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nuevoValor = e.target.value;

    if (name === 'dpi') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 13);
    } else if (name === 'telefono') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 8);
    } else if (name === 'codigo') {
      nuevoValor = nuevoValor.replace(/\D/g, '').slice(0, 4);
    }

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
        disabled={disabled}
        className={`w-full border rounded px-3 py-2 ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'
        }`}
      />
    </div>
  );
}
