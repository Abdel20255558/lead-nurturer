import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Truck, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTrips, TripFormData } from '@/hooks/useTrips';
import { Trip, TRUCK_OPTIONS, DRIVER_OPTIONS, TRUCK_LABELS, DELIVERY_TIME_OPTIONS, DELIVERY_TIME_LABELS, DeliveryTimeSlot } from '@/types/trips';

const tripFormSchema = z.object({
  company_name: z.string().min(1, 'Le nom de la société est requis'),
  product: z.string().min(1, 'Le produit est requis'),
  truck: z.enum(['SOLO 1', 'SOLO 2', 'Renault', 'Man']),
  driver: z.enum(['M. Jalale', 'M. Dawi']),
  delivery_date: z.string().min(1, 'La date de livraison est requise'),
  delivery_time_slot: z.enum(['matin', 'apres_midi', 'heure_precise']).optional(),
  delivery_time_precise: z.string().optional(),
  notes: z.string().optional(),
});

interface TripFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip;
}

// Helper to parse delivery_time from DB
const parseDeliveryTime = (deliveryTime?: string): { slot?: DeliveryTimeSlot; precise?: string } => {
  if (!deliveryTime) return {};
  if (deliveryTime === 'matin' || deliveryTime === 'apres_midi') {
    return { slot: deliveryTime };
  }
  // It's a specific time (HH:MM format)
  return { slot: 'heure_precise', precise: deliveryTime };
};

// Helper to format delivery_time for DB
const formatDeliveryTime = (slot?: DeliveryTimeSlot, precise?: string): string | undefined => {
  if (!slot) return undefined;
  if (slot === 'heure_precise' && precise) return precise;
  if (slot === 'matin' || slot === 'apres_midi') return slot;
  return undefined;
};

export function TripFormModal({ open, onOpenChange, trip }: TripFormModalProps) {
  const { createTrip, updateTrip } = useTrips();
  
  const parsedTime = trip ? parseDeliveryTime(trip.delivery_time) : {};
  
  const form = useForm<z.infer<typeof tripFormSchema>>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      company_name: '',
      product: '',
      truck: 'SOLO 1',
      driver: 'M. Jalale',
      delivery_date: '',
      delivery_time_slot: undefined,
      delivery_time_precise: '',
      notes: '',
    },
  });

  // Reset form when trip changes or modal opens
  useEffect(() => {
    if (open) {
      if (trip) {
        const parsed = parseDeliveryTime(trip.delivery_time);
        form.reset({
          company_name: trip.company_name,
          product: trip.product,
          truck: trip.truck,
          driver: trip.driver,
          delivery_date: trip.delivery_date,
          delivery_time_slot: parsed.slot,
          delivery_time_precise: parsed.precise || '',
          notes: trip.notes || '',
        });
      } else {
        form.reset({
          company_name: '',
          product: '',
          truck: 'SOLO 1',
          driver: 'M. Jalale',
          delivery_date: '',
          delivery_time_slot: undefined,
          delivery_time_precise: '',
          notes: '',
        });
      }
    }
  }, [open, trip, form]);

  const deliveryTimeSlot = form.watch('delivery_time_slot');

  const onSubmit = async (data: z.infer<typeof tripFormSchema>) => {
    const deliveryTime = formatDeliveryTime(data.delivery_time_slot, data.delivery_time_precise);
    
    const tripData = {
      company_name: data.company_name,
      product: data.product,
      truck: data.truck,
      driver: data.driver,
      delivery_date: data.delivery_date,
      delivery_time: deliveryTime,
      notes: data.notes,
    };

    if (trip) {
      await updateTrip.mutateAsync({ id: trip.id, ...tripData });
    } else {
      await createTrip.mutateAsync(tripData);
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {trip ? 'Modifier le voyage' : 'Nouveau voyage'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Société</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la société" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produit</FormLabel>
                  <FormControl>
                    <Input placeholder="Description du produit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="truck"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camion</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir camion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRUCK_OPTIONS.map((truck) => (
                          <SelectItem key={truck} value={truck}>
                            {TRUCK_LABELS[truck]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chauffeur</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir chauffeur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DRIVER_OPTIONS.map((driver) => (
                          <SelectItem key={driver} value={driver}>
                            {driver}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="delivery_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de livraison</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: fr })
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Heure de livraison */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="delivery_time_slot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Heure de livraison
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le moment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERY_TIME_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {DELIVERY_TIME_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryTimeSlot === 'heure_precise' && (
                <FormField
                  control={form.control}
                  name="delivery_time_precise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heure précise</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes supplémentaires..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createTrip.isPending || updateTrip.isPending}>
                {trip ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
