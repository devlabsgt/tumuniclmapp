import { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { PermisoEmpleado, PermisosPorOficina, UsuarioConJerarquia, EstadoPermiso } from '@/components/permisos/types';
import { obtenerPermisos, eliminarPermiso, obtenerPerfilUsuario, PerfilUsuario, gestionarPermiso } from '@/components/permisos/acciones';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';

export type TipoVistaPermisos = 'mis_permisos' | 'gestion_jefe' | 'gestion_rrhh';

export const usePermisos = (tipoVista: TipoVistaPermisos) => {
  const [registrosRaw, setRegistrosRaw] = useState<PermisoEmpleado[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [oficinasAbiertas, setOficinasAbiertas] = useState<Record<string, boolean>>({});
  
  const estadoDefault = (tipoVista === 'mis_permisos' || tipoVista === 'gestion_jefe') ? 'todos' : 'pendiente';
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoPermiso>(estadoDefault);
  
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [permisoParaEditar, setPermisoParaEditar] = useState<PermisoEmpleado | null>(null);

  const { usuarios: usuariosHook } = useListaUsuarios();

  const usuariosAdaptados = useMemo(() => {
    return (usuariosHook as unknown) as UsuarioConJerarquia[];
  }, [usuariosHook]);

  const cargarDatos = async () => {
    try {
      const data = await obtenerPermisos(mesSeleccionado, anioSeleccionado);
      setRegistrosRaw(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingPermisos(true);
      try {
        const [data, perfil] = await Promise.all([
          obtenerPermisos(mesSeleccionado, anioSeleccionado),
          obtenerPerfilUsuario()
        ]);
        setRegistrosRaw(data);
        setPerfilUsuario(perfil);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPermisos(false);
      }
    };
    init();
  }, [mesSeleccionado, anioSeleccionado]);

  const toggleOficina = (nombre: string) => {
    setOficinasAbiertas(prev => ({ ...prev, [nombre]: !prev[nombre] }));
  };

  const handleNuevoPermiso = () => {
    setPermisoParaEditar(null);
    setModalAbierto(true);
  };

  const handleClickFila = (permiso: PermisoEmpleado) => {
    // SIEMPRE abrimos el modal para ver detalles. 
    // La decisión de aprobar/rechazar se toma DENTRO del modal.
    setPermisoParaEditar(permiso);
    setModalAbierto(true);
  };

  const handleEliminarPermiso = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
       background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
       color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
    });

    if (result.isConfirmed) {
      try {
        await eliminarPermiso(id);
        await cargarDatos();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'El permiso ha sido eliminado correctamente.',
          icon: 'success',
           background: document.documentElement.classList.contains('dark') ? '#171717' : '#fff',
           color: document.documentElement.classList.contains('dark') ? '#e5e5e5' : '#000',
        });
      } catch (error) {
        Swal.fire({ title: 'Error', text: 'No se pudo eliminar el permiso.', icon: 'error' });
      }
    }
  };

  const registrosEnriquecidos = useMemo(() => {
    if (!usuariosAdaptados.length) return [];
    return registrosRaw.map(permiso => {
      const usuarioEncontrado = usuariosAdaptados.find(u => u.id === permiso.user_id);
      return { ...permiso, usuario: usuarioEncontrado };
    });
  }, [registrosRaw, usuariosAdaptados]);

  const { permisosVisibles, usuariosParaModal } = useMemo(() => {
    if (!perfilUsuario) return { permisosVisibles: [], usuariosParaModal: [] };

    let permisosFiltrados = [...registrosEnriquecidos];
    let usuariosFiltrados = [...usuariosAdaptados];
    
    const esRRHH = ['RRHH', 'SUPER', 'SECRETARIO'].includes(perfilUsuario.rol || '');
    const idsOficinasJefe = perfilUsuario.oficinasACargo.map(o => o.id);
    const nombresOficinasJefe = perfilUsuario.oficinasACargo.map(o => o.nombre.toLowerCase().trim());

    switch (tipoVista) {
        case 'mis_permisos':
            permisosFiltrados = permisosFiltrados.filter(p => p.user_id === perfilUsuario.id);
            usuariosFiltrados = usuariosFiltrados.filter(u => u.id === perfilUsuario.id);
            break;

        case 'gestion_jefe':
            if (idsOficinasJefe.length > 0) {
              permisosFiltrados = permisosFiltrados.filter(p => {
                 const depId = p.usuario?.dependencia_id;
                 const depNombre = p.usuario?.oficina_nombre?.toLowerCase().trim();
                 const esDeMisOficinas = (depId && idsOficinasJefe.includes(depId)) || 
                                         (depNombre && nombresOficinasJefe.includes(depNombre));
                 const noSoyYoMismo = p.user_id !== perfilUsuario.id;
                 return esDeMisOficinas && noSoyYoMismo;
              });
              
              usuariosFiltrados = usuariosFiltrados.filter(u => {
                  const depId = u.dependencia_id;
                  const depNombre = u.oficina_nombre?.toLowerCase().trim();
                  return (depId && idsOficinasJefe.includes(depId)) || 
                         (depNombre && nombresOficinasJefe.includes(depNombre));
              });
            } else {
              permisosFiltrados = [];
            }
            break;

        case 'gestion_rrhh':
            if (!esRRHH) {
                permisosFiltrados = []; 
                usuariosFiltrados = [];
            }
            break;
    }

    return { permisosVisibles: permisosFiltrados, usuariosParaModal: usuariosFiltrados };
  }, [registrosEnriquecidos, usuariosAdaptados, perfilUsuario, tipoVista]);

  const registrosFinales = useMemo(() => {
    return permisosVisibles.filter(r => {
      const nombreEmpleado = r.usuario?.nombre?.toLowerCase() || '';
      const nombreOficina = r.usuario?.oficina_nombre?.toLowerCase() || '';
      const termino = searchTerm.toLowerCase();
      
      const matchBusqueda = nombreEmpleado.includes(termino) || nombreOficina.includes(termino);
      const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
      
      return matchBusqueda && matchEstado;
    });
  }, [permisosVisibles, searchTerm, filtroEstado]);

  const datosAgrupados = useMemo(() => {
    const grupos: Record<string, PermisosPorOficina> = {};

    if (tipoVista === 'gestion_jefe' && perfilUsuario?.oficinasACargo) {
        perfilUsuario.oficinasACargo.forEach(oficina => {
            grupos[oficina.nombre] = {
                oficina_nombre: oficina.nombre,
                path_orden: '0', 
                permisos: []
            };
        });
    }

    registrosFinales.forEach(r => {
      const nombreOficina = r.usuario?.oficina_nombre || 'Sin Oficina Asignada';
      const pathOrden = r.usuario?.oficina_path_orden || '9999';
      
      if (!grupos[nombreOficina]) {
        grupos[nombreOficina] = { 
            oficina_nombre: nombreOficina, 
            path_orden: pathOrden, 
            permisos: [] 
        };
      }
      grupos[nombreOficina].permisos.push(r);
    });

    return Object.values(grupos).sort((a, b) => a.path_orden.localeCompare(b.path_orden, undefined, { numeric: true }));
  }, [registrosFinales, tipoVista, perfilUsuario]);

  const estadisticas = useMemo(() => {
    let pendientes = 0; let aprobados = 0; let rechazados = 0; let avalados = 0;
    
    permisosVisibles.forEach(r => {
      if (r.estado === 'pendiente') pendientes++;
      if (r.estado === 'aprobado') aprobados++;
      if (r.estado.includes('rechazado')) rechazados++;
      if (r.estado === 'aprobado_jefe') avalados++;
    });
    return { pendientes, aprobados, rechazados, avalados };
  }, [permisosVisibles]);

  return {
    state: {
      loadingPermisos, searchTerm, filtroEstado, mesSeleccionado, anioSeleccionado,
      modalAbierto, permisoParaEditar, perfilUsuario, oficinasAbiertas,
      datosAgrupados, estadisticas, usuariosParaModal,
    },
    actions: {
      setSearchTerm, setFiltroEstado, setMesSeleccionado, setAnioSeleccionado,
      setModalAbierto, toggleOficina, cargarDatos, handleNuevoPermiso,
      handleClickFila, handleEliminarPermiso,
    }
  };
};