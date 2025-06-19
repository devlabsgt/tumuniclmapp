'use client';

import { useAutoLogout } from '@/hooks/useAutoLogout';

export default function AutoLogoutWrapper() {
  useAutoLogout(); // Ya usa 5 minutos por defecto
  return null;
}
