import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Loader2, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface InviteParticipantsDialogProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteParticipantsDialog({ 
  eventId, 
  eventTitle, 
  open, 
  onOpenChange 
}: InviteParticipantsDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteParticipantsMutation = useMutation({
    mutationFn: async (emailList: string[]) => {
      const response = await apiRequest('POST', `/api/events/${eventId}/invite`, {
        participantEmails: emailList,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const count = emails.length;
      setSuccessMessage(
        `✅ ${count} invitation(s) envoyée(s) avec succès pour "${eventTitle}" !`
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      setTimeout(() => {
        setEmails([]);
        setCurrentEmail("");
        setSuccessMessage(null);
        onOpenChange(false);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'envoi des invitations",
        variant: "destructive",
      });
    },
  });

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = () => {
    const trimmedEmail = currentEmail.trim().toLowerCase();
    
    if (!trimmedEmail) {
      return;
    }
    
    if (!isValidEmail(trimmedEmail)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      toast({
        title: "Email déjà ajouté",
        description: "Cet email est déjà dans la liste",
        variant: "destructive",
      });
      return;
    }
    
    setEmails([...emails, trimmedEmail]);
    setCurrentEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emails.length === 0) {
      toast({
        title: "Aucun email",
        description: "Veuillez ajouter au moins une adresse email",
        variant: "destructive",
      });
      return;
    }
    
    inviteParticipantsMutation.mutate(emails);
  };

  const resetForm = () => {
    setEmails([]);
    setCurrentEmail("");
    setSuccessMessage(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !inviteParticipantsMutation.isPending) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviter des participants
          </DialogTitle>
          <DialogDescription>
            Envoyez des invitations par email pour "{eventTitle}"
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">{successMessage}</p>
              <p className="text-green-600 text-sm mt-1">
                Le dialog va se fermer automatiquement...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresses email des participants</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="participant@exemple.com"
                disabled={inviteParticipantsMutation.isPending}
              />
              <Button 
                type="button" 
                onClick={addEmail}
                disabled={inviteParticipantsMutation.isPending}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Appuyez sur Entrée ou cliquez sur + pour ajouter un email
            </p>
          </div>

          {/* List of added emails */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Emails ajoutés ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 max-h-40 overflow-y-auto">
                {emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                      disabled={inviteParticipantsMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={inviteParticipantsMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={inviteParticipantsMutation.isPending || emails.length === 0}
            >
              {inviteParticipantsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                `Envoyer ${emails.length} invitation(s)`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
