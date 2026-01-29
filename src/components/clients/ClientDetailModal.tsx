import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, Globe, MapPin, Calendar, Clock, MessageSquare, Plus, Edit, X } from 'lucide-react';
import { Client, STATUS_LABELS, CONTACT_METHOD_LABELS, CONTACT_RESULT_LABELS, INTERACTION_TYPE_LABELS, InteractionType } from '@/types/database';
import { useInteractions } from '@/hooks/useInteractions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { InteractionFormModal } from './InteractionFormModal';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit: () => void;
}

export function ClientDetailModal({ isOpen, onClose, client, onEdit }: ClientDetailModalProps) {
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false);
  const { interactions, isLoading: interactionsLoading } = useInteractions(client?.id);

  if (!client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_contacted': return 'bg-muted text-muted-foreground';
      case 'in_progress': return 'bg-primary/10 text-primary';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'interested': return 'bg-success/10 text-success';
      case 'not_interested': return 'bg-destructive/10 text-destructive';
      case 'pending': return 'bg-warning/10 text-warning';
      default: return '';
    }
  };

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{client.name}</h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    {client.activity || 'Aucune activité renseignée'}
                  </p>
                </div>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(client.status)}>
                  {STATUS_LABELS[client.status]}
                </Badge>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="history">
                Historique ({interactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 pt-4">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">{client.email}</span>
                    </a>
                  )}
                  {client.phone_mobile && (
                    <a href={`tel:${client.phone_mobile}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-sm">{client.phone_mobile}</span>
                    </a>
                  )}
                  {client.phone_fixed && (
                    <a href={`tel:${client.phone_fixed}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.phone_fixed} (fixe)</span>
                    </a>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate">{client.website}</span>
                    </a>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Business Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Informations entreprise
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{client.company_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-sm font-medium">
                      {format(new Date(client.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dernière action</p>
                    <p className="text-sm font-medium">
                      {client.last_action_at
                        ? format(new Date(client.last_action_at), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prochaine relance</p>
                    <p className={`text-sm font-medium ${
                      client.next_follow_up_at && new Date(client.next_follow_up_at) <= new Date()
                        ? 'text-warning'
                        : ''
                    }`}>
                      {client.next_follow_up_at
                        ? format(new Date(client.next_follow_up_at), 'dd MMM yyyy', { locale: fr })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Status (if in progress) */}
              {client.status === 'in_progress' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Statut du contact
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Méthode</p>
                        <p className="text-sm font-medium">
                          {client.contact_method ? CONTACT_METHOD_LABELS[client.contact_method] : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date d'envoi</p>
                        <p className="text-sm font-medium">
                          {client.offer_sent_date
                            ? format(new Date(client.offer_sent_date), 'dd MMM yyyy', { locale: fr })
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Résultat</p>
                        {client.contact_result ? (
                          <Badge className={getResultColor(client.contact_result)}>
                            {CONTACT_RESULT_LABELS[client.contact_result]}
                          </Badge>
                        ) : (
                          <p className="text-sm font-medium">-</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {client.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Notes
                    </h3>
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4">
                      {client.notes}
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Historique des interactions
                </h3>
                <Button size="sm" onClick={() => setIsInteractionFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {interactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Aucune interaction enregistrée</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsInteractionFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter une interaction
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {interactions.map((interaction, index) => {
                    const Icon = getInteractionIcon(interaction.type);
                    return (
                      <motion.div
                        key={interaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative pl-8 pb-4 border-l-2 border-muted last:border-transparent"
                      >
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                          <Icon className="h-3 w-3 text-primary" />
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">
                              {INTERACTION_TYPE_LABELS[interaction.type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(interaction.date_time), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {interaction.summary && (
                            <p className="text-sm mb-2">{interaction.summary}</p>
                          )}
                          {interaction.next_step && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Prochaine étape: {interaction.next_step}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <InteractionFormModal
        isOpen={isInteractionFormOpen}
        onClose={() => setIsInteractionFormOpen(false)}
        clientId={client.id}
      />
    </>
  );
}
