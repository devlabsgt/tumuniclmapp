'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

interface Props<T> {
  items: T[];
  onSelect: (item: T) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  keyAccessor: (item: T) => string | number;
  displayAccessor: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
}

export const AutoComplete = <T,>({
  items,
  onSelect,
  searchTerm,
  onSearchChange,
  keyAccessor,
  displayAccessor,
  placeholder,
  disabled,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (items.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className={items.length > 0 && isOpen ? 'pl-9 rounded-b-none' : 'pl-9'}
        disabled={disabled}
      />
      <AnimatePresence>
        {isOpen && items.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full bg-white border border-gray-200 rounded-md rounded-t-none shadow-lg max-h-60 overflow-y-auto"
          >
            {items.map(item => (
              <li
                key={keyAccessor(item)}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              >
                {displayAccessor(item)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};