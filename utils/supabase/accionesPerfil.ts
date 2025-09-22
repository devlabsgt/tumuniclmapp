import { createClient } from '@/utils/supabase/client';
import { toast } from 'react-toastify';

export const subirAvatar = async (userId: string, file: File, onUpload: () => void) => {
  const supabase = createClient();
  const fileName = `${userId}/${Date.now()}`;
  const bucketName = 'avatares';

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    toast.error('Error al subir la imagen.');
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('info_usuario')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);

  if (updateError) {
    toast.error('Error al guardar la nueva imagen.');
  } else {
    toast.success('Foto de perfil actualizada.');
    onUpload();
  }
};