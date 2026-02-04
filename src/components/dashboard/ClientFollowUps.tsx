import { useState } from 'react';
import { format, addDays, isBefore, isToday, isTomorrow, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, ExternalLink, AlertTriangle, Calendar } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { Client } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FollowUpItem {
  client: Client;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  daysUntil: number;
}

export function ClientFollowUps() {
  const { clients, isLoading, updateClient } = useClients();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Filtrer les clients avec une date de relance et les catégoriser
  const followUps: FollowUpItem[] = clients
    .filter(client => client.next_follow_up_at && client.status !== 'rejected')
    .map(client => {
      const followUpDate = startOfDay(new Date(client.next_follow_up_at!));
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      
      const isOverdueCheck = isBefore(followUpDate, today);
      const isTodayCheck = isToday(followUpDate);
      const isTomorrowCheck = isTomorrow(followUpDate);
      
      const diffTime = followUpDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        client,
        isOverdue: isOverdueCheck,
        isToday: isTodayCheck,
        isTomorrow: isTomorrowCheck,
        daysUntil,
      };
    })
    // Afficher: en retard, aujourd'hui, demain (1 jour avant)
    .filter(item => item.isOverdue || item.isToday || item.isTomorrow)
    .sort((a, b) => {
      // Trier: en retard d'abord, puis aujourd'hui, puis demain
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return a.daysUntil - b.daysUntil;
    });

  const handleOpenClient = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const handleMarkAsDone = async (client: Client) => {
    setProcessingIds(prev => new Set(prev).add(client.id));
    
    try {
      // Marquer la relance comme faite en mettant à jour last_action_at et en incrémentant follow_up_count
      // Planifier la prochaine relance dans 15 jours
      const nextFollowUp = addDays(new Date(), 15);
      
      const { error } = await supabase
        .from('clients')
        .update({
          last_action_at: new Date().toISOString(),
          follow_up_count: (client.follow_up_count || 0) + 1,
          next_follow_up_at: nextFollowUp.toISOString(),
        })
        .eq('id', client.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Relance marquée comme faite', description: `Prochaine relance planifiée le ${format(nextFollowUp, 'dd MMM yyyy', { locale: fr })}` });
    } catch (error) {
      console.error('Error marking follow-up as done:', error);
      toast({ title: 'Erreur', description: 'Impossible de marquer la relance', variant: 'destructive' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(client.id);
        return next;
      });
    }
  };

  const handlePostpone = async (client: Client, days: number) => {
    setProcessingIds(prev => new Set(prev).add(client.id));
    
    try {
      const newDate = addDays(new Date(), days);
      
      const { error } = await supabase
        .from('clients')
        .update({
          next_follow_up_at: newDate.toISOString(),
        })
        .eq('id', client.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Relance reportée', description: `Nouvelle date: ${format(newDate, 'dd MMM yyyy', { locale: fr })}` });
    } catch (error) {
      console.error('Error postponing follow-up:', error);
      toast({ title: 'Erreur', description: 'Impossible de reporter la relance', variant: 'destructive' });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(client.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Relances clients
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
              <Calendar className="h-5 w-5 text-primary" />
              Relances clients
              {followUps.length > 0 && (
                <Badge variant={followUps.some(f => f.isOverdue) ? 'destructive' : 'default'}>
                  {followUps.length}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 text-success opacity-50" />
              <p>Aucune relance prévue pour les prochains jours</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {followUps.map((item, index) => {
                  const isProcessing = processingIds.has(item.client.id);
                  
                  return (
                    <motion.div
                      key={item.client.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        item.isOverdue 
                          ? 'border-destructive bg-destructive/10' 
                          : item.isToday 
                            ? 'border-warning bg-warning/10'
                            : 'border-primary/30 bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.isOverdue && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            {item.isToday && !item.isOverdue && (
                              <Bell className="h-4 w-4 text-warning shrink-0" />
                            )}
                            {item.isTomorrow && (
                              <Clock className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <h4 className="font-medium truncate">{item.client.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.client.activity || 'Aucune activité'}
                          </p>
                          <p className={`text-xs mt-1 flex items-center gap-1 ${
                            item.isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {item.isOverdue && (
                              <span className="font-semibold">EN RETARD - </span>
                            )}
                            {format(new Date(item.client.next_follow_up_at!), 'dd MMM yyyy', { locale: fr })}
                            {item.isToday && <span className="text-warning font-medium ml-1">(Aujourd'hui)</span>}
                            {item.isTomorrow && <span className="text-primary ml-1">(Demain)</span>}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenClient(item.client)}
                            disabled={isProcessing}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Ouvrir
                          </Button>
                          <Button
                            size="sm"
                            variant={item.isOverdue ? 'destructive' : 'default'}
                            onClick={() => handleMarkAsDone(item.client)}
                            disabled={isProcessing}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Fait
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePostpone(item.client, 3)}
                            disabled={isProcessing}
                          >
                            +3j
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePostpone(item.client, 7)}
                            disabled={isProcessing}
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
