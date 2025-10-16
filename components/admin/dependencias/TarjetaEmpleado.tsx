'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Usuario } from '@/lib/usuarios/esquemas';
import { Database } from '@/lib/database.types';
import { User, Mail, Shield, Fingerprint, Hash, MapPin, Phone, FileText, CircleDollarSign, BadgeDollarSign, FileSignature, CalendarPlus, CalendarMinus, X, Loader2, Briefcase, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InfoUsuario = Database['public']['Tables']['info_usuario']['Row'];
type InfoContrato = Database['public']['Tables']['info_contrato']['Row'];

interface TarjetaProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  infoUsuario?: Partial<InfoUsuario> | null;
  infoContrato?: Partial<InfoContrato> | null;
  cargandoContrato: boolean;
  cargoAsignado?: string | null;
}

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

export default function TarjetaEmpleado({ isOpen, onClose, usuario, infoUsuario, infoContrato, cargandoContrato, cargoAsignado }: TarjetaProps) {
  if (!isOpen || !usuario) return null;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '--';
    return `Q ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const bonificacionValue = infoContrato?.bonificacion;

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
            
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{usuario.nombre}</h2>
                  <p className="text-sm text-gray-500">{usuario.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Columna 1: Información Personal */}
                <div className="flex flex-col space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información Personal</h3>
                    <InfoItem icon={<User size={18} />} label="Nombre Completo" value={infoUsuario?.nombre} />
                    <InfoItem icon={<Phone size={18} />} label="Teléfono" value={infoUsuario?.telefono} />
                    <InfoItem icon={<Fingerprint size={18} />} label="DPI" value={infoUsuario?.dpi} />
                    <InfoItem icon={<Shield size={18} />} label="IGSS" value={infoUsuario?.igss} />
                    <InfoItem icon={<Hash size={18} />} label="NIT" value={infoUsuario?.nit} />
                    <InfoItem icon={<Banknote size={18} />} label="No. Cuenta" value={infoUsuario?.cuenta_no} />
                    <InfoItem icon={<MapPin size={18} />} label="Dirección" value={infoUsuario?.direccion} />
                </div>

                {/* Columna 2: Información de Contrato */}
                <div className="flex flex-col space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información de Contrato</h3>
                    <InfoItem icon={<Briefcase size={18} />} label="Cargo" value={cargoAsignado} />
                    <InfoItem icon={<FileText size={18} />} label="Renglón" value={infoContrato?.renglon} isLoading={cargandoContrato} />
                    <InfoItem icon={<FileSignature size={18} />} label="No. Contrato" value={infoContrato?.contrato_no} isLoading={cargandoContrato} />
                    <InfoItem icon={<CalendarPlus size={18} />} label="Fecha Inicio" value={infoContrato?.fecha_ini} isLoading={cargandoContrato} />
                    <InfoItem icon={<CalendarMinus size={18} />} label="Fecha Fin" value={infoContrato?.fecha_fin} isLoading={cargandoContrato} />
                </div>
                
                {/* Columna 3: Información Financiera */}
                <div className="flex flex-col space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información Financiera</h3>
                    <InfoItem icon={<CircleDollarSign size={18} />} label="Salario" value={formatCurrency(infoContrato?.salario)} isLoading={cargandoContrato} />
                    {bonificacionValue !== null && bonificacionValue !== undefined && bonificacionValue !== 0 && (
                        <InfoItem icon={<BadgeDollarSign size={18} />} label="Bonificación" value={formatCurrency(bonificacionValue)} isLoading={cargandoContrato} />
                    )}
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}