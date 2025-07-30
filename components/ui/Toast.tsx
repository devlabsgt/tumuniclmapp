'use client'; 

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number; 
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 5000 }) => {
  const [progress, setProgress] = useState(100); 

  useEffect(() => {
    if (duration > 0) {
      const interval = 100; 
      const steps = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const newProgress = 100 - (currentStep / steps) * 100;
        setProgress(Math.max(0, newProgress)); 

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [duration]);

  return (
    // ¡NINGUNA CLASE O ATRIBUTO 'style' AQUÍ!
    <div> 
      <div>
        <span>{message}</span> 
      </div>
      {duration > 0 && (
        // Esta barra de progreso no tendrá estilos visuales de mi parte.
        // Solo el 'width' que es funcional para la animación.
        <div>
          <div 
            style={{ width: `${progress}%` }} 
          ></div>
        </div>
      )}
    </div>
  );
};