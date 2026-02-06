import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PayrollSettings, AttendanceSummary, PayrollCalculation, Employee, Attendance } from '@/types/hr';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePayrollSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['payroll-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as PayrollSettings | null;
    },
    enabled: !!user,
  });

  const upsertSettings = useMutation({
    mutationFn: async (data: { paid_leave_is_paid: boolean; holidays_are_paid: boolean }) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('payroll_settings')
        .upsert({
          user_id: user.id,
          ...data,
        }, {
          onConflict: 'user_id',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      toast.success('Paramètres sauvegardés');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { settings, isLoading, upsertSettings };
};

export const calculatePayroll = (
  employees: Employee[],
  attendance: Attendance[],
  settings: PayrollSettings | null,
  totalDaysInMonth: number
): PayrollCalculation[] => {
  const paidLeaveIsPaid = settings?.paid_leave_is_paid ?? false;
  const holidaysArePaid = settings?.holidays_are_paid ?? false;

  return employees.map(employee => {
    const employeeAttendance = attendance.filter(a => a.employee_id === employee.id);
    
    // Jours explicitement marqués avec un statut autre que P
    const days_A = employeeAttendance.filter(a => a.status === 'A').length;
    const days_SL = employeeAttendance.filter(a => a.status === 'SL').length;
    const days_UL = employeeAttendance.filter(a => a.status === 'UL').length;
    const days_PL = employeeAttendance.filter(a => a.status === 'PL').length;
    const days_H = employeeAttendance.filter(a => a.status === 'H').length;
    const explicit_P = employeeAttendance.filter(a => a.status === 'P').length;
    
    // Les jours non renseignés comptent comme Présent
    const daysWithStatus = employeeAttendance.length;
    const unrecordedDays = Math.max(0, totalDaysInMonth - daysWithStatus);
    
    const summary: AttendanceSummary = {
      days_P: explicit_P + unrecordedDays,
      days_A,
      days_SL,
      days_UL,
      days_PL,
      days_H,
    };

    const paid_days = summary.days_P 
      + (paidLeaveIsPaid ? summary.days_PL : 0) 
      + (holidaysArePaid ? summary.days_H : 0);

    const unpaid_days = summary.days_A 
      + summary.days_SL 
      + summary.days_UL 
      + (paidLeaveIsPaid ? 0 : summary.days_PL) 
      + (holidaysArePaid ? 0 : summary.days_H);

    const total_to_pay = paid_days * employee.daily_rate;

    return {
      employee,
      summary,
      paid_days,
      unpaid_days,
      total_to_pay,
    };
  });
};
