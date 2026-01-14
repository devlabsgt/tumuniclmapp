'use client';

import { useMemo, useState } from 'react';
import { TODOS_LOS_MODULOS } from '../constants';
import ModuleCard from '../modules/ModuleCard';
import ModuleAccordion from '../modules/ModuleAccordion';

interface ModulesViewProps {
  rol: string;
  modulos: string[];
  esjefe: boolean;
}

export default function ModulesView({ rol, modulos = [], esjefe }: ModulesViewProps) {
  const [loadingModule, setLoadingModule] = useState<string | null>(null);

  const modulosDisponibles = useMemo(() =>
    TODOS_LOS_MODULOS.filter(m => {
      if (rol === 'SUPER') return true;
      if (['ACTIVIDADES', 'PERMISOS'].includes(m.id)) return true;
      if (m.subgrupo === 'Concejo Municipal' && (rol === 'CONCEJAL' || rol === 'ALCALDE')) return true;
      if (m.id === 'ASISTENCIA') return esjefe;
      if (m.id === 'COMISIONES_JEFE') return esjefe;
      if (rol === 'INVITADO' || rol === 'ALCALDE') return true;
      
      const tieneModuloAsignado = modulos.includes(m.permiso);
      
      if (m.id === 'COMISIONES_RRHH') return rol === 'RRHH' || rol === 'SECRETARIO' || tieneModuloAsignado;
      if (m.id === 'PERMISOS_GESTION') return rol === 'RRHH' || tieneModuloAsignado;
      
      return tieneModuloAsignado;
    })
  , [rol, modulos, esjefe]);

  const modulosPoliticas = useMemo(() => modulosDisponibles.filter(m => m.categoria === 'Políticas Públicas'), [modulosDisponibles]);
  const modulosGestion = useMemo(() => modulosDisponibles.filter(m => m.categoria === 'Gestión Administrativa'), [modulosDisponibles]);

  const tienePoliticas = modulosPoliticas.length > 0;
  const tieneGestion = modulosGestion.length > 0;

  return (
    <div className="w-full lg:max-w-[100%] xl:max-w-[90%] mx-auto">
      <div className={`${(tienePoliticas && tieneGestion) ? 'grid grid-cols-1 md:grid-cols-2 gap-x-8 items-start' : 'max-w-3xl mx-auto flex flex-col justify-center'}`}>
        
        {tienePoliticas && (
          <div className={`space-y-4 mb-4 ${(!tieneGestion) ? 'w-full' : ''}`}>
            <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4 text-center md:text-left">Políticas Públicas</h2>
            <div className="space-y-4">
              {modulosPoliticas.map((modulo) => (
                <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
              ))}
            </div>
          </div>
        )}

        {tieneGestion && (
          <div className={`space-y-4 ${(!tienePoliticas) ? 'w-full' : ''}`}>
           <h2 className="text-2xl font-bold text-blue-600 dark:text-gray-100 mb-4 text-center md:text-left">Gestión Administrativa</h2>
           
           <ModuleAccordion titulo="Gestión Propia" descripcion="Gestión de actividades y permisos personales." iconKey="fmdwwfgs">
              {modulosGestion.filter(m => ['ACTIVIDADES', 'PERMISOS'].includes(m.id)).map(modulo => (
                <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
              ))}
           </ModuleAccordion>
           
           {esjefe && (
              <ModuleAccordion titulo="Gestión Jefe de Área" descripcion="Gestión y supervisión de equipos." iconKey="tobsqthh">
                {modulosGestion.filter(m => m.subgrupo === 'Gestión Jefe de Área' && m.id !== 'ACTIVIDADES').map(modulo => (
                  <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
                ))}
              </ModuleAccordion>
           )}

           <ModuleAccordion titulo="Concejo Municipal" descripcion="Gestión de actas, sesiones y estructura municipal." iconKey="qaeqyqcc">
              {modulosGestion.filter(m => m.subgrupo === 'Concejo Municipal').map(modulo => (
                <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
              ))}
           </ModuleAccordion>

           <ModuleAccordion titulo="Recursos Humanos" descripcion="Administración de personal." iconKey="zyuyqigo">
              {modulosGestion.filter(m => m.subgrupo === 'Recursos Humanos').map(modulo => (
                <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
              ))}
           </ModuleAccordion>

           <div className="space-y-4">
              {modulosGestion.filter(m => !m.subgrupo && !['ACTIVIDADES', 'PERMISOS', 'PERMISOS_GESTION'].includes(m.id)).map(modulo => (
                <ModuleCard key={modulo.id} modulo={modulo} loadingModule={loadingModule} setLoadingModule={setLoadingModule} />
              ))}
           </div>
          </div>
        )}
      </div>
    </div>
  );
}