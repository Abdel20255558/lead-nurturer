import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';

export function useAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user,
  });

  const todayAlerts = alerts.filter(alert => {
    const dueDate = new Date(alert.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });

  const overdueAlerts = alerts.filter(alert => {
    const dueDate = new Date(alert.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const completeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({ title: 'Relance marquée comme faite' });
    },
  });

  const postponeAlert = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const alert = alerts.find(a => a.id === id);
      if (!alert) throw new Error('Alert not found');
      
      const newDueDate = addDays(new Date(alert.due_date), days);
      
      const { error } = await supabase
        .from('alerts')
        .update({ due_date: newDueDate.toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({ title: 'Relance reportée' });
    },
  });

  return {
    alerts,
    todayAlerts,
    overdueAlerts,
    isLoading,
    completeAlert,
    postponeAlert,
  };
}
