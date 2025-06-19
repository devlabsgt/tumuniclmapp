
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

