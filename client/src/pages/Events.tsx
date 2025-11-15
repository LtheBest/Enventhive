import { useState } from "react";
import { EventCard } from "@/components/EventCard";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch events from API
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des événements');
      }
      
      return response.json();
    },
  });

  const events = eventsData?.events || [];

  const filteredEvents = events.filter((event: Event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6" data-testid="page-events">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Événements</h1>
          <p className="text-muted-foreground mt-1">
            Gérez tous vos événements d'entreprise
          </p>
        </div>
        <CreateEventDialog />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou lieu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-events"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-filter-status">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="ongoing">En cours</SelectItem>
            <SelectItem value="completed">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Chargement des événements...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Erreur lors du chargement des événements
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event: Event) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {events.length === 0 ? "Aucun événement créé. Créez votre premier événement !" : "Aucun événement trouvé"}
          </div>
        )}
      </div>
    </div>
  );
}
