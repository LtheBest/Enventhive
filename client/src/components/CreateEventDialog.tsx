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
import { Plus } from "lucide-react";

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [eventType, setEventType] = useState<"single" | "recurring">("single");
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Create event', { ...formData, type: eventType });
    setOpen(false);
    setFormData({ title: "", date: "", location: "", description: "" });
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
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                placeholder="Commencez à taper une adresse..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                data-testid="input-event-location"
                required
              />
              <p className="text-xs text-muted-foreground">Auto-complétion des adresses françaises</p>
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-event"
            >
              Annuler
            </Button>
            <Button type="submit" data-testid="button-submit-event">
              Créer l'événement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
