// 1. DEFINICIÓN DEL TIPO 'Vistas' (Esto es lo que faltaba)
export type Vistas = 'modulos' | 'asistencia' | 'comisiones';

// 2. ARRAY DE MÓDULOS (Con la configuración de Actividades y Permisos)
export const TODOS_LOS_MODULOS = [
  {
    id: 'EDUCACION',
    permiso: 'EDUCACION',
    titulo: 'Política de Educación',
    descripcion: 'Administre programas, niveles, maestros y alumnos.',
    ruta: '/protected/educacion',
    iconoKey: 'upgronsr',
    colorProps: { primaryColor: '#4bb3fd' },
    categoria: 'Políticas Públicas',
  },
  {
    id: 'FERTILIZANTE',
    permiso: 'FERTILIZANTE',
    titulo: 'Política de Desarrollo Económico Local',
    descripcion: 'Gestione beneficiarios, entregas y estadísticas.',
    ruta: '/protected/fertilizante/beneficiarios',
    iconoKey: 'bikvuqcq',
    colorProps: { primaryFrom: '#ffc738', secondaryColor: '#4ade80' },
    categoria: 'Políticas Públicas'
  },
  {
    id: 'PERMISOS',
    permiso: 'PERMISOS',
    titulo: 'Mis Permisos',
    descripcion: 'Solicitud y control de permisos personales.',
    ruta: '/protected/permisos',
    iconoKey: 'hnqamtrw',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Propia' 
  },
  {
    id: 'ACTIVIDADES',
    permiso: 'ACTIVIDADES',
    titulo: 'Mis Actividades',
    descripcion: 'Planificación y seguimiento de sus actividades.',
    ruta: '/protected/actividades',
    iconoKey: 'hrtsficn',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Propia'
  },
  {
    id: 'PERMISOS_JEFE',
    permiso: 'PERMISOS',
    titulo: 'Aprobación de Permisos',
    descripcion: 'Avalar solicitudes de su equipo a cargo.',
    ruta: '/protected/permisos/jefe',
    iconoKey: 'hnqamtrw',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Jefe de Área'
  },
  {
    id: 'ACTIVIDADES_JEFE',
    permiso: 'ACTIVIDADES', 
    titulo: 'Supervisión de Actividades',
    descripcion: 'Revise y gestione las actividades de su equipo.',
    ruta: '/protected/actividades/jefe',
    iconoKey: 'hrtsficn',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Jefe de Área'
  },
  {
    id: 'ASISTENCIA',
    permiso: 'ASISTENCIA',
    titulo: 'Gestión de Asistencia',
    descripcion: 'Supervise la asistencia de su equipo.',
    ruta: '/protected/asistencias',
    iconoKey: 'sgtmgpft',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Jefe de Área'
  },
  {
    id: 'COMISIONES_JEFE',
    permiso: 'COMISIONES',
    titulo: 'Gestión de Comisiones',
    descripcion: 'Gestione las comisiones de su área.',
    ruta: '/protected/comisiones/JEFE',
    iconoKey: 'vqkaxtlm',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Gestión Jefe de Área'
  },
  {
    id: 'PERMISOS_GESTION',
    permiso: 'RRHH', 
    titulo: 'Administración de Permisos',
    descripcion: 'Aprobación final y gestión de historial.',
    ruta: '/protected/permisos/rrhh', 
    iconoKey: 'hnqamtrw',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'ACTIVIDADES_GESTION',
    permiso: 'RRHH', 
    titulo: 'Administración de Actividades',
    descripcion: 'Visión global de actividades municipales.',
    ruta: '/protected/actividades/rrhh', 
    iconoKey: 'hrtsficn',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'RRHH',
    permiso: 'RRHH',
    titulo: 'Gestión de Personal',
    descripcion: 'Gestione los datos y el historial de los empleados.',
    ruta: '/protected/admin/users',
    iconoKey: 'daeumrty',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'COMISIONES_RRHH',
    permiso: 'COMISIONES',
    titulo: 'Gestión de Comisiones Global',
    descripcion: 'Cree, apruebe y gestione las comisiones.',
    ruta: '/protected/comisiones/RRHH',
    iconoKey: 'vqkaxtlm',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'ORGANOS_RRHH',
    permiso: 'ORGANOS',
    titulo: 'Estructura Organizacional',
    descripcion: 'Gestione dependencias y jerarquías.',
    ruta: '/protected/admin/dependencias',
    iconoKey: 'ilrifayj', 
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#b26836' },
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'AGENDA_CONCEJO',
    permiso: 'AGENDA_CONCEJO',
    titulo: 'Agenda de Concejo',
    descripcion: 'Consulte y gestione las próximas reuniones.',
    ruta: '/protected/concejo/agenda/',
    iconoKey: 'yxsbonud',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#4bb3fd' },
    categoria: 'Gestión Administrativa',
    subgrupo: 'Concejo Municipal'
  },
  {
    id: 'ORGANOS_CONCEJO', 
    permiso: 'ORGANOS',
    titulo: 'Estructura Organizacional',
    descripcion: 'Vista de estructura y órganos municipales.',
    ruta: '/protected/admin/dependencias',
    iconoKey: 'ilrifayj',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#b26836' },
    categoria: 'Gestión Administrativa',
    subgrupo: 'Concejo Municipal'
  },
];