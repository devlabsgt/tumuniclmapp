'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { motion } from 'framer-motion';
import DependenciaForm, { type FormData, SelectableDependency } from './forms/Dependencia';
import EmpleadoForm from './forms/Empleado';
import InfoPersonalForm, { InfoPersonalFormData } from './forms/InfoPersonal';
import ContratoForm, { ContratoFormData } from './forms/Contrato';
import TarjetaEmpleado from './TarjetaEmpleado';
import DescriptionModal from './DescriptionModal';
import DependenciaList from './DependenciaList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Download, ChevronsUpDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/database.types';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import { useInfoUsuario, useInfoUsuarios, InfoUsuario } from '@/hooks/usuarios/useInfoUsuario';
import useUserData from '@/hooks/sesion/useUserData'; // <--- 1. IMPORTADO
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DependenciaNode } from './DependenciaItem';
import { Usuario } from '@/lib/usuarios/esquemas';

export type Dependencia = Database['public']['Tables']['dependencias']['Row'];

type UserWithDependency = Usuario & { dependencia_id: string | null; };


function buildDependencyTree(dependencias: Dependencia[], infoUsuarios: InfoUsuario[], usuarios: Usuario[]): DependenciaNode[] {
    const userMap = new Map(usuarios.map(u => [u.id, u]));
    const nodeMap = new Map<string, DependenciaNode>();
    const roots: DependenciaNode[] = [];

    dependencias.forEach(dep => {
        nodeMap.set(dep.id, { ...dep, no: dep.no ?? 0, children: [] });
    });

    dependencias.forEach(dep => {
        if (dep.parent_id && nodeMap.has(dep.parent_id)) {
            const parent = nodeMap.get(dep.parent_id);
            if (parent) {
                parent.children.push(nodeMap.get(dep.id)!);
            }
        } else {
            roots.push(nodeMap.get(dep.id)!);
        }
    });

    infoUsuarios.forEach((info: InfoUsuario) => {
        const parentNode = nodeMap.get(info.dependencia_id as string);
        const usuario = userMap.get(info.user_id);
        if (parentNode && usuario) {
            parentNode.children.push({ isEmployee: true, usuario: usuario as any });
        }
    });

    nodeMap.forEach(node => {
        node.children.sort((a, b) => {
            const aIsDep = !('isEmployee' in a);
            const bIsDep = !('isEmployee' in b);
            if (aIsDep && bIsDep) { return a.no - b.no; }
            if (aIsDep && !bIsDep) return -1;
            if (!aIsDep && bIsDep) return 1;
            return 0;
        });
    });

    roots.sort((a,b) => a.no - b.no);

    return roots;
}

const getAllIds = (nodes: DependenciaNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
        ids.push(node.id);
        if (node.children && node.children.length > 0) {
            const childrenNodes = node.children.filter(c => !('isEmployee' in c)) as DependenciaNode[];
            ids = ids.concat(getAllIds(childrenNodes));
        }
    });
    return ids;
};

const findNodeById = (nodes: DependenciaNode[], id: string): DependenciaNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const childrenNodes = node.children.filter(c => !('isEmployee' in c)) as DependenciaNode[];
      const found = findNodeById(childrenNodes, id);
      if (found) return found;
    }
    return null;
};

const getDescendantIds = (node: DependenciaNode, ids: Set<string>) => {
    node.children.forEach(child => {
        if (!('isEmployee' in child)) {
            ids.add(child.id);
            getDescendantIds(child, ids);
        }
    });
};


