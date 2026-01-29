export type ClientStatus = 'not_contacted' | 'in_progress' | 'rejected';
export type CompanyType = 'SA' | 'Non SA';
export type ContactMethod = 'email' | 'reels';
export type ContactResult = 'pending' | 'interested' | 'not_interested';
export type InteractionType = 'call' | 'email' | 'reels' | 'visit' | 'other';

export interface Client {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
  last_action_at?: string;
  next_follow_up_at?: string;
  follow_up_count: number;
}

export interface Interaction {
  id: string;
  client_id: string;
  user_id: string;
  type: InteractionType;
  date_time: string;
  summary?: string;
  next_step?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  is_read: boolean;
  client_id?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

// Status display helpers
export const STATUS_LABELS: Record<ClientStatus, string> = {
  not_contacted: 'Pas encore contacté',
  in_progress: 'En cours',
  rejected: 'Rejeté',
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: 'Email',
  reels: 'Reels',
};

export const CONTACT_RESULT_LABELS: Record<ContactResult, string> = {
  pending: 'En attente',
  interested: 'Intéressé',
  not_interested: 'Pas intéressé',
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: 'Appel',
  email: 'Email',
  reels: 'Reels',
  visit: 'Visite',
  other: 'Autre',
};

export const COMPANY_TYPE_OPTIONS: CompanyType[] = ['SA', 'Non SA'];
