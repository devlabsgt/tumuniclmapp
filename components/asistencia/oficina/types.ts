
export type AsistenciaEnriquecida = any; 

export type AsistenciaDiaria = {
    entrada: AsistenciaEnriquecida | null;
    salida: AsistenciaEnriquecida | null;
    multiple: AsistenciaEnriquecida[];
    diaString: string;
};

export type RegistrosAgrupadosPorUsuario = {
    userId: string;
    nombre: string;
    puesto_nombre: string;
    oficina_nombre: string;
    oficina_path_orden: string;
    asistencias: AsistenciaDiaria[];
};

export type RegistrosAgrupadosDiarios = {
    entrada: AsistenciaEnriquecida | null;
    salida: AsistenciaEnriquecida | null;
    multiple: AsistenciaEnriquecida[];
    nombre: string;
    puesto_nombre: string;
    oficina_nombre: string;
    oficina_path_orden: string;
    userId: string;
    diaString: string;
};