import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, TrendingUp, Users, Car } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Reporting() {
  const { planData, hasFeature } = usePlanFeatures();

  // Vérifier si l'utilisateur a accès à cette fonctionnalité
  const hasAccess = hasFeature('hasAdvancedReporting');

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reporting avancé
              <Badge variant="secondary">ESSENTIEL+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan ESSENTIEL ou supérieur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Le reporting avancé vous permet de générer des rapports détaillés sur vos événements,
              participants et performances de covoiturage.
            </p>
            <Link href="/billing">
              <Button>
                Améliorer mon plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Reporting avancé
            <Badge variant="secondary" className="ml-2">ESSENTIEL+</Badge>
          </h1>
          <p className="text-muted-foreground">
            Générez et téléchargez des rapports détaillés sur vos activités
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Rapport événements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rapport événements
            </CardTitle>
            <CardDescription>
              Statistiques détaillées de vos événements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </CardContent>
        </Card>

        {/* Rapport participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rapport participants
            </CardTitle>
            <CardDescription>
              Analyse des inscriptions et participation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </CardContent>
        </Card>

        {/* Rapport covoiturage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" />
              Rapport covoiturage
            </CardTitle>
            <CardDescription>
              Performance et utilisation des véhicules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Rapport personnalisé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rapport personnalisé
          </CardTitle>
          <CardDescription>
            Créez un rapport sur mesure avec les métriques de votre choix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sélectionnez les périodes, événements et métriques pour générer un rapport personnalisé.
          </p>
          <Button variant="outline">
            Créer un rapport personnalisé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
