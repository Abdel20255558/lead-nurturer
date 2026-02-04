import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CalendarIcon } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { Client, ClientStatus, CompanyType, ContactMethod, ContactResult, STATUS_LABELS, CONTACT_METHOD_LABELS, CONTACT_RESULT_LABELS, COMPANY_TYPE_OPTIONS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const clientSchema = z.object({
  name: z.string().min(1, 'Nom obligatoire'),
  address: z.string().optional(),
  activity: z.string().optional(),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email('Email invalide').optional()
  ),
  website: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('URL invalide').optional()
  ),
  phone_fixed: z.string().optional(),
  phone_mobile: z.string().optional(),
  company_type: z.enum(['SA', 'Non SA']).optional().nullable(),
  status: z.enum(['not_prepared', 'not_contacted', 'in_progress', 'rejected']),
  notes: z.string().optional(),
  contact_method: z.enum(['email', 'reels']).optional().nullable(),
  offer_sent_date: z.string().optional(),
  contact_result: z.enum(['pending', 'interested', 'not_interested']).optional().nullable(),
  next_follow_up_at: z.date().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientFormModal({ isOpen, onClose, client }: ClientFormModalProps) {
  const { createClient, updateClient } = useClients();
  const isEditing = !!client;

  const getDefaultValues = (): Partial<ClientFormData> => {
    if (client) {
      return {
        name: client.name,
        address: client.address || '',
        activity: client.activity || '',
        email: client.email || '',
        website: client.website || '',
        phone_fixed: client.phone_fixed || '',
        phone_mobile: client.phone_mobile || '',
        company_type: client.company_type,
        status: client.status,
        notes: client.notes || '',
        contact_method: client.contact_method,
        offer_sent_date: client.offer_sent_date || '',
        contact_result: client.contact_result,
        next_follow_up_at: client.next_follow_up_at ? new Date(client.next_follow_up_at) : null,
      };
    }
    return {
      status: 'not_prepared',
      next_follow_up_at: null,
    };
  };

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when client changes (for edit mode)
  React.useEffect(() => {
    if (isOpen) {
      const values = getDefaultValues();
      reset(values);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, client]);

  const status = watch('status');
  const contactResult = watch('contact_result');
  const phoneFixed = watch('phone_fixed');
  const phoneMobile = watch('phone_mobile');
  const nextFollowUpAt = watch('next_follow_up_at');

  // Fonction pour vérifier si un numéro de téléphone est valide (contient au moins 8 chiffres)
  const isValidPhoneNumber = (phone: string | undefined): boolean => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 8;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (formData: ClientFormData) => {
    console.log('Form submitted with data:', formData);
    const data = { ...formData };
    
    // Vérifier si le téléphone fixe contient un numéro valide
    const hasValidPhone = isValidPhoneNumber(data.phone_fixed);
    
    // Déterminer le statut basé sur le téléphone fixe (sauf si déjà en cours ou rejeté)
    if (data.status !== 'in_progress' && data.status !== 'rejected') {
      if (hasValidPhone) {
        data.status = 'not_contacted';
      } else {
        data.status = 'not_prepared';
      }
    }
    
    // Si le résultat est "pas intéressé", passer automatiquement en rejeté
    if (data.contact_result === 'not_interested') {
      data.status = 'rejected';
    }

    // Nettoyer les champs conditionnels si pas en cours
    if (data.status !== 'in_progress') {
      data.contact_method = undefined;
      data.offer_sent_date = undefined;
      data.contact_result = undefined;
    }

    // Nettoyer les valeurs vides
    const cleanedData = {
      name: data.name,
      status: data.status,
      address: data.address || undefined,
      activity: data.activity || undefined,
      email: data.email || undefined,
      website: data.website || undefined,
      phone_fixed: data.phone_fixed || undefined,
      phone_mobile: data.phone_mobile || undefined,
      company_type: data.company_type || undefined,
      notes: data.notes || undefined,
      contact_method: data.contact_method || undefined,
      offer_sent_date: data.offer_sent_date || undefined,
      contact_result: data.contact_result || undefined,
      next_follow_up_at: data.next_follow_up_at ? data.next_follow_up_at.toISOString() : undefined,
    };

    try {
      if (isEditing && client) {
        console.log('Updating client:', client.id, cleanedData);
        await updateClient.mutateAsync({ id: client.id, data: cleanedData });
      } else {
        console.log('Creating new client:', cleanedData);
        await createClient.mutateAsync(cleanedData);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  // Log validation errors
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
    }
  }, [errors]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEditing ? 'Modifier le client' : 'Ajouter un client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nom client *</Label>
              <Input id="name" {...register('name')} placeholder="Nom de l'entreprise" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* Adresse */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" {...register('address')} placeholder="Adresse complète" />
            </div>

            {/* Activité */}
            <div className="space-y-2">
              <Label htmlFor="activity">Activité / Secteur</Label>
              <Input id="activity" {...register('activity')} placeholder="Ex: Commerce, IT..." />
            </div>

            {/* Type société */}
            <div className="space-y-2">
              <Label>Type de société</Label>
            <Select
              value={watch('company_type') || undefined}
              onValueChange={(v) => setValue('company_type', v as CompanyType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPE_OPTIONS.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="contact@exemple.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Site web */}
            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input id="website" {...register('website')} placeholder="https://exemple.com" />
              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
            </div>

            {/* Téléphone fixe */}
            <div className="space-y-2">
              <Label htmlFor="phone_fixed">Téléphone fixe</Label>
              <Input id="phone_fixed" {...register('phone_fixed')} placeholder="+212 5XX XXX XXX" />
            </div>

            {/* Téléphone mobile */}
            <div className="space-y-2">
              <Label htmlFor="phone_mobile">Téléphone mobile</Label>
              <Input id="phone_mobile" {...register('phone_mobile')} placeholder="+212 6XX XXX XXX" />
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prochaine relance */}
            <div className="space-y-2">
              <Label>Prochaine relance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !nextFollowUpAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextFollowUpAt ? format(nextFollowUpAt, "dd MMM yyyy", { locale: fr }) : <span>Sélectionner une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={nextFollowUpAt || undefined}
                    onSelect={(date) => setValue('next_follow_up_at', date || null)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {nextFollowUpAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setValue('next_follow_up_at', null)}
                >
                  Supprimer la date
                </Button>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Notes internes..." rows={3} />
            </div>
          </div>

          {/* Champs conditionnels si status = in_progress */}
          <AnimatePresence>
            {status === 'in_progress' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4 space-y-4"
              >
                <h3 className="font-medium text-primary">Détails du contact en cours</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Méthode de contact */}
                  <div className="space-y-2">
                    <Label>Méthode d'offre</Label>
                    <Select
                      value={watch('contact_method') || undefined}
                      onValueChange={(v) => setValue('contact_method', v as ContactMethod)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date d'envoi */}
                  <div className="space-y-2">
                    <Label htmlFor="offer_sent_date">Date d'envoi de l'offre</Label>
                    <Input
                      id="offer_sent_date"
                      type="date"
                      {...register('offer_sent_date')}
                    />
                  </div>

                  {/* Résultat */}
                  <div className="space-y-2">
                    <Label>Résultat du contact</Label>
                    <Select
                      value={watch('contact_result') || undefined}
                      onValueChange={(v) => setValue('contact_result', v as ContactResult)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_RESULT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {contactResult === 'not_interested' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-warning bg-warning/10 p-3 rounded-lg"
                  >
                    ⚠️ Ce client sera automatiquement marqué comme "Rejeté" à la sauvegarde.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createClient.isPending || updateClient.isPending}
            >
              {(isSubmitting || createClient.isPending || updateClient.isPending) 
                ? 'Enregistrement...' 
                : (isEditing ? 'Mettre à jour' : 'Créer le client')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
