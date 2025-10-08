'use client';

import React, { useState, useMemo } from 'react';
import DependenciaForm, { type FormData } from './forms/Dependencia';
import EmpleadoForm from './forms/Empleado';
import Cargando from '@/components/ui/animations/Cargando';
import DependenciaList from './DependenciaList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
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

  const findNodeById = (nodes: DependenciaNode[], id: string): DependenciaNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNodeById(node.children.filter(c => !('isEmployee' in c)) as DependenciaNode[], id);
      if (found) return found;
    }
    return null;
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
  const handleSaveEmpleado = async (userId: string, dependenciaId: string) => {
    const { error } = await supabase
      .from('info_usuario')
      .update({ dependencia_id: dependenciaId })
      .eq('user_id', userId);
      
    if (error) {
      toast.error('Error al asignar el empleado.');
    } else {
      const usuario = usuarios.find(u => u.id === userId);
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
  
  if (loadingDependencias || loadingUsuarios || loadingInfo) return <Cargando />;

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-xs font-bold text-blue-600 text-center md:text-left">Jerarquía Municipal 🏛️</h1>
        <Button onClick={() => handleOpenForm()} className="w-full text-xs md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva Dependencia
        </Button>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Buscar por nombre o descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full text-xs" />
      </div>
      {isFormOpen && (
        <DependenciaForm isOpen={isFormOpen} onClose={handleCloseForm} onSubmit={handleSubmit} initialData={editingDependencia} todasLasDependencias={dependencias} preselectedParentId={preselectedParentId} />
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
  );
}