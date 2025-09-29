import React from 'react';

type FormFieldsProps = {
  formData: {
    id_categoria: string;
    descripcion: string;
    correlativo: number | '';
    monto: number | '';
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Fields = ({ formData, handleChange }: FormFieldsProps) => {
  return (
    <div>
      <label htmlFor="id_categoria">ID de Categoría:</label>
      <input type="text" id="id_categoria" name="id_categoria" value={formData.id_categoria} onChange={handleChange} required />
      
      <label htmlFor="correlativo">Correlativo:</label>
      <input type="number" id="correlativo" name="correlativo" value={formData.correlativo} onChange={handleChange} required />

      <label htmlFor="descripcion">Descripción:</label>
      <input type="text" id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} required />

      <label htmlFor="monto">Monto:</label>
      <input type="number" id="monto" name="monto" value={formData.monto} onChange={handleChange} required />
    </div>
  );
};

export default Fields;