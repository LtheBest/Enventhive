import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAddressAutocomplete } from "@/hooks/use-address-autocomplete";

interface Event {
  id: string;
  title: string;
  startDate: string;
  location: string;
  city: string;
  description?: string;
  maxParticipants?: number;
  status: string;
}

interface EditEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const [formData, setFormData] = useState({
    title: event.title,
    date: new Date(event.startDate).toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
    location: event.location,
    city: event.city,
    description: event.description || "",
    maxParticipants: event.maxParticipants || "",
  });
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addressAutocomplete = useAddressAutocomplete();

  // Reset form when event changes
  useEffect(() => {
    if (open) {
      setFormData({
        title: event.title,
        date: new Date(event.startDate).toISOString().slice(0, 16),
        location: event.location,
        city: event.city,
        description: event.description || "",
        maxParticipants: event.maxParticipants || "",
      });
      setSuccessMessage(null);
    }
  }, [event, open]);

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('PATCH', `/api/events/${event.id}`, eventData);
      return response.json();
    },
    onSuccess: (data) => {
      setSuccessMessage(`✅ L'événement "${formData.title}" a été modifié avec succès !`);
      
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      setTimeout(() => {
        onOpenChange(false);
        setSuccessMessage(null);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modification de l'événement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date || !formData.location || !formData.city) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      title: formData.title,
      startDate: new Date(formData.date).toISOString(),
      location: formData.location,
      city: formData.city,
      description: formData.description || null,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants as string) : null,
    };

    updateEventMutation.mutate(eventData);
  };

  const handleLocationSearch = (value: string) => {
    setFormData({ ...formData, location: value });
    if (value.length >= 3) {
      setShowAddressSuggestions(true);
      addressAutocomplete.search(value);
    } else {
      setShowAddressSuggestions(false);
      addressAutocomplete.clear();
    }
  };

  const selectAddress = (suggestion: any) => {
    setFormData({
      ...formData,
      location: suggestion.properties.name,
      city: suggestion.properties.city,
    });
    setShowAddressSuggestions(false);
    addressAutocomplete.clear();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'événement</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'événement
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'événement *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Réunion annuelle, Team Building..."
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Date et heure *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <Label htmlFor="location">Adresse de l'événement *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Commencez à taper une adresse..."
                required
              />
              
              {showAddressSuggestions && addressAutocomplete.suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  {addressAutocomplete.suggestions.map((suggestion: any, index: number) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectAddress(suggestion)}
                    >
                      <div className="font-medium">{suggestion.properties.label}</div>
                      <div className="text-sm text-gray-500">{suggestion.properties.context}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Paris, Lyon..."
                required
              />
            </div>

            <div>
              <Label htmlFor="maxParticipants">Nombre maximum de participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                placeholder="Laisser vide pour illimité"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre événement..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateEventMutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
