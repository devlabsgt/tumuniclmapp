'use client';

import { Usuario } from './types';
import { useRouter } from 'next/navigation';

type Props = {
  usuarios: Usuario[];
};

export default function UsersTable({ usuarios }: Props) {
  const router = useRouter();

  return (
    <table className="min-w-full border rounded shadow bg-background text-foreground text-sm">
      <thead className="bg-muted text-left">
        <tr>
          <th className="p-3 border-b">Correo</th>
          <th className="p-3 border-b">Nombre</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) =>
          usuario.id ? (
            <tr
              key={usuario.id}
              onClick={() => router.push(`/protected/admin/users/ver?id=${usuario.id}`)}
              className="border-b hover:bg-muted cursor-pointer transition"
            >
              <td className="p-3">{usuario.email}</td>
              <td className="p-3">{usuario.nombre || '—'}</td>
            </tr>
          ) : null
        )}

        {usuarios.length === 0 && (
          <tr>
            <td colSpan={2} className="p-3 text-center text-muted-foreground">
              No hay resultados
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
