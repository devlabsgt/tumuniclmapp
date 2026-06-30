-- ================================================
-- 🔗 TABLA INTERMEDIA: PUNTOS DE AGENDA ↔ ACTIVIDADES
-- Relaciona un punto a tratar (tareas_concejo) con una o
-- varias actividades del módulo de actividades (tasks).
-- Las actividades siguen viviendo en la tabla `tasks`, por lo
-- que conservan el flujo de bloqueo/confirmación existente.
-- ================================================

CREATE TABLE IF NOT EXISTS public.tareas_concejo_actividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tarea_concejo_id UUID NOT NULL REFERENCES public.tareas_concejo(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  UNIQUE (task_id)
);

CREATE INDEX IF NOT EXISTS idx_tca_tarea_concejo ON public.tareas_concejo_actividades (tarea_concejo_id);
CREATE INDEX IF NOT EXISTS idx_tca_task ON public.tareas_concejo_actividades (task_id);

ALTER TABLE public.tareas_concejo_actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tca_select_authenticated"
ON public.tareas_concejo_actividades
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tca_all_authenticated"
ON public.tareas_concejo_actividades
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
