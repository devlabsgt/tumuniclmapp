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
  telefono: string;
  fecha_nacimiento: string;
  cantidad: string;
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
      <div>
        <label className="font-semibold block mb-1">Fecha de nacimiento</label>
        <input
          type="date"
          name="fecha_nacimiento"
          value={formulario.fecha_nacimiento}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <CampoTexto
        label="Folio"
        name="codigo"
        value={formulario.codigo}
        onChange={onChange}
      />
      <div>
      <label className="font-semibold block mb-1">Cantidad de sacos</label>
      <input
        type="number"
        name="cantidad"
        min="1"
        step="1"
        value={formulario.cantidad}
        onChange={onChange}
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      />
    </div>

      <CampoTexto
        label="Teléfono"
        name="telefono"
        value={formulario.telefono}
        onChange={onChange}
        type="tel"
        placeholder="Ingrese 8 dígitos"
      />
    </>
  );
}
