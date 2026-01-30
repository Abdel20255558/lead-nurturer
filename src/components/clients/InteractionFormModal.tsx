import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, CalendarIcon } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import { useClients } from '@/hooks/useClients';
import { Interaction, InteractionType, INTERACTION_TYPE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const interactionSchema = z.object({
  type: z.enum(['call', 'email', 'reels', 'visit', 'other']),
  date_time: z.string(),
  summary: z.string().optional(),
  next_step: z.string().optional(),
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface InteractionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  interaction?: Interaction | null;
}

export function InteractionFormModal({ isOpen, onClose, clientId, interaction }: InteractionFormModalProps) {
  const { createInteraction, updateInteraction } = useInteractions(clientId);
  const { updateClient } = useClients();
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const isEditing = !!interaction;

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'call',
      date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && interaction) {
      reset({
        type: interaction.type,
        date_time: format(new Date(interaction.date_time), "yyyy-MM-dd'T'HH:mm"),
        summary: interaction.summary || '',
        next_step: interaction.next_step || '',
      });
    } else if (isOpen && !interaction) {
      reset({
        type: 'call',
        date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        summary: '',
        next_step: '',
      });
      setFollowUpDate(undefined);
    }
  }, [isOpen, interaction?.id]);

  const handleClose = () => {
    reset();
    setFollowUpDate(undefined);
    onClose();
  };

  const onSubmit = async (data: InteractionFormData) => {
    try {
      if (isEditing && interaction) {
        // Update existing interaction
        await updateInteraction.mutateAsync({
          id: interaction.id,
          data: {
            type: data.type,
            summary: data.summary,
            next_step: data.next_step,
            date_time: new Date(data.date_time).toISOString(),
          },
        });
      } else {
        // Create new interaction
        await createInteraction.mutateAsync({
          type: data.type,
          summary: data.summary,
          next_step: data.next_step,
          client_id: clientId,
          date_time: new Date(data.date_time).toISOString(),
        });

        // Update client status to "in_progress" and set next_follow_up_at if date is selected
        const updateData: { status: 'in_progress'; next_follow_up_at?: string } = {
          status: 'in_progress',
        };

        if (followUpDate) {
          updateData.next_follow_up_at = followUpDate.toISOString();
        }

        await updateClient.mutateAsync({
          id: clientId,
          data: updateData,
        });
      }

      handleClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {isEditing ? 'Modifier l\'interaction' : 'Ajouter une interaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type d'interaction</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as InteractionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <Label htmlFor="date_time">Date & Heure</Label>
              <Input
                id="date_time"
                type="datetime-local"
                {...register('date_time')}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Résumé / Commentaire</Label>
            <Textarea
              id="summary"
              {...register('summary')}
              placeholder="Décrivez l'interaction..."
              rows={3}
            />
          </div>

          {/* Next Step */}
          <div className="space-y-2">
            <Label htmlFor="next_step">Prochaine étape (optionnel)</Label>
            <Input
              id="next_step"
              {...register('next_step')}
              placeholder="Ex: Rappeler lundi"
            />
          </div>

          {/* Next Follow-up Date - Only show when creating new interaction */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Date de prochaine relance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !followUpDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpDate ? format(followUpDate, "PPP", { locale: fr }) : "Choisir une date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Le statut du client passera automatiquement à "En cours"
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createInteraction.isPending || updateInteraction.isPending || updateClient.isPending}>
              {isEditing ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
