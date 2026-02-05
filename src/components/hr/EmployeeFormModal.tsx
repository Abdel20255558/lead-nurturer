import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEmployees, EmployeeFormData } from '@/hooks/useEmployees';
import { Employee } from '@/types/hr';

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export const EmployeeFormModal = ({ open, onOpenChange, employee }: EmployeeFormModalProps) => {
  const { createEmployee, updateEmployee } = useEmployees();
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: employee?.full_name || '',
    daily_rate: employee?.daily_rate || 0,
    is_active: employee?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (employee) {
      await updateEmployee.mutateAsync({ id: employee.id, data: formData });
    } else {
      await createEmployee.mutateAsync(formData);
    }
    
    onOpenChange(false);
    setFormData({ full_name: '', daily_rate: 0, is_active: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Modifier l\'employé' : 'Ajouter un employé'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Mohammed Alami"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="daily_rate">Taux journalier (DH)</Label>
            <Input
              id="daily_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })}
              placeholder="200"
              required
            />
          </div>

          {employee && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Employé actif</Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
              {employee ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
