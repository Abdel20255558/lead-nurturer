import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientStatus, CompanyType, ContactMethod, ContactResult } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface ClientFormData {
  name: string;
  address?: string;
  activity?: string;
  email?: string;
  website?: string;
  phone_fixed?: string;
  phone_mobile?: string;
  company_type?: CompanyType;
  status: ClientStatus;
  notes?: string;
  contact_method?: ContactMethod;
  offer_sent_date?: string;
  contact_result?: ContactResult;
}

export function useClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const createClient = useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client créé avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const { data: updated, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client mis à jour' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client supprimé' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const markAsRejected = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .update({
          status: 'rejected' as ClientStatus,
          notes: supabase.rpc ? undefined : 'Rejet manuel',
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client marqué comme rejeté' });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    markAsRejected,
  };
}
