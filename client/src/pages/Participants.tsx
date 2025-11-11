import { useState } from "react";
import { ParticipantTable } from "@/components/ParticipantTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

//todo: remove mock functionality
const mockParticipants = [
  {
    id: "1",
    name: "Marie Dubois",
    email: "marie.dubois@example.com",
    city: "Paris",
    role: "driver" as const,
    seats: 4,
    status: "confirmed" as const,
  },
  {
    id: "2",
    name: "Pierre Martin",
    email: "pierre.martin@example.com",
    city: "Paris",
    role: "passenger" as const,
    status: "confirmed" as const,
  },
  {
    id: "3",
    name: "Sophie Laurent",
    email: "sophie.laurent@example.com",
    city: "Lyon",
    role: "driver" as const,
    seats: 3,
    status: "pending" as const,
  },
  {
    id: "4",
    name: "Thomas Bernard",
    email: "thomas.bernard@example.com",
    city: "Marseille",
    role: "passenger" as const,
    status: "confirmed" as const,
  },
  {
    id: "5",
    name: "Julie Petit",
    email: "julie.petit@example.com",
    city: "Toulouse",
    role: "driver" as const,
    seats: 5,
    status: "confirmed" as const,
  },
];

export default function Participants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite participant:', inviteEmail);
    setInviteDialogOpen(false);
    setInviteEmail("");
  };

  const filteredParticipants = mockParticipants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="page-participants">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Participants</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos participants et leurs inscriptions
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou ville..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-participants"
        />
      </div>

      {filteredParticipants.length > 0 ? (
        <ParticipantTable participants={filteredParticipants} />
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          Aucun participant trouvé
        </div>
      )}
    </div>
  );
}
