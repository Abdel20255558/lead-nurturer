import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { useInteractions } from '@/hooks/useInteractions';
import { InteractionType, INTERACTION_TYPE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
}

export function InteractionFormModal({ isOpen, onClose, clientId }: InteractionFormModalProps) {
  const { createInteraction } = useInteractions(clientId);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'call',
      date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: InteractionFormData) => {
    try {
      await createInteraction.mutateAsync({
        type: data.type,
        summary: data.summary,
        next_step: data.next_step,
        client_id: clientId,
        date_time: new Date(data.date_time).toISOString(),
      });
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
            Ajouter une interaction
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createInteraction.isPending}>
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
