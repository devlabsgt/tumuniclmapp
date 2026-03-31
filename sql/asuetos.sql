-- ================================================
-- 🗓️ TABLA DE ASUETOS GLOBALES
-- Aplica a TODOS los empleados del sistema
-- Solo RRHH puede crear/editar/eliminar asuetos
-- ================================================

CREATE TABLE IF NOT EXISTS public.asuetos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice por fecha para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_asuetos_fecha ON public.asuetos (fecha);

-- Habilitar RLS
ALTER TABLE public.asuetos ENABLE ROW LEVEL SECURITY;

-- Política: todos los usuarios autenticados pueden leer
CREATE POLICY "asuetos_select_authenticated"
ON public.asuetos
FOR SELECT
TO authenticated
USING (true);

-- Política: solo pueden insertar/actualizar/eliminar usuarios RRHH, SECRETARIO, SUPER
-- Esta verificación se hace en el servidor (Server Actions), la política permite a autenticados
CREATE POLICY "asuetos_all_authenticated"
ON public.asuetos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
