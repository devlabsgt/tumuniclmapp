'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import SubscribeButton from '@/components/push/SubscribeButton';

interface ProfileProps {
  userId: string | null;
  isSuper: boolean;
  onShowTarjeta: () => void;
}

export default function Profile({ userId, isSuper, onShowTarjeta }: ProfileProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div 
      className={`relative order-2 md:order-4 flex gap-2 ${isSuper ? 'md:col-span-4' : 'md:col-span-6'}`} 
      onMouseEnter={() => setHoveredButton('profile')} 
      onMouseLeave={() => setHoveredButton(null)}
    >
      <Button 
        onClick={onShowTarjeta} 
        className="flex-grow gap-2 text-base md:text-lg h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm border border-blue-200 dark:border-blue-800 font-bold transition-colors duration-200"
      >
        <AnimatedIcon iconKey="hroklero" className="w-8 h-8" trigger={hoveredButton === 'profile' ? 'loop' : undefined} />
        <span className="truncate">Mi Información</span>
      </Button>
      <div className="w-[3.5rem] flex-shrink-0">
        {userId && <SubscribeButton userId={userId} />}
      </div>
    </div>
  );
}