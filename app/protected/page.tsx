'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function ProtectedPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/sign-in');
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  if (loading) return <p className="p-4 text-center">Cargando...</p>;

  const irAlDashboard = () => {
    const rol = user.user_metadata?.rol;
    if (rol === 'Admin') {
      router.push('/protected/admin');
    } else {
      router.push('/protected/user');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center pt-12 px-4">
      <div className="text-center w-full max-w-xl">
        <h1 className="text-xl md:text-4xl font-bold mb-4">Bienvenido al sistema de Gestión Municipal</h1>
        <p className="text-xl md:text-4xl text-gray-600 mb-6">Selecciona una opción.</p>

        <Button onClick={irAlDashboard} className="text-xl md:text-2xl px-6 h-16 w-full">
          Entrar al Sistema
        </Button>
      </div>
    </div>
  );
}
