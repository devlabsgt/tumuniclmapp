'use client';

import { useState, useEffect } from 'react';
import LoadingAnimation from "@/components/ui/animations/LoadingAnimation"; 
import { LoginForm } from "./login/Form";

export default function Hero() {
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCargando(false);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  return cargando ? <LoadingAnimation /> : <LoginForm />;
}