import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trip, TruckType, DriverType, DeliveryStatus } from '@/types/trips';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { isToday, isTomorrow, isPast, parseISO, startOfDay } from 'date-fns';

export interface TripFormData {
  company_name: string;
  product: string;
  truck: TruckType;
  driver: DriverType;
  delivery_date: string;
  delivery_time?: string;
  notes?: string;
}

export function useTrips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('delivery_date', { ascending: true });
      
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user,
  });

  // Trips due tomorrow (notification)
  const tomorrowTrips = trips.filter(t => 
    t.status === 'pending' && isTomorrow(parseISO(t.delivery_date))
  );

  // Trips due today (need confirmation)
  const todayTrips = trips.filter(t => 
    t.status === 'pending' && isToday(parseISO(t.delivery_date))
  );

  // Overdue trips
  const overdueTrips = trips.filter(t => {
    const deliveryDate = startOfDay(parseISO(t.delivery_date));
    const today = startOfDay(new Date());
    return t.status === 'pending' && isPast(deliveryDate) && deliveryDate < today;
  });

  // Pending trips (future)
  const pendingTrips = trips.filter(t => t.status === 'pending');

  const createTrip = useMutation({
    mutationFn: async (data: TripFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: newTrip, error } = await supabase
        .from('trips')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return newTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Voyage créé avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Trip> & { id: string }) => {
      const { data: updatedTrip, error } = await supabase
        .from('trips')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Voyage mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateTripStatus = useMutation({
    mutationFn: async ({ id, status, postponed_date }: { id: string; status: DeliveryStatus; postponed_date?: string }) => {
      const updateData: Partial<Trip> = { status };
      if (postponed_date) {
        updateData.postponed_date = postponed_date;
        updateData.delivery_date = postponed_date;
      }
      
      const { data: updatedTrip, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedTrip;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      const messages: Record<DeliveryStatus, string> = {
        delivered: 'Voyage marqué comme livré',
        postponed: 'Voyage reporté',
        cancelled: 'Voyage annulé',
        pending: 'Voyage remis en attente',
      };
      toast({ title: messages[variables.status] });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Voyage supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    trips,
    isLoading,
    tomorrowTrips,
    todayTrips,
    overdueTrips,
    pendingTrips,
    createTrip,
    updateTrip,
    updateTripStatus,
    deleteTrip,
  };
}
