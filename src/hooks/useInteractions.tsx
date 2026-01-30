import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Interaction, InteractionType } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface InteractionFormData {
  client_id: string;
  type: InteractionType;
  date_time?: string;
  summary?: string;
  next_step?: string;
}

export function useInteractions(clientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('date_time', { ascending: false });
      
      if (error) throw error;
      return data as Interaction[];
    },
    enabled: !!clientId,
  });

  const createInteraction = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: newInteraction, error } = await supabase
        .from('interactions')
        .insert({
          ...data,
          user_id: user.id,
          date_time: data.date_time || new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return newInteraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Interaction ajoutée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateInteraction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InteractionFormData> }) => {
      const { data: updated, error } = await supabase
        .from('interactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Interaction mise à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('interactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Interaction supprimée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    interactions,
    isLoading,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  };
}
