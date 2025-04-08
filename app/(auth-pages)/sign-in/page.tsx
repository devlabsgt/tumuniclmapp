'use client';

import { Suspense } from 'react';
import { LoginForm } from './loginForm';

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
