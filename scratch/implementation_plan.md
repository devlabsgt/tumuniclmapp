# Plan de Implementación: Adaptación del Concejo al Formato de Tareas Grupales

## 1. Backend (`lib/actividades.ts`)
- **Consulta unificada:** Actualizar `obtenerActividadesDePunto` para que no retorne un objeto simplificado (`ActividadConcejo`), sino que construya y retorne el tipo `Tarea` completo (haciendo el JOIN con `act_miembros`, `users`, etc.). De esta manera, el front-end tendrá toda la información de las pestañas grupales.
- **Creación (`crearActividadConcejo`):** Modificar la función para que reciba el array de participantes y los inserte en la tabla `act_miembros` al crear la tarea.
- **Edición (`editarActividadConcejo`):** Modificar la función para que, al concatenar la nueva nota a la descripción (bitácora), procese a los usuarios mencionados (`@`) en la nota y los añada a `act_miembros` si no estaban ya en la actividad.

## 2. Frontend del Concejo (`ActividadesAsignadas.tsx`)
- **Reemplazo Visual (`DetalleActividadPanel` -> `TareaItem`):** En lugar de usar el panel local y resumido del concejo, importaremos y renderizaremos el componente oficial `TareaItem` que se usa en el gestor de tareas principal. Esto garantiza que las actividades del Concejo se vean 100% idénticas a la imagen proporcionada, con soporte para pestañas de usuarios, progreso global y checklists individuales.
- **Formulario de Crear Actividad:**
  - Eliminar el componente visual de "Lista de pendientes".
  - Implementar el componente de área de texto enriquecido (el que pinta de azul los `@nombres` y abre el menú desplegable).
- **Formulario de Editar Actividad (Bitácora):**
  - Mantener la lógica de "Nueva nota" que se anexa al final.
  - Implementar el área de texto enriquecido en la nueva nota, permitiendo que el usuario asigne personas adicionales con un `@` a medida que agrega actualizaciones a la bitácora.
