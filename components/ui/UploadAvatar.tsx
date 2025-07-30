'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { toast } from 'react-toastify';

interface Props {
  userId: string;
  initialAvatarUrl: string | null;
  onUpload: () => void; // Para refrescar los datos del usuario
}

export default function UploadAvatar({ userId, initialAvatarUrl, onUpload }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const fileName = `${userId}/${Date.now()}`;
    const bucketName = 'avatares';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Error al subir la imagen.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('usuarios_perfil')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId);

    setUploading(false);

    if (updateError) {
      toast.error('Error al guardar la nueva imagen.');
    } else {
      toast.success('Foto de perfil actualizada.');
      onUpload(); // Llama a la función para recargar los datos
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-32 h-32 rounded-full overflow-hidden relative">
        <Image
          src={avatarUrl || '/default-avatar.png'} // Muestre un avatar por defecto si no hay
          alt="Foto de perfil"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div>
        <label htmlFor="avatar-upload" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
          {uploading ? 'Subiendo...' : 'Cambiar Foto'}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}