import { AppLayout } from '@/components/layout/AppLayout';
import { TripsTable } from '@/components/trips/TripsTable';

export default function TripsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Voyages</h1>
          <p className="text-muted-foreground">Gestion des livraisons et transport</p>
        </div>

        <TripsTable />
      </div>
    </AppLayout>
  );
}
