'use client';

import React, { useState, useMemo } from 'react';
import DependenciaForm, { type FormData } from './forms/Dependencia';
import Cargando from '@/components/ui/animations/Cargando';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, PlusCircle, GitBranchPlus, ChevronRight, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/database.types';
import { useDependencias } from '@/hooks/dependencias/useDependencias';
import { motion, AnimatePresence } from 'framer-motion';

export type Dependencia = Database['public']['Tables']['dependencias']['Row'];

interface DependenciaNode extends Dependencia {
  children: DependenciaNode[];
}

const DependenciaItem = ({ node, onEdit, onDelete, onAddSub, level, prefix }: { node: DependenciaNode, onEdit: (d: Dependencia) => void, onDelete: (id: string) => void, onAddSub: (parent: Dependencia) => void, level: number, prefix: string }) => {
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsible = hasChildren && level < 2;
  const [isOpen, setIsOpen] = useState(hasChildren && !isCollapsible);

  const handleToggle = () => {
    if (isCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center justify-between p-2 rounded-md transition-colors ${isCollapsible ? 'cursor-pointer hover:bg-gray-100' : ''} ${level > 0 ? 'bg-gray-50' : 'bg-white'}`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={handleToggle}
      >
        <div className="flex-grow flex items-center gap-3 min-w-0">
          {isCollapsible ? (
            <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
          ) : (
            <div className="w-4 flex-shrink-0" /> 
          )}
          <div className="flex items-center justify-center h-7 w-7 bg-blue-100 text-blue-800 rounded-md font-bold text-xs shadow-sm flex-shrink-0">
            {prefix}
          </div>
          <div className="min-w-0">
            <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">{node.nombre}</span>
            {node.descripcion && (
              <p className="text-xs text-gray-500 mt-1 pr-2 truncate">{node.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Añadir Subdependencia" onClick={() => onAddSub(node)}>
            <GitBranchPlus className="h-4 w-4 text-sky-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => onEdit(node)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" title="Eliminar" onClick={() => onDelete(node.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {node.children.map((child, index) => <DependenciaItem key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} onAddSub={onAddSub} level={level + 1} prefix={`${prefix}.${index + 1}`} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Ver() {
  const { dependencias, loading, mutate } = useDependencias();
  const supabase = createClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDependencia, setEditingDependencia] = useState<Dependencia | null>(null);
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    const dataToSubmit = {
      nombre: formData.nombre,
      parent_id: formData.parent_id || null,
      descripcion: formData.descripcion || null,
    };
    const { error } = editingDependencia
      ? await supabase.from('dependencias').update(dataToSubmit).eq('id', editingDependencia.id)
      : await supabase.from('dependencias').insert(dataToSubmit);
    if (error) Swal.fire('Error', 'Ocurrió un error al guardar.', 'error');
    else {
      Swal.fire('Éxito', 'Dependencia guardada.', 'success');
      handleCloseForm();
      mutate();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({ title: '¿Está seguro?', text: "No podrá revertir esto.", icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (result.isConfirmed) {
      const { error } = await supabase.from('dependencias').delete().eq('id', id);
      if (error) Swal.fire('Error', 'No se pudo eliminar.', 'error');
      else {
        Swal.fire('Eliminada', 'La dependencia ha sido eliminada.', 'success');
        mutate();
      }
    }
  };

  const dependenciasFiltradas = useMemo(() => {
    if (!searchTerm) {
      return dependencias;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const dependencyMap = new Map(dependencias.map(d => [d.id, d]));
    const visibleIds = new Set<string>();

    dependencias.forEach(dep => {
      const nombreMatch = dep.nombre.toLowerCase().includes(lowercasedTerm);
      const descripcionMatch = (dep.descripcion || '').toLowerCase().includes(lowercasedTerm);

      if (nombreMatch || descripcionMatch) {
        visibleIds.add(dep.id);
        let current = dep;
        while (current.parent_id && dependencyMap.has(current.parent_id)) {
          current = dependencyMap.get(current.parent_id)!;
          visibleIds.add(current.id);
        }
      }
    });
    return dependencias.filter(d => visibleIds.has(d.id));
  }, [dependencias, searchTerm]);
  
  const arbolDependencias = useMemo(() => {
    const map = new Map(dependenciasFiltradas.map(d => [d.id, { ...d, children: [] } as DependenciaNode]));
    const roots: DependenciaNode[] = [];
    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    roots.sort((a, b) => a.nombre.localeCompare(b.nombre));
    roots.forEach(root => root.children.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return roots;
  }, [dependenciasFiltradas]);
  
  if (loading) return <Cargando />;

  return (
    <div className="p-1 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-center md:text-left">Gestión de Dependencias</h1>
        <Button onClick={() => handleOpenForm()} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva Dependencia Principal
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full"
        />
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

      <div className="mt-6 border rounded-lg bg-gray-50/50 space-y-1">
        {arbolDependencias.length > 0
          ? arbolDependencias.map((node, index) => <DependenciaItem key={node.id} node={node} onEdit={handleOpenForm} onDelete={handleDelete} onAddSub={handleOpenSubForm} level={0} prefix={`${index + 1}`} />)
          : <p className="text-center text-gray-500 p-4">No hay resultados para su búsqueda.</p>
        }
      </div>
    </div>
  );
}