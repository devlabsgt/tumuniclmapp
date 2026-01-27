import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; 
import { UsuarioInfo, Vehiculo, DetalleComision, SolicitudCombustible } from '../types';
import { getCurrentUserInfo, saveSolicitud, updateSolicitud } from '../actions';
import { CommissionTable } from '@/components/combustible/solicitudes/TablaComision';

// Componentes extraídos
import { DataSolicitante } from './DataSolicitante';
import { VehiculoData } from './VehiculoData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Propiedad opcional: Si viene null es "Crear", si trae datos es "Editar"
  solicitudToEdit?: SolicitudCombustible | null; 
}

export const CreateRequestModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  solicitudToEdit = null 
}) => {
  const [user, setUser] = useState<UsuarioInfo | null>(null);
  const [loading, setLoading] = useState(false);
    
  // Estado Vehículo
  const [vehiculo, setVehiculo] = useState<Vehiculo>({ 
    placa: '', modelo: '', tipo_vehiculo: '', tipo_combustible: '' 
  });
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [kmInicial, setKmInicial] = useState<number | ''>('');
    
  // Estado General
  const [destino, setDestino] = useState({ depto: 'Chiquimula', muni: 'Concepción Las Minas' });
  const [justificacion, setJustificacion] = useState('');
  const [comisiones, setComisiones] = useState<DetalleComision[]>([]);

  // 1. Cargar información del usuario actual (siempre necesario)
  useEffect(() => {
    const loadUser = async () => {
      const data = await getCurrentUserInfo();
      setUser(data);
    };
    if (isOpen) loadUser();
  }, [isOpen]);

  // 2. EFECTO: Detectar si es EDICIÓN o CREACIÓN al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (solicitudToEdit) {
        // --- MODO EDICIÓN: Poblamos los campos ---
        
        // Mapear Vehículo (asegurando que los campos existan)
        if (solicitudToEdit.vehiculo) {
            setVehiculo({
                placa: solicitudToEdit.vehiculo.placa,
                modelo: solicitudToEdit.vehiculo.modelo,
                tipo_vehiculo: solicitudToEdit.vehiculo.tipo_vehiculo,
                tipo_combustible: solicitudToEdit.vehiculo.tipo_combustible
            });
        }
        
        // Al editar, asumimos que el vehículo ya existe (no es nuevo)
        setIsNewVehicle(false);

        // Mapear Datos Generales
        setKmInicial(solicitudToEdit.kilometraje_inicial);
        setDestino({
            depto: solicitudToEdit.departamento_destino,
            muni: solicitudToEdit.municipio_destino
        });
        setJustificacion(solicitudToEdit.justificacion);
        
        // Mapear Tabla de Comisión
        setComisiones(solicitudToEdit.detalles || []);

      } else {
        // --- MODO CREACIÓN: Limpiamos el formulario ---
        resetForm();
      }
    }
  }, [isOpen, solicitudToEdit]);

  // Función auxiliar para resetear
  const resetForm = () => {
    setVehiculo({ placa: '', modelo: '', tipo_vehiculo: '', tipo_combustible: '' });
    setIsNewVehicle(false);
    setKmInicial('');
    setDestino({ depto: 'Chiquimula', muni: 'Concepción Las Minas' }); 
    setJustificacion('');
    setComisiones([]);
  };

  // --- FUNCIÓN DE GUARDAR ---
  const handleSubmit = async () => {
    if (loading) return; // Evita doble clic
    
    // Validación básica de usuario
    if (!user?.user_id) {
        toast.error("Error: No se ha cargado la información del usuario.");
        return;
    }

    setLoading(true); // Bloquea UI
    
    try {
        const payload = {
            usuario_id: user.user_id,
            vehiculo,
            es_nuevo_vehiculo: isNewVehicle, // Solo relevante al crear
            municipio_destino: destino.muni,
            departamento_destino: destino.depto,
            kilometraje_inicial: Number(kmInicial),
            justificacion,
            detalles: comisiones
        };

        if (solicitudToEdit?.id) {
            // --- MODO EDICIÓN (AZUL) ---
            await updateSolicitud(solicitudToEdit.id, payload);
            // Usamos .info para que salga azul
            toast.info('Solicitud actualizada correctamente'); 
        } else {
            // --- MODO CREACIÓN (VERDE) ---
            await saveSolicitud(payload);
            // Usamos .success para que salga verde
            toast.success('Solicitud creada correctamente'); 
        }

        onSuccess();
        onClose();
    } catch (error: any) {
        console.error(error);
        // Usamos .error para que salga rojo
        toast.error(error.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
        setLoading(false); // Desbloquea UI
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-neutral-800">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {solicitudToEdit ? 'Editar Solicitud' : 'Nueva Solicitud'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        {solicitudToEdit 
                            ? `Modificando solicitud #${solicitudToEdit.id}` 
                            : 'Complete los datos para registrar una nueva comisión.'}
                    </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* BODY SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* COLUMNA IZQUIERDA: DATOS PRINCIPALES */}
                    <DataSolicitante 
                        user={user}
                        destino={destino}
                        setDestino={setDestino}
                    />

                    {/* COLUMNA DERECHA: VEHÍCULO */}
                    <VehiculoData 
                        vehiculo={vehiculo}
                        setVehiculo={setVehiculo}
                        isNewVehicle={isNewVehicle}
                        setIsNewVehicle={setIsNewVehicle}
                        kmInicial={kmInicial}
                        setKmInicial={setKmInicial}
                    />

                    {/* FILA COMPLETA: TABLA COMISIÓN */}
                    <div className="lg:col-span-12">
                        <div className="bg-gray-50 dark:bg-neutral-800/40 rounded-lg p-5 border border-gray-100 dark:border-neutral-700/50">
                            <h3 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                Detalle de la Comisión
                            </h3>
                            
                            <CommissionTable 
                                items={comisiones}
                                onChange={setComisiones}
                            />
                        </div>
                    </div>

                    {/* JUSTIFICACIÓN */}
                    <div className="lg:col-span-12">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Justificación de la Comisión
                        </label>
                        <textarea
                            value={justificacion}
                            onChange={(e) => setJustificacion(e.target.value)}
                            rows={3}
                            placeholder="Describa brevemente el motivo del viaje..."
                            className="w-full bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
                        ></textarea>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-gray-50 dark:bg-neutral-900/50 flex justify-end gap-3 border-t border-gray-100 dark:border-neutral-800 rounded-b-xl">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors focus:ring-2 focus:ring-gray-200"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/10 transition-all flex items-center gap-2"
                >
                    {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {solicitudToEdit ? 'Actualizar Solicitud' : 'Guardar Solicitud'}
                </button>
            </div>
        </div>
    </div>
  );
};