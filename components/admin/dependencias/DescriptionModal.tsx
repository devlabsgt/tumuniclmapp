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
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            
            <div className="p-8">
              <h2 className="text-lg font-bold mb-4">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}