const getSelectableDependencies = (
  allDependenciasRaw: Dependencia[], 
  allInfoUsuarios: InfoUsuario[],
  allUsuarios: Usuario[],
  editingDependencia: DependenciaNode | null
): SelectableDependency[] => {
    
    const fullTree = buildDependencyTree(allDependenciasRaw, allInfoUsuarios, allUsuarios);
    
    const nodesToExclude = new Set<string>();
    if (editingDependencia) {
        nodesToExclude.add(editingDependencia.id);
        
        const nodeInTree = findNodeById(fullTree, editingDependencia.id);
        if (nodeInTree) {
             getDescendantIds(nodeInTree, nodesToExclude);
        }
    }
    
    const result: SelectableDependency[] = [];
    const buildFlattenedList = (nodes: DependenciaNode[], level: number, parentPrefix: string = '') => {
        nodes.forEach(node => {
            const isEmployeeNode = 'isEmployee' in node;
            const isPuesto = !isEmployeeNode && node.es_puesto; 
            
            const currentPrefix = parentPrefix ? `${parentPrefix}.${node.no}` : `${node.no}`;
            
            if (!nodesToExclude.has(node.id) && !isEmployeeNode && !isPuesto) { 
                result.push({
                    id: node.id,
                    nombre: node.nombre,
                    level: level,
                    prefix: currentPrefix, 
                });
            }
            
            const childrenNodes = (node.children ?? []).filter(c => !('isEmployee' in c)) as DependenciaNode[]; 
            const childrenNodesLength = childrenNodes.length;

            if (childrenNodesLength > 0) {
                buildFlattenedList(childrenNodes, level + 1, currentPrefix);
            }
        });
    };
    
    buildFlattenedList(fullTree, 0);
    
    return result;
}


