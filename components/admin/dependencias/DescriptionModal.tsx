'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { X, Bold, Italic, List, ListOrdered, Save, GripVertical } from 'lucide-react';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  title: string;
  description: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200 text-black' : ''}
        title="Negrita"
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200 text-black' : ''}
        title="Cursiva"
      >
        <Italic className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200 text-black' : ''}
        title="Viñetas"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200 text-black' : ''}
        title="Numeración"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default function DescriptionModal({ isOpen, onClose, onSave, title, description }: DescriptionModalProps) {
  const [width, setWidth] = useState<number>(1000);
  const isResizing = useRef(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: description,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl !max-w-full w-full h-full p-6 min-h-[300px] prose-li:marker:text-gray-500 prose-ol:list-decimal prose-ul:list-disc focus:outline-none bg-white',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWidth(Math.min(1000, window.innerWidth * 0.95));
    }
  }, []);

  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setContent(description);
    }
  }, [description, editor, isOpen]);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const center = window.innerWidth / 2;
      const distanceFromCenter = e.clientX - center;
      
      let newWidth = distanceFromCenter * 2;
      
      const maxW = window.innerWidth * 0.98;
      const minW = 400;

      if (newWidth > maxW) newWidth = maxW;
      if (newWidth < minW) newWidth = minW;

      setWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isOpen, resize, stopResizing]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <style jsx global>{`
            .ProseMirror {
              min-width: 100% !important;
              max-width: none !important;
              width: 100% !important;
            }
            .ProseMirror p {
              max-width: none !important;
            }
          `}</style>

          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 relative flex flex-row h-[90vh] overflow-hidden"
            style={{ width: width }}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col flex-grow min-w-0">
              <div className="px-6 pt-4 flex-shrink-0">
                <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                  <h2 className="text-xl lg:text-2xl font-semibold text-blue-600 pr-4 truncate">
                    {title}
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-full" 
                    onClick={onClose}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col flex-grow overflow-hidden">
                <MenuBar editor={editor} />
                <div className="flex-grow overflow-auto custom-scrollbar bg-white w-full relative">
                  <EditorContent editor={editor} className="w-full h-full" />
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </Button>
              </div>
            </div>

            <div
              className="w-5 cursor-col-resize flex items-center justify-center hover:bg-gray-100 bg-gray-50 border-l border-gray-200 transition-colors z-50 flex-shrink-0 group"
              onMouseDown={startResizing}
            >
              <GripVertical className="w-4 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}