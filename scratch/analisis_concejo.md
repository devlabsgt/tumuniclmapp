# Análisis: Adaptación de la nueva creación de tareas al Concejo

He revisado los módulos de `components/tareas` y `components/concejo`. Aquí está mi análisis de los cambios necesarios para que las **Actividades del Concejo** utilicen el nuevo formato (menciones con `@` en la descripción en lugar de paneles manuales y checklists).

## Archivos a modificar

### 1. `ActividadesAsignadas.tsx` (Modal de la UI)
- **Eliminar el Checklist:** Quitar todo el estado, las funciones (`agregarChecklist`, `quitarChecklist`) y la interfaz de usuario (inputs y listas) del checklist, ya que este sistema ha sido deprecado en favor de las menciones grupales.
- **Implementar Textarea Enriquecido:** Reemplazar el campo de texto de `Descripción` estándar por el campo de texto superpuesto (con `aria-hidden`) que resalta los `@nombres` en color azul.
- **Lógica de Menciones:** Importar e integrar la misma lógica de `NewTarea.tsx` (`insertMention`, `handleKeyDown` para borrar menciones con Backspace) en este formulario.
- **Paridad en Edición:** Actualmente, al editar una actividad desde el Concejo, la descripción funciona como "Nueva nota" (solo permite añadir texto al final como una bitácora). Hay que adaptar esto para que, si el usuario borra o añade arrobas al editar la descripción, los miembros grupales se actualicen correspondientemente, o al menos estandarizar el formulario para que sea idéntico al de crear/editar tareas normales.

### 2. `DetalleActividadPanel` (Dentro de ActividadesAsignadas.tsx)
- **Visualización:** Actualmente, las tarjetas que muestran las actividades asignadas a un punto de agenda renderizan una barra de progreso del checklist.
- **Cambio:** Al eliminar los checklists, este panel debería actualizarse para mostrar los **miembros grupales asignados** en lugar de los ítems del checklist.

### 3. `lib/actividades.ts` y `lib/esquemas.ts` (Backend del Concejo)
- **`CrearActividadInput`:** Se debe actualizar para aceptar un array opcional de `miembros` generados a partir de los `@`.
- **`crearActividadConcejo`:** Debe incluir la lógica para insertar los registros en la tabla `act_miembros` de la base de datos una vez que se crea el registro en `tasks`.
- **`obtenerActividadesDePunto`:** Se debe modificar la consulta (Query) a Supabase para que también haga un JOIN con la tabla `act_miembros` (y `users`), de manera que `DetalleActividadPanel` reciba los datos de los participantes y pueda mostrarlos.

## Siguientes pasos
Si estás de acuerdo con este enfoque, procederé a implementar estos cambios paso a paso, asegurándome de no romper ninguna lógica existente de las reuniones del Concejo, pero garantizando que la asignación de actividades se comporte exactamente igual que en el gestor principal.
