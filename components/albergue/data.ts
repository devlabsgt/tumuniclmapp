export type Albergue = {
  id: string;
  nombre: string;
  direccion: string;
  encargado?: string;
  /** Teléfono en formato local de 8 dígitos, ej. "79421234" */
  telefono: string;
  lat: number;
  lng: number;
};

/** 14°31'19.8"N 89°27'23.4"W — Concepción Las Minas */
export const CENTRO_ALBERGUES = {
  lat: 14.5221667,
  lng: -89.4565,
};

const base = CENTRO_ALBERGUES;
const TELEFONO_CONTACTO = '47902524';

// 13 albergues simulados. Reemplazar con datos reales cuando estén disponibles.
export const albergues: Albergue[] = [
  {
    id: '01',
    nombre: 'Salón Municipal',
    direccion: 'Barrio El Centro, Concepción Las Minas',
    encargado: 'Municipalidad de Concepción Las Minas',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat,
    lng: base.lng,
  },
  {
    id: '02',
    nombre: 'Escuela Oficial Urbana Mixta',
    direccion: '4ª Calle, Barrio El Centro',
    encargado: 'Lic. María López',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0012,
    lng: base.lng - 0.0008,
  },
  {
    id: '03',
    nombre: 'INEB Concepción Las Minas',
    direccion: 'Avenida Principal, zona urbana',
    encargado: 'Prof. Carlos Méndez',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0009,
    lng: base.lng + 0.0011,
  },
  {
    id: '04',
    nombre: 'Albergue Barrio San José',
    direccion: 'Barrio San José, Concepción Las Minas',
    encargado: 'Sra. Ana García',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0025,
    lng: base.lng + 0.0015,
  },
  {
    id: '05',
    nombre: 'Centro Comunal Colonia El Progreso',
    direccion: 'Colonia El Progreso',
    encargado: 'Sr. Jorge Ramírez',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0018,
    lng: base.lng - 0.0022,
  },
  {
    id: '06',
    nombre: 'Albergue Barrio La Unión',
    direccion: 'Barrio La Unión',
    encargado: 'Sra. Rosa Hernández',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0031,
    lng: base.lng - 0.0019,
  },
  {
    id: '07',
    nombre: 'Polideportivo Municipal',
    direccion: 'Salida a Jocotán, zona deportiva',
    encargado: 'Ing. Luis Morales',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0028,
    lng: base.lng + 0.0026,
  },
  {
    id: '08',
    nombre: 'Escuela Rural Aldea El Carmen',
    direccion: 'Aldea El Carmen',
    encargado: 'Prof. Sandra Paz',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0045,
    lng: base.lng + 0.0032,
  },
  {
    id: '09',
    nombre: 'Centro Comunal Aldea Los Planes',
    direccion: 'Aldea Los Planes',
    encargado: 'Sr. Pedro Castillo',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0042,
    lng: base.lng - 0.0035,
  },
  {
    id: '10',
    nombre: 'Albergue Aldea La Puerta',
    direccion: 'Aldea La Puerta',
    encargado: 'Sra. Elena Vásquez',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0058,
    lng: base.lng - 0.0028,
  },
  {
    id: '11',
    nombre: 'Centro Comunal Aldea El Zapote',
    direccion: 'Aldea El Zapote',
    encargado: 'Sr. Francisco Reyes',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0055,
    lng: base.lng + 0.0041,
  },
  {
    id: '12',
    nombre: 'Albergue Barrio Las Flores',
    direccion: 'Barrio Las Flores',
    encargado: 'Sra. Claudia Ortiz',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat + 0.0015,
    lng: base.lng + 0.0048,
  },
  {
    id: '13',
    nombre: 'Centro Comunal Aldea El Rosario',
    direccion: 'Aldea El Rosario',
    encargado: 'Sr. Miguel Álvarez',
    telefono: TELEFONO_CONTACTO,
    lat: base.lat - 0.0033,
    lng: base.lng - 0.0046,
  },
];
