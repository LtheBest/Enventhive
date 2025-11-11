import { StatCard } from "@/components/StatCard";
import { EventCard } from "@/components/EventCard";
import { CreateEventDialog } from "@/components/CreateEventDialog";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Calendar, Users, Car, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
];

export default function Dashboard() {
  //todo: remove mock functionality - get user plan from API
  const currentPlan: "DECOUVERTE" | "ESSENTIEL" | "PRO" | "PREMIUM" = "ESSENTIEL"; 
  const showUpgradePrompt = currentPlan === "DECOUVERTE" || currentPlan === "ESSENTIEL";

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de vos événements et participants
          </p>
        </div>
        <CreateEventDialog />
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          currentPlan={currentPlan}
          targetPlan="Pro"
          featureName="Statistiques avancées et CRM"
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Événements actifs"
          value={12}
          icon={Calendar}
          trend={{ value: "+3 ce mois", isPositive: true }}
        />
        <StatCard
          title="Participants"
          value={248}
          icon={Users}
          trend={{ value: "+12%", isPositive: true }}
        />
        <StatCard
          title="Conducteurs"
          value={45}
          icon={Car}
        />
        <StatCard
          title="Places disponibles"
          value={87}
          icon={MapPin}
          trend={{ value: "-5 depuis hier", isPositive: false }}
        />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">À venir</TabsTrigger>
          <TabsTrigger value="ongoing" data-testid="tab-ongoing">En cours</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Terminés</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {mockEvents
              .filter((e) => e.status === "upcoming")
              .map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="ongoing" className="space-y-4">
          <div className="grid gap-4">
            {mockEvents
              .filter((e) => e.status === "ongoing")
              .map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {mockEvents
              .filter((e) => e.status === "completed")
              .map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
