import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserPlus, Car, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";

interface Participant {
  email: string;
}

interface Vehicle {
  driverEmail: string;
  totalSeats: number;
  departureLocation: string;
  departureCity: string;
  destinationLocation?: string;
  notes?: string;
}

interface CompanyVehicle {
  id: string;
  name: string;
  vehicleType: string;
  licensePlate?: string;
  totalSeats: number;
  isActive: boolean;
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
  const [selectedCompanyVehicles, setSelectedCompanyVehicles] = useState<string[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showVehicleSection, setShowVehicleSection] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addressAutocomplete = useAddressAutocomplete();

  // Fetch company vehicles
  const { data: companyVehiclesData } = useQuery({
    queryKey: ['company-vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/company-vehicles', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des véhicules');
      return response.json();
    },
    enabled: open,
  });

  const companyVehicles: CompanyVehicle[] = companyVehiclesData?.vehicles || [];

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/events', eventData);
      return response.json();
    },
    onSuccess: (data) => {
      const eventTitle = formData.title;
      const participantCount = participants.length;
      
      // Afficher un message de succès dans le dialog
      setSuccessMessage(
        `✅ L'événement "${eventTitle}" a été créé avec succès !${
          participantCount > 0 
            ? ` ${participantCount} invitation(s) email ont été envoyées.` 
            : ''
        }`
      );
      
      // Toast notification
      toast({
        title: "✅ Événement créé !",
        description: data.message || "L'événement a été créé avec succès. Vos participants vont recevoir leurs invitations par email.",
        duration: 5000,
      });
      
      // Invalider toutes les requêtes d'événements pour rafraîchir le dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Fermer le dialog après 2 secondes pour laisser le temps de voir le message
      setTimeout(() => {
        setOpen(false);
        resetForm();
        setSuccessMessage(null);
      }, 2000);
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
    setSelectedCompanyVehicles([]);
    setNewParticipantEmail("");
    setShowParticipantForm(false);
    setShowVehicleSection(false);
  };

  const addParticipant = () => {
    if (!newParticipantEmail || !newParticipantEmail.includes('@')) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un email valide",
        variant: "destructive",
      });
      return;
    }
    
    if (participants.some(p => p.email === newParticipantEmail)) {
      toast({
        title: "Erreur",
        description: "Cet email a déjà été ajouté",
        variant: "destructive",
      });
      return;
    }
    
    setParticipants([...participants, { email: newParticipantEmail }]);
    setNewParticipantEmail("");
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.location || !formData.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    const eventData = {
      title: formData.title,
      startDate: new Date(formData.date),
      location: formData.location,
      city: formData.city,
      description: formData.description || null,
      eventType: eventType,
      maxParticipants: null,
      participantEmails: participants.length > 0 ? participants.map(p => p.email) : undefined,
      vehicles: vehicles.length > 0 ? vehicles : undefined,
      companyVehicleIds: selectedCompanyVehicles.length > 0 ? selectedCompanyVehicles : undefined,
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
          
          {/* Message de succès */}
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
          
          {/* Formulaire - caché pendant l'affichage du succès */}
          {!successMessage && (
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

            <div className="space-y-2 relative">
              <Label htmlFor="location">Adresse complète</Label>
              <Input
                id="location"
                placeholder="Commencez à taper une adresse..."
                value={formData.location}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, location: value });
                  addressAutocomplete.search(value);
                  setShowAddressSuggestions(true);
                }}
                onFocus={() => {
                  if (addressAutocomplete.suggestions.length > 0) {
                    setShowAddressSuggestions(true);
                  }
                }}
                data-testid="input-event-location"
                required
              />
              {showAddressSuggestions && addressAutocomplete.suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {addressAutocomplete.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          location: suggestion.properties.label,
                          city: suggestion.properties.city || suggestion.properties.name,
                        });
                        setShowAddressSuggestions(false);
                        addressAutocomplete.clear();
                      }}
                    >
                      <div className="font-medium">{suggestion.properties.label}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.properties.context}</div>
                    </button>
                  ))}
                </div>
              )}
              {addressAutocomplete.isLoading && (
                <p className="text-xs text-muted-foreground mt-1">Recherche en cours...</p>
              )}
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
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={newParticipantEmail}
                      onChange={(e) => setNewParticipantEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addParticipant}>
                      Ajouter
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les participants recevront une invitation par email avec un lien pour rejoindre l'événement
                  </p>
                </div>
              )}

              {participants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{participants.length} participant(s) ajouté(s)</p>
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <span className="font-medium">{p.email}</span>
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

            {/* Company Vehicles Section */}
            {companyVehicles.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Véhicules d'entreprise (optionnel)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVehicleSection(!showVehicleSection)}
                  >
                    <Car className="h-4 w-4 mr-2" />
                    {showVehicleSection ? 'Masquer' : 'Ajouter un véhicule'}
                  </Button>
                </div>

                {showVehicleSection && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <Label>Sélectionner des véhicules</Label>
                    <div className="space-y-2">
                      {companyVehicles.filter(v => v.isActive).map((vehicle) => (
                        <div key={vehicle.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`vehicle-${vehicle.id}`}
                            checked={selectedCompanyVehicles.includes(vehicle.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCompanyVehicles([...selectedCompanyVehicles, vehicle.id]);
                              } else {
                                setSelectedCompanyVehicles(selectedCompanyVehicles.filter(id => id !== vehicle.id));
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`vehicle-${vehicle.id}`} className="text-sm cursor-pointer flex-1">
                            <span className="font-medium">{vehicle.name}</span>
                            <span className="text-muted-foreground ml-2">({vehicle.vehicleType})</span>
                            <span className="ml-2 text-xs">💺 {vehicle.totalSeats} places</span>
                            {vehicle.licensePlate && (
                              <span className="ml-2 text-xs text-muted-foreground">{vehicle.licensePlate}</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedCompanyVehicles.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedCompanyVehicles.length} véhicule(s) sélectionné(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {!successMessage && (
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
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
