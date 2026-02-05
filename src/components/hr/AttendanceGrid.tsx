import { useState, useMemo } from 'react';
import { format, eachDayOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceStatus, ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '@/types/hr';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

interface AttendanceGridProps {
  month: Date;
}

export const AttendanceGrid = ({ month }: AttendanceGridProps) => {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
  
  const { employees } = useEmployees();
  const { attendance, bulkUpsertAttendance } = useAttendance(startDate, endDate);
  
  const activeEmployees = employees.filter(e => e.is_active);
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });

  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});

  const getAttendanceKey = (employeeId: string, date: string) => `${employeeId}_${date}`;

  const getStatus = (employeeId: string, date: string): AttendanceStatus | undefined => {
    const key = getAttendanceKey(employeeId, date);
    if (localAttendance[key]) return localAttendance[key];
    const record = attendance.find(a => a.employee_id === employeeId && a.date === date);
    return record?.status;
  };

  const setStatus = (employeeId: string, date: string, status: AttendanceStatus) => {
    const key = getAttendanceKey(employeeId, date);
    setLocalAttendance(prev => ({ ...prev, [key]: status }));
  };

  const handleSave = async () => {
    const records = Object.entries(localAttendance).map(([key, status]) => {
      const [employee_id, date] = key.split('_');
      return { employee_id, date, status };
    });
    
    if (records.length > 0) {
      await bulkUpsertAttendance.mutateAsync(records);
      setLocalAttendance({});
    }
  };

  const hasChanges = Object.keys(localAttendance).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Présences - {format(month, 'MMMM yyyy', { locale: fr })}
        </h2>
        {hasChanges && (
          <Button onClick={handleSave} disabled={bulkUpsertAttendance.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {(Object.entries(ATTENDANCE_STATUS_LABELS) as [AttendanceStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1 text-sm">
            <div className={cn('w-4 h-4 rounded', ATTENDANCE_STATUS_COLORS[status])} />
            <span>{status} = {label}</span>
          </div>
        ))}
      </div>

      {activeEmployees.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucun employé actif. Ajoutez des employés d'abord.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Employé</TableHead>
                {days.map(day => (
                  <TableHead key={day.toISOString()} className="text-center min-w-[60px]">
                    <div className="text-xs">{format(day, 'EEE', { locale: fr })}</div>
                    <div>{format(day, 'd')}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">
                    {employee.full_name}
                  </TableCell>
                  {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const status = getStatus(employee.id, dateStr);
                    return (
                      <TableCell key={dateStr} className="p-1">
                        <Select
                          value={status || ''}
                          onValueChange={(value) => setStatus(employee.id, dateStr, value as AttendanceStatus)}
                        >
                          <SelectTrigger className={cn(
                            'h-8 w-14 text-xs font-medium text-white border-0',
                            status ? ATTENDANCE_STATUS_COLORS[status] : 'bg-muted text-muted-foreground'
                          )}>
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(ATTENDANCE_STATUS_LABELS) as [AttendanceStatus, string][]).map(([s, label]) => (
                              <SelectItem key={s} value={s}>{s} - {label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
