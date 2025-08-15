'use client';

import { Suspense } from 'react';
import { LoginForm } from './loginForm';
import Cargando from '@/components/ui/animations/LoadingAnimation';

export default function SignInPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <LoginForm />
    </Suspense>
  );
}
