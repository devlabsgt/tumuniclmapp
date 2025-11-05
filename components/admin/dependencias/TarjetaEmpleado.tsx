'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Fingerprint, Hash, MapPin, Phone, FileText, CircleDollarSign, BadgeDollarSign, FileSignature, CalendarPlus, CalendarMinus, X, Loader2, Briefcase, Banknote, Clock, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cargando from '@/components/ui/animations/Cargando';
import { useInfoUsuario } from '@/hooks/usuarios/useInfoUsuario';

const InfoItem = ({ icon, label, value, isLoading }: { icon: React.ReactNode, label: string, value?: string | number | null, isLoading?: boolean }) => (
  <div className="flex items-start gap-4 py-2">
    <div className="text-blue-500 dark:text-blue-400 mt-1">{icon}</div>
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mt-1" />
      ) : (
        <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-100 break-words">{value || '--'}</h3>
      )}
    </div>
  </div>
);

interface TarjetaEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function TarjetaEmpleado({ isOpen, onClose, userId }: TarjetaEmpleadoProps) {
  const { 
    usuario: datosCompletos, 
    cargando: cargandoDatos
  } = useInfoUsuario(userId);

  if (!isOpen) return null;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '--';
    return `Q ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const correctedDate = new Date(date.getTime() + userTimezoneOffset);
      return new Intl.DateTimeFormat('es-GT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(correctedDate);
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '--';
    try {
      // Creamos una fecha falsa solo para poder formatear la hora
      const [hours, minutes, seconds] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return new Intl.DateTimeFormat('es-GT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return timeString;
    }
  };
  
  const formatDays = (days: number[] | null | undefined) => {
    if (!days || days.length === 0) return '--';
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.sort((a, b) => a - b).map(d => dayNames[d] || '?').join(', ');
  };


  const bonificacionValue = datosCompletos?.bonificacion;
  const isGlobalLoading = cargandoDatos;

  const pathItems = datosCompletos?.puesto_path_jerarquico
    ? datosCompletos.puesto_path_jerarquico
        .split(' > ')
        .filter(item => {
          const upperItem = item.toUpperCase();
          return upperItem !== 'SIN DIRECCIÓN' && upperItem !== 'SIN DIRECCION';
        })
        .slice(1)
    : [];
    
  const horario = datosCompletos?.horario_nombre ? {
    nombre: datosCompletos.horario_nombre,
    dias: formatDays(datosCompletos.horario_dias),
    entrada: formatTime(datosCompletos.horario_entrada),
    salida: formatTime(datosCompletos.horario_salida)
  } : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            
            {isGlobalLoading ? (
              <div className="p-8 h-64">
                <Cargando texto="Cargando perfil..." />
              </div>
            ) : (
              <div className="p-8">
                <div className="flex flex-col items-center mb-8 lg:flex-row lg:items-center lg:gap-4">
                  
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-4 lg:mb-0">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="flex flex-col items-start w-full">
                    <h2 className="text-xl font-bold">{datosCompletos?.nombre || 'N/A'}</h2>
                    <p className="text-sm text-gray-500 mt-1">{datosCompletos?.email || 'N/A'}</p>
                    
                    {pathItems.length > 0 && (
                      <div className="mt-4 w-full border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="flex items-center text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <Briefcase size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                          Ubicación Organizacional
                        </h4>
                        
                        <div className="flex flex-col lg:hidden">
                          {pathItems.map((item, index) => (
                            <p key={index} className="text-xs text-gray-500 leading-snug">
                              {item}{index < pathItems.length - 1 ? ',' : ''}
                            </p>
                          ))}
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-1.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {pathItems.join(' / ')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {horario && (
                      <div className="mt-4 w-full border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="flex items-center text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <Clock size={14} className="mr-2 text-blue-500 flex-shrink-0" />
                          Información de Horario
                        </h4>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Horario:</span> {horario.nombre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Días:</span> {horario.dias}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Entrada:</span> {horario.entrada}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Salida:</span> {horario.salida}
                          </p>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información Personal</h3>
                      <InfoItem icon={<User size={18} />} label="Nombre Completo" value={datosCompletos?.nombre} />
                      <InfoItem icon={<Phone size={18} />} label="Teléfono" value={datosCompletos?.telefono} />
                      <InfoItem icon={<Fingerprint size={18} />} label="DPI" value={datosCompletos?.dpi} />
                      <InfoItem icon={<Shield size={18} />} label="IGSS" value={datosCompletos?.igss} />
                      <InfoItem icon={<Hash size={18} />} label="NIT" value={datosCompletos?.nit} />
                      <InfoItem icon={<Banknote size={18} />} label="No. Cuenta" value={datosCompletos?.cuenta_no} />
                      <InfoItem icon={<MapPin size={18} />} label="Dirección" value={datosCompletos?.direccion} />
                  </div>

                  <div className="flex flex-col space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información de Contrato</h3>
                      <InfoItem icon={<Briefcase size={18} />} label="Cargo" value={datosCompletos?.puesto_nombre} />
                      <InfoItem icon={<FileText size={18} />} label="Renglón" value={datosCompletos?.renglon} />
                      <InfoItem icon={<FileSignature size={18} />} label="No. Contrato" value={datosCompletos?.contrato_no} />
                      <InfoItem icon={<CalendarPlus size={18} />} label="Fecha Inicio" value={formatDate(datosCompletos?.fecha_ini)} />
                      <InfoItem icon={<CalendarMinus size={18} />} label="Fecha Fin" value={formatDate(datosCompletos?.fecha_fin)} />
                      <InfoItem icon={<CircleDollarSign size={18} />} label="Salario" value={formatCurrency(datosCompletos?.salario)} />
                      {bonificacionValue !== null && bonificacionValue !== undefined && bonificacionValue !== 0 && (
                          <InfoItem icon={<BadgeDollarSign size={18} />} label="Bonificación" value={formatCurrency(bonificacionValue)} />
                      )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}