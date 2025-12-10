'use client';

import React, { useState } from 'react';
import useUserData from '@/hooks/sesion/useUserData';
import useAsistenciasOficina from '@/hooks/asistencia/useAsistenciasOficina';
import AsistenciaTable from '../tabla/AsistenciaTable'; 
import Cargando from '@/components/ui/animations/Cargando';

export default function VerAsistenciaOficinas() {
  const { dependencia_id, rol, cargando: cargandoUsuario } = useUserData();
  
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFinal, setFechaFinal] = useState<string | null>(null);

  const { registros, loading } = useAsistenciasOficina(dependencia_id, fechaInicio, fechaFinal);

  if (cargandoUsuario) {
    return <Cargando texto='Cargando sesión...'/>;
  }

  return (
    <div className="w-full">
        <AsistenciaTable 
          registros={registros} 
          rolActual={rol} 
          loading={loading}
          setOficinaId={() => {}}
          setFechaInicio={setFechaInicio}
          setFechaFinal={setFechaFinal}
        />
    </div>
  );
}