import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; 
import { UsuarioInfo, Vehiculo, DetalleComision, SolicitudCombustible } from '../types';
import { getCurrentUserInfo, saveSolicitud, updateSolicitud } from '../actions';
import { CommissionTable } from '@/components/combustible/solicitudes/TablaComision';
import { DataSolicitante } from './DataSolicitante';
import { VehiculoData } from './VehiculoData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
    
  // --- ESTADO DE FORMULARIO ---
  const [vehiculo, setVehiculo] = useState<Vehiculo>({ 
    placa: '', modelo: '', tipo_vehiculo: '', tipo_combustible: '' 
  });
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [kmInicial, setKmInicial] = useState<number | ''>('');
  const [destino, setDestino] = useState({ depto: 'Chiquimula', muni: 'Concepción Las Minas' });
  const [justificacion, setJustificacion] = useState('');
  const [comisiones, setComisiones] = useState<DetalleComision[]>([]);

  // Bloqueo de scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const loadUser = async () => {
      const data = await getCurrentUserInfo();
      setUser(data);
    };
    if (isOpen) loadUser();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (solicitudToEdit) {
        if (solicitudToEdit.vehiculo) {
            setVehiculo({
                placa: solicitudToEdit.vehiculo.placa,
                modelo: solicitudToEdit.vehiculo.modelo,
                tipo_vehiculo: solicitudToEdit.vehiculo.tipo_vehiculo,
                tipo_combustible: solicitudToEdit.vehiculo.tipo_combustible
            });
        }
        setIsNewVehicle(false);
        setKmInicial(solicitudToEdit.kilometraje_inicial);
        setDestino({ depto: solicitudToEdit.departamento_destino, muni: solicitudToEdit.municipio_destino });
        setJustificacion(solicitudToEdit.justificacion);
        setComisiones(solicitudToEdit.detalles || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, solicitudToEdit]);

  const resetForm = () => {
    setVehiculo({ placa: '', modelo: '', tipo_vehiculo: '', tipo_combustible: '' });
    setIsNewVehicle(false);
    setKmInicial('');
    setDestino({ depto: 'Chiquimula', muni: 'Concepción Las Minas' }); 
    setJustificacion('');
    setComisiones([]);
    setCurrentStep(1);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (loading || !user?.user_id) return;

    // --- NUEVA VALIDACIÓN: Verificar itinerario ---
    if (comisiones.length === 0) {
        toast.warning('Debe registrar al menos un recorrido en el itinerario.');
        return;
    }
    // ----------------------------------------------

    setLoading(true);
    
    try {
        const payload = {
            usuario_id: user.user_id,
            vehiculo,
            es_nuevo_vehiculo: isNewVehicle,
            municipio_destino: destino.muni,
            departamento_destino: destino.depto,
            kilometraje_inicial: Number(kmInicial),
            justificacion,
            detalles: comisiones
        };

        if (solicitudToEdit?.id) {
            await updateSolicitud(solicitudToEdit.id, payload);
            toast.info('Solicitud actualizada correctamente'); 
        } else {
            await saveSolicitud(payload);
            toast.success('Solicitud creada correctamente'); 
        }
        onSuccess();
        onClose();
    } catch (error: any) {
        toast.error(error.message || 'Error al procesar la solicitud.');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl flex flex-col sm:rounded-3xl shadow-2xl border-0 sm:border border-gray-100 dark:border-neutral-800 overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="pr-8">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            {solicitudToEdit ? 'Editar Solicitud' : 'Nueva Solicitud'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Paso {currentStep} de {totalSteps} — {currentStep === 1 ? 'Identificación' : currentStep === 2 ? 'Vehículo' : 'Recorrido'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 sm:static p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-all text-gray-400 active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 sm:gap-3 justify-center">
                    {[1, 2, 3].map((step) => (
                        <div 
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                currentStep === step 
                                ? 'w-10 sm:w-12 bg-blue-600 shadow-lg shadow-blue-500/20' 
                                : currentStep > step ? 'w-5 sm:w-6 bg-emerald-500' : 'w-5 sm:w-6 bg-gray-200 dark:bg-neutral-800'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* --- BODY SCROLLABLE --- */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 custom-scrollbar pb-24 sm:pb-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <DataSolicitante user={user} destino={destino} setDestino={setDestino} />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="w-full max-w-2xl mx-auto py-2">
                            <VehiculoData 
                                vehiculo={vehiculo}
                                setVehiculo={setVehiculo}
                                isNewVehicle={isNewVehicle}
                                setIsNewVehicle={setIsNewVehicle}
                                kmInicial={kmInicial}
                                setKmInicial={setKmInicial}
                            />
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-neutral-800/40 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-neutral-700/50">
                                <h3 className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-4">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                    Detalle del Itinerario
                                </h3>
                                <CommissionTable items={comisiones} onChange={setComisiones} />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest ml-1">
                                    Justificación del Viaje
                                </label>
                                <textarea
                                    value={justificacion}
                                    onChange={(e) => setJustificacion(e.target.value)}
                                    rows={4}
                                    placeholder="Describa el motivo de la comisión..."
                                    className="w-full bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- FOOTER NAVEGACIÓN (FIJO EN MÓVIL) --- */}
            <div className="p-4 sm:p-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg flex justify-between items-center border-t border-gray-100 dark:border-neutral-800 sticky bottom-0 sm:static">
                <button 
                    onClick={currentStep === 1 ? onClose : prevStep} 
                    className="px-5 sm:px-6 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-all flex items-center gap-2 active:scale-95"
                >
                    {currentStep === 1 ? 'Cerrar' : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                            Atrás
                        </>
                    )}
                </button>

                <button 
                    onClick={currentStep === totalSteps ? handleSubmit : nextStep} 
                    // --- NUEVA LÓGICA DE DESHABILITADO ---
                    disabled={
                        loading || 
                        (currentStep === 2 && !vehiculo.placa) || 
                        (currentStep === 3 && comisiones.length === 0)
                    }
                    // -------------------------------------
                    className={`
                        px-6 sm:px-10 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-xl active:scale-95
                        ${currentStep === totalSteps 
                            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-blue-500/10' 
                            : 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {currentStep === totalSteps ? (solicitudToEdit ? 'Actualizar' : 'Enviar Solicitud') : 'Siguiente'}
                            {currentStep !== totalSteps && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>}
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};