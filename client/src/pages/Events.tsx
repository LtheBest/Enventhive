import { useState } from "react";
import { EventCard } from "@/components/EventCard";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

//todo: remove mock functionality
const mockEvents = [
  {
    id: "1",
    title: "Réunion d'équipe Q4",
    date: "15 Décembre 2024, 14:00",
    location: "Paris, 75001",
    participants: 32,
    maxParticipants: 50,
    drivers: 8,
    availableSeats: 12,
    status: "upcoming" as const,
  },
  {
    id: "2",
    title: "Team Building Automne",
    date: "20 Novembre 2024, 10:00",
    location: "Lyon, 69001",
    participants: 45,
    maxParticipants: 60,
    drivers: 10,
    availableSeats: 5,
    status: "ongoing" as const,
  },
  {
    id: "3",
    title: "Formation Sécurité",
    date: "10 Octobre 2024, 09:00",
    location: "Marseille, 13001",
    participants: 28,
    maxParticipants: 30,
    drivers: 6,
    availableSeats: 0,
    status: "completed" as const,
  },
  {
    id: "4",
    title: "Conférence Annuelle",
    date: "05 Janvier 2025, 09:00",
    location: "Toulouse, 31000",
    participants: 120,
    maxParticipants: 150,
    drivers: 25,
    availableSeats: 30,
    status: "upcoming" as const,
  },
];

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Aucun événement trouvé
          </div>
        )}
      </div>
    </div>
  );
}
