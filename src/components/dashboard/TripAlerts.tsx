import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Truck, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTrips } from '@/hooks/useTrips';
import { Trip, TRUCK_LABELS } from '@/types/trips';
import { TripStatusModal } from '@/components/trips/TripStatusModal';

export function TripAlerts() {
  const { todayTrips, tomorrowTrips, overdueTrips } = useTrips();
  const [statusModalTrip, setStatusModalTrip] = useState<Trip | undefined>();

  const allAlerts = [...overdueTrips, ...todayTrips, ...tomorrowTrips];

  if (allAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Livraisons à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune livraison prévue prochainement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Livraisons à venir
            {allAlerts.length > 0 && (
              <Badge variant="secondary">{allAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overdueTrips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium">{trip.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.product} • {TRUCK_LABELS[trip.truck]} • {trip.driver}
                  </p>
                  <p className="text-xs text-destructive mt-1">
                    En retard depuis le {format(parseISO(trip.delivery_date), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => setStatusModalTrip(trip)}>
                Confirmer
              </Button>
            </div>
          ))}

          {todayTrips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{trip.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.product} • {TRUCK_LABELS[trip.truck]} • {trip.driver}
                  </p>
                  <Badge className="mt-1 bg-primary/10 text-primary">Livraison aujourd'hui</Badge>
                </div>
              </div>
              <Button size="sm" onClick={() => setStatusModalTrip(trip)}>
                Confirmer
              </Button>
            </div>
          ))}

          {tomorrowTrips.map((trip) => (
            <div
              key={trip.id}
              className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
            >
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">{trip.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.product} • {TRUCK_LABELS[trip.truck]} • {trip.driver}
                  </p>
                  <Badge className="mt-1 bg-warning/10 text-warning">Livraison demain</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
