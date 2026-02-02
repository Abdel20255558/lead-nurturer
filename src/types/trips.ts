export type TruckType = 'SOLO 1' | 'SOLO 2' | 'Renault' | 'Man';
export type DriverType = 'M. Jalale' | 'M. Dawi';
export type DeliveryStatus = 'pending' | 'delivered' | 'postponed' | 'cancelled';

export interface Trip {
  id: string;
  user_id: string;
  company_name: string;
  product: string;
  truck: TruckType;
  driver: DriverType;
  delivery_date: string;
  status: DeliveryStatus;
  notes?: string;
  postponed_date?: string;
  created_at: string;
  updated_at: string;
}

export const TRUCK_OPTIONS: TruckType[] = ['SOLO 1', 'SOLO 2', 'Renault', 'Man'];
export const DRIVER_OPTIONS: DriverType[] = ['M. Jalale', 'M. Dawi'];

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'En attente',
  delivered: 'Livré',
  postponed: 'Reporté',
  cancelled: 'Annulé',
};

export const TRUCK_LABELS: Record<TruckType, string> = {
  'SOLO 1': 'SOLO 1 (Solo)',
  'SOLO 2': 'SOLO 2 (Solo)',
  'Renault': 'Renault (Tracteur)',
  'Man': 'Man (Tracteur)',
};
