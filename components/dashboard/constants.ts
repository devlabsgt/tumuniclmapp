export type Vistas = 'modulos' | 'asistencia' | 'comisiones';

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
    id: 'AGENDA_CONCEJO',
    permiso: 'AGENDA_CONCEJO',
    titulo: 'Agenda de Concejo',
    descripcion: 'Consulte y gestione las próximas reuniones del concejo.',
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
    descripcion: 'Estructura y órganos municipales (Concejo).',
    ruta: '/protected/admin/dependencias',
    iconoKey: 'ilrifayj',
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#b26836' },
    categoria: 'Gestión Administrativa',
    subgrupo: 'Concejo Municipal'
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
    id: 'ORGANOS_RRHH',
    permiso: 'ORGANOS',
    titulo: 'Estructura Organizacional',
    descripcion: 'Gestione dependencias y jerarquías (RRHH).',
    ruta: '/protected/admin/dependencias',
    iconoKey: 'ilrifayj', 
    colorProps: { primaryColor: '#ebe6ef', secondaryColor: '#b26836' },
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'COMISIONES_RRHH',
    permiso: 'COMISIONES',
    titulo: 'Gestión de Comisiones',
    descripcion: 'Cree, apruebe y gestione las comisiones.',
    ruta: '/protected/comisiones',
    iconoKey: 'vqkaxtlm',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Recursos Humanos'
  },
  {
    id: 'ASISTENCIA',
    permiso: 'ASISTENCIA',
    titulo: 'Control de Asistencia',
    descripcion: 'Supervise la asistencia de su equipo.',
    ruta: '/protected/asistencias',
    iconoKey: 'sgtmgpft',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Control Jefe de Área'
  },
  {
    id: 'COMISIONES_JEFE',
    permiso: 'COMISIONES',
    titulo: 'Gestión de Comisiones',
    descripcion: 'Gestione las comisiones de su área.',
    ruta: '/protected/comisiones',
    iconoKey: 'vqkaxtlm',
    categoria: 'Gestión Administrativa',
    subgrupo: 'Control Jefe de Área'
  },
];