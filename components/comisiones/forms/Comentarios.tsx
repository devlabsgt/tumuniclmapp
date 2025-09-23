'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { X, Pencil, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ComisionFormData } from '@/lib/comisiones/esquemas';

export default function Comentarios() {
  const { setValue, watch } = useFormContext<ComisionFormData>();
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true); 

  const comentarios = watch('comentarios') || [];

  const handleAgregarComentario = () => {
    if (nuevoComentario.trim() !== '') {
      const comentariosActualizados = [...comentarios];
      if (editingIndex !== null) {
        comentariosActualizados[editingIndex] = nuevoComentario.trim();
        setEditingIndex(null);
      } else {
        comentariosActualizados.push(nuevoComentario.trim());
      }
      setValue('comentarios', comentariosActualizados, { shouldValidate: true });
      setNuevoComentario('');
    }
  };

  const handleQuitarComentario = (index: number) => {
    const comentariosFiltrados = comentarios.filter((_, i) => i !== index);
    setValue('comentarios', comentariosFiltrados, { shouldValidate: true });
  };

  const handleEditarComentario = (index: number) => {
    setNuevoComentario(comentarios[index]);
    setEditingIndex(index);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const reorderedComentarios = Array.from(comentarios);
    const [removed] = reorderedComentarios.splice(result.source.index, 1);
    reorderedComentarios.splice(result.destination.index, 0, removed);
    setValue('comentarios', reorderedComentarios, { shouldValidate: true });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 rounded-md hover:bg-gray-100 transition-colors p-2 -ml-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>Comentarios</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {isOpen && (
          <div className="flex-grow ml-4">
            <div className='flex gap-2'>
              <Input
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escriba aquí los comentarios..."
              />
              <Button 
                type="button" 
                onClick={handleAgregarComentario} 
                className={editingIndex !== null ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {editingIndex !== null ? <Check size={20} /> : <Plus size={20} />}
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          {comentarios.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="comentarios-droppable">
                {(droppableProvided) => (
                  <ul
                    className="list-disc list-inside mt-4 space-y-2"
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {comentarios.map((coment, index) => (
                      <Draggable key={index} draggableId={index.toString()} index={index}>
                        {(draggableProvided) => (
                          <li
                            className="text-sm text-gray-700 flex justify-between items-center border-b border-gray-200 pb-2"
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                          >
                            {coment}
                            <div className="flex gap-1">
                              <button type="button" onClick={() => handleQuitarComentario(index)} className="p-1 text-red-500 hover:text-red-700 rounded-sm hover:bg-red-100"><X size={14} /></button>
                              <button type="button" onClick={() => handleEditarComentario(index)} className="p-1 text-blue-500 hover:text-blue-700 rounded-sm hover:bg-blue-100"><Pencil size={14} /></button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}