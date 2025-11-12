'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Fingerprint, Hash, MapPin, Phone, FileText, 
  CircleDollarSign, BadgeDollarSign, Wallet,
  TrendingDown, Banknote,
  X, Loader2, Briefcase, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cargando from '@/components/ui/animations/Cargando';
import { useInfoUsuario } from '@/hooks/usuarios/useInfoUsuario';

// --- Configuración de Renglones ---
type RenglonConfig = { salarioLabel: string; bonoLabel?: string; tieneBono: boolean };

const renglonConfig: Record<string, RenglonConfig> = {
  '011': { salarioLabel: 'Salario Base (011)', bonoLabel: 'Bonificación (015)', tieneBono: true },
  '061': { salarioLabel: 'Dietas (061)', tieneBono: false },
  '022': { salarioLabel: 'Salario Base (022)', bonoLabel: 'Bonificación (027)', tieneBono: true },
  '029': { salarioLabel: 'Honorarios (029)', tieneBono: false },
  '031': { salarioLabel: 'Jornal (031)', bonoLabel: 'Bonificación (033)', tieneBono: true },
  '035': { salarioLabel: 'Retribución a destajo (035)', tieneBono: false },
  '036': { salarioLabel: 'Retribución por servicios (036)', tieneBono: false },
};
// ------------------------------------


const InfoItem = ({ icon, label, value, isLoading, isDeduction = false, isTotal = false }: { 
  icon: React.ReactNode, 
  label: string, 
  value?: string | number | null, 
  isLoading?: boolean,
  isDeduction?: boolean,
  isTotal?: boolean
}) => (
  <div className="flex items-start gap-4 py-2">
    <div className={`mt-1 ${isDeduction ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'} ${isTotal ? 'text-green-600 dark:text-green-500' : ''}`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mt-1" />
      ) : (
        <h3 className={`text-xs font-semibold ${isDeduction ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'} ${isTotal ? 'text-lg text-green-700 dark:text-green-500' : ''}`}>
          {value || '--'}
        </h3>
      )}
    </div>
  </div>
);

interface TarjetaEmpleadoProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

// --- CONSTANTES DE DESCUENTOS (GUATEMALA) ---
const PORCENTAJE_IGSS = 0.0483;
const PORCENTAJE_PLAN_PRESTACIONES = 0.07; 
const GASTOS_PERSONALES_ANUAL_ISR = 48000;
// Techo de cotización IGSS (E.M.A). Inferido de tus números (Q6075 * 0.0483 * 12 = 3521.04)
const TECHO_COTIZACION_IGSS = 6075; 
// ---------------------------------------------


/**
 * Calcula la retención mensual de ISR para un empleado en relación de dependencia.
 * Lógica actualizada para incluir el techo de cotización de IGSS.
 */
const calcularISR = (salarioBase: number): number => {
  if (salarioBase === 0) return 0;

  const rentaGravadaAnual = salarioBase * 12;

  // El IGSS deducible de ISR es sobre el *mínimo* entre el salario y el techo de cotización
  const igssDeducibleAnual = Math.min(salarioBase, TECHO_COTIZACION_IGSS) * PORCENTAJE_IGSS * 12;

  const deduccionesISRAnual = GASTOS_PERSONALES_ANUAL_ISR + igssDeducibleAnual;
  const rentaImponible = rentaGravadaAnual - deduccionesISRAnual;

  if (rentaImponible <= 0) return 0;

  let isrAnual = 0;
  if (rentaImponible <= 300000) {
    // Tipo impositivo del 5%
    isrAnual = rentaImponible * 0.05;
  } else {
    // Tipo impositivo del 7% sobre el excedente de 300k
    isrAnual = 15000 + (rentaImponible - 300000) * 0.07;
  }

  const isrMensual = isrAnual / 12;
  return isrMensual;
};


