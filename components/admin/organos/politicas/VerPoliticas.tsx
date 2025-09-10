'use client';

import { useEffect, useState, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { ToastContainer, toast } from 'react-toastify'; // ¡CAMBIO AQUÍ! Importar de 'react-toastify'

// Importe TablaPoliticas y CrearPoliticaForm una vez que los haya creado
// import TablaPoliticas from './TablaPoliticas';
// import CrearPoliticaForm from './CrearPoliticaForm';

type Politica = { 
  id: number; 
  nombre: string; 
  descripcion: string | null;
  codigo: string | null;
  "No": number | null; 
};

export default function VerPoliticas() {
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [mostrarCrearPolitica, setMostrarCrearPolitica] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase.from('politicas')
      .select('id, nombre, descripcion, codigo, "No"') // Asegúrese de seleccionar todos los campos
      .order('No', { ascending: true }); // Ordenar por 'No'

    if (error) {
      console.error('Error al cargar políticas:', error);
      toast.error('Error al cargar políticas.'); // Toast para error
    } else {
      setPoliticas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Cargando políticas...</div>;
  }

  return (
    <>
      {/* ¡CAMBIO AQUÍ! Usar ToastContainer de react-toastify */}
      <ToastContainer /> 
      
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Políticas</h1>
          <Button onClick={() => setMostrarCrearPolitica(true)}>Crear Nueva Política</Button>
        </div>

        {/* Aquí irá su componente TablaPoliticas cuando lo cree */}
        {/* <TablaPoliticas politicas={politicas} onDataChange={fetchData} /> */}
        <p className="text-center text-gray-500 mt-8">Tabla de políticas irá aquí.</p>

        {/* Modal Crear Política */}
        <Transition show={mostrarCrearPolitica} as={Fragment}>
          <Dialog onClose={() => setMostrarCrearPolitica(false)} className="relative z-50">
            <DialogPanel className="fixed inset-0 flex items-center justify-center p-4 bg-black/30">
              <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">Crear Nueva Política</DialogTitle>
                {/* Aquí irá su componente CrearPoliticaForm cuando lo cree */}
                {/* <CrearPoliticaForm onClose={() => setMostrarCrearPolitica(false)} onPoliticaCreada={fetchData} /> */}
                <p>Formulario de creación de política irá aquí.</p>
              </div>
            </DialogPanel>
          </Dialog>
        </Transition>
      </div>
    </>
  );
}