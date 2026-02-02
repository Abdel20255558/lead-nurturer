import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTrips } from '@/hooks/useTrips';
import { Trip, TRUCK_LABELS } from '@/types/trips';

interface TripStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
}

export function TripStatusModal({ open, onOpenChange, trip }: TripStatusModalProps) {
  const { updateTripStatus } = useTrips();
  const [showPostpone, setShowPostpone] = useState(false);
  const [postponeDate, setPostponeDate] = useState<Date | undefined>();

  const handleDelivered = async () => {
    await updateTripStatus.mutateAsync({ id: trip.id, status: 'delivered' });
    onOpenChange(false);
  };

  const handleCancelled = async () => {
    await updateTripStatus.mutateAsync({ id: trip.id, status: 'cancelled' });
    onOpenChange(false);
  };

  const handlePostpone = async () => {
    if (!postponeDate) return;
    await updateTripStatus.mutateAsync({ 
      id: trip.id, 
      status: 'postponed',
      postponed_date: format(postponeDate, 'yyyy-MM-dd')
    });
    setShowPostpone(false);
    setPostponeDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirmation de livraison
          </DialogTitle>
          <DialogDescription>
            Le voyage prévu pour aujourd'hui est-il livré ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 border-y">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Société:</span>
            <span className="font-medium">{trip.company_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Produit:</span>
            <span className="font-medium">{trip.product}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Camion:</span>
            <span className="font-medium">{TRUCK_LABELS[trip.truck]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chauffeur:</span>
            <span className="font-medium">{trip.driver}</span>
          </div>
        </div>

        {!showPostpone ? (
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleDelivered} className="w-full" variant="default">
              <CheckCircle className="h-4 w-4 mr-2" />
              Oui, livré
            </Button>
            <Button onClick={() => setShowPostpone(true)} variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Reporter à une autre date
            </Button>
            <Button onClick={handleCancelled} variant="destructive" className="w-full">
              <XCircle className="h-4 w-4 mr-2" />
              Annuler le voyage
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouvelle date de livraison</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !postponeDate && "text-muted-foreground"
                    )}
                  >
                    {postponeDate ? (
                      format(postponeDate, "PPP", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={postponeDate}
                    onSelect={setPostponeDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPostpone(false)} className="flex-1">
                Retour
              </Button>
              <Button onClick={handlePostpone} disabled={!postponeDate} className="flex-1">
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
