
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


--- vistas para el frontend
CREATE VIEW public.vista_usuarios_detalle AS
SELECT
  u.id AS id,
  u.email,
  p.nombre
FROM auth.users u
LEFT JOIN public.usuarios_perfil p ON u.id = p.user_id;
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