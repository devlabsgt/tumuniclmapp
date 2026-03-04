'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { actualizarInfoPersonal, obtenerInfoUsuario } from './action';
import Swal from 'sweetalert2';

export function useInfoForm(userId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey = ['info_usuario', userId];

  const { data: usuarioData, isLoading: isLoadingData } = useQuery({
    queryKey: queryKey,
    queryFn: () => obtenerInfoUsuario(userId),
    enabled: !!userId,
    
   
    staleTime: 1000 * 60 * 6, 
    gcTime: 1000 * 60 * 10,   
    refetchOnWindowFocus: false, 
  });

  const mutation = useMutation({
    mutationFn: (formData: any) => actualizarInfoPersonal(userId, formData),
    onSuccess: (result) => {
      if (result.success) {
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