import { useState } from 'react';
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, CheckCircle, Clock, XCircle, Truck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTrips } from '@/hooks/useTrips';
import { Trip, DeliveryStatus, DELIVERY_STATUS_LABELS, TRUCK_LABELS, DELIVERY_TIME_LABELS, DeliveryTimeSlot } from '@/types/trips';
import { TripFormModal } from './TripFormModal';
import { TripStatusModal } from './TripStatusModal';
import { Skeleton } from '@/components/ui/skeleton';

export function TripsTable() {
  const { trips, isLoading, deleteTrip } = useTrips();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>();
  const [statusModalTrip, setStatusModalTrip] = useState<Trip | undefined>();

  const handleEdit = (trip: Trip) => {
    setSelectedTrip(trip);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedTrip(undefined);
    setFormOpen(true);
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const variants: Record<DeliveryStatus, string> = {
      pending: 'bg-warning/10 text-warning',
      delivered: 'bg-green-500/10 text-green-600',
      postponed: 'bg-orange-500/10 text-orange-600',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return (
      <Badge className={variants[status]}>
        {DELIVERY_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getDateBadge = (trip: Trip) => {
    const date = parseISO(trip.delivery_date);
    const today = startOfDay(new Date());
    
    if (trip.status !== 'pending') return null;
    
    if (isToday(date)) {
      return <Badge className="bg-primary/10 text-primary ml-2">Aujourd'hui</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge className="bg-warning/10 text-warning ml-2">Demain</Badge>;
    }
    if (isPast(date) && startOfDay(date) < today) {
      return <Badge className="bg-destructive/10 text-destructive ml-2">En retard</Badge>;
    }
    return null;
  };

  const needsConfirmation = (trip: Trip) => {
    return trip.status === 'pending' && (
      isToday(parseISO(trip.delivery_date)) || 
      (isPast(parseISO(trip.delivery_date)) && startOfDay(parseISO(trip.delivery_date)) < startOfDay(new Date()))
    );
  };

  const getDeliveryTimeLabel = (deliveryTime?: string) => {
    if (!deliveryTime) return '-';
    if (deliveryTime === 'matin') return 'Matin';
    if (deliveryTime === 'apres_midi') return 'Après-midi';
    // It's a specific time (HH:MM format)
    return deliveryTime;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Gestion des Voyages
          </CardTitle>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau voyage
          </Button>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun voyage enregistré</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                Créer votre premier voyage
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date livraison</TableHead>
                    <TableHead>Heure</TableHead>
                    <TableHead>Société</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Camion</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id} className={needsConfirmation(trip) ? 'bg-warning/5' : ''}>
                      <TableCell>
                        <div className="flex items-center">
                          {format(parseISO(trip.delivery_date), 'dd/MM/yyyy', { locale: fr })}
                          {getDateBadge(trip)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getDeliveryTimeLabel(trip.delivery_time)}
                      </TableCell>
                      <TableCell className="font-medium">{trip.company_name}</TableCell>
                      <TableCell>{trip.product}</TableCell>
                      <TableCell>{TRUCK_LABELS[trip.truck]}</TableCell>
                      <TableCell>{trip.driver}</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {needsConfirmation(trip) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-warning border-warning hover:bg-warning/10"
                              onClick={() => setStatusModalTrip(trip)}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(trip)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce voyage ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Le voyage pour {trip.company_name} sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTrip.mutate(trip.id)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TripFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        trip={selectedTrip}
      />

      {statusModalTrip && (
        <TripStatusModal
          open={!!statusModalTrip}
          onOpenChange={(open) => !open && setStatusModalTrip(undefined)}
          trip={statusModalTrip}
        />
      )}
    </>
  );
}
