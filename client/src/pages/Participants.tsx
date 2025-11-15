import { useState } from "react";
import { ParticipantTable } from "@/components/ParticipantTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Participant {
  participant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city: string;
    role: 'driver' | 'passenger';
    status: 'pending' | 'confirmed' | 'declined';
    eventId: string;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    city: string;
  };
}

export default function Participants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite participant:', inviteEmail);
    setInviteDialogOpen(false);
    setInviteEmail("");
  };

  // Fetch participants from API
  const { data: participantsData, isLoading, error } = useQuery<{
    success: boolean;
    participants: Participant[];
    count: number;
  }>({
    queryKey: ['/api/participants', roleFilter !== 'all' ? { role: roleFilter } : {}],
  });

  const allParticipants = participantsData?.participants || [];

  // Transform data for ParticipantTable
  const transformedParticipants = allParticipants.map((p) => ({
    id: p.participant.id,
    name: `${p.participant.firstName} ${p.participant.lastName}`,
    email: p.participant.email,
    city: p.participant.city,
    role: p.participant.role,
    status: p.participant.status,
    eventTitle: p.event.title,
    eventDate: new Date(p.event.startDate).toLocaleDateString('fr-FR'),
  }));

  // Filter participants based on search and status
  const filteredParticipants = transformedParticipants.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.eventTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" data-testid="page-participants">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Participants</h1>
          <p className="text-muted-foreground mt-1">
            {participantsData?.count || 0} participant(s) inscrit(s) à vos événements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Message groupé
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-invite-participant">
                <Plus className="h-4 w-4 mr-2" />
                Inviter
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-invite-participant">
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Inviter un participant</DialogTitle>
                  <DialogDescription>
                    Envoyez une invitation par email pour rejoindre l'événement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email du participant</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="participant@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      data-testid="input-invite-email"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" data-testid="button-send-invite">
                    Envoyer l'invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, ville ou événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-participants"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="driver">Conducteurs</SelectItem>
            <SelectItem value="passenger">Passagers</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="confirmed">Confirmés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="declined">Déclinés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Chargement des participants...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive border rounded-md">
          Erreur lors du chargement des participants
        </div>
      ) : filteredParticipants.length > 0 ? (
        <ParticipantTable participants={filteredParticipants} />
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          {allParticipants.length === 0 
            ? "Aucun participant inscrit pour le moment" 
            : "Aucun participant trouvé avec ces critères"}
        </div>
      )}
    </div>
  );
}