export default function TarjetaEmpleado({ isOpen, onClose, userId }: TarjetaEmpleadoProps) {
  const { 
    usuario: datosCompletos, 
    cargando: cargandoDatos
  } = useInfoUsuario(userId);

  if (!isOpen) return null;

  const formatCurrency = (amount: number | null | undefined, options: { sign?: 'default' | 'negative' } = {}) => {
    if (amount === null || amount === undefined) return '--';
    const formatted = `Q ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return options.sign === 'negative' ? `- ${formatted}` : formatted;
  };
  
  // ... (otras funciones format) ...
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const correctedDate = new Date(date.getTime() + userTimezoneOffset);
      return new Intl.DateTimeFormat('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(correctedDate);
    } catch (e) { return dateString; }
  };
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '--';
    try {
      const [hours, minutes, seconds] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      return new Intl.DateTimeFormat('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
    } catch (e) { return timeString; }
  };
  const formatDays = (days: number[] | null | undefined) => {
    if (!days || days.length === 0) return '--';
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.sort((a, b) => a - b).map(d => dayNames[d] || '?').join(', ');
  };
  // ---------------------------------


  // --- Lógica de Contrato/Finanzas ---
  const isGlobalLoading = cargandoDatos;
  const renglon = datosCompletos?.renglon;
  const salarioBase = datosCompletos?.salario || 0;
  const bonificacion = datosCompletos?.bonificacion || 0;

  const configActual = renglon ? renglonConfig[renglon] : null;
  const tieneBono = configActual?.tieneBono || false;

  const salarioLabel = configActual ? configActual.salarioLabel : "Salario";
  const bonoLabel = (configActual && configActual.bonoLabel) ? configActual.bonoLabel : "Bonificación";
  
  const totalDevengado = salarioBase + bonificacion;

  // --- CÁLCULO DE DEDUCCIONES ---
  // Este es el descuento REAL (sobre el total)
  const deduccionIGSS = salarioBase * PORCENTAJE_IGSS; 
  
  const deduccionPlan = salarioBase * PORCENTAJE_PLAN_PRESTACIONES;
  
  // El ISR se calcula con la función corregida
  const deduccionISR = calcularISR(salarioBase);

  const totalDeducciones = deduccionIGSS + deduccionPlan + deduccionISR;
  const liquidoARecibir = totalDevengado - totalDeducciones;
  // ---------------------------------


  const pathItems = datosCompletos?.puesto_path_jerarquico
    ? datosCompletos.puesto_path_jerarquico.split(' > ').filter(item => item.toUpperCase() !== 'SIN DIRECCIÓN' && item.toUpperCase() !== 'SIN DIRECCION').slice(1)
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
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl relative max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            
            {isGlobalLoading ? (
              <div className="p-8 h-64"> <Cargando texto="Cargando perfil..." /> </div>
            ) : (
              <div className="p-8">
                
                {/* ... (Encabezado con nombre, email, ubicación y horario) ... */}
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
                          <Briefcase size={14} className="mr-2 text-blue-500 flex-shrink-0" /> Ubicación Organizacional
                        </h4>
                        <div className="hidden lg:flex items-center gap-1.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400"> {pathItems.join(' / ')} </p>
                        </div>
                      </div>
                    )}
                    {horario && (
                      <div className="mt-4 w-full border-t border-gray-200 dark:border-gray-700 pt-3">
                        <h4 className="flex items-center text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          <Clock size={14} className="mr-2 text-blue-500 flex-shrink-0" /> Información de Horario
                        </h4>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400"> <span className="font-medium text-gray-700 dark:text-gray-300">Horario:</span> {horario.nombre} </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4"> <span className="font-medium text-gray-700 dark:text-gray-300">Días:</span> {horario.dias} </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4"> <span className="font-medium text-gray-700 dark:text-gray-300">Entrada:</span> {horario.entrada} </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 lg:border-l lg:pl-4"> <span className="font-medium text-gray-700 dark:text-gray-300">Salida:</span> {horario.salida} </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- SECCIÓN DE 3 COLUMNAS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* --- COLUMNA 1: INFO PERSONAL --- */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información Personal</h3>
                      <InfoItem icon={<User size={18} />} label="Nombre Completo" value={datosCompletos?.nombre} />
                      <InfoItem icon={<Phone size={18} />} label="Teléfono" value={datosCompletos?.telefono} />
                      <InfoItem icon={<Fingerprint size={18} />} label="DPI" value={datosCompletos?.dpi} />
                      <InfoItem icon={<Shield size={18} />} label="IGSS" value={datosCompletos?.igss} />
                      <InfoItem icon={<Hash size={18} />} label="NIT" value={datosCompletos?.nit} />
                      <InfoItem icon={<CircleDollarSign size={18} />} label="No. Cuenta" value={datosCompletos?.cuenta_no} />
                      <InfoItem icon={<MapPin size={18} />} label="Dirección" value={datosCompletos?.direccion} />
                  </div>

                  {/* --- COLUMNA 2: INFO CONTRATO (INGRESOS) --- */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">Información de Contrato</h3>
                      <InfoItem icon={<Briefcase size={18} />} label="Cargo" value={datosCompletos?.puesto_nombre} />
                      <InfoItem icon={<FileText size={18} />} label="Renglón" value={renglon} />
                      
                      <InfoItem 
                        icon={<CircleDollarSign size={18} />} 
                        label={salarioLabel} 
                        value={formatCurrency(salarioBase)} 
                      />
                      {tieneBono && (
                        <InfoItem 
                          icon={<BadgeDollarSign size={18} />} 
                          label={bonoLabel} 
                          value={formatCurrency(bonificacion)} 
                        />
                      )}
                      <div className="border-t pt-4">
                        <InfoItem 
                          icon={<Wallet size={18} />} 
                          label="Total Devengado" 
                          value={formatCurrency(totalDevengado)}
                          isTotal={true}
                        />
                      </div>
                  </div>

                  {/* --- COLUMNA 3: DEDUCCIONES Y LÍQUIDO --- */}
                  <div className="flex flex-col space-y-4">
                    <h3 className="font-semibold text-sm text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800 pb-2 mb-2">Deducciones de Ley</h3>
                    
                    <InfoItem 
                      icon={<TrendingDown size={18} />} 
                      label={`IGSS (${(PORCENTAJE_IGSS * 100).toFixed(2)}%)`}
                      value={formatCurrency(deduccionIGSS, { sign: 'negative' })}
                      isDeduction={true}
                    />
                    <InfoItem 
                      icon={<TrendingDown size={18} />} 
                      label={`Plan de Prestaciones (${(PORCENTAJE_PLAN_PRESTACIONES * 100).toFixed(0)}%)`}
                      value={formatCurrency(deduccionPlan, { sign: 'negative' })}
                      isDeduction={true}
                    />
                    <InfoItem 
                      icon={<TrendingDown size={18} />} 
                      label="ISR (Retención Mensual)" 
                      value={formatCurrency(deduccionISR, { sign: 'negative' })}
                      isDeduction={true}
                    />
                    
                    <div className="border-t border-red-200 dark:border-red-800 pt-4">
                      <InfoItem 
                        icon={<TrendingDown size={18} />} 
                        label="Total Deducciones" 
                        value={formatCurrency(totalDeducciones, { sign: 'negative' })}
                        isDeduction={true}
                        isTotal={true} 
                      />
                    </div>
                    
                    <div className="border-t border-green-200 dark:border-green-800 pt-4 mt-4">
                      <InfoItem 
                        icon={<Banknote size={20} />} 
                        label="Líquido a Recibir" 
                        value={formatCurrency(liquidoARecibir)}
                        isTotal={true}
                      />
                    </div>
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