import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Trash2, Car } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  city: string;
  role: "driver" | "passenger";
  seats?: number;
  status: "confirmed" | "pending" | "declined";
  eventTitle?: string;
  eventDate?: string;
}

interface ParticipantTableProps {
  participants: Participant[];
  onSendEmail?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const statusConfig = {
  confirmed: { label: "Confirmé", variant: "default" as const },
  pending: { label: "En attente", variant: "secondary" as const },
  declined: { label: "Décliné", variant: "outline" as const },
};

export function ParticipantTable({ participants, onSendEmail, onRemove }: ParticipantTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Participant</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Événement</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => {
            const statusInfo = statusConfig[participant.status];
            return (
              <TableRow key={participant.id} data-testid={`row-participant-${participant.id}`}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-xs">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span data-testid="text-participant-name">{participant.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground" data-testid="text-participant-email">
                  {participant.email}
                </TableCell>
                <TableCell className="text-sm" data-testid="text-participant-city">
                  {participant.city}
                </TableCell>
                <TableCell className="text-sm">
                  {participant.eventTitle && (
                    <div>
                      <div className="font-medium">{participant.eventTitle}</div>
                      {participant.eventDate && (
                        <div className="text-xs text-muted-foreground">{participant.eventDate}</div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {participant.role === "driver" && <Car className="h-3 w-3" />}
                    <span className="text-sm capitalize">
                      {participant.role === "driver" ? "Conducteur" : "Passager"}
                    </span>
                    {participant.role === "driver" && participant.seats && (
                      <span className="text-xs text-muted-foreground">({participant.seats} places)</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant} className="text-xs">
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onSendEmail?.(participant.id);
                        console.log('Send email to', participant.id);
                      }}
                      data-testid={`button-email-${participant.id}`}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onRemove?.(participant.id);
                        console.log('Remove participant', participant.id);
                      }}
                      data-testid={`button-remove-${participant.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
