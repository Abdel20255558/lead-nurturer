import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users, Calendar, Calculator } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeesTable } from '@/components/hr/EmployeesTable';
import { AttendanceGrid } from '@/components/hr/AttendanceGrid';
import { PayrollTable } from '@/components/hr/PayrollTable';

const HR = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestion RH & Paie</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees" className="gap-2">
              <Users className="h-4 w-4" />
              Employés
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <Calendar className="h-4 w-4" />
              Présences
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2">
              <Calculator className="h-4 w-4" />
              Paie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesTable />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceGrid month={currentMonth} />
          </TabsContent>

          <TabsContent value="payroll">
            <PayrollTable month={currentMonth} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HR;
