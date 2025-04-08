'use client';

import { Suspense } from 'react';
import { SignupForm } from './signupForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SignupForm />
    </Suspense>
  );
}
