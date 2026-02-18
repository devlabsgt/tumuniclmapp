'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { actualizarInfoPersonal, obtenerInfoUsuario } from './action';
import Swal from 'sweetalert2';

export function useInfoForm(userId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey = ['info_usuario', userId];

  // 1. QUERY: Obtener los datos con caché de 6 minutos
  const { data: usuarioData, isLoading: isLoadingData } = useQuery({
    queryKey: queryKey,
    queryFn: () => obtenerInfoUsuario(userId),
    enabled: !!userId,
    
    // --- AQUÍ ESTÁ LA MAGIA DEL CACHÉ ---
    staleTime: 1000 * 60 * 6, // 6 minutos: Los datos se consideran frescos por este tiempo (no recarga auto)
    gcTime: 1000 * 60 * 10,   // 10 minutos: Tiempo que permanecen en memoria si no se usan (Garbage Collection)
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
  });

  // 2. MUTATION: Guardar los datos
  const mutation = useMutation({
    mutationFn: (formData: any) => actualizarInfoPersonal(userId, formData),
    onSuccess: (result) => {
      if (result.success) {
        // Al guardar, invalidamos el caché para forzar una recarga inmediata
        // ignorando los 6 minutos, para que el usuario vea sus cambios nuevos.
        queryClient.invalidateQueries({ queryKey: queryKey });
        
        router.refresh();

        Swal.fire({
          title: '¡Guardado!',
          text: 'La información personal ha sido actualizada correctamente.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          background: '#18181b',
          color: '#ffffff'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: result.error || 'No se pudo actualizar la información',
          icon: 'error',
          background: '#18181b',
          color: '#ffffff'
        });
      }
    },
    onError: (error: any) => {
      Swal.fire({
        title: 'Error de red',
        text: error.message || 'Ocurrió un error inesperado',
        icon: 'error',
        background: '#18181b',
        color: '#ffffff'
      });
    }
  });

  return {
    usuarioData,
    isLoadingData,
    handleSave: mutation.mutate,
    isSaving: mutation.isPending
  };
}