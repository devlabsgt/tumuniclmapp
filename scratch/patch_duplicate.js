const fs = require('fs');

let content = fs.readFileSync('components/tareas/modals/NewTarea.tsx', 'utf8');

// Interface NewTareaProps exists in NewTarea.tsx
// Let's add tareaOriginal
content = content.replace(
  /interface NewTareaProps {/,
  'interface NewTareaProps {\n  tareaOriginal: any;' // using any temporarily to avoid import issues if Tarea is not imported. Oh wait, Tarea might not be imported in NewTarea.tsx! Let's check imports.
);

// We need to import Tarea if not already. Let's just use `any` for tareaOriginal or import Tarea.
if (!content.includes('Tarea')) {
  content = content.replace(/import \{ Usuario, AsignacionMiembro \} from '\.\.\/types';/, "import { Usuario, AsignacionMiembro, Tarea } from '../types';");
  content = content.replace(/tareaOriginal: any;/, "tareaOriginal: Tarea | null | undefined;");
} else {
  content = content.replace(/tareaOriginal: any;/, "tareaOriginal: Tarea | null | undefined;");
}

content = content.replace(
  /export default function NewTarea\(\{ isOpen, onClose, usuarios, usuarioActual, esJefe \}: NewTareaProps\) \{/,
  'export default function DuplicateTarea({ isOpen, onClose, usuarios, usuarioActual, esJefe, tareaOriginal }: NewTareaProps) {'
);

// Header title
content = content.replace(/>Nueva Actividad<\/h2>/g, '>Duplicar Actividad</h2>');
// Button text
content = content.replace(/> Crear Actividad<\/button>/g, '> Duplicar Actividad</button>');
content = content.replace(/> Creando...<\/>/g, '> Duplicando...</>');
content = content.replace(/>Crear Actividad<\/>/g, '>Duplicar Actividad</>');

// Remove draft cache logic
content = content.replace(/const CACHE_KEY = `newTareaDraft_\${usuarioActual}`;/g, '');
content = content.replace(/const CACHE_EXPIRY_MS = 5 \* 60 \* 1000;/g, '');
content = content.replace(/const \[isRestored, setIsRestored\] = useState\(false\);/g, '');

content = content.replace(/useEffect\(\(\) => \{\n\s*if \(!isOpen\) return;\n\n\s*const loadDraft = \(\) => \{[\s\S]*?\} else \{\n\s*setIsRestored\(true\);\n\s*\}\n\s*\}\n\s*loadDraft\(\);\n\s*\}, \[isOpen, usuarioActual\]\);/g, '');
content = content.replace(/useEffect\(\(\) => \{\n\s*if \(\!isOpen || \!isRestored\) return;[\s\S]*?\}, \[title, description, dueDate, assignedTo, isOpen, isRestored\]\);/g, '');

// Initial states 
content = content.replace(/const \[title, setTitle\] = useState\(''\);/g, 'const [title, setTitle] = useState("");');
content = content.replace(/const \[description, setDescription\] = useState\(''\);/g, 'const [description, setDescription] = useState("");');
content = content.replace(/const \[dueDate, setDueDate\] = useState\(''\);/g, 'const [dueDate, setDueDate] = useState("");');
content = content.replace(/const \[assignedTo, setAssignedTo\] = useState\(usuarioActual\);/g, 'const [assignedTo, setAssignedTo] = useState(usuarioActual);');

// For search term
content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);/g, 'const [searchTerm, setSearchTerm] = useState("");');

const initEffect = `
  useEffect(() => {
    if (isOpen && tareaOriginal) {
      setTitle(tareaOriginal.title + ' (Copia)');
      setDescription(tareaOriginal.description || '');
      const d = new Date(tareaOriginal.due_date);
      setDueDate(\`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,"0")}-\${String(d.getDate()).padStart(2,"0")}T\${String(d.getHours()).padStart(2,"0")}:\${String(d.getMinutes()).padStart(2,"0")}\`);
      setAssignedTo(tareaOriginal.assigned_to || usuarioActual);
      
      const assignedUser = usuarios.find(u => u.user_id === tareaOriginal.assigned_to);
      if (assignedUser) setSearchTerm(assignedUser.nombre);
      else if (tareaOriginal.assigned_to === usuarioActual) setSearchTerm('(A mí mismo)');
      
      const initialMentions = usuarios
          .filter(u => tareaOriginal.description?.includes(\`@\${u.nombre}\`))
          .map(u => ({ userId: u.user_id, nombre: u.nombre, asignaciones: [] }));
      setMiembros(initialMentions);
    } else if (isOpen) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedTo(usuarioActual);
      setSearchTerm("");
      setMiembros([]);
    }
  }, [isOpen, tareaOriginal, usuarios, usuarioActual]);
`;

content = content.replace(/const handleSelectEncargado/, initEffect + '\n  const handleSelectEncargado');

// Change mutation from crear to duplicar
content = content.replace(/const \{ crear \} = useTareaMutations\(\);/g, 'const { duplicar } = useTareaMutations();');
content = content.replace(/const isSubmitting = crear\.isPending;/g, 'const isSubmitting = duplicar.isPending;');
content = content.replace(/await crear\.mutateAsync\(\{/g, 'await duplicar.mutateAsync({\n        checklist: [],\n');

// Change the success message!
content = content.replace(/toast\.success\('Actividad creada exitosamente'\);/g, "toast.success('¡Actividad duplicada correctamente!');");

// Delete localStorage clearing
content = content.replace(/localStorage\.removeItem\(CACHE_KEY\);/g, '');

fs.writeFileSync('components/tareas/modals/DuplicateTarea.tsx', content);
