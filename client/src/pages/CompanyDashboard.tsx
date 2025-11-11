import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Car, TrendingUp, Plus, Settings, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalParticipants: number;
  activeVehicles: number;
  plan: {
    tier: string;
    status: string;
    maxEvents: number | null;
    maxParticipantsPerEvent: number | null;
  };
}

export default function CompanyDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', { limit: 5 }],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const planConfig = {
    DECOUVERTE: { color: "bg-blue-500", label: "Découverte", maxEvents: 5 },
    ESSENTIEL: { color: "bg-green-500", label: "Essentiel", maxEvents: 20 },
    PRO: { color: "bg-purple-500", label: "Pro", maxEvents: null },
    PREMIUM: { color: "bg-amber-500", label: "Premium", maxEvents: null },
  };

  const currentPlan = stats?.plan.tier as keyof typeof planConfig || 'DECOUVERTE';
  const planInfo = planConfig[currentPlan];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">TM</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">TEAMMOVE</h1>
                <p className="text-sm text-muted-foreground">Dashboard Entreprise</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" data-testid="button-settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost" size="icon" data-testid="button-billing">
                  <CreditCard className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Plan Status Banner */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${planInfo.color}`} />
                <div>
                  <p className="font-medium">Plan {planInfo.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {planInfo.maxEvents !== null
                      ? `${stats?.totalEvents || 0}/${planInfo.maxEvents} événements utilisés`
                      : 'Événements illimités'}
                  </p>
                </div>
              </div>
              {stats?.plan.status === 'quote_pending' && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  Devis en attente
                </Badge>
              )}
              <Link href="/billing">
                <Button variant="outline" size="sm" data-testid="button-upgrade-plan">
                  Gérer mon abonnement
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-events">
                {stats?.totalEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.upcomingEvents || 0} à venir
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-participants">
                {stats?.totalParticipants || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total inscrits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-vehicles">
                {stats?.activeVehicles || 0}
              </div>
              <p className="text-xs text-muted-foreground">Covoiturages actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalParticipants && stats?.activeVehicles
                  ? Math.round((stats.activeVehicles / stats.totalParticipants) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Taux de covoiturage</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Events */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Gérez vos événements et participants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/events/new">
                <Button className="w-full justify-start" data-testid="button-create-event">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un événement
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir tous les événements
                </Button>
              </Link>
              <Link href="/participants">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-participants">
                  <Users className="mr-2 h-4 w-4" />
                  Gérer les participants
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Événements récents</CardTitle>
              <CardDescription>Vos derniers événements créés</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : recentEvents && Array.isArray(recentEvents) && recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentEvents.slice(0, 5).map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 rounded-md hover-elevate"
                      data-testid={`event-item-${event.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.city}</p>
                      </div>
                      <Link href={`/events/${event.id}`}>
                        <Button size="sm" variant="ghost">Voir</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Aucun événement créé
                  </p>
                  <Link href="/events/new">
                    <Button size="sm" data-testid="button-create-first-event">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer votre premier événement
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
