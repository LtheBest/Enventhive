import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants?: number;
  drivers: number;
  availableSeats: number;
  status: "upcoming" | "ongoing" | "completed";
  onViewDetails?: () => void;
}

const statusConfig = {
  upcoming: { label: "À venir", color: "border-l-chart-1" },
  ongoing: { label: "En cours", color: "border-l-chart-2" },
  completed: { label: "Terminé", color: "border-l-muted-foreground" },
};

export function EventCard({
  id,
  title,
  date,
  location,
  participants,
  maxParticipants,
  drivers,
  availableSeats,
  status,
  onViewDetails,
}: EventCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className={cn("border-l-4", statusInfo.color)} data-testid={`card-event-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold" data-testid="text-event-title">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span data-testid="text-event-date">{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span data-testid="text-event-location">{location}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-event-participants">
              {participants}{maxParticipants ? `/${maxParticipants}` : ''} participants
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-event-drivers">
              {drivers} conducteurs
            </span>
          </div>
        </div>
        {availableSeats > 0 && (
          <div className="text-sm text-chart-2 font-medium">
            {availableSeats} places disponibles
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            console.log('Share event', id);
          }}
          data-testid="button-share-event"
        >
          Partager
        </Button>
        <Button 
          size="sm"
          onClick={() => {
            onViewDetails?.();
            console.log('View event details', id);
          }}
          data-testid="button-view-details"
        >
          Voir détails
        </Button>
      </CardFooter>
    </Card>
  );
}
