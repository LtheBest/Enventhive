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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, MapPin, Users, Download, Trash2, QrCode, Link as LinkIcon, Copy, Check, Edit, Eye, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EditEventDialog } from "@/components/EditEventDialog";
import { InviteParticipantsDialog } from "@/components/InviteParticipantsDialog";

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
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
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
      const response = await apiRequest('DELETE', `/api/events/${event.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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

  const downloadQRCode = () => {
    if (!event.qrCode) return;
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = event.qrCode;
    link.download = `qr-code-${event.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code téléchargé !",
      description: "Le QR Code a été téléchargé avec succès.",
    });
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
        <CardFooter className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDetailsDialog(true)}
                  data-testid="button-view-event"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voir les détails</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowEditDialog(true)}
                  data-testid="button-edit-event"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Éditer l'événement</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowInviteDialog(true)}
                  data-testid="button-invite-participants"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inviter des participants</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                  data-testid="button-delete-event"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer l'événement</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            {event.publicLink && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(event.publicLink!)}
                    data-testid="button-copy-link"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copier le lien public</TooltipContent>
              </Tooltip>
            )}

            {event.qrCode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={downloadQRCode}
                    data-testid="button-download-qr"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Télécharger le QR Code</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <DialogDescription>
              Détails complets de l'événement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Event Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Date et heure</p>
                  <p className="text-sm text-muted-foreground">{formattedDate}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Lieu</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <p className="text-sm text-muted-foreground">{event.city}</p>
                </div>
              </div>

              {event.maxParticipants && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-sm text-muted-foreground">Maximum {event.maxParticipants} personnes</p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="pt-2">
                  <p className="font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}
            </div>

            {/* Public Link Section */}
            {event.publicLink && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Lien public de l'événement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={event.publicLink}
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(event.publicLink!)}
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            
            {/* QR Code Section */}
            {event.qrCode && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <label className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code pour l'inscription
                </label>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 border rounded-lg bg-white">
                    <img 
                      src={event.qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadQRCode}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le QR Code
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Les participants peuvent scanner ce code pour s'inscrire à l'événement
                  </p>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Statut de l'événement</span>
              <Badge variant="outline">{statusInfo.label}</Badge>
            </div>
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

      {/* Edit Event Dialog */}
      <EditEventDialog 
        event={event} 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
      />

      {/* Invite Participants Dialog */}
      <InviteParticipantsDialog
        eventId={event.id}
        eventTitle={event.title}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </>
  );
}
