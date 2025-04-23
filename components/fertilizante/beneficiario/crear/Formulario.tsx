'use client';

import { CampoTexto } from './CampoTexto';
import { CampoLugar } from './CampoLugar';

interface Props {
  formulario: {
    nombre_completo: string;
    dpi: string;
    lugar: string;
    fecha: string;
    codigo: string;
    // img: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function Formulario({ formulario, onChange }: Props) {
  return (
    <>
      <CampoTexto
        label="Nombre completo"
        name="nombre_completo"
        value={formulario.nombre_completo}
        onChange={onChange}
      />
      <CampoTexto
        label="DPI"
        name="dpi"
        value={formulario.dpi}
        onChange={onChange}
      />
      <CampoLugar value={formulario.lugar} onChange={onChange} />
      <div>
        <label className="font-semibold block mb-1">Fecha</label>
        <input
          type="date"
          name="fecha"
          value={formulario.fecha}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>
      <CampoTexto
        label="Código"
        name="codigo"
        value={formulario.codigo}
        onChange={onChange}
      />
      {/*
      <CampoTexto
        label="Imagen (URL)"
        name="img"
        value={formulario.img}
        onChange={onChange}
      />
      */}
    </>
  );
}
