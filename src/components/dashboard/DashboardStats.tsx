import { motion } from 'framer-motion';
import { Users, Clock, Check, X, Bell, FileWarning, Phone } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useAlerts } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardStats() {
  const { clients, isLoading: clientsLoading } = useClients();
  const { todayAlerts, overdueAlerts } = useAlerts();

  const stats = [
    {
      label: 'Total clients',
      value: clients.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pas encore préparé',
      value: clients.filter(c => c.status === 'not_prepared').length,
      icon: FileWarning,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Pas encore contactés',
      value: clients.filter(c => c.status === 'not_contacted').length,
      icon: Phone,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    {
      label: 'En cours',
      value: clients.filter(c => c.status === 'in_progress').length,
      icon: Bell,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Rejetés',
      value: clients.filter(c => c.status === 'rejected').length,
      icon: X,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'À relancer aujourd\'hui',
      value: todayAlerts.length + overdueAlerts.length,
      icon: Bell,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      highlight: todayAlerts.length + overdueAlerts.length > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`card-hover ${stat.highlight ? 'border-warning' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{clientsLoading ? '-' : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
