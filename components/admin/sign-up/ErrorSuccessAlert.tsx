// components/admin/sign-up/ErrorSuccessAlert.tsx
'use client';

type Props = {
  error?: string | null;
  success?: string | null;
  traducirError: (mensaje: string) => string;
};

export default function ErrorSuccessAlert({ error, success, traducirError }: Props) {
  return (
    <>
      {error && (
        <div className="bg-red-100 text-red-800 p-3 text-base rounded mb-4 border border-red-300">
          {traducirError(decodeURIComponent(error))}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-800 p-3 text-base rounded mb-4 border border-green-300">
          {decodeURIComponent(success)}
        </div>
      )}
    </>
  );
}
