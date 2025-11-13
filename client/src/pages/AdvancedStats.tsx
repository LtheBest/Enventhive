import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Calendar, Car, Activity } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function AdvancedStats() {
  const { hasFeature } = usePlanFeatures();
  const hasAccess = hasFeature('hasCRM'); // Stats avancées disponibles avec le CRM (PRO+)

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques avancées
              <Badge>PRO+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan PRO ou PREMIUM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Les statistiques avancées vous offrent une analyse approfondie de vos performances,
              avec des graphiques détaillés et des insights actionnables.
            </p>
            <Link href="/billing">
              <Button>Passer au plan PRO</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Statistiques avancées
          <Badge className="ml-2">PRO+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Analyses détaillées et insights sur vos performances
        </p>
      </div>

      <div className="grid gap-6">
        {/* KPIs principaux */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Croissance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+0%</div>
              <p className="text-xs text-muted-foreground">vs mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Taux moyen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Car className="h-4 w-4" />
                Covoiturage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Taux d'utilisation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0/10</div>
              <p className="text-xs text-muted-foreground">Score d'engagement</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution des événements
              </CardTitle>
              <CardDescription>
                Nombre d'événements créés par mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Graphique à venir</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants par événement
              </CardTitle>
              <CardDescription>
                Moyenne et répartition des participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Graphique à venir</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Performance covoiturage
              </CardTitle>
              <CardDescription>
                Taux d'occupation et économies réalisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Graphique à venir</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendances d'engagement
              </CardTitle>
              <CardDescription>
                Évolution de l'engagement des participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">Graphique à venir</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rapports personnalisés */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports personnalisés</CardTitle>
            <CardDescription>
              Créez des rapports sur mesure avec les métriques de votre choix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Button>Créer un rapport personnalisé</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
