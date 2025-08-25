'use client';

import { useRef, useEffect } from 'react';

interface AnimatedIconProps {
  iconKey: string;
  className?: string;
  trigger?: string;
  delay?: string | number;
  speed?: string | number;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
}

export default function AnimatedIcon({ 
  iconKey, 
  className = 'w-24 h-24',
  trigger,
  delay = 0,
  speed = 2,
  primaryColor, 
  secondaryColor, 
  tertiaryColor 
}: AnimatedIconProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const baseUrl = 'https://cdn.lordicon.com/';

  useEffect(() => {
    if (iconRef.current && iconKey) {
      const fullUrl = `${baseUrl}${iconKey}.json`;
      const icon = document.createElement('lord-icon');
      
      icon.setAttribute('src', fullUrl);
      if (trigger) {
        icon.setAttribute('trigger', trigger);
      }
      icon.setAttribute('delay', String(delay));
      icon.setAttribute('speed', String(speed));
      icon.style.width = '100%';
      icon.style.height = '100%';

      const colors = [];
      if (primaryColor) colors.push(`primary:${primaryColor}`);
      if (secondaryColor) colors.push(`secondary:${secondaryColor}`);
      if (tertiaryColor) colors.push(`tertiary:${tertiaryColor}`);
      
      if (colors.length > 0) {
        icon.setAttribute('colors', colors.join(','));
      }

      iconRef.current.innerHTML = '';
      iconRef.current.appendChild(icon);
    }
  }, [iconKey, trigger, delay, speed, primaryColor, secondaryColor, tertiaryColor]);

  return <div ref={iconRef} className={className} />;
}