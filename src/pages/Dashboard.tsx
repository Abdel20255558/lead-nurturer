import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { ClientFollowUps } from '@/components/dashboard/ClientFollowUps';
import { TripAlerts } from '@/components/dashboard/TripAlerts';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre prospection</p>
        </div>

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientFollowUps />
          <TripAlerts />
        </div>
      </div>
    </AppLayout>
  );
}
