import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, Car, Share2, Trash2, QrCode, Link as LinkIcon, Copy, Check, Edit, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Event {
  id: string;
  title: string;
  startDate: string;
  location: string;
  city: string;
  description?: string;
  maxParticipants?: number;
  status: string;
  qrCode?: string;
  publicLink?: string;
}

interface EventCardProps {
  event: Event;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  upcoming: { label: "À venir", color: "border-l-chart-1" },
  ongoing: { label: "En cours", color: "border-l-chart-2" },
  completed: { label: "Terminé", color: "border-l-muted-foreground" },
  cancelled: { label: "Annulé", color: "border-l-destructive" },
};

export function EventCard({ event }: EventCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusInfo = statusConfig[event.status] || statusConfig.upcoming;

  // Format date
  const formattedDate = new Date(event.startDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast({
      title: "Lien copié !",
      description: "Le lien a été copié dans le presse-papiers.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <Card className={cn("border-l-4", statusInfo.color)} data-testid={`card-event-${event.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="text-xl font-semibold" data-testid="text-event-title">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span data-testid="text-event-date">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid="text-event-location">{event.location}, {event.city}</span>
          </div>
          {event.maxParticipants && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-event-participants">
                Max {event.maxParticipants} participants
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = `/events/${event.id}`}
            data-testid="button-view-event"
          >
            <Eye className="h-4 w-4 mr-2" />
            Détails
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowShareDialog(true)}
            data-testid="button-share-event"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            data-testid="button-delete-event"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager l'événement</DialogTitle>
            <DialogDescription>
              Partagez le lien public ou le QR code de votre événement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {event.publicLink && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Lien public</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={event.publicLink}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(event.publicLink!)}
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            
            {event.qrCode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">QR Code</label>
                <div className="flex justify-center p-4 border rounded-lg bg-white">
                  <img 
                    src={event.qrCode} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Scannez ce code pour accéder à l'événement
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'événement "{event.title}" et toutes ses données associées seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
