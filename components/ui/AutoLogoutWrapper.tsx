'use client';

import { useAutoLogout } from '@/hooks/useAutoLogout';

export default function AutoLogoutWrapper() {
  useAutoLogout(); 
  return null;
}
