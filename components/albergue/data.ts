export type Albergue = {
  id: string;
  lugar: string;
  nombre: string;
  direccion: string;
  capacidad: number;
  encargado?: string;
  /** Teléfono en formato local de 8 dígitos */
  telefono: string;
  lat: number;
  lng: number;
};

/** Centro aproximado — Concepción Las Minas */
export const CENTRO_ALBERGUES = {
  lat: 14.5212062,
  lng: -89.4563032,
};

const TELEFONO_CONTACTO = "47902524";

export const albergues: Albergue[] = [
  {
    id: "13",
    lugar: "Casco Urbano",
    nombre: "Gimnasio Municipal",
    direccion: "Casco Urbano, Concepción Las Minas",
    capacidad: 300,
    encargado: "Darwin Javier",
    telefono: "47175727",
    lat: 14.5209197,
    lng: -89.456675,
  },
  {
    id: "01",
    lugar: "Casco Urbano",
    nombre: "Salón Parroquial",
    direccion: "Concepción Las Minas, atrás de la Iglesia Católica",
    capacidad: 100,
    encargado: "Padre Juan Pablo Aguirre",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5212062,
    lng: -89.4563032,
  },
  {
    id: "02",
    lugar: "Casco Urbano",
    nombre: "Iglesia Amigos",
    direccion: "Concepción Las Minas, frente Parque Central",
    capacidad: 100,
    encargado: "Lionel Guerra",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5216015,
    lng: -89.4568007,
  },
  {
    id: "03",
    lugar: "Guacamayas",
    nombre: "Centro Deportivo Las Minas",
    direccion: "Guacamayas, Concepción Las Minas",
    capacidad: 150,
    encargado: "Arnoldo Ortega",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5408042,
    lng: -89.4617749,
  },
  {
    id: "04",
    lugar: "Caserío Rodeito",
    nombre: "Salón de Ganaderos",
    direccion: "Caserío Rodeito, Concepción Las Minas",
    capacidad: 100,
    encargado: "Julio Martínez",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5320529,
    lng: -89.4570079,
  },
  {
    id: "05",
    lugar: "La Ermita",
    nombre: "Salón de Ganaderos",
    direccion: "Aldea La Ermita, Concepción Las Minas",
    capacidad: 50,
    encargado: "Noé Lemus",
    telefono: TELEFONO_CONTACTO,
    lat: 14.4704789,
    lng: -89.460136,
  },
  {
    id: "06",
    lugar: "La Ermita",
    nombre: "Salón Comunal",
    direccion: "Aldea La Ermita, Concepción Las Minas",
    capacidad: 100,
    encargado: "Noé Lemus",
    telefono: TELEFONO_CONTACTO,
    lat: 14.4671568,
    lng: -89.4567843,
  },
  {
    id: "07",
    lugar: "La Ermita",
    nombre: "Cancha de Basquetbol",
    direccion: "Aldea La Ermita, Concepción Las Minas",
    capacidad: 50,
    encargado: "Noé Lemus",
    telefono: TELEFONO_CONTACTO,
    lat: 14.4668266,
    lng: -89.4561989,
  },
  {
    id: "08",
    lugar: "Limones",
    nombre: "Salón Iglesia Evangélica Pentecostés Fuente de Vida",
    direccion: "Aldea Limones, Concepción Las Minas",
    capacidad: 100,
    encargado: "Israel Ramos",
    telefono: TELEFONO_CONTACTO,
    lat: 14.4815871,
    lng: -89.4632367,
  },
  {
    id: "09",
    lugar: "Apantes",
    nombre: "Salón Iglesia Católica Apantes",
    direccion: "Aldea Apantes",
    capacidad: 100,
    encargado: "Neftalí Roldán",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5456979,
    lng: -89.4103703,
  },
  {
    id: "10",
    lugar: "Palo Gordo",
    nombre: "Tabernáculo Iglesia Evangélica",
    direccion: "Palo Gordo, Concepción Las Minas",
    capacidad: 1500,
    encargado: "Fernando Velásquez",
    telefono: TELEFONO_CONTACTO,
    lat: 14.5542083,
    lng: -89.4763611,
  },
  {
    id: "11",
    lugar: "Caserío El Límite",
    nombre: "Parque Escuela",
    direccion: "Caserío El Límite, Concepción Las Minas",
    capacidad: 50,
    encargado: "Jonathan Ruiz",
    telefono: "51501871",
    lat: 14.5467776,
    lng: -89.4506015,
  },
  {
    id: "12",
    lugar: "Frontera Anguiatú",
    nombre: "Polideportivo",
    direccion: "Frontera Anguiatú",
    capacidad: 300,
    encargado: "Edwin Heredia",
    telefono: TELEFONO_CONTACTO,
    lat: 14.4226783,
    lng: -89.4623611,
  },
];
