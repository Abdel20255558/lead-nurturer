import { ClientsTable } from '@/components/clients/ClientsTable';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ClientsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gérez votre liste de prospects</p>
        </div>

        <ClientsTable />
      </div>
    </AppLayout>
  );
}
