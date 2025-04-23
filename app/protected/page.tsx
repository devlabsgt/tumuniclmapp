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
    <div className="flex-1 w-full flex flex-col gap-12 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">¡Bienvenido!</h1>
        <p className="text-gray-600 mb-6">Ya estás autenticado.</p>
        <Button onClick={irAlDashboard} className="text-lg px-6 h-12">
          Entrar al Dashboard
        </Button>
      </div>
    </div>
  );
}
