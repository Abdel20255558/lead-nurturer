import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/hr';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface EmployeeFormData {
  full_name: string;
  daily_rate: number;
  is_active?: boolean;
  job_title?: string;
  start_date?: string;
}

export const useEmployees = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('full_name');
      
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!user,
  });

  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from('employees').insert({
        ...data,
        job_title: data.job_title || null,
        start_date: data.start_date || null,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employé ajouté avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employé mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employé supprimé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
