import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendance } from '@/hooks/useAttendance';
import { usePayrollSettings, calculatePayroll } from '@/hooks/usePayroll';

interface PayrollTableProps {
  month: Date;
}

export const PayrollTable = ({ month }: PayrollTableProps) => {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
  
  const { employees } = useEmployees();
  const { attendance } = useAttendance(startDate, endDate);
  const { settings, upsertSettings } = usePayrollSettings();

  const activeEmployees = employees.filter(e => e.is_active);
  
  const payrollData = useMemo(() => {
    return calculatePayroll(activeEmployees, attendance, settings);
  }, [activeEmployees, attendance, settings]);

  const grandTotal = payrollData.reduce((sum, p) => sum + p.total_to_pay, 0);

  const handleSettingChange = (key: 'paid_leave_is_paid' | 'holidays_are_paid', value: boolean) => {
    upsertSettings.mutate({
      paid_leave_is_paid: key === 'paid_leave_is_paid' ? value : (settings?.paid_leave_is_paid ?? false),
      holidays_are_paid: key === 'holidays_are_paid' ? value : (settings?.holidays_are_paid ?? false),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Paie - {format(month, 'MMMM yyyy', { locale: fr })}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètres de paie</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="pl_paid"
              checked={settings?.paid_leave_is_paid ?? false}
              onCheckedChange={(checked) => handleSettingChange('paid_leave_is_paid', checked)}
            />
            <Label htmlFor="pl_paid">Congés payés (PL) rémunérés</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="h_paid"
              checked={settings?.holidays_are_paid ?? false}
              onCheckedChange={(checked) => handleSettingChange('holidays_are_paid', checked)}
            />
            <Label htmlFor="h_paid">Jours fériés (H) rémunérés</Label>
          </div>
        </CardContent>
      </Card>

      {payrollData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucun employé actif. Ajoutez des employés d'abord.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead className="text-right">Taux/jour</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">A</TableHead>
                <TableHead className="text-center">SL</TableHead>
                <TableHead className="text-center">UL</TableHead>
                <TableHead className="text-center">PL</TableHead>
                <TableHead className="text-center">H</TableHead>
                <TableHead className="text-right">Jours payés</TableHead>
                <TableHead className="text-right">Jours non payés</TableHead>
                <TableHead className="text-right">Total à payer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((row) => (
                <TableRow key={row.employee.id}>
                  <TableCell className="font-medium">{row.employee.full_name}</TableCell>
                  <TableCell className="text-right">{row.employee.daily_rate.toFixed(2)} DH</TableCell>
                  <TableCell className="text-center">{row.summary.days_P}</TableCell>
                  <TableCell className="text-center">{row.summary.days_A}</TableCell>
                  <TableCell className="text-center">{row.summary.days_SL}</TableCell>
                  <TableCell className="text-center">{row.summary.days_UL}</TableCell>
                  <TableCell className="text-center">{row.summary.days_PL}</TableCell>
                  <TableCell className="text-center">{row.summary.days_H}</TableCell>
                  <TableCell className="text-right font-medium text-green-600">{row.paid_days}</TableCell>
                  <TableCell className="text-right text-red-600">{row.unpaid_days}</TableCell>
                  <TableCell className="text-right font-bold">{row.total_to_pay.toFixed(2)} DH</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={10} className="text-right">TOTAL GÉNÉRAL</TableCell>
                <TableCell className="text-right text-lg">{grandTotal.toFixed(2)} DH</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Rappel (Darija):</strong> الأيام المؤداة = P فقط (+ PL و H إلا إذا فعّلتهم). 
                المرض SL والغياب A ماشي مؤدى.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
