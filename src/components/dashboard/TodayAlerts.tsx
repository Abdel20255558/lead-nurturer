import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { Client } from '@/types/database';

export function TodayAlerts() {
  const { todayAlerts, overdueAlerts, isLoading, completeAlert, postponeAlert } = useAlerts();
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const allAlerts = [...overdueAlerts, ...todayAlerts];

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleOpenClient = (clientId: string) => {
    const client = getClientById(clientId);
    if (client) {
      setSelectedClient(client);
      setIsDetailOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            Relances du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              Relances du jour
              {allAlerts.length > 0 && (
                <Badge className="bg-warning text-warning-foreground">
                  {allAlerts.length}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
              <p>Aucune relance prévue pour aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {allAlerts.map((alert, index) => {
                  const client = getClientById(alert.client_id);
                  const isOverdue = new Date(alert.due_date) < new Date(new Date().toDateString());
                  
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        isOverdue ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isOverdue && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <h4 className="font-medium truncate">{alert.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {client?.name || 'Client inconnu'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(alert.due_date), 'dd MMM yyyy', { locale: fr })}
                            {isOverdue && <span className="text-destructive">(en retard)</span>}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenClient(alert.client_id)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Ouvrir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeAlert.mutate(alert.id)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Fait
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => postponeAlert.mutate({ id: alert.id, days: 3 })}
                          >
                            +3j
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => postponeAlert.mutate({ id: alert.id, days: 7 })}
                          >
                            +7j
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedClient(null); }}
        client={selectedClient}
        onEdit={() => { setIsDetailOpen(false); setIsEditOpen(true); }}
      />

      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedClient(null); }}
        client={selectedClient}
      />
    </>
  );
}
