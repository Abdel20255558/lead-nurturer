export type AttendanceStatus = 'P' | 'A' | 'SL' | 'UL' | 'PL' | 'H';

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  daily_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
}

export interface PayrollSettings {
  id: string;
  user_id: string;
  paid_leave_is_paid: boolean;
  holidays_are_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  days_P: number;
  days_A: number;
  days_SL: number;
  days_UL: number;
  days_PL: number;
  days_H: number;
}

export interface PayrollCalculation {
  employee: Employee;
  summary: AttendanceSummary;
  paid_days: number;
  unpaid_days: number;
  total_to_pay: number;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  P: 'Présent',
  A: 'Absent',
  SL: 'Congé maladie',
  UL: 'Congé sans solde',
  PL: 'Congé payé',
  H: 'Jour férié',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  P: 'bg-green-500',
  A: 'bg-red-500',
  SL: 'bg-yellow-500',
  UL: 'bg-orange-500',
  PL: 'bg-blue-500',
  H: 'bg-purple-500',
};
