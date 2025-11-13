import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, TrendingUp, Mail, Phone, Calendar } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function CRM() {
  const { hasFeature } = usePlanFeatures();
  const hasAccess = hasFeature('hasCRM');

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              CRM - Gestion de la relation client
              <Badge>PRO+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan PRO ou PREMIUM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Le CRM vous permet de gérer vos relations avec les participants,
              suivre leur engagement et optimiser votre communication.
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
          <Building2 className="h-8 w-8" />
          CRM - Gestion de la relation client
          <Badge className="ml-2">PRO+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Gérez efficacement vos relations avec les participants
        </p>
      </div>

      <div className="grid gap-6">
        {/* Statistiques CRM */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0 ce mois-ci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taux d'engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails envoyés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Ce mois-ci</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Prochaines actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">À traiter</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>
                  Gérez tous vos contacts participants
                </CardDescription>
              </div>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Ajouter un contact
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Aucun contact pour le moment</p>
              <p className="text-xs mt-2">
                Les participants de vos événements apparaîtront automatiquement ici
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Campagnes et segments */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campagnes
              </CardTitle>
              <CardDescription>
                Créez des campagnes d'emailing ciblées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-4">Aucune campagne créée</p>
                <Button variant="outline">Créer une campagne</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Segments
              </CardTitle>
              <CardDescription>
                Organisez vos contacts en segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-4">Aucun segment créé</p>
                <Button variant="outline">Créer un segment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
