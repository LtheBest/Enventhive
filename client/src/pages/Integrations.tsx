import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Zap, Mail, Calendar as CalendarIcon, MessageSquare, Webhook } from "lucide-react";
import { usePlanFeatures } from "@/contexts/PlanFeaturesContext";
import { Link } from "wouter";
import { useState } from "react";

export default function Integrations() {
  const { hasFeature } = usePlanFeatures();
  const hasAccess = hasFeature('hasIntegrations');

  const [integrations, setIntegrations] = useState({
    gmail: false,
    outlook: false,
    googleCalendar: false,
    slack: false,
    teams: false,
    zapier: false,
  });

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Intégrations
              <Badge>PRO+</Badge>
            </CardTitle>
            <CardDescription>
              Cette fonctionnalité nécessite un plan PRO ou PREMIUM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connectez TEAMMOVE à vos outils préférés pour automatiser vos workflows
              et synchroniser vos données.
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
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8" />
          Intégrations
          <Badge className="ml-2">PRO+</Badge>
        </h1>
        <p className="text-muted-foreground">
          Connectez TEAMMOVE à vos outils préférés
        </p>
      </div>

      <div className="space-y-6">
        {/* Intégrations email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Messagerie
            </CardTitle>
            <CardDescription>
              Synchronisez vos emails et notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Gmail</p>
                  <p className="text-sm text-muted-foreground">Synchronisation des emails</p>
                </div>
              </div>
              <Switch
                checked={integrations.gmail}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, gmail: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Outlook</p>
                  <p className="text-sm text-muted-foreground">Synchronisation des emails</p>
                </div>
              </div>
              <Switch
                checked={integrations.outlook}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, outlook: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Intégrations calendrier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendrier
            </CardTitle>
            <CardDescription>
              Synchronisez vos événements avec votre calendrier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Synchronisation bidirectionnelle</p>
                </div>
              </div>
              <Switch
                checked={integrations.googleCalendar}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, googleCalendar: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Intégrations collaboration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Collaboration
            </CardTitle>
            <CardDescription>
              Notifications et updates en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Slack</p>
                  <p className="text-sm text-muted-foreground">Notifications dans vos channels</p>
                </div>
              </div>
              <Switch
                checked={integrations.slack}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, slack: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Microsoft Teams</p>
                  <p className="text-sm text-muted-foreground">Notifications dans vos équipes</p>
                </div>
              </div>
              <Switch
                checked={integrations.teams}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, teams: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks et API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks & API
            </CardTitle>
            <CardDescription>
              Créez des intégrations personnalisées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Zapier</p>
                  <p className="text-sm text-muted-foreground">Connectez 5000+ applications</p>
                </div>
              </div>
              <Switch
                checked={integrations.zapier}
                onCheckedChange={(checked) =>
                  setIntegrations({ ...integrations, zapier: checked })
                }
              />
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="font-medium mb-2">Webhooks personnalisés</p>
              <p className="text-sm text-muted-foreground mb-3">
                Configurez des webhooks pour recevoir des notifications en temps réel
              </p>
              <Button variant="outline" size="sm">Configurer les webhooks</Button>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="font-medium mb-2">Documentation API</p>
              <p className="text-sm text-muted-foreground mb-3">
                Accédez à notre API RESTful pour créer vos propres intégrations
              </p>
              <Button variant="outline" size="sm">Voir la documentation</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
