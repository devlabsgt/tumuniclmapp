'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import { 
  X, Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Save, GripVertical, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Minus, Heading1, Heading2, Heading3, Pilcrow
} from 'lucide-react';

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
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 items-center">
      {/* Grupo de Tamaños (Encabezados) */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-black' : ''}`}
          title="Muy Grande (H1)"
        >
          <Heading1 className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-black' : ''}`}
          title="Grande (H2)"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-black' : ''}`}
          title="Mediano (H3)"
        >
          <Heading3 className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('paragraph') ? 'bg-gray-200 text-black' : ''}`}
          title="Texto Normal"
        >
          <Pilcrow className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Grupo de Estilos */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200 text-black' : ''}`}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200 text-black' : ''}`}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-gray-200 text-black' : ''}`}
          title="Subrayado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200 text-black' : ''}`}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Grupo de Alineación */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-black' : ''}`}
          title="Izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-black' : ''}`}
          title="Centro"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-black' : ''}`}
          title="Derecha"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 text-black' : ''}`}
          title="Justificado"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Grupo de Listas y Otros */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-gray-200 text-black' : ''}`}
          title="Viñetas"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-gray-200 text-black' : ''}`}
          title="Numeración"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-gray-200 text-black' : ''}`}
          title="Cita"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="h-8 w-8 p-0"
          title="Línea Horizontal"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default function DescriptionModal({ isOpen, onClose, onSave, title, description }: DescriptionModalProps) {
  const [width, setWidth] = useState<number>(1000);
  const isResizing = useRef(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
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
      const minW = 600;

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
            .ProseMirror:focus {
              outline: none;
            }
            /* Ajuste de tamaños visuales para los encabezados dentro del editor */
            .ProseMirror h1 { font-size: 2em; line-height: 1.2; font-weight: 800; margin-bottom: 0.5em; }
            .ProseMirror h2 { font-size: 1.5em; line-height: 1.3; font-weight: 700; margin-bottom: 0.5em; }
            .ProseMirror h3 { font-size: 1.25em; line-height: 1.4; font-weight: 600; margin-bottom: 0.5em; }
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