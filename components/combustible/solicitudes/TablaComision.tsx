// features/solicitudes/components/CommissionTable.tsx
import React, { useState } from 'react';
import Swal from 'sweetalert2'; // <--- 1. Importar SweetAlert2
import { DetalleComision } from '@/components/combustible/solicitudes/types';

interface Props {
  items: DetalleComision[];
  onChange: (items: DetalleComision[]) => void;
}

export const CommissionTable: React.FC<Props> = ({ items, onChange }) => {
  
  const [newItem, setNewItem] = useState<DetalleComision>({
    fecha_inicio: '',
    fecha_fin: '',
    lugar_visitar: '',
    kilometros_recorrer: 0
  });

  const isValid = newItem.fecha_inicio && newItem.fecha_fin && newItem.lugar_visitar && newItem.kilometros_recorrer > 0;

  const handleAddItem = () => {
    if (!isValid) return;
    onChange([...items, newItem]);
    setNewItem({
      fecha_inicio: '',
      fecha_fin: '',
      lugar_visitar: '',
      kilometros_recorrer: 0
    });
  };

  // --- 2. LÓGICA DE ELIMINAR CON SWEETALERT ---
  const removeItem = (index: number) => {
    // Detectamos el modo oscuro revisando la clase en el HTML
    const isDarkMode = document.documentElement.classList.contains('dark');

    Swal.fire({
      title: '¿Eliminar recorrido?',
      text: "Este registro se borrará de la lista.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6', // Rojo
      cancelButtonColor: '#ef4444', // Azul
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      // Estilos dinámicos para Dark Mode
      background: isDarkMode ? '#171717' : '#ffffff', 
      color: isDarkMode ? '#ffffff' : '#1f2937',
    }).then((result) => {
      if (result.isConfirmed) {
        // Si confirma, ejecutamos la eliminación
        onChange(items.filter((_, i) => i !== index));

        // Alerta de confirmación rápida (opcional)
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El recorrido ha sido quitado.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#171717' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#1f2937',
        });
      }
    });
  };

  const totalKms = items.reduce((acc, curr) => acc + (Number(curr.kilometros_recorrer) || 0), 0);

  // Formateador de fecha más compacto
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return (
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
          {date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })}
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-[10px]">
          {date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4">
      
      {/* ==============================================
          SECCIÓN 1: FORMULARIO COMPACTO
          ============================================== */}
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 shadow-sm">
        
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-700 pb-2">
          <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          Agregar Nuevo Recorrido
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LUGAR */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Lugar a Visitar
            </label>
            <input 
              type="text"
              placeholder="Escribe el destino..."
              className="w-full text-sm p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder-gray-400"
              value={newItem.lugar_visitar}
              onChange={e => setNewItem({...newItem, lugar_visitar: e.target.value})}
            />
          </div>

          {/* FECHA SALIDA */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Salida
            </label>
            <input 
              type="datetime-local"
              className="w-full text-sm p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-blue-600 cursor-pointer dark:[color-scheme:dark]"
              value={newItem.fecha_inicio}
              onChange={e => setNewItem({...newItem, fecha_inicio: e.target.value})}
            />
          </div>

          {/* FECHA RETORNO */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Retorno
            </label>
            <input 
              type="datetime-local"
              className="w-full text-sm p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:border-blue-600 cursor-pointer dark:[color-scheme:dark]"
              value={newItem.fecha_fin}
              onChange={e => setNewItem({...newItem, fecha_fin: e.target.value})}
            />
          </div>

          {/* KILOMETROS */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Kilómetros Estimado (Ida y Vuelta)
            </label>
            <div className="relative">
              <input 
                    type="text"            // Mantiene el diseño sin flechas
                    inputMode="numeric"    // Mantiene teclado numérico en móviles
                    pattern="[0-9]*"
                    className="w-full text-base font-bold p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-blue-700 dark:text-blue-400 focus:border-blue-600 pr-10"
                    
                    // Aquí cambiamos cómo se muestra el valor para que no se quede en 0 si el usuario lo borra
                    value={newItem.kilometros_recorrer === 0 ? '' : newItem.kilometros_recorrer}
                    placeholder="0" // Placeholder para cuando esté vacío
                    
                    onChange={(e) => {
                        const val = e.target.value;
                        // VALIDACIÓN: Solo permite dígitos (0-9). Si hay letras, no actualiza el estado.
                        if (/^\d*$/.test(val)) {
                            setNewItem({
                                ...newItem,
                                kilometros_recorrer: val === '' ? 0 : Number(val)
                            });
                        }
                    }}
                    onFocus={e => e.target.select()}
                />
              <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-bold">KM</span>
            </div>
          </div>
        </div>

        {/* BOTÓN AGREGAR */}
        <button
          type="button"
          onClick={handleAddItem}
          disabled={!isValid}
          className={`
            w-full mt-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transform transition-all active:scale-[0.98]
            flex items-center justify-center gap-2
            ${isValid 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-100 dark:bg-neutral-700 text-gray-400 cursor-not-allowed'}
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          AGREGAR RECORRIDO
        </button>
      </div>

      {/* ==============================================
          SECCIÓN 2: LISTADO
          ============================================== */}
      <div>
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <span className="bg-gray-700 text-white dark:bg-neutral-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Lista de Recorridos
            </h3>
            {items.length > 0 && (
                <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-blue-100 dark:border-blue-800">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </span>
            )}
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg p-6 text-center bg-gray-50 dark:bg-neutral-800/30">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Lista vacía</p>
            <p className="text-gray-400 text-xs">Usa el formulario de arriba.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm hover:border-blue-300 transition-colors"
              >
                {/* Cabecera Tarjeta Compacta */}
                <div className="p-3 flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-center flex-1">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded text-blue-600 dark:text-blue-300 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate leading-tight">
                                {item.lugar_visitar}
                            </h4>
                        </div>
                    </div>
                    
                    {/* BOTÓN ELIMINAR MODIFICADO */}
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar este recorrido"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>

                {/* Detalles Tarjeta (Grid más ajustado) */}
                <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 border-t border-gray-100 dark:border-neutral-700 flex items-center justify-between gap-2 text-xs">
                    
                    {/* Fechas */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            {formatDate(item.fecha_inicio)}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            {formatDate(item.fecha_fin)}
                        </div>
                    </div>

                    {/* Kilometraje Compacto */}
                    <div className="text-right pl-3 border-l border-gray-200 dark:border-neutral-700">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase">Distancia</span>
                        <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                            {item.kilometros_recorrer}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-1">km</span>
                    </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TOTALES STICKY --- */}
        {items.length > 0 && (
          <div className="mt-4 sticky bottom-2">
             <div className="bg-gray-800 dark:bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-lg flex justify-between items-center border border-gray-700/50 backdrop-blur-sm opacity-95">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Total Acumulado</span>
                </div>
                <div>
                    <span className="text-xl font-bold text-white">{totalKms}</span>
                    <span className="text-xs font-bold text-gray-400 ml-1">KM</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};