// app/protected/admin/logs/page.tsx
import Logs from '@/components/admin/logs/LogsTable';

export const dynamic = 'force-dynamic';

export default function LogsPage() {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Registro de Actividades</h1>
      <Logs />
    </div>
  );
}