export default function Ver() {
  const { rol, cargando: cargandoUsuario } = useUserData(); // <--- 2. OBTENER ROL Y CARGANDO
  const { usuarios, loading: loadingUsuarios, fetchUsuarios } = useListaUsuarios() as unknown as { usuarios: UserWithDependency[], loading: boolean, fetchUsuarios: () => void };
  const { dependencias, loading: loadingDependencias, mutate: mutateDependencias } = useDependencias();
  const { infoUsuarios, loading: loadingInfo, mutate: mutateInfoUsuarios } = useInfoUsuarios();

  const supabase = createClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDependencia, setEditingDependencia] = useState<DependenciaNode | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dependenciaParaEmpleado, setDependenciaParaEmpleado] = useState<DependenciaNode | null>(null);
  const [openNodeIds, setOpenNodeIds] = useState<string[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [areAllOpen, setAreAllOpen] = useState(false);

  const [isInfoPersonalOpen, setIsInfoPersonalOpen] = useState(false);
  const [isContratoOpen, setIsContratoOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  const [usuarioIdParaTarjeta, setUsuarioIdParaTarjeta] = useState<string | null>(null);
  
  const { 
    cargando: cargandoDatosTarjeta,
    fetchUsuario
  } = useInfoUsuario(usuarioIdParaTarjeta); 

  const [isTarjetaOpen, setIsTarjetaOpen] = useState(false);
  
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });

  const hasPermission = rol === 'SUPER' || rol === 'SECRETARIO'; // <--- 3. CREAR FLAG DE PERMISO

  useEffect(() => {
    const isAnyModalOpen = isFormOpen || isInfoPersonalOpen || isContratoOpen || isTarjetaOpen || !!dependenciaParaEmpleado || descriptionModalOpen;
    
    if (isAnyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFormOpen, isInfoPersonalOpen, isContratoOpen, isTarjetaOpen, dependenciaParaEmpleado, descriptionModalOpen]);
  
  const handleExportar = async () => {
    const elementToExport = exportRef.current;
    if (!elementToExport) return;
    setIsExporting(true);
    const logoElement = document.getElementById('export-logo');
    elementToExport.classList.add('ml-20');
    if (logoElement) logoElement.classList.remove('hidden');
    try {
      const blob = await toBlob(elementToExport, { quality: 0.98, backgroundColor: '#ffffff', filter: (node: HTMLElement) => !node.classList?.contains('exclude-from-capture') });
      if (blob) { const url = URL.createObjectURL(blob); window.open(url, '_blank'); URL.revokeObjectURL(url); }
    } catch (error) {
        console.error('Error al exportar la imagen:', error);
        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    } finally {
        elementToExport.classList.remove('ml-20');
        if (logoElement) logoElement.classList.add('hidden');
        setIsExporting(false);
    }
  };

  const handleToggleAll = () => {
    if (areAllOpen) { setOpenNodeIds([]); } else { const allIds = getAllIds(finalTree); setOpenNodeIds(allIds); }
    setAreAllOpen(!areAllOpen);
  };

  const handleOpenForm = (dependencia: DependenciaNode | null = null) => { setEditingDependencia(dependencia); setPreselectedParentId(null); setIsFormOpen(true); };
  const handleOpenSubForm = (parent: DependenciaNode) => { setEditingDependencia(null); setPreselectedParentId(parent.id); setIsFormOpen(true); };
  const handleCloseForm = () => { setIsFormOpen(false); setEditingDependencia(null); setPreselectedParentId(null); };
  
  const handleSubmit = async (formData: FormData) => {
    const isEditing = !!editingDependencia;
    let dataToSubmit: any = { 
        nombre: formData.nombre, 
        parent_id: formData.parent_id ?? null, 
        descripcion: formData.descripcion || null, 
        es_puesto: formData.es_puesto || false, 
    };

    let error: any = null;

    if (isEditing) {
        const oldParentId = editingDependencia?.parent_id ?? null;
        const newParentId = formData.parent_id ?? null;
        
        if (oldParentId !== newParentId) {
            const { error: rpcError } = await supabase.rpc('cambiar_padre_y_reordenar_dependencia', {
                id_a_mover: editingDependencia!.id as string,
                nuevo_parent_id: newParentId,
            });
            error = rpcError;
        } else {
            const { error: updateError } = await supabase.from('dependencias').update(dataToSubmit).eq('id', editingDependencia!.id as string);
            error = updateError;
        }

    } else {
        let query = supabase.from('dependencias').select('no', { count: 'exact' });
        const parentId = formData.parent_id ?? null;
        if (parentId) { query = query.eq('parent_id', parentId); } else { query = query.is('parent_id', null); }
        const { count } = await query;
        dataToSubmit.no = (count || 0) + 1;
        
        const { error: insertError } = await supabase.from('dependencias').insert(dataToSubmit);
        error = insertError;
    }

    if (error) { 
        console.error('Error en handleSubmit:', error);
        toast.error('Ocurrió un error al guardar o reordenar.'); 
    } else { 
        handleCloseForm(); 
        mutateDependencias(); 
    }
  };
  
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: '¿Está seguro?', text: 'No podrá revertir esto.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (result.isConfirmed) {
        const { error } = await supabase.rpc('eliminar_dependencia_y_reordenar', { id_a_eliminar: id });
        if (error) { toast.error('Ocurrió un error al eliminar la dependencia.'); } else { await mutateDependencias(); }
    }
  };
  
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const { error } = await supabase.rpc('mover_dependencia', { id_a_mover: id, direccion: direction });
    if (error) { toast.error('Ocurrió un error al reordenar.'); } else { await mutateDependencias(); }
  };
  
  const handleMoveExtreme = async (id: string, direction: 'inicio' | 'final') => {
    const { error } = await supabase.rpc('mover_dependencia_extremo', { id_a_mover: id, direccion: direction });
    if (error) { toast.error('Ocurrió un error al reordenar.'); } else { await mutateDependencias(); }
  };
  
  const handleOpenEmpleadoModal = (dependencia: DependenciaNode) => { setDependenciaParaEmpleado(dependencia); };
  const handleCloseEmpleadoModal = () => { setDependenciaParaEmpleado(null); };
  
  const handleSaveEmpleado = async (newUserId: string, dependenciaId: string) => {
    const oldAssignment = infoUsuarios.find((info: InfoUsuario) => info.dependencia_id === dependenciaId);
    
    if (oldAssignment && oldAssignment.user_id !== newUserId) {
      const { error: unassignError } = await supabase.from('info_usuario').update({ dependencia_id: null }).eq('user_id', oldAssignment.user_id);
      if (unassignError) { toast.error('Error al desasignar al empleado anterior.'); handleCloseEmpleadoModal(); return; }
    }
    
    const { error: assignError } = await supabase.from('info_usuario').update({ dependencia_id: dependenciaId }).eq('user_id', newUserId);
    
    if (assignError) { 
        toast.error('Error al asignar el empleado.'); 
    } else { 
        const usuario = usuarios.find(u => u.id === newUserId); 
        const dependencia = findNodeById(finalTree, dependenciaId); 
        toast.success(`"${usuario?.nombre}" fue añadido a "${dependencia?.nombre}"`); 
        mutateInfoUsuarios(); 
    }
    handleCloseEmpleadoModal();
  };
  
  const handleDeleteEmpleado = async (userId: string) => {
    const result = await Swal.fire({ title: '¿Está seguro?', text: 'El empleado será desasignado de este puesto.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, desasignar', cancelButtonText: 'Cancelar', confirmButtonColor: '#d33' });
    if (result.isConfirmed) {
      const { error } = await supabase.from('info_usuario').update({ dependencia_id: null }).eq('user_id', userId);
      if(error){ toast.error('Error al desasignar al empleado.'); } else { toast.success('Empleado desvinculado de la dependencia.'); mutateInfoUsuarios(); }
    }
  };

  const handleOpenInfoPersonal = (usuario: Usuario) => { setSelectedUsuario(usuario); setIsInfoPersonalOpen(true); };
  const handleOpenContrato = (usuario: Usuario) => { setSelectedUsuario(usuario); setIsContratoOpen(true); }; 
  const handleCloseModals = () => { setIsInfoPersonalOpen(false); setIsContratoOpen(false); setSelectedUsuario(null); }; 

  const handleOpenTarjeta = (usuario: Usuario) => { 
    setUsuarioIdParaTarjeta(usuario.id); 
    setIsTarjetaOpen(true); 
  };
  const handleCloseTarjeta = () => { 
    setIsTarjetaOpen(false); 
    setUsuarioIdParaTarjeta(null); 
  };
  
  const handleOpenDescriptionModal = (title: string, description: string) => { setModalContent({ title, description }); setDescriptionModalOpen(true); };
  const handleCloseDescriptionModal = () => { setDescriptionModalOpen(false); setModalContent({ title: '', description: '' }); };

  const handleSubmitInfoPersonal = async (data: InfoPersonalFormData) => {
    if (!selectedUsuario) return;
    const { error } = await supabase.from('info_usuario').update({
      direccion: data.direccion,
      telefono: data.telefono,
      dpi: data.dpi,
      nit: data.nit,
      igss: data.igss,
      cuenta_no: data.cuenta_no
    }).eq('user_id', selectedUsuario.id);
    if (error) { toast.error('Error al guardar la información personal.'); } else { toast.success('Información guardada.'); handleCloseModals(); mutateInfoUsuarios(); fetchUsuarios(); }
  };

  const handleSubmitContrato = async (data: ContratoFormData) => {
    if (!selectedUsuario) return;
    const dataToSubmit = { ...data, user_id: selectedUsuario.id };
    const { error } = await supabase.from('info_contrato').insert(dataToSubmit);
    if (error) { toast.error('Error al guardar el contrato.'); } else { toast.success('Contrato guardado.'); handleCloseModals(); }
  };

  const finalTree = useMemo(() => {
    if (!dependencias || !infoUsuarios || !usuarios) return [];
    
    const filteredDependencias = !searchTerm ? dependencias : (() => { const lowercasedTerm = searchTerm.toLowerCase(); const dependencyMap = new Map(dependencias.map(d => [d.id, d])); const visibleIds = new Set<string>(); dependencias.forEach(dep => { if (dep.nombre.toLowerCase().includes(lowercasedTerm) || (dep.descripcion || '').toLowerCase().includes(lowercasedTerm)) { visibleIds.add(dep.id); let current = dep; while (current.parent_id && dependencyMap.has(current.parent_id)) { current = dependencyMap.get(current.parent_id)!; visibleIds.add(current.id); } } }); return dependencias.filter(d => visibleIds.has(d.id)); })();
    
    return buildDependencyTree(filteredDependencias, infoUsuarios, usuarios as Usuario[]);
  }, [dependencias, searchTerm, infoUsuarios, usuarios]);

  const selectableDependencias = useMemo(() => {
    if (!dependencias || !infoUsuarios || !usuarios) return [];
    
    return getSelectableDependencies(dependencias, infoUsuarios, usuarios as Usuario[], editingDependencia);
  }, [dependencias, infoUsuarios, usuarios, editingDependencia]);

  const empleadosAsignadosParaForm = useMemo(() => {
    if (!infoUsuarios || !dependencias) return [];

    const puestoMap = new Map(dependencias.map(dep => [dep.id, dep.nombre]));
    
    return infoUsuarios
        .filter(info => info.dependencia_id && puestoMap.has(info.dependencia_id))
        .map(info => ({
            userId: info.user_id,
            puestoNombre: puestoMap.get(info.dependencia_id!)!,
            puestoId: info.dependencia_id!,
        }));
  }, [infoUsuarios, dependencias]);

  const loading = loadingDependencias || loadingUsuarios || loadingInfo || cargandoDatosTarjeta || cargandoUsuario; // <--- 2. AÑADIR 'cargandoUsuario'

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="flex flex-col md:flex-row items-center mb-6 gap-2 md:gap-4">
        <h1 className="text-lg lg:text-2xl font-bold text-blue-600 text-center md:text-left whitespace-nowrap">Organización Municipal 🏛️</h1>
        <div className="relative w-full flex-grow exclude-from-capture"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full text-xs"/></div>
        <div className="w-full md:w-auto flex items-center gap-2 exclude-from-capture">
            {/* 4. APLICAR CONDICIÓN AL BOTÓN */}
            {hasPermission && (
              <Button onClick={() => handleOpenForm()} className="w-full text-xs md:w-auto bg-blue-100 text-blue-800 hover:bg-blue-200"><PlusCircle className="mr-2 h-4 w-4" /> Nueva Dependencia</Button>
            )}
            <Button onClick={handleExportar} disabled={isExporting} className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"><Download className="h-4 w-4" /></Button>
            <Button onClick={handleToggleAll} className="text-xs bg-green-100 text-green-800 hover:bg-green-200"><motion.div animate={{ rotate: areAllOpen ? 90 : 0 }} transition={{ duration: 0.2 }}><ChevronsUpDown className="h-4 w-4" /></motion.div></Button>
        </div>
      </div>

      <div ref={exportRef} className='pb-10'>
        <div id="export-logo" className="hidden text-center mb-4"><img src="/images/logo-muni.png" alt="Logo Municipalidad" className="h-40 w-auto inline-block" /><h2 className="text-2xl font-bold mt-2 text-blue-600">Organización Municipal</h2></div>
        {isFormOpen && (
            <DependenciaForm 
                isOpen={isFormOpen} 
                onClose={handleCloseForm} 
                onSubmit={handleSubmit} 
                initialData={editingDependencia} 
                todasLasDependencias={dependencias} 
                preselectedParentId={preselectedParentId} 
                selectableDependencies={selectableDependencias} 
            />
        )}
        
        <DependenciaList 
            dependencias={finalTree} 
            rol={rol} 
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
            onAddSub={handleOpenSubForm} 
            onMove={handleMove} 
            onMoveExtreme={handleMoveExtreme} 
            onAddEmpleado={handleOpenEmpleadoModal} 
            onDeleteEmpleado={handleDeleteEmpleado} 
            onOpenInfoPersonal={handleOpenInfoPersonal} 
            onOpenContrato={handleOpenContrato} 
            onViewCard={handleOpenTarjeta} 
            onOpenDescription={handleOpenDescriptionModal} 
            openNodeIds={openNodeIds} 
            setOpenNodeIds={setOpenNodeIds} 
        />
        
        <EmpleadoForm 
            isOpen={!!dependenciaParaEmpleado} 
            onClose={handleCloseEmpleadoModal} 
            dependencia={dependenciaParaEmpleado} 
            usuarios={usuarios} 
            empleadosAsignados={empleadosAsignadosParaForm} 
            todasLasDependencias={dependencias}
            onSave={handleSaveEmpleado} 
        />
        <InfoPersonalForm isOpen={isInfoPersonalOpen} onClose={handleCloseModals} onSubmit={handleSubmitInfoPersonal} usuario={selectedUsuario} initialData={infoUsuarios.find((i: InfoUsuario) => i.user_id === selectedUsuario?.id)} />
        <ContratoForm isOpen={isContratoOpen} onClose={handleCloseModals} onSubmit={handleSubmitContrato} usuario={selectedUsuario} initialData={null} />
        
        <TarjetaEmpleado 
          isOpen={isTarjetaOpen} 
          onClose={handleCloseTarjeta} 
          userId={usuarioIdParaTarjeta} 
        />

        <DescriptionModal isOpen={descriptionModalOpen} onClose={handleCloseDescriptionModal} title={modalContent.title} description={modalContent.description} />
      </div>
    </div>
  );
}