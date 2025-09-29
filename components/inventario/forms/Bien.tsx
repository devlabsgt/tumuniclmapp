'use client';

import { useState } from 'react';
import Fields from './Fields';
import Actions from './Actions';
import useUserData from '@/hooks/sesion/useUserData';

type FormData = {
  id_categoria: string;
  descripcion: string;
  correlativo: number | '';
  monto: number | '';
};

const INITIAL_STATE: FormData = {
  id_categoria: '',
  descripcion: '',
  correlativo: '',
  monto: '',
};

const Bien = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userData = useUserData();
  const user_id = userData?.userId; // El cambio está aquí

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user_id) {
        setError('No se pudo obtener el ID del usuario.');
        setLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/inventario/alta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user_id,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error en la petición API.');
      }

      setFormData(INITIAL_STATE);
      alert('Bien dado de alta exitosamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'correlativo' || name === 'monto' ? Number(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Fields formData={formData} handleChange={handleChange} />
      <Actions loading={loading} error={error} />
    </form>
  );
};

export default Bien;