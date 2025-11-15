import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, UserPlus, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Participant {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city: string;
  role: "driver" | "passenger";
}

interface Vehicle {
  driverEmail: string;
  totalSeats: number;
  departureLocation: string;
  departureCity: string;
  destinationLocation?: string;
  notes?: string;
}

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [eventType, setEventType] = useState<"single" | "recurring">("single");
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    city: "",
    description: "",
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newParticipant, setNewParticipant] = useState<Participant>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    role: "passenger",
  });
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Événement créé !",
        description: data.message || "L'événement a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ 
      title: "", 
      date: "", 
      location: "", 
      city: "",
      description: "",
    });
    setParticipants([]);
    setVehicles([]);
    setNewParticipant({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      city: "",
      role: "passenger",
    });
    setShowParticipantForm(false);
  };

  const addParticipant = () => {
    if (!newParticipant.email || !newParticipant.firstName || !newParticipant.lastName || !newParticipant.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    setParticipants([...participants, newParticipant]);
    setNewParticipant({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      city: "",
      role: "passenger",
    });
    setShowParticipantForm(false);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract city from location (simplifié)
    const cityFromLocation = formData.city || formData.location.split(',').pop()?.trim() || "";
    
    const eventData = {
      title: formData.title,
      startDate: new Date(formData.date),
      location: formData.location,
      city: cityFromLocation,
      description: formData.description || null,
      eventType: eventType,
      participants: participants.length > 0 ? participants : undefined,
      vehicles: vehicles.length > 0 ? vehicles : undefined,
    };
    
    console.log('Creating event:', eventData);
    createEventMutation.mutate(eventData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-event">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-create-event">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
            <DialogDescription>
              Configurez votre nouvel événement et invitez vos participants
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type d'événement</Label>
              <RadioGroup
                value={eventType}
                onValueChange={(value) => setEventType(value as "single" | "recurring")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" data-testid="radio-event-single" />
                  <Label htmlFor="single" className="font-normal">Événement ponctuel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="recurring" data-testid="radio-event-recurring" />
                  <Label htmlFor="recurring" className="font-normal">Événement récurrent</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'événement</Label>
              <Input
                id="title"
                placeholder="Réunion d'équipe, Team building..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-event-title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date et heure</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-event-date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Adresse complète</Label>
              <Input
                id="location"
                placeholder="1 rue Lefebvre, 91350 Grigny"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                data-testid="input-event-location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                placeholder="Paris"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                data-testid="input-event-city"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Détails de l'événement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-event-description"
                rows={3}
              />
            </div>

            {/* Participants Section */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Participants (optionnel)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowParticipantForm(!showParticipantForm)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un participant
                </Button>
              </div>

              {showParticipantForm && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Prénom"
                      value={newParticipant.firstName}
                      onChange={(e) => setNewParticipant({ ...newParticipant, firstName: e.target.value })}
                    />
                    <Input
                      placeholder="Nom"
                      value={newParticipant.lastName}
                      onChange={(e) => setNewParticipant({ ...newParticipant, lastName: e.target.value })}
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Téléphone (optionnel)"
                      value={newParticipant.phone}
                      onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                    />
                    <Input
                      placeholder="Ville"
                      value={newParticipant.city}
                      onChange={(e) => setNewParticipant({ ...newParticipant, city: e.target.value })}
                    />
                  </div>
                  <RadioGroup
                    value={newParticipant.role}
                    onValueChange={(value) => setNewParticipant({ ...newParticipant, role: value as "driver" | "passenger" })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="passenger" id="passenger" />
                      <Label htmlFor="passenger" className="font-normal">Passager</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="driver" id="driver" />
                      <Label htmlFor="driver" className="font-normal">Conducteur</Label>
                    </div>
                  </RadioGroup>
                  <Button type="button" onClick={addParticipant} className="w-full">
                    Ajouter
                  </Button>
                </div>
              )}

              {participants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{participants.length} participant(s) ajouté(s)</p>
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                        <span className="text-muted-foreground ml-2">({p.email})</span>
                        <span className="ml-2 text-xs">{p.role === "driver" ? "🚗 Conducteur" : "👤 Passager"}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(i)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              data-testid="button-cancel-event"
              disabled={createEventMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              data-testid="button-submit-event"
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? "Création..." : "Créer l'événement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
