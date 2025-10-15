'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export default function DescriptionModal({ isOpen, onClose, title, description }: DescriptionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] relative mx-auto flex flex-col"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 flex-shrink-0">
              <div className="flex items-start justify-between border-b pb-3 border-gray-200">
                <h2 className="text-xs lg:text-xl font-semibold text-blue-600 pr-4">
                  {title}
                </h2>
                <Button 
                  variant="ghost" 
                  className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors duration-200 rounded-md px-3 h-auto ml-auto" 
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              </div>
            </div>
            
            <div className="px-6 overflow-y-auto custom-scrollbar flex-grow">
              <p className="text-xs lg:text-lg text-gray-700 whitespace-pre-wrap p-6" style={{ lineHeight: '2.5' }} 
>
                {description}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}