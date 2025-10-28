
-- ============================================
-- 📁 COMANDOS ÚTILES - BENEFICIARIOS FERTILIZANTE
-- Autor: Óscar Jiménez
-- Descripción: Consultas y actualizaciones frecuentes
-- ============================================
-- 🔁 ACTUALIZACIONES MASIVAS POR CÓDIGO
-- --------------------------------------------
-- Asignar lugar según rango de códigos
UPDATE beneficiarios_fertilizante
SET lugar = 'Monte Barroso'
WHERE codigo BETWEEN '0500' AND '0599';
-- Asignar lugar según rango de códigos
UPDATE beneficiarios_fertilizante
SET lugar = 'Liquidámbar'
WHERE codigo BETWEEN '0700' AND '0800';
-- 🧼 LIMPIEZA DE DATOS
-- --------------------------------------------
-- Quitar lugar a beneficiarios anulados
UPDATE beneficiarios_fertilizante
SET lugar = NULL
WHERE lugar = 'Liquidámbar' AND estado = 'Anulado';
-- Asignar año 2025 a todos los registros
UPDATE beneficiarios_fertilizante
SET anio = 2025;
-- Asignar año 2025 solo si estaba vacío
UPDATE beneficiarios_fertilizante
SET anio = 2025
WHERE anio IS NULL;


-- 📊 CONSULTAS ESTADÍSTICAS
-- --------------------------------------------
-- Contar beneficiarios por lugar

SELECT lugar, COUNT(*) AS total
FROM beneficiarios_fertilizante
GROUP BY lugar
ORDER BY total DESC;

-- Beneficiarios anulados por lugar

SELECT lugar, COUNT(*) AS total
FROM beneficiarios_fertilizante
WHERE estado = 'Anulado'
GROUP BY lugar;

--- Politicas

CREATE POLICY "Acceso completo si está autenticado"
ON logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

--- crear tabla con referencia a usuarios y perfil

CREATE TABLE public.info_contrato (
    id uuid NOT NULL,
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    direccion text,
    telefono text,
    dpi text,
    nit text,
    igss text,
    cuenta_no text,
    contrato_no text,
    cargo text,
    salario numeric,
    bonificacion numeric,
    fecha_ini date,
    fecha_fin date,
    renglon text,
    created_at timestamptz
);

--- Activar RLS y crear politicas

  ALTER TABLE info_contrato ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "allow_all_authenticated"
  ON info_contrato
  FOR ALL
  TO authenticated
  USING (true);

--- vistas para el frontend
CREATE VIEW public.vista_usuarios_detalle AS
SELECT
  u.id AS id,
  u.email,
  p.nombre
FROM auth.users u
LEFT JOIN public.info_usuario p ON u.id = p.user_id;
-- 3. Volver a crear la vista de logs con el email del usuario
CREATE VIEW public.vista_logs AS
SELECT
  logs.id,
  logs.accion,
  logs.descripcion,
  logs.fecha,
  logs.modulo_id,
  logs.user_id,
  u.email AS usuario_email
FROM logs
LEFT JOIN public.vista_usuarios_detalle u ON logs.user_id = u.id;


---crear funcion para creart politicas en supabase

CREATE OR REPLACE FUNCTION crear_politicas_crud(nombre_tabla TEXT)
RETURNS VOID AS $$
BEGIN
    -- Habilitar RLS en la tabla
    EXECUTE 'ALTER TABLE public.' || quote_ident(nombre_tabla) || ' ENABLE ROW LEVEL SECURITY;';

    -- Eliminar políticas viejas con el mismo nombre para evitar errores
    EXECUTE 'DROP POLICY IF EXISTS "Acceso total para usuarios autenticados" ON public.' || quote_ident(nombre_tabla) || ';';

    -- Crear la política de acceso total
    EXECUTE 'CREATE POLICY "Acceso total para usuarios autenticados" ON public.' || quote_ident(nombre_tabla) ||
            ' FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'');';
END;
$$ LANGUAGE plpgsql;


--1. Función SQL (Machote Simple)

DROP FUNCTION IF EXISTS public.info_personal(uuid);

CREATE OR REPLACE FUNCTION public.info_personal(p_user_id uuid)
RETURNS TABLE(
    nombre text, 
    email text,
    direccion text,
    telefono text
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
    SELECT 
        'Nombre Simulado (Machote)' AS nombre,
        'correo@simulado.com' AS email,
        'Dirección Simulada 123' AS direccion,
        '5555-5555' AS telefono
    WHERE p_user_id IS NOT NULL;
$function$;

GRANT EXECUTE ON FUNCTION public.info_personal(uuid) TO authenticated;

--2. Hook (useInfoPersonal.tsx)

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface InfoPersonalData {
  nombre: string | null;
  email: string | null;
  direccion: string | null;
  telefono: string | null;
}

export function useInfoPersonal(userId: string | null) {
  const [data, setData] = useState<InfoPersonalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('info_personal', {
        p_user_id: userId
      });

      if (rpcError) {
        throw rpcError;
      }

      setData(rpcData && rpcData.length > 0 ? rpcData[0] : null);

    } catch (err: any) {
      console.error('Error al obtener info personal:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, fetchData };
}

--3. Componente (InfoPersonalCard.tsx)

'use client';

import React from 'react';
import { useInfoPersonal } from '@/hooks/useInfoPersonal';
import { User, Mail, MapPin, Phone } from 'lucide-react';

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}

const InfoItem = ({ icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-4 py-2">
    <div className="text-blue-500 mt-1">{icon}</div>
    <div className="flex flex-col">
      <p className="text-xs text-gray-500">{label}</p>
      <h3 className="text-xs font-semibold text-gray-800">{value || '--'}</h3>
    </div>
  </div>
);

interface InfoPersonalCardProps {
  userId: string | null;
}

export default function InfoPersonalCard({ userId }: InfoPersonalCardProps) {
  const { data, loading, error } = useInfoPersonal(userId);

  if (loading) {
    return <div className="p-4 text-xs">Cargando datos...</div>;
  }

  if (error) {
    return <div className="p-4 text-xs text-red-500">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4 text-xs">No se encontraron datos.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-sm font-bold text-gray-700 border-b pb-2 mb-2">Información Personal (Simulada)</h2>
      <InfoItem icon={<User size={18} />} label="Nombre Completo" value={data.nombre} />
      <InfoItem icon={<Mail size={18} />} label="Email" value={data.email} />
      <InfoItem icon={<Phone size={18} />} label="Teléfono" value={data.telefono} />
      <InfoItem icon={<MapPin size={18} />} label="Dirección" value={data.direccion} />
    </div>
  );
}