//Ver.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { motion } from 'framer-motion';
import DependenciaForm, { type FormData } from './forms/Dependencia';
import EmpleadoForm from './forms/Empleado';
import Cargando from '@/components/ui/animations/Cargando';
import DependenciaList from './DependenciaList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Download, ChevronsUpDown } from 'lucide-react';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/database.types';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import { useListaUsuarios } from '@/hooks/usuarios/useListarUsuarios';
import { useInfoUsuarios, InfoUsuario } from '@/hooks/usuarios/useInfoUsuario';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DependenciaNode } from './DependenciaItem';
import { Usuario } from '@/lib/usuarios/esquemas';

export type Dependencia = Database['public']['Tables']['dependencias']['Row'];

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

    infoUsuarios.forEach(info => {
        const parentNode = nodeMap.get(info.dependencia_id);
        const usuario = userMap.get(info.user_id);
        if (parentNode && usuario) {
            parentNode.children.push({ isEmployee: true, usuario: usuario });
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


export default function Ver() {
  const { dependencias, loading: loadingDependencias, mutate: mutateDependencias } = useDependencias();
  const { usuarios, loading: loadingUsuarios } = useListaUsuarios();
  const { infoUsuarios, loading: loadingInfo, mutate: mutateInfoUsuarios } = useInfoUsuarios();
  
  const supabase = createClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDependencia, setEditingDependencia] = useState<Dependencia | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dependenciaParaEmpleado, setDependenciaParaEmpleado] = useState<DependenciaNode | null>(null);
  const [openNodeIds, setOpenNodeIds] = useState<string[]>([]);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [areAllOpen, setAreAllOpen] = useState(false);

  const findNodeById = (nodes: DependenciaNode[], id: string): DependenciaNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNodeById(node.children.filter(c => !('isEmployee' in c)) as DependenciaNode[], id);
      if (found) return found;
    }
    return null;
  };

  const handleExportar = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    const logoElement = document.getElementById('export-logo');
    if (logoElement) logoElement.classList.remove('hidden');

    try {
      const blob = await toBlob(exportRef.current, { 
          quality: 0.98, 
          backgroundColor: '#ffffff',
          filter: (node: HTMLElement) => !node.classList?.contains('exclude-from-capture')
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }

    } catch (error) {
        console.error('Error al exportar la imagen:', error);
        Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    } finally {
        if (logoElement) logoElement.classList.add('hidden');
        setIsExporting(false);
    }
  };
  
  const handleToggleAll = () => {
    if (areAllOpen) {
        setOpenNodeIds([]);
    } else {
        const allIds = getAllIds(finalTree);
        setOpenNodeIds(allIds);
    }
    setAreAllOpen(!areAllOpen);
  };

  const handleOpenForm = (dependencia: Dependencia | null = null) => {
    setEditingDependencia(dependencia);
    setPreselectedParentId(null);
    setIsFormOpen(true);
  };
  const handleOpenSubForm = (parent: Dependencia) => {
    setEditingDependencia(null);
    setPreselectedParentId(parent.id);
    setIsFormOpen(true);
  };
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDependencia(null);
    setPreselectedParentId(null);
  };
  const handleSubmit = async (formData: FormData) => {
    const isEditing = !!editingDependencia;
    let dataToSubmit: any = {
      nombre: formData.nombre,
      parent_id: formData.parent_id ?? null,
      descripcion: formData.descripcion || null,
    };
    if (!isEditing) {
        let query = supabase.from('dependencias').select('no', { count: 'exact' });
        const parentId = formData.parent_id ?? null;
        if (parentId) {
          query = query.eq('parent_id', parentId);
        } else {
          query = query.is('parent_id', null);
        }
        const { count } = await query;
        dataToSubmit.no = (count || 0) + 1;
    }
    const { error } = isEditing
      ? await supabase.from('dependencias').update(dataToSubmit).eq('id', editingDependencia!.id)
      : await supabase.from('dependencias').insert(dataToSubmit);
    if (error) { toast.error('Ocurrió un error al guardar.'); } 
    else { handleCloseForm(); mutateDependencias(); }
  };
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: '¿Está seguro?', text: "No podrá revertir esto.", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (result.isConfirmed) {
        const { error } = await supabase.rpc('eliminar_dependencia_y_reordenar', { id_a_eliminar: id });
        if (error) { toast.error('Ocurrió un error al eliminar la dependencia.'); } 
        else { await mutateDependencias(); }
    }
  };
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const { error } = await supabase.rpc('mover_dependencia', { id_a_mover: id, direccion: direction });
    if (error) { toast.error('Ocurrió un error al reordenar.'); } 
    else { await mutateDependencias(); }
  };
  const handleOpenEmpleadoModal = (dependencia: DependenciaNode) => {
    setDependenciaParaEmpleado(dependencia);
  };
  const handleCloseEmpleadoModal = () => {
    setDependenciaParaEmpleado(null);
  };
  const handleSaveEmpleado = async (newUserId: string, dependenciaId: string) => {
    const empleadoInfo = infoUsuarios.find(info => info.user_id === newUserId);
    if (empleadoInfo && empleadoInfo.dependencia_id && empleadoInfo.dependencia_id !== dependenciaId) {
        const dependenciaActual = dependencias.find(dep => dep.id === empleadoInfo.dependencia_id);
        Swal.fire({
            title: 'Empleado ya asignado',
            html: `
                <p>Este empleado ya está asignado al puesto</p>
                <p style="text-align: center; font-weight: bold; margin: 0.5rem 0;">${dependenciaActual?.nombre}</p>
                <p>Desasígnelo antes de reasignar</p>
            `,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563eb'      
        });
        handleCloseEmpleadoModal();
        return;
    }

    const oldAssignment = infoUsuarios.find(info => info.dependencia_id === dependenciaId);
    if (oldAssignment && oldAssignment.user_id !== newUserId) {
      const { error: unassignError } = await supabase
        .from('info_usuario')
        .update({ dependencia_id: null })
        .eq('user_id', oldAssignment.user_id);

      if (unassignError) {
        toast.error('Error al desasignar al empleado anterior.');
        handleCloseEmpleadoModal();
        return;
      }
    }

    const { error: assignError } = await supabase
      .from('info_usuario')
      .update({ dependencia_id: dependenciaId })
      .eq('user_id', newUserId);
      
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
  const handleEditEmpleado = (empleado: Usuario, parentId: string) => {
    const parentNode = findNodeById(finalTree, parentId);
    if (parentNode) {
      handleOpenEmpleadoModal(parentNode);
    }
  };
  const handleDeleteEmpleado = async (userId: string) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "El empleado será desasignado de este puesto.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
  
    if (result.isConfirmed) {
      const { error } = await supabase
        .from('info_usuario')
        .update({ dependencia_id: null })
        .eq('user_id', userId);
  
      if(error){
        toast.error('Error al desasignar el empleado.');
      } else {
        toast.success('Empleado desvinculado de la dependencia.');
        mutateInfoUsuarios();
      }
    }
  };

  const finalTree = useMemo(() => {
    if (!dependencias || !infoUsuarios || !usuarios) return [];
    
    const filteredDependencias = !searchTerm 
      ? dependencias
      : (() => {
          const lowercasedTerm = searchTerm.toLowerCase();
          const dependencyMap = new Map(dependencias.map(d => [d.id, d]));
          const visibleIds = new Set<string>();
          dependencias.forEach(dep => {
            if (dep.nombre.toLowerCase().includes(lowercasedTerm) || (dep.descripcion || '').toLowerCase().includes(lowercasedTerm)) {
              visibleIds.add(dep.id);
              let current = dep;
              while (current.parent_id && dependencyMap.has(current.parent_id)) {
                current = dependencyMap.get(current.parent_id)!;
                visibleIds.add(current.id);
              }
            }
          });
          return dependencias.filter(d => visibleIds.has(d.id));
        })();

    return buildDependencyTree(filteredDependencias, infoUsuarios, usuarios);
  }, [dependencias, searchTerm, infoUsuarios, usuarios]);
  
  const loading = loadingDependencias || loadingUsuarios || loadingInfo;
  if (loading) return <Cargando />;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      <div className="flex flex-col md:flex-row items-center mb-6 gap-2 md:gap-4">
        <h1 className="text-lg lg:text-2xl font-bold text-blue-600 text-center md:text-left whitespace-nowrap">Organización Municipal 🏛️</h1>
        <div className="relative w-full flex-grow exclude-from-capture">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full text-xs"
          />
        </div>
        <div className="w-full md:w-auto flex items-center gap-2 exclude-from-capture">
            <Button onClick={() => handleOpenForm()} className="w-full text-xs md:w-auto bg-blue-100 text-blue-800 hover:bg-blue-200">
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva Dependencia
            </Button>
            <Button onClick={handleExportar} disabled={isExporting} className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
              {isExporting ? <Cargando /> : <Download className="h-4 w-4" />}
            </Button>
            <Button onClick={handleToggleAll} className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                <motion.div animate={{ rotate: areAllOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronsUpDown className="h-4 w-4" />
                </motion.div>
            </Button>
        </div>
      </div>

      <div ref={exportRef} className='pb-10'>
        <div id="export-logo" className="hidden text-center mb-4">
          <img src="/images/logo-muni.png" alt="Logo Municipalidad" className="h-40 w-auto inline-block" />
          <h2 className="text-2xl font-bold mt-2 text-blue-600">Organización Municipal</h2>
        </div>
      
        {isFormOpen && (
          <DependenciaForm 
            isOpen={isFormOpen} 
            onClose={handleCloseForm} 
            onSubmit={handleSubmit} 
            initialData={editingDependencia} 
            todasLasDependencias={dependencias} 
            preselectedParentId={preselectedParentId} 
          />
        )}
        
        <DependenciaList
          dependencias={finalTree}
          onEdit={handleOpenForm}
          onDelete={handleDelete}
          onAddSub={handleOpenSubForm}
          onMove={handleMove}
          onAddEmpleado={handleOpenEmpleadoModal}
          onEditEmpleado={handleEditEmpleado}
          onDeleteEmpleado={handleDeleteEmpleado}
          openNodeIds={openNodeIds}
          setOpenNodeIds={setOpenNodeIds}
        />
        
        <EmpleadoForm
          isOpen={!!dependenciaParaEmpleado}
          onClose={handleCloseEmpleadoModal}
          dependencia={dependenciaParaEmpleado}
          usuarios={usuarios}
          onSave={handleSaveEmpleado}
        />
      </div>
    </div>
  );
}
