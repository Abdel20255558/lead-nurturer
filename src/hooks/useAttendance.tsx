import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus } from '@/types/hr';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useAttendance = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: attendance = [], isLoading, error } = useQuery({
    queryKey: ['attendance', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id);
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query.order('date');
      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!user,
  });

  const upsertAttendance = useMutation({
    mutationFn: async ({ employee_id, date, status }: { employee_id: string; date: string; status: AttendanceStatus }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('attendance')
        .upsert({
          employee_id,
          date,
          status,
          user_id: user.id,
        }, {
          onConflict: 'employee_id,date',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const bulkUpsertAttendance = useMutation({
    mutationFn: async (records: { employee_id: string; date: string; status: AttendanceStatus }[]) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('attendance')
        .upsert(
          records.map(r => ({ ...r, user_id: user.id })),
          { onConflict: 'employee_id,date' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Présences enregistrées');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    attendance,
    isLoading,
    error,
    upsertAttendance,
    bulkUpsertAttendance,
  };
};